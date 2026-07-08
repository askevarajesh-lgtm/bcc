const SeoAudit = require('../models/seoAudit.model');
const SeoProject = require('../models/seoProject.model');
const CrawlService = require('./crawl.service');
const axios = require('axios');

class AuditService {
  /**
   * Triggers a website crawl using the Node.js CrawlService.
   */
  static async runAudit(projectId) {
    try {
      const project = await SeoProject.findById(projectId);
      if (!project) throw new Error('Project not found');

      // Update project phase to audit
      project.phase = 'audit';
      await project.save();

      // Run Node.js crawler
      const crawler = new CrawlService(project.siteUrl, 100); // limit to 100 pages for demo/speed
      const crawlResult = await crawler.run();
      
      const summary = crawlResult.summary;
      
      // Fetch Real Performance Score via Google PageSpeed Insights
      let performanceScore = 65; // Default fallback
      try {
        console.log(`[AuditService] Fetching PageSpeed Insights for ${project.siteUrl}`);
        const psiRes = await axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(project.siteUrl)}&strategy=desktop`, { timeout: 15000 });
        const score = psiRes.data?.lighthouseResult?.categories?.performance?.score;
        if (score !== undefined) {
          performanceScore = Math.round(score * 100);
        }
      } catch (psiError) {
        console.error('[AuditService] Failed to fetch PageSpeed score, using fallback.');
      }

      const totalElements = summary.total_urls * 3; // title, meta, h1
      const missingElements = (summary.missing_title || 0) + (summary.missing_meta_description || 0) + (summary.missing_h1 || 0);
      const onPageScore = summary.total_urls > 0 ? Math.max(0, Math.round(((totalElements - missingElements) / totalElements) * 100)) : 0;

      const audit = new SeoAudit({
        projectId,
        agencyId: project.createdBy || project.companyId,
        taskId: `audit_${Date.now()}`,
        status: 'completed',
        metrics: {
          onpageScore: onPageScore,
          pagesCrawled: summary.total_urls || 0,
          performance: performanceScore,
          crawlability: summary.total_urls > 0 ? Math.round((summary.status_200 / summary.total_urls) * 100) : 0,
          security: project.siteUrl.startsWith('https') ? 100 : 0, 
          onPage: onPageScore,
          mobileUsability: performanceScore > 50 ? performanceScore + 10 : 60,
          overall: 0
        },
        completedAt: new Date()
      });
      
      audit.metrics.overall = Math.round((audit.metrics.performance + audit.metrics.crawlability + audit.metrics.onPage + audit.metrics.security) / 4);

      await audit.save();

      // Return the completed audit
      return audit;
    } catch (error) {
      console.error('AuditService error:', error);
      throw error;
    }
  }

  /**
   * Compares the two most recent audits for a project and calculates the diff.
   */
  static async compareAudits(projectId) {
    try {
      const audits = await SeoAudit.find({ projectId }).sort({ createdAt: -1 }).limit(2);
      
      if (audits.length < 2) {
        return { message: 'Not enough audits to compare. Need at least 2.' };
      }

      const latest = audits[0];
      const previous = audits[1];

      const diff = {
        performance: latest.metrics.performance - previous.metrics.performance,
        onPage: latest.metrics.onPage - previous.metrics.onPage,
        crawlability: latest.metrics.crawlability - previous.metrics.crawlability,
        overall: latest.metrics.overall - previous.metrics.overall
      };

      return {
        latestId: latest._id,
        previousId: previous._id,
        diff
      };
    } catch (error) {
      console.error('AuditService compare error:', error);
      throw error;
    }
  }
}

module.exports = AuditService;
