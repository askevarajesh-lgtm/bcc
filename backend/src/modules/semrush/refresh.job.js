const IntelligenceRefreshJob = require('./models/intelligenceRefreshJob.model');
const SemrushProject = require('./semrushProject.model');
const OptimizationSnapshot = require('./models/optimizationSnapshot.model');
// Additional services would be imported here

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
    const workerId = `worker-${Math.random().toString(36).substr(2, 9)}`;
    
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

      // Execution Pipeline
      // 1. Fetch from providers
      // 2. Normalize
      // 3. Score
      // 4. Save OptimizationSnapshot
      // (Mocked pipeline for implementation structure)
      
      const project = await SemrushProject.findById(job.projectId);
      if (!project) throw new Error('Project not found');

      // ... Call Crawler, Semrush, etc ...
      
      const newSnapshot = await OptimizationSnapshot.create({
        projectId: job.projectId,
        companyId: job.companyId,
        domain: project.domain,
        runId: job._id,
        status: 'COMPLETED',
        promotionReason: 'First successful run',
        scores: { overall: 80, seo: 80, geo: 80, aeo: 80 } // using deterministic scoring in reality
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
        { $set: { status: 'COMPLETED', completedAt: new Date() } }
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
