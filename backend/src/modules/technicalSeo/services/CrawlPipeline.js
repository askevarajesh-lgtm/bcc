/**
 * CrawlPipeline
 * Manages the sequential execution of crawl stages:
 * URL Frontier -> Downloader -> HTML Parser -> Link Extractor -> Page Analyzer
 */

const { eventBus, EVENTS } = require('../events/EventBus');
const StaticHtmlProvider = require('../providers/StaticHtmlProvider');
const cheerio = require('cheerio');

class CrawlPipeline {
  constructor(auditConfig, queueProvider, rulesEngine) {
    this.config = auditConfig;
    this.queue = queueProvider;
    this.rules = rulesEngine;
    this.renderer = new StaticHtmlProvider(); // Default to StaticHtml for now
  }

  /**
   * Process a single URL through the pipeline.
   * @param {string} url 
   * @param {string} auditId
   */
  async processUrl(url, auditId) {
    try {
      eventBus.dispatch(EVENTS.PAGE_DISCOVERED, { auditId, url });

      // 1. Downloader / Rendering
      const renderResult = await this.renderer.render(url, this.config);
      eventBus.dispatch(EVENTS.PAGE_RENDERED, { auditId, url, status: renderResult.status });

      // 2. HTML Parser
      const $ = cheerio.load(renderResult.html);

      // 3. Link Extractor
      const links = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href').trim();
        if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
          try {
            const absolute = new URL(href, renderResult.finalUrl).href.split('#')[0];
            links.push(absolute);
          } catch(e) {}
        }
      });

      // 4. Page Analyzer (Extract title, meta, h1, etc.)
      const pageData = {
        url,
        finalUrl: renderResult.finalUrl,
        status: renderResult.status,
        title: $('title').text().trim(),
        metaDescription: $('meta[name="description" i]').attr('content')?.trim() || '',
        h1: $('h1').first().text().trim(),
        canonical: $('link[rel="canonical" i]').attr('href')?.trim() || '',
        links,
        loadTimeMs: renderResult.loadTimeMs
      };

      eventBus.dispatch(EVENTS.PAGE_CRAWLED, { auditId, url, pageData });

      // 5. URL Frontier (Enqueue new links)
      for (const link of links) {
        if (this.rules.isAllowed(link)) {
          // Send to URL frontier queue
          await this.queue.enqueue('crawl_url', { url: link, auditId });
        }
      }

      eventBus.dispatch(EVENTS.PAGE_ANALYZED, { auditId, url, pageData });

      return pageData;
    } catch (error) {
      console.error(`[CrawlPipeline] Error processing ${url}:`, error.message);
      throw error;
    }
  }
}

module.exports = CrawlPipeline;
