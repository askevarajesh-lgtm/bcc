const axios = require('axios');
const cheerio = require('cheerio');
const robotsParser = require('robots-parser');
const WorkspaceAuditJob = require('../models/workspaceAuditJob.model');
const WorkspaceAuditQueue = require('../models/workspaceAuditQueue.model');
const WorkspaceAuditPage = require('../models/workspaceAuditPage.model');
const logger = require('../../aiCore/logger.service');

const TAG = 'EnterpriseCrawlWorker';
const USER_AGENT = 'SEO-Enterprise-Auditor/1.0';

class EnterpriseCrawlWorker {
  constructor() {
    this.isRunning = false;
    this.robotsCache = new Map(); // domain -> parsed robots
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.poll();
  }

  stop() {
    this.isRunning = false;
  }

  async getRobotsTxt(domain) {
    if (this.robotsCache.has(domain)) return this.robotsCache.get(domain);
    
    const robotsUrl = `${domain.startsWith('http') ? domain : `https://${domain}`}/robots.txt`;
    let parsed = null;
    try {
      const res = await axios.get(robotsUrl, { timeout: 5000, validateStatus: () => true });
      if (res.status === 200) {
        parsed = robotsParser(robotsUrl, res.data);
      } else {
        // Dummy parser allowing everything if 404
        parsed = robotsParser(robotsUrl, 'User-agent: *\nAllow: /');
      }
    } catch(e) {
      parsed = robotsParser(robotsUrl, 'User-agent: *\nAllow: /');
    }
    this.robotsCache.set(domain, parsed);
    return parsed;
  }

