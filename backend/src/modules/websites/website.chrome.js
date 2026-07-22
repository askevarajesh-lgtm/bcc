const cheerio = require('cheerio');
const Website = require('./website.model');
const Page = require('./page.model');

const NON_CONTENT_SELECTOR =
  'script, style, noscript, #spinner, #preloader, .preloader, .loader-wrapper, .loader, .td-preloader-wrap';

// Mirrors the client-side heuristic in GrapesJSBuilder.jsx's parseHeaderFooterFromHtml,
// so anything rendered server-side (public blog pages, embeds, etc.) ends up with the
// same header/footer the builder itself would infer for a blank page: prefer an explicit
// <header>/<footer> (or common header/footer class/id), and fall back to the first/last
// top-level body element when a template doesn't tag them explicitly.
function parseHeaderFooterFromHtml(html) {
  if (!html) return { header: '', footer: '' };
  try {
    const $ = cheerio.load(html, null, false);
    const body = $('body').length ? $('body') : $.root();

    let headerEl = $('header, [data-gjs-type="header"], .site-header, .main-header, #header').first();
    let footerEl = $('footer, [data-gjs-type="footer"], .site-footer, .main-footer, #footer').first();

    const topLevelChildren = body.children().filter((_, el) => !$(el).is(NON_CONTENT_SELECTOR));

    if (headerEl.length === 0 && topLevelChildren.length > 1) {
      headerEl = topLevelChildren.first();
    }
    if (footerEl.length === 0 && topLevelChildren.length > 1) {
      footerEl = topLevelChildren.last();
    }

    // Guard against a single-section page grabbing the same element twice.
    if (headerEl.length && footerEl.length && headerEl.is(footerEl)) {
      footerEl = $();
    }

    return {
      header: headerEl.length ? $.html(headerEl) : '',
      footer: footerEl.length ? $.html(footerEl) : ''
    };
  } catch (err) {
    console.error('Failed to parse header/footer from home page html', err);
    return { header: '', footer: '' };
  }
}

// Imported template pages link their real stylesheet(s) via <link> tags pointing at
// Cloudinary (see website.controller.js's zip import). Header/footer markup pulled out
// of that html is meaningless without those stylesheets, so surface them alongside the
// markup for the consumer to render.
function extractStylesheetUrls(html) {
  if (!html) return [];
  try {
    const $ = cheerio.load(html, null, false);
    const urls = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && /^https?:\/\//i.test(href)) urls.push(href);
    });
    return urls;
  } catch (err) {
    console.error('Failed to extract stylesheet urls from home page html', err);
    return [];
  }
}

// Loads a website's home page (or its first page with saved html) and returns the
// header/footer markup + stylesheet URLs a dependent module (blogs, stores, funnels...)
// can use so its own pages get the website's chrome by default, without needing to know
// anything about how the website itself is built or stored.
async function getSiteChrome(websiteId) {
  const empty = { headerHtml: '', footerHtml: '', stylesheetUrls: [] };
  if (!websiteId) return empty;

  try {
    const website = await Website.findOne({ _id: websiteId, isDeleted: false }).select('_id');
    if (!website) return empty;

    const homePage =
      (await Page.findOne({ websiteId, isHome: true, isDeleted: false })) ||
      (await Page.findOne({ websiteId, isDeleted: false, html: { $exists: true, $ne: '' } }).sort({ createdAt: 1 }));

    if (!homePage || !homePage.html) return empty;

    const { header, footer } = parseHeaderFooterFromHtml(homePage.html);
    return {
      headerHtml: header,
      footerHtml: footer,
      stylesheetUrls: extractStylesheetUrls(homePage.html)
    };
  } catch (err) {
    console.error('Failed to compute site chrome for website', websiteId, err);
    return empty;
  }
}

module.exports = { getSiteChrome, parseHeaderFooterFromHtml, extractStylesheetUrls };
