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
    return ip === '127.0.0.1' || ip === 'localhost' || ip === '::1' ||
           ip.startsWith('10.') || ip.startsWith('192.168.') || 
           ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || 
           ip === '169.254.169.254';
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

  async processPage(url, depth, allowedDomain) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: this.timeoutMs,
        maxContentLength: this.maxResponseSize,
        validateStatus: status => status < 400
      });

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