  async poll() {
    while (this.isRunning) {
      try {
        const jobs = await WorkspaceAuditJob.find({ status: 'running' }).limit(1);
        if (jobs.length === 0) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        const job = jobs[0];
        
        // 1. Enforce maxDuration budget
        const duration = Date.now() - new Date(job.startedAt).getTime();
        if (job.budgets.maxDuration && duration >= job.budgets.maxDuration) {
          await this.completeJob(job, 'budget_reached');
          continue;
        }

        // 2. Fetch queue items honoring maxConcurrentRequests
        const queueItems = await WorkspaceAuditQueue.find({ jobId: job._id, status: 'pending' })
          .limit(job.budgets.maxConcurrentRequests || 5);

        if (queueItems.length === 0) {
          const processingCount = await WorkspaceAuditQueue.countDocuments({ jobId: job._id, status: 'processing' });
          if (processingCount === 0) {
            await this.completeJob(job, 'completed');
          } else {
            await new Promise(r => setTimeout(r, 2000));
          }
          continue;
        }

        const itemIds = queueItems.map(q => q._id);
        await WorkspaceAuditQueue.updateMany({ _id: { $in: itemIds } }, { $set: { status: 'processing' } });

        // Throttle Requests Per Second (RPS)
        const rps = job.budgets.requestsPerSecond || 5;
        const delayMs = Math.floor(1000 / rps);
        
        for (const item of queueItems) {
          await this.processUrl(job, item);
          await new Promise(r => setTimeout(r, delayMs));
        }

      } catch (error) {
        logger.error(TAG, `Worker polling error: ${error.message}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  async completeJob(job, finalStatus) {
    if (finalStatus === 'budget_reached' || finalStatus === 'completed') {
      job.status = 'synthesizing';
      await job.save();
      logger.info(TAG, `Audit Job ${job._id} entering AI synthesis phase`);

      try {
        const seoAuditorAgent = require('./seoAuditorAgent.service');
        await seoAuditorAgent.synthesizeSiteAudit(job._id);
        
        job.status = finalStatus;
        job.completedAt = new Date();
        await job.save();
        logger.info(TAG, `Audit Job ${job._id} finished with status: ${finalStatus}`);
      } catch(err) {
        logger.error(TAG, `Failed to synthesize site audit for job ${job._id}: ${err.message}`);
        job.status = 'failed';
        job.error = err.message;
        await job.save();
      }
    } else {
      job.status = finalStatus;
      job.completedAt = new Date();
      await job.save();
      logger.info(TAG, `Audit Job ${job._id} finished with status: ${finalStatus}`);
    }
    
    // Cleanup internal memory
    this.robotsCache.clear();
  }

  async processUrl(job, queueItem) {
    try {
      // 1. Check maxPages budget
      if (job.budgets.maxPages && job.progress.urlsCrawled >= job.budgets.maxPages) {
        queueItem.status = 'skipped';
        queueItem.skipReason = 'budget_reached';
        await queueItem.save();
        await WorkspaceAuditJob.findByIdAndUpdate(job._id, { $inc: { 'progress.urlsSkipped': 1 } });
        return;
      }

      // 2. Robots.txt compliance
      const urlObj = new URL(queueItem.url);
      const robots = await this.getRobotsTxt(urlObj.origin);
      if (robots && !robots.isAllowed(queueItem.url, USER_AGENT)) {
        queueItem.status = 'skipped';
        queueItem.skipReason = 'robots_disallowed';
        await queueItem.save();
        await WorkspaceAuditJob.findByIdAndUpdate(job._id, { $inc: { 'progress.urlsSkipped': 1 } });
        return;
      }

      // 3. Incremental Crawling Check (ETag/LastModified)
      const previousAudit = await WorkspaceAuditPage.findOne({ projectId: job.projectId, url: queueItem.url }).sort({ createdAt: -1 });
      const headRes = await axios.head(queueItem.url, { timeout: 5000, validateStatus: () => true }).catch(() => null);
      
      let useCache = false;
      if (headRes && previousAudit) {
        const etag = headRes.headers['etag'];
        const lastMod = headRes.headers['last-modified'];
        if (etag && etag === previousAudit.etag) useCache = true;
        if (lastMod && lastMod === previousAudit.lastModified) useCache = true;
      }

      let auditPage;
      let html = null;
      
      // Update UI real-time tracking
      await WorkspaceAuditJob.findByIdAndUpdate(job._id, { $set: { 'progress.currentUrl': queueItem.url } });

      if (useCache) {
        logger.info(TAG, `Skipping fetch for ${queueItem.url} (Unchanged, ETag match)`);
        // We clone the old record for the new job
        const clonedObj = previousAudit.toObject();
        delete clonedObj._id;
        clonedObj.jobId = job._id;
        auditPage = await WorkspaceAuditPage.create(clonedObj);
        queueItem.status = 'completed';
      } else {
        logger.info(TAG, `Fetching ${queueItem.url}`);
        const startMs = Date.now();
        const res = await axios.get(queueItem.url, { 
          timeout: 10000, 
          maxRedirects: 5,
          headers: { 'User-Agent': USER_AGENT },
          validateStatus: () => true 
        });
        const endMs = Date.now();

        const contentType = res.headers['content-type'] || '';
        const isHtml = contentType.toLowerCase().includes('html');
        
        auditPage = new WorkspaceAuditPage({
          projectId: job.projectId,
          jobId: job._id,
          url: queueItem.url,
          statusCode: res.status,
          redirectUrl: res.request?.res?.responseUrl !== queueItem.url ? res.request?.res?.responseUrl : null,
          responseTimeMs: endMs - startMs,
          contentType,
          contentLength: parseInt(res.headers['content-length'] || 0, 10),
          etag: res.headers['etag'],
          lastModified: res.headers['last-modified']
        });

        if (isHtml) {
          html = res.data;
          this.parseHtmlAssets(html, auditPage);
        }

        await auditPage.save();
        queueItem.status = 'completed';
      }

      await queueItem.save();

      // 4. Enqueue internal links (if HTML and within depth limit)
      if (html && (!job.budgets.maxDepth || queueItem.depth < job.budgets.maxDepth)) {
        await this.enqueueInternalLinks(job, queueItem, html);
      }

      // Update successful metrics
      await WorkspaceAuditJob.findByIdAndUpdate(job._id, { 
        $inc: { 
          'progress.urlsCrawled': 1,
          'progress.urlsRemaining': -1
        }
      });

    } catch (error) {
      logger.warn(TAG, `Failed to crawl ${queueItem.url}: ${error.message}`);
      queueItem.retryCount += 1;
      queueItem.error = error.message;
      if (queueItem.retryCount >= 2) {
        queueItem.status = 'failed';
        await WorkspaceAuditJob.findByIdAndUpdate(job._id, { $inc: { 'progress.failedUrls': 1, 'progress.urlsRemaining': -1 } });
      } else {
        queueItem.status = 'pending'; // Re-queue
      }
      await queueItem.save();
    }
  }

  parseHtmlAssets(html, auditPage) {
    const $ = cheerio.load(html);
    
    auditPage.title = $('title').text().trim();
    auditPage.metaDescription = $('meta[name="description" i]').attr('content')?.trim() || '';
    auditPage.h1 = $('h1').first().text().trim();
    auditPage.canonical = $('link[rel="canonical" i]').attr('href')?.trim() || '';
    auditPage.robots = $('meta[name="robots" i]').attr('content')?.trim() || '';
    
    // Open Graph & Twitter
    auditPage.openGraph = {
      title: $('meta[property="og:title"]').attr('content'),
      description: $('meta[property="og:description"]').attr('content'),
      image: $('meta[property="og:image"]').attr('content')
    };
    auditPage.twitterCard = {
      title: $('meta[name="twitter:title"]').attr('content'),
      description: $('meta[name="twitter:description"]').attr('content'),
      card: $('meta[name="twitter:card"]').attr('content')
    };

    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    auditPage.wordCount = text.split(' ').filter(w => w.length > 0).length;

    // Checks
    const rLower = auditPage.robots.toLowerCase();
    auditPage.checks.isIndexable = auditPage.statusCode === 200 && !rLower.includes('noindex');
    auditPage.checks.missingTitle = !auditPage.title;
    auditPage.checks.missingDescription = !auditPage.metaDescription;
    auditPage.checks.missingH1 = !auditPage.h1;
    auditPage.checks.thinContent = auditPage.wordCount < 300;

    // Images
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.startsWith('data:')) {
        const alt = $(el).attr('alt');
        auditPage.images.push({ src, alt });
        if (!alt) auditPage.checks.missingAltCount++;
      }
    });

    // Links (internal & external tracked)
    const host = new URL(auditPage.url).hostname.replace(/^www\./, '');
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        try {
          const absolute = new URL(href, auditPage.url).href.split('#')[0];
          const isInternal = new URL(absolute).hostname.replace(/^www\./, '') === host;
          auditPage.links.push({ href: absolute, text: $(el).text().trim(), isInternal });
        } catch(e) { }
      }
    });
  }

  async enqueueInternalLinks(job, parentQueueItem, html) {
    const $ = cheerio.load(html);
    const host = new URL(parentQueueItem.url).hostname.replace(/^www\./, '');
    const newLinks = new Set();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
        try {
          const absoluteUrl = new URL(href, parentQueueItem.url).href.split('#')[0];
          const urlObj = new URL(absoluteUrl);
          if (['http:', 'https:'].includes(urlObj.protocol) && urlObj.hostname.replace(/^www\./, '') === host) {
            newLinks.add(absoluteUrl);
          }
        } catch (e) { }
      }
    });

    let queuedCount = 0;
    for (const link of newLinks) {
      try {
        await WorkspaceAuditQueue.create({
          jobId: job._id,
          url: link,
          depth: parentQueueItem.depth + 1,
          status: 'pending'
        });
        queuedCount++;
      } catch (err) {
        // Ignored E11000 (duplicate queue item)
      }
    }
    
    if (queuedCount > 0) {
      await WorkspaceAuditJob.findByIdAndUpdate(job._id, { 
        $inc: { 
          'progress.urlsDiscovered': queuedCount,
          'progress.urlsRemaining': queuedCount
        }
      });
    }
  }
}

const enterpriseCrawlWorker = new EnterpriseCrawlWorker();

if (process.env.NODE_ENV !== 'test') {
  enterpriseCrawlWorker.start();
}

module.exports = enterpriseCrawlWorker;
