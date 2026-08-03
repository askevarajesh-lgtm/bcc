const axios = require('axios');
const cheerio = require('cheerio');

// Simple syllable counter for Flesch-Kincaid
function countSyllables(word) {
  word = word.toLowerCase();
  if(word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  return word.match(/[aeiouy]{1,2}/g)?.length || 1;
}

function calculateReadability(text, wordCount) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  let syllables = 0;
  for(const word of words) syllables += countSyllables(word);
  
  // Flesch Reading Ease
  const score = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount);
  return Math.max(0, Math.min(100, Math.round(score)));
}

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
    this.redirectChains = new Map();
    this.inlinksCount = new Map();
  }

  async discoverSitemapUrls() {
    try {
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
      redirect_chain: [],
      title: "",
      meta_description: "",
      h1: "",
      canonical: "",
      meta_robots: "",
      word_count: 0,
      indexable: null,
      error: "",
      links: [],
      external_links: [],
      images: [],
      headings: [], 
      listCount: 0, 
      tableCount: 0,
      videoCount: 0,
      readingTime: 0,
      readingLevel: 0,
      author: "",
      publishedDate: "",
      updatedDate: "",
      openGraph: {},
      twitterCards: {},
      hreflang: [],
      hasExistingFaqSchema: false,
      jsonLd: [],
      urlDepth: new URL(url).pathname.split('/').filter(Boolean).length,
      urlLength: url.length
    };

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: { 'User-Agent': 'SEO-Agent-Team/1.0 (+https://example.com)' },
        validateStatus: () => true 
      });

      record.status = response.status;
      record.final_url = response.request?.res?.responseUrl || url;
      
      if (record.final_url !== url) {
        record.redirected = true;
        // Approximation of chain based on final url difference, 
        // real chain needs interceptors, but this is safe fallback
        record.redirect_chain.push(record.final_url); 
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
      
      // Open Graph & Twitter Cards
      $('meta[property^="og:"]').each((i, el) => {
        record.openGraph[$(el).attr('property')] = $(el).attr('content');
      });
      $('meta[name^="twitter:"]').each((i, el) => {
        record.twitterCards[$(el).attr('name')] = $(el).attr('content');
      });

      // Hreflang
      $('link[rel="alternate"][hreflang]').each((i, el) => {
        record.hreflang.push({
          lang: $(el).attr('hreflang'),
          url: $(el).attr('href')
        });
      });

      // Article Meta (Author, Dates)
      record.author = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content') || '';
      record.publishedDate = $('meta[property="article:published_time"]').attr('content') || '';
      record.updatedDate = $('meta[property="article:modified_time"]').attr('content') || '';

      $('script, style, noscript').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      record.word_count = text.split(' ').filter(w => w.length > 0).length;
      record.readingTime = Math.ceil(record.word_count / 200); // 200 words per minute
      if(record.word_count > 0) {
        record.readingLevel = calculateReadability(text, record.word_count);
      }

      const robotsLower = record.meta_robots.toLowerCase();
      record.indexable = (record.status === 200 && !robotsLower.includes('noindex'));

      // Links extraction
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href').trim();
        const anchor = $(el).text().trim();
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:') && !href.startsWith('#')) {
          try {
            const absolute = new URL(href, record.final_url).href.split('#')[0];
            const urlObj = new URL(absolute);
            if (urlObj.hostname.replace(/^www\./, '') === this.host) {
              record.links.push({ url: absolute, anchor });
              // Track inlinks
              this.inlinksCount.set(absolute, (this.inlinksCount.get(absolute) || 0) + 1);
            } else {
              record.external_links.push({ url: absolute, anchor });
            }
          } catch(e) {}
        }
      });

      // Images
      $('img').each((i, el) => {
        const rawSrc = $(el).attr('src') || $(el).attr('data-src') || '';
        if (!rawSrc || rawSrc.startsWith('data:')) return;
        try {
          record.images.push({
            src: new URL(rawSrc, record.final_url).href,
            alt: $(el).attr('alt') || '',
            title: $(el).attr('title') || ''
          });
        } catch (e) {}
      });

      // Headings & Structure
      $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text) record.headings.push({ level: parseInt(el.tagName.substring(1)), text });
      });
      record.listCount = $('ul, ol').length;
      record.tableCount = $('table').length;
      record.videoCount = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
      
      // JSON-LD Schema
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const parsed = JSON.parse($(el).html());
          record.jsonLd.push(parsed); 
          const nodes = Array.isArray(parsed) ? parsed : (Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed]);
          if (nodes.some((n) => {
            const t = n && n['@type'];
            return t === 'FAQPage' || (Array.isArray(t) && t.includes('FAQPage'));
          })) {
            record.hasExistingFaqSchema = true;
          }
        } catch (e) {}
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
    // Parallel fetching with concurrency limit
    const CONCURRENCY = 5;
    
    const processNext = async () => {
      if (queue.length === 0 || this.pages.length >= this.limit) return;
      const url = queue.shift();
      const pageData = await this.fetchAndParse(url);
      this.pages.push(pageData);

      if (pageData.status === 200) {
        for (const link of pageData.links) {
          if (!this.seen.has(link.url) && this.pages.length + queue.length < this.limit) {
            this.seen.add(link.url);
            queue.push(link.url);
          }
        }
      }

      i++;
      if (i % 25 === 0) console.log(`[CrawlService] fetched ${i}`);
      await processNext();
    };

    const workers = Array(CONCURRENCY).fill(null).map(() => processNext());
    await Promise.all(workers);

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
    
    // Advanced duplicates & orphans
    const titles = new Set();
    let duplicate_titles = 0;
    const canonicals = new Set();
    let duplicate_canonicals = 0;
    let orphan_pages = 0;
    let missing_hreflang = 0;

    this.pages.forEach(p => {
      if(p.status === 200) {
        if(p.title && titles.has(p.title)) duplicate_titles++;
        if(p.title) titles.add(p.title);
        
        if(p.canonical && canonicals.has(p.canonical)) duplicate_canonicals++;
        if(p.canonical) canonicals.add(p.canonical);
        
        if((this.inlinksCount.get(p.url) || 0) === 0 && p.url !== this.siteUrl) orphan_pages++;
        if(p.hreflang.length === 0) missing_hreflang++;
      }
    });

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
      thin_content_lt_300_words: thin,
      duplicate_titles,
      duplicate_canonicals,
      orphan_pages,
      missing_hreflang
    };
  }
}

module.exports = CrawlService;