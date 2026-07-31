const axios = require('axios');
const WorkspaceCrawlJob = require('../models/workspaceCrawlJob.model');
const WorkspaceCrawlQueue = require('../models/workspaceCrawlQueue.model');
const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const hybridKeywordExtractor = require('./hybridKeywordExtractor.service');
const logger = require('../../aiCore/logger.service');
const cheerio = require('cheerio');

const TAG = 'CrawlWorker';
const DEFAULT_LOCATION_CODE = 2840;
const DEFAULT_LANGUAGE_CODE = 'en';

class CrawlWorker {
  constructor() {
    this.isRunning = false;
    this.batchSize = 5; // process 5 pages concurrently
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    try {
      // Revert any stuck processing items from previous crashes
      await WorkspaceCrawlQueue.updateMany({ status: 'processing' }, { $set: { status: 'pending' } });
      logger.info(TAG, 'Reverted stuck processing items to pending.');
    } catch (err) {
      logger.warn(TAG, 'Failed to revert stuck items on startup: ' + err.message);
    }
    
    this.poll();
  }

  stop() {
    this.isRunning = false;
  }

  async poll() {
    while (this.isRunning) {
      try {
        const jobs = await WorkspaceCrawlJob.find({ status: 'running' });
        if (jobs.length === 0) {
          await new Promise(r => setTimeout(r, 5000)); // Sleep if no jobs
          continue;
        }

        let didWork = false;

        for (const job of jobs) {
          // Find pending URLs for this job
          const queueItems = await WorkspaceCrawlQueue.find({ jobId: job._id, status: 'pending' })
            .limit(this.batchSize);

          if (queueItems.length === 0) {
            // Check if any are still processing
            const processingCount = await WorkspaceCrawlQueue.countDocuments({ jobId: job._id, status: 'processing' });
            if (processingCount === 0) {
              // Job is truly completed
              job.status = 'completed';
              job.completedAt = new Date();
              await job.save();
              logger.info(TAG, `Crawl Job ${job._id} completed. Extracted ${job.progress.keywordsExtracted} keywords.`);
            }
            continue; // Skip to next job (do not infinitely block here)
          }

          didWork = true;

          // Mark as processing
          const itemIds = queueItems.map(q => q._id);
          await WorkspaceCrawlQueue.updateMany({ _id: { $in: itemIds } }, { $set: { status: 'processing' } });

          // Process concurrently
          await Promise.all(queueItems.map(item => this.processUrl(job, item)));
        }

        if (!didWork) {
          // If all jobs are waiting on processing items, sleep to prevent CPU spinning
          await new Promise(r => setTimeout(r, 2000));
        }

      } catch (error) {
        logger.error(TAG, `Worker polling error: ${error.message}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  async processUrl(job, queueItem) {
    let keywordsExtracted = 0;
    try {
      logger.info(TAG, `Fetching URL: ${queueItem.url}`);
      const response = await axios.get(queueItem.url, { timeout: 10000, maxRedirects: 3 });
      const html = response.data;
      
      const contentType = response.headers['content-type'] || '';
      if (!contentType.toLowerCase().includes('html')) {
        throw new Error('Not HTML content');
      }

      // Discover and queue new internal links (BFS)
      await this.enqueueInternalLinks(job, queueItem.url, html);

      // Extract NLP keywords
      const keywords = hybridKeywordExtractor.extractFromHtml(html, queueItem.url);
      keywordsExtracted = keywords.length;

      // Save to database
      await this.saveKeywords(job, queueItem.url, keywords);

      // Update progress
      await WorkspaceCrawlJob.findByIdAndUpdate(job._id, {
        $inc: { 
          'progress.pagesCrawled': 1,
          'progress.keywordsExtracted': keywordsExtracted
        }
      });

      queueItem.status = 'completed';
      await queueItem.save();
    } catch (error) {
      logger.warn(TAG, `Failed to crawl ${queueItem.url}: ${error.message}`);
      queueItem.retryCount += 1;
      queueItem.error = error.message;
      if (queueItem.retryCount >= 3) {
        queueItem.status = 'failed';
      } else {
        queueItem.status = 'pending'; // Re-queue
      }
      await queueItem.save();
    }
  }

  async enqueueInternalLinks(job, sourceUrl, html) {
    const $ = cheerio.load(html);
    const host = new URL(sourceUrl).hostname.replace(/^www\./, '');
    const newLinks = new Set();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
        try {
          const absoluteUrl = new URL(href, sourceUrl).href.split('#')[0];
          const urlObj = new URL(absoluteUrl);
          if (['http:', 'https:'].includes(urlObj.protocol) && urlObj.hostname.replace(/^www\./, '') === host) {
            newLinks.add(absoluteUrl);
          }
        } catch (e) { /* ignore invalid URLs */ }
      }
    });

    for (const link of newLinks) {
      try {
        await WorkspaceCrawlQueue.create({
          jobId: job._id,
          url: link,
          status: 'pending'
        });
      } catch (err) {
        // E11000 duplicate key error is expected (we already queued this URL for this job)
        if (err.code !== 11000) {
          logger.warn(TAG, `Failed to enqueue ${link}: ${err.message}`);
        }
      }
    }
  }

  async saveKeywords(job, queueItemUrl, extractedKeywords) {
    const keywordQuality = require('./keywordQuality.service');
    const keywordIntent = require('./keywordIntent.service');
    const keywordOpportunity = require('./keywordOpportunity.service');

    const validKeywords = [];
    
    // Apply Quality Filter and Intent Classification
    for (const k of extractedKeywords) {
      const quality = keywordQuality.assessQuality(k.keyword, { searchVolume: 0 });
      if (quality.isRejected) continue; // Skip bad keywords
      
      const intentData = keywordIntent.classify(k.keyword);
      
      // Calculate a base opportunity score (will be enriched later when API data is fetched)
      const opportunity = keywordOpportunity.calculateOpportunity({
        searchVolume: 0,
        keywordDifficulty: 0,
        cpc: 0,
        currentRank: null,
        intent: intentData.intent
      });

      validKeywords.push({
        ...k,
        intentData,
        opportunity
      });
    }

    const bulkOps = validKeywords.map(k => {
      // Map source elements into a readable string or take the top one
      const htmlElementStr = k.sourceElements.map(se => se.element).join(',');

      return {
        updateOne: {
          filter: {
            projectId: job.projectId,
            keyword: k.keyword,
            locationCode: DEFAULT_LOCATION_CODE,
            languageCode: DEFAULT_LANGUAGE_CODE
          },
          update: {
            $set: {
              agencyId: job.agencyId,
              source: 'discovery_crawler',
              'metrics.intent': k.intentData.intent
            },
            $setOnInsert: {
              status: 'Approved',
              lifecycle: 'Discovered',
              'metrics.searchVolume': 0,
              'metrics.cpc': 0,
              'metrics.competition': 0,
              'metrics.keywordDifficulty': 0,
              isQuestion: false
            },
            $max: { 'agent.opportunityScore': k.opportunity.score },
            $addToSet: { 
              entities: { $each: k.entities }
            },
            $push: {
              pageUrls: {
                url: queueItemUrl,
                htmlElement: htmlElementStr,
                frequency: k.frequency,
                firstSeen: new Date(),
                lastSeen: new Date()
              }
            }
          },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < bulkOps.length; i += chunkSize) {
        const chunk = bulkOps.slice(i, i + chunkSize);
        await WorkspaceKeyword.bulkWrite(chunk);
      }
      
      await WorkspaceCrawlJob.findByIdAndUpdate(job._id, {
        $inc: { 'progress.keywordsSaved': bulkOps.length }
      });
    }
  }
}

const crawlWorker = new CrawlWorker();

// Auto-start worker in background
if (process.env.NODE_ENV !== 'test') {
  crawlWorker.start();
}

module.exports = crawlWorker;
