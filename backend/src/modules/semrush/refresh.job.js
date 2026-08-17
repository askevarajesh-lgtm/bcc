const IntelligenceRefreshJob = require('./models/intelligenceRefreshJob.model');
const SemrushProject = require('./models/semrushProject.model');
const OptimizationSnapshot = require('./models/optimizationSnapshot.model');
const crypto = require('crypto');
const semrushService = require('./semrush.service');
const crawlerService = require('./crawler.service');
const providerNormalization = require('./providerNormalization.service');
const scoringService = require('./scoring.service');

class IntelligenceRefreshWorker {
  constructor() {
    this.leaseTimeoutMs = 5 * 60 * 1000; // 5 minutes
  }

  async recoverStaleJobs() {
    const staleThreshold = new Date(Date.now() - this.leaseTimeoutMs);
    await IntelligenceRefreshJob.updateMany(
      { status: 'RUNNING', lastHeartbeatAt: { $lt: staleThreshold } },
      { $set: { status: 'QUEUED', lockedBy: null, lockedAt: null } }
    );
  }

  async queueRefresh(projectId, companyId) {
    try {
      const existingJob = await IntelligenceRefreshJob.findOne({
        projectId,
        companyId,
        status: { $in: ['QUEUED', 'RUNNING'] }
      });

      if (existingJob) {
        return { jobId: existingJob._id, status: existingJob.status, alreadyRunning: true };
      }

      const newJob = await IntelligenceRefreshJob.create({
        projectId,
        companyId,
        status: 'QUEUED'
      });

      // Fire and forget the worker
      this.processJob(newJob._id).catch(console.error);

      return { jobId: newJob._id, status: 'QUEUED', alreadyRunning: false };
    } catch (error) {
      if (error.code === 11000) {
        // Race condition caught by unique partial index
        const existingJob = await IntelligenceRefreshJob.findOne({
          projectId, companyId, status: { $in: ['QUEUED', 'RUNNING'] }
        });
        return { jobId: existingJob._id, status: existingJob.status, alreadyRunning: true };
      }
      throw error;
    }
  }

  async processJob(jobId) {
    const workerId = `worker-${crypto.randomUUID()}`;
    
    const job = await IntelligenceRefreshJob.findOneAndUpdate(
      { _id: jobId, status: 'QUEUED' },
      { 
        $set: { 
          status: 'RUNNING', 
          lockedBy: workerId, 
          lockedAt: new Date(),
          startedAt: new Date(),
          lastHeartbeatAt: new Date()
        },
        $inc: { attempts: 1 }
      },
      { new: true }
    );

    if (!job) return; // Claimed by another worker or not queued

    let heartbeatInterval;
    try {
      heartbeatInterval = setInterval(async () => {
        await IntelligenceRefreshJob.updateOne({ _id: jobId }, { $set: { lastHeartbeatAt: new Date() } });
      }, Math.floor(this.leaseTimeoutMs / 2));

      const project = await SemrushProject.findById(job.projectId);
      if (!project) throw new Error('Project not found');

      const domain = project.domain;
      let finalStatus = 'COMPLETED';

      // 1. Fetch from providers
      let semrushOverview = null;
      let semrushBacklinks = null;
      let semrushSiteHealth = null;
      let crawlerData = null;

      try {
        if (process.env.SEMRUSH_API_KEY) {
          semrushOverview = await semrushService.getDomainOverview(domain, 'us').catch(e => { console.error(e); return null; });
          semrushBacklinks = await semrushService.getBacklinksOverview(domain).catch(e => { console.error(e); return null; });
          semrushSiteHealth = await semrushService.getSiteHealth(domain, 'us').catch(e => { console.error(e); return null; });
        }
      } catch (e) {
        console.error('Semrush provider error:', e.message);
      }

      try {
        crawlerData = await crawlerService.crawlSite(domain).catch(e => { console.error(e); return null; });
      } catch (e) {
        console.error('Crawler provider error:', e.message);
      }

      if (!semrushOverview && !crawlerData) {
        finalStatus = 'PARTIAL'; // Adjust depending on completeness later
      }

      // 2. Normalize
      const normalizedSeo = {
        ...providerNormalization.normalizeSemrushOverview(semrushOverview),
        ...providerNormalization.normalizeSemrushBacklinks(semrushBacklinks),
        ...providerNormalization.normalizeSemrushSiteHealth(semrushSiteHealth)
      };

      const normalizedGeo = {
        ...providerNormalization.normalizeCrawlerData(crawlerData)
      };

      const normalizedAeo = {
        ...providerNormalization.normalizeCrawlerData(crawlerData) // Example mapping
      };

      const canonicalDataset = {
        seo: normalizedSeo,
        geo: normalizedGeo,
        aeo: normalizedAeo
      };

      // 3. Score
      const analysisResult = scoringService.calculateOverallScores(canonicalDataset);

      // 4. Save OptimizationSnapshot
      const newSnapshot = await OptimizationSnapshot.create({
        projectId: job.projectId,
        companyId: job.companyId,
        domain: project.domain,
        runId: job._id,
        status: analysisResult.status,
        dataCompleteness: analysisResult.dataCompleteness,
        scores: analysisResult.scores,
        seo: canonicalDataset.seo,
        geo: canonicalDataset.geo,
        aeo: canonicalDataset.aeo,
        promotionReason: 'First successful run'
      });

      const previousSnapshot = project.latestSnapshot ? await OptimizationSnapshot.findById(project.latestSnapshot) : null;
      let shouldPromote = false;

      if (newSnapshot.status === 'COMPLETED') {
        shouldPromote = true;
        newSnapshot.promotionReason = 'Status is COMPLETED';
      } else if (newSnapshot.status === 'PARTIAL' && newSnapshot.dataCompleteness >= 50) {
        if (!previousSnapshot) {
           shouldPromote = true;
           newSnapshot.promotionReason = 'No previous snapshot, promoting PARTIAL';
        } else if (newSnapshot.dataCompleteness >= previousSnapshot.dataCompleteness) {
           shouldPromote = true;
           newSnapshot.promotionReason = 'PARTIAL snapshot has better or equal completeness';
        } else {
           newSnapshot.promotionReason = 'Previous snapshot has better completeness. Retaining old snapshot.';
        }
      } else {
         newSnapshot.promotionReason = 'Insufficient completeness for promotion';
      }

      await newSnapshot.save();

      if (shouldPromote) {
        project.latestSnapshot = newSnapshot._id;
        await project.save();
      }

      await IntelligenceRefreshJob.updateOne(
        { _id: jobId },
        { $set: { status: newSnapshot.status, completedAt: new Date() } }
      );

    } catch (error) {
      await IntelligenceRefreshJob.updateOne(
        { _id: jobId },
        { $set: { status: 'FAILED', error: error.message, completedAt: new Date() } }
      );
    } finally {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
  }
}

module.exports = new IntelligenceRefreshWorker();
