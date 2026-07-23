const cheerio = require('cheerio');
const Website = require('./website.model');
const Page = require('./page.model');

const NON_CONTENT_SELECTOR =
  'script, style, noscript, #spinner, #preloader, .preloader, .loader-wrapper, .loader, .td-preloader-wrap, ' +
  '.back-to-top, #back-to-top, .backtotop, .back-to-top-btn, .scroll-top, .scrolltop, .scroll-to-top, .scrollup, .go-top, .gotop, .totop';

const GENERIC_CLASS_RE = /^(container|container-fluid|row|col(-\w+)?(-\d+)?|[pm][trblxy]?-\d+|wow|fade\w*|text-(center|left|right|white|dark)|d-\w+|position-\w+|w-100|h-100)$/i;

function significantClassTokens($, el) {
  return ($(el).attr('class') || '').trim().split(/\s+/).filter(Boolean).filter((c) => !GENERIC_CLASS_RE.test(c));
}

function shareStyleSignal($, elA, elB) {
  const a = significantClassTokens($, elA);
  const b = new Set(significantClassTokens($, elB));
  return a.some((c) => b.has(c));
}

function isNavLike($, el) {
  const $el = $(el);
  return $el.is('nav') || $el.find('nav').length > 0 || $el.is('[class*="navbar"]') || $el.find('[class*="navbar"]').length > 0;
}

function isFooterSignal($, el) {
  return $(el).is('[class*="footer"], [id*="footer"], [class*="copyright"], [id*="copyright"]');
}

function buildHeaderGroup($, children) {
  if (children.length === 0) return [];
  const lookahead = Math.min(children.length, 3);
  for (let i = 0; i < lookahead; i++) {
    if (isNavLike($, children[i])) return children.slice(0, i + 1);
  }
  return [children[0]]; 
}

function buildFooterGroup($, children) {
  const n = children.length;
  if (n === 0) return [];
  const lookback = Math.min(n, 3);
  const group = [children[n - 1]];
  for (let i = n - 2; i >= n - lookback; i--) {
    const el = children[i];
    if (isFooterSignal($, el) || shareStyleSignal($, el, group[0])) {
      group.unshift(el);
    } else {
      break;
    }
  }
  return group;
}
function parseHeaderFooterFromHtml(html) {
  if (!html) return { header: '', footer: '' };
  try {
    const $ = cheerio.load(html);
    const body = $('body').length ? $('body') : $.root();

    const headerEl = $('header, [data-gjs-type="header"], .site-header, .main-header, #header').first();
    const footerEl = $('footer, [data-gjs-type="footer"], .site-footer, .main-footer, #footer').first();

    const topLevelChildren = body.children().filter((_, el) => !$(el).is(NON_CONTENT_SELECTOR)).toArray();

    let headerGroup = headerEl.length ? [headerEl.get(0)] : [];
    let footerGroup = footerEl.length ? [footerEl.get(0)] : [];

    if (headerGroup.length === 0 && topLevelChildren.length > 1) {
      headerGroup = buildHeaderGroup($, topLevelChildren);
    }
    if (footerGroup.length === 0 && topLevelChildren.length > 1) {
      footerGroup = buildFooterGroup($, topLevelChildren);
    }

    // Guard against a single-section page grabbing the same element(s) twice.
    if (headerGroup.length && footerGroup.length && headerGroup.some((h) => footerGroup.includes(h))) {
      footerGroup = [];
    }

    return {
      header: headerGroup.map((el) => $.html(el)).join('\n'),
      footer: footerGroup.map((el) => $.html(el)).join('\n')
    };
  } catch (err) {
    console.error('Failed to parse header/footer from home page html', err);
    return { header: '', footer: '' };
  }
}

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
    const stylesheetUrls = homePage.stylesheetUrls?.length
      ? homePage.stylesheetUrls
      : extractStylesheetUrls(homePage.html);
    return {
      headerHtml: header,
      footerHtml: footer,
      stylesheetUrls
    };
  } catch (err) {
    console.error('Failed to compute site chrome for website', websiteId, err);
    return empty;
  }
}

module.exports = { getSiteChrome, parseHeaderFooterFromHtml, extractStylesheetUrls };