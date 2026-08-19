const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

const dns = require('dns');
const util = require('util');
const resolve4 = util.promisify(dns.resolve4);

class CrawlerService {
  constructor() {
    this.maxPages = parseInt(process.env.MAX_CRAWL_PAGES || '50', 10);
    this.concurrency = parseInt(process.env.CRAWL_CONCURRENCY || '5', 10);
    this.timeoutMs = parseInt(process.env.CRAWL_TIMEOUT_MS || '10000', 10);
    this.maxDepth = parseInt(process.env.CRAWL_MAX_DEPTH || '3', 10);
    this.delayMs = parseInt(process.env.CRAWL_DELAY_MS || '200', 10);
    this.maxResponseSize = parseInt(process.env.CRAWL_MAX_RESPONSE_SIZE || '5242880', 10); // 5MB
    this.userAgent = process.env.CRAWL_USER_AGENT || 'IntelligenceBot/1.0 (+https://example.com/bot)';
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  normalizeUrl(rawUrl, baseUrl) {
    try {
      const urlObj = new URL(rawUrl, baseUrl);
      urlObj.hash = ''; // Remove fragment
      return urlObj.href;
    } catch (e) {
      return null;
    }
  }

  isIpPrivate(ip) {
    if (ip === 'localhost') return true;
    
    // IPv4 private/reserved ranges
    const isV4Private = ip.startsWith('127.') || 
           ip.startsWith('10.') || 
           ip.startsWith('192.168.') || 
           !!ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || 
           ip.startsWith('169.254.') ||
           ip.startsWith('0.') ||
           !!ip.match(/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./) || // 100.64.0.0/10
           !!ip.match(/^198\.(1[8-9])\./); // 198.18.0.0/15

    // IPv6 private/reserved ranges
    const isV6Private = ip === '::1' || 
           ip.toLowerCase().startsWith('fc') || // fc00::/7 (fc00... - fdff...)
           ip.toLowerCase().startsWith('fd') || 
           ip.toLowerCase().startsWith('fe8') || // fe80::/10 link-local
           ip.toLowerCase().startsWith('fe9') || 
           ip.toLowerCase().startsWith('fea') || 
           ip.toLowerCase().startsWith('feb');

    return isV4Private || isV6Private;
  }

  async ensureSafeDomain(domain) {
    if (this.isIpPrivate(domain)) return false;
    try {
      const ips = await resolve4(domain);
      for (const ip of ips) {
        if (this.isIpPrivate(ip)) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async checkRobotsTxt(domain) {
    try {
      const isSafe = await this.ensureSafeDomain(domain);
      if (!isSafe) return false;
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await axios.get(robotsUrl, { timeout: this.timeoutMs });
      if (response.data && response.data.includes('User-agent: *') && response.data.includes('Disallow: /')) {
        return false; // Blocked entirely
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  async crawl(startUrl) {
    let domainUrl;
    try {
      domainUrl = new URL(startUrl);
    } catch (err) {
      throw new Error('Invalid start URL');
    }

    const domain = domainUrl.hostname;
    const isAllowed = await this.checkRobotsTxt(domain);
    if (!isAllowed) {
      throw new Error('Crawling disallowed by robots.txt');
    }

    const visited = new Set();
    const queue = [{ url: startUrl, depth: 0 }];
    const results = [];
    let activeWorkers = 0;

    return new Promise((resolve, reject) => {
      const processQueue = async () => {
        if (queue.length === 0 && activeWorkers === 0) {
          resolve(results);
          return;
        }

        while (queue.length > 0 && activeWorkers < this.concurrency && visited.size < this.maxPages) {
          const currentItem = queue.shift();
          
          if (visited.has(currentItem.url)) {
            continue;
          }

          visited.add(currentItem.url);
          activeWorkers++;

          this.processPage(currentItem.url, currentItem.depth, domain)
            .then(pageData => {
              if (pageData) {
                results.push(pageData);
                
                // Add new links to queue
                if (currentItem.depth < this.maxDepth) {
                  for (const link of pageData.links) {
                    if (!visited.has(link) && queue.length + visited.size < this.maxPages) {
                       // Ensure uniqueness in queue
                       if (!queue.find(q => q.url === link)) {
                         queue.push({ url: link, depth: currentItem.depth + 1 });
                       }
                    }
                  }
                }
              }
            })
            .catch(err => {
               // Log but continue crawling
               console.error(`Crawler failed on ${currentItem.url}:`, err.message);
            })
            .finally(async () => {
              activeWorkers--;
              await this.sleep(this.delayMs); // Rate limiting
              processQueue();
            });
        }
      };

      processQueue();
    });
  }

  async safeFetch(url, allowedDomain, redirectCount = 0) {
    if (redirectCount > 3) throw new Error('Too many redirects');

    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }

    const isSafe = await this.ensureSafeDomain(parsedUrl.hostname);
    if (!isSafe) throw new Error('SSRF check failed');

    // Only allow crossing domains if explicitly allowed, but here we just check SSRF.
    // However, the original crawl ensures URLs added to the queue are within the same domain.
    // If a redirect goes off-domain, we might block it, but standard crawler allows off-domain if it's safe?
    // The instructions say "If same-domain policy permits it: public URL -> 301 -> another allowed URL Expected: request succeeds."
    // So we just rely on SSRF for safety here.

    const response = await axios.get(url, {
      headers: { 'User-Agent': this.userAgent },
      timeout: this.timeoutMs,
      maxContentLength: this.maxResponseSize,
      validateStatus: status => status < 400 || (status >= 300 && status < 400),
      maxRedirects: 0
    });

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      const redirectUrl = new URL(response.headers.location, url).href;
      return this.safeFetch(redirectUrl, allowedDomain, redirectCount + 1);
    }

    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  }

  async processPage(url, depth, allowedDomain) {
    try {
      const response = await this.safeFetch(url, allowedDomain);

      const html = response.data;
      const $ = cheerio.load(html);
      
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      const h1Count = $('h1').length;
      
      // Extract Canonical
      const canonicalTag = $('link[rel="canonical"]').attr('href');
      const canonical = canonicalTag ? this.normalizeUrl(canonicalTag, url) : url;

      // Extract internal links
      const links = new Set();
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const normalized = this.normalizeUrl(href, url);
          if (normalized) {
             try {
               const normalizedUrlObj = new URL(normalized);
               if (normalizedUrlObj.hostname === allowedDomain) {
                 links.add(normalized);
               }
             } catch(e) {}
          }
        }
      });

      // Simple Schema Extraction (Just count JSON-LD tags for now)
      const schemaCount = $('script[type="application/ld+json"]').length;

      return {
        url,
        canonical,
        title,
        metaDescription,
        h1Count,
        schemaCount,
        depth,
        statusCode: response.status,
        contentLength: html.length,
        links: Array.from(links)
      };

    } catch (error) {
      if (error.response) {
         return {
            url,
            statusCode: error.response.status,
            error: error.message,
            links: []
         };
      }
      throw error;
    }
  }
}

module.exports = new CrawlerService();
