const IntelligenceRefreshJob = require('./models/intelligenceRefreshJob.model');
const SemrushProject = require('./models/semrushProject.model');
const OptimizationSnapshot = require('./models/optimizationSnapshot.model');
const crypto = require('crypto');
const semrushService = require('./semrush.service');
const providerNormalization = require('./providerNormalization.service');

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

      const project = await SemrushProject.findOne({ _id: job.projectId, companyId: job.companyId });
      if (!project) throw new Error('Project not found or unauthorized for this tenant');

      const domain = project.domain;
      let finalStatus = 'COMPLETED';

      // 1. Fetch from providers
      let semrushOverview = null;
      let semrushBacklinks = null;
      let semrushSiteHealth = null;

      try {
        if (process.env.SEMRUSH_API_KEY) {
          semrushOverview = await semrushService.getDomainOverview(domain, job.companyId, 'us').catch(e => { console.error(e); return null; });
          semrushBacklinks = await semrushService.getBacklinksOverview(domain, job.companyId).catch(e => { console.error(e); return null; });
          semrushSiteHealth = await semrushService.getSiteHealth(domain, job.companyId, 'us').catch(e => { console.error(e); return null; });
        }
      } catch (e) {
        console.error('Semrush provider error:', e.message);
      }

      if (!semrushOverview && !semrushBacklinks && !semrushSiteHealth) {
        finalStatus = 'FAILED';
      } else if (!semrushOverview || !semrushBacklinks || !semrushSiteHealth) {
        finalStatus = 'PARTIAL';
      }

      const previousSnapshot = project.latestSnapshot ? await OptimizationSnapshot.findById(project.latestSnapshot) : null;

      // 2. Normalize (Thin mapping of Semrush responses)
      // Initialize with previous valid data to prevent null overwrites
      const normalizedSeo = previousSnapshot?.seo ? JSON.parse(JSON.stringify(previousSnapshot.seo)) : {};

      if (semrushOverview) {
        Object.assign(normalizedSeo, providerNormalization.normalizeSemrushOverview(semrushOverview));
      }
      if (semrushBacklinks) {
        Object.assign(normalizedSeo, providerNormalization.normalizeSemrushBacklinks(semrushBacklinks));
      }
      if (semrushSiteHealth) {
        Object.assign(normalizedSeo, providerNormalization.normalizeSemrushSiteHealth(semrushSiteHealth));
      }

      const canonicalDataset = {
        seo: normalizedSeo,
        geo: previousSnapshot?.geo ? JSON.parse(JSON.stringify(previousSnapshot.geo)) : {}, // No native GEO metrics from Semrush API yet
        aeo: previousSnapshot?.aeo ? JSON.parse(JSON.stringify(previousSnapshot.aeo)) : {}  // No native AEO metrics from Semrush API yet
      };

      let completenessScore = 0;
      if (canonicalDataset.seo.organicTraffic !== undefined || canonicalDataset.seo.organicKeywordsData?.length > 0) completenessScore += 33;
      if (canonicalDataset.seo.backlinks !== undefined || canonicalDataset.seo.backlinksDetails) completenessScore += 33;
      if (canonicalDataset.seo.technicalScore !== undefined) completenessScore += 34;

      // 4. Save OptimizationSnapshot (No fake scores)
      const newSnapshot = await OptimizationSnapshot.create({
        projectId: job.projectId,
        companyId: job.companyId,
        domain: project.domain,
        runId: job._id,
        status: finalStatus,
        dataCompleteness: completenessScore,
        scores: previousSnapshot?.scores ? JSON.parse(JSON.stringify(previousSnapshot.scores)) : {
          overall: null,
          seo: null,
          geo: null,
          aeo: null
        },
        seo: canonicalDataset.seo,
        geo: canonicalDataset.geo,
        aeo: canonicalDataset.aeo,
        promotionReason: 'First successful run'
      });


      let shouldPromote = false;

      if (newSnapshot.status === 'COMPLETED' || newSnapshot.status === 'PARTIAL') {
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
