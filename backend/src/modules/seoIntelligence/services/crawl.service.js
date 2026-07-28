const axios = require('axios');
const cheerio = require('cheerio');

class CrawlService {
  constructor(siteUrl, limit = 2000) {
    this.siteUrl = siteUrl;
    this.limit = limit;
    
    let urlObj;
    try {
      urlObj = new URL(siteUrl);
    } catch(e) {
      urlObj = new URL(`https://${siteUrl}`);
      this.siteUrl = urlObj.href;
    }
    
    this.host = urlObj.hostname.replace(/^www\./, '');
    this.pages = [];
    this.seen = new Set();
  }

  async discoverSitemapUrls() {
    try {
      // Very basic sitemap discovery - in a real app, use a dedicated sitemap parser
      const robotsTxt = await axios.get(new URL('/robots.txt', this.siteUrl).href, { timeout: 5000 }).catch(() => null);
      let sitemapUrl = new URL('/sitemap.xml', this.siteUrl).href;
      
      if (robotsTxt && robotsTxt.data) {
        const sitemapMatch = robotsTxt.data.match(/Sitemap:\s*(.+)/i);
        if (sitemapMatch) sitemapUrl = sitemapMatch[1].trim();
      }

      const res = await axios.get(sitemapUrl, { timeout: 10000 });
      const $ = cheerio.load(res.data, { xmlMode: true });
      const urls = [];
      
      $('loc').each((i, el) => {
        const loc = $(el).text().trim();
        if (loc && !this.seen.has(loc)) {
          this.seen.add(loc);
          urls.push(loc);
        }
      });
      return urls;
    } catch (error) {
      console.log('[CrawlService] No sitemap found or failed to parse. Falling back to BFS.');
      return [];
    }
  }

  async fetchAndParse(url) {
    const record = {
      url: url,
      status: 0,
      final_url: url,
      redirected: false,
      title: "",
      meta_description: "",
      h1: "",
      canonical: "",
      meta_robots: "",
      word_count: 0,
      indexable: null,
      error: "",
      links: []
    };

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: { 'User-Agent': 'SEO-Agent-Team/1.0 (+https://example.com)' },
        validateStatus: () => true // resolve for any status code
      });

      record.status = response.status;
      record.final_url = response.request?.res?.responseUrl || url;
      if (record.final_url !== url) {
        record.redirected = true;
      }

      const contentType = response.headers['content-type'] || '';
      if (!contentType.toLowerCase().includes('html')) {
        record.indexable = false;
        return record;
      }

      const html = response.data;
      const $ = cheerio.load(html);

      record.title = $('title').text().trim();
      record.meta_description = $('meta[name="description" i]').attr('content')?.trim() || '';
      record.h1 = $('h1').first().text().trim();
      record.canonical = $('link[rel="canonical" i]').attr('href')?.trim() || '';
      record.meta_robots = $('meta[name="robots" i]').attr('content')?.trim() || '';
      
      $('script, style, noscript').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      record.word_count = text.split(' ').filter(w => w.length > 0).length;

      const robotsLower = record.meta_robots.toLowerCase();
      record.indexable = (record.status === 200 && !robotsLower.includes('noindex'));

      // Extract links for BFS
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href').trim();
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:') && !href.startsWith('#')) {
          try {
            const absolute = new URL(href, record.final_url).href.split('#')[0];
            const urlObj = new URL(absolute);
            if (['http:', 'https:'].includes(urlObj.protocol) && urlObj.hostname.replace(/^www\./, '') === this.host) {
              record.links.push(absolute);
            }
          } catch(e) {}
        }
      });
      
    } catch (err) {
      record.error = err.message;
      record.indexable = false;
    }

    return record;
  }

  async run() {
    console.log(`[CrawlService] discovering URLs for ${this.siteUrl} ...`);
    let queue = await this.discoverSitemapUrls();
    
    if (queue.length === 0) {
      queue.push(this.siteUrl);
      this.seen.add(this.siteUrl);
    }

    if (this.limit && queue.length > this.limit) {
      queue = queue.slice(0, this.limit);
    }

    let i = 0;
    while (queue.length > 0 && this.pages.length < this.limit) {
      const url = queue.shift();
      const pageData = await this.fetchAndParse(url);
      this.pages.push(pageData);

      if (pageData.status === 200) {
        for (const link of pageData.links) {
          if (!this.seen.has(link) && this.pages.length + queue.length < this.limit) {
            this.seen.add(link);
            queue.push(link);
          }
        }
      }

      i++;
      if (i % 25 === 0) console.log(`[CrawlService] fetched ${i}`);
      await new Promise(resolve => setTimeout(resolve, 250)); // polite delay
    }

    return {
      summary: this.buildSummary(),
      pages: this.pages
    };
  }

  buildSummary() {
    const total = this.pages.length;
    const ok = this.pages.filter(p => p.status === 200).length;
    const errors = this.pages.filter(p => p.status === 0 || p.error).length;
    const redirects = this.pages.filter(p => p.redirected).length;
    const server_errors = this.pages.filter(p => p.status >= 500).length;
    const client_errors = this.pages.filter(p => p.status >= 400 && p.status < 500).length;
    const noindex = this.pages.filter(p => p.indexable === false && p.status === 200).length;
    const missing_title = this.pages.filter(p => p.status === 200 && !p.title).length;
    const missing_meta = this.pages.filter(p => p.status === 200 && !p.meta_description).length;
    const missing_h1 = this.pages.filter(p => p.status === 200 && !p.h1).length;
    const thin = this.pages.filter(p => p.status === 200 && p.word_count < 300).length;

    return {
      site_url: this.siteUrl,
      crawled_at: new Date().toISOString(),
      total_urls: total,
      status_200: ok,
      client_errors_4xx: client_errors,
      server_errors_5xx: server_errors,
      fetch_errors: errors,
      redirected: redirects,
      noindex_pages: noindex,
      missing_title,
      missing_meta_description: missing_meta,
      missing_h1,
      thin_content_lt_300_words: thin
    };
  }
}

module.exports = CrawlService;