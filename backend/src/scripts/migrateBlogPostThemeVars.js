const mongoose = require('mongoose');
const cheerio = require('cheerio');
require('dotenv').config();

const BlogPost = require('../modules/blogs/blog-post.model');
const Website = require('../modules/websites/website.model');

const APPLY = process.argv.includes('--apply');

const KNOWN_NEUTRALS = new Set(['#ffffff', '#fff', '#0f172a', '#64748b', '#e2e8f0', '#1e293b', '#334155', '#475569']);

function extractHexColors(styleStr) {
  const matches = styleStr.match(/#[0-9a-fA-F]{3,8}/g) || [];
  return matches.map((h) => h.toLowerCase());
}

function rewriteFontFamily($el) {
  const style = $el.attr('style');
  if (!style) return false;
  const re = /font-family\s*:\s*'([^']+)'\s*,\s*sans-serif/i;
  const m = style.match(re);
  if (!m) return false;
  if (m[1] === 'var(--site-font' /* already migrated, guard against double-wrap */) return false;
  const replaced = style.replace(re, `font-family:var(--site-font, '${m[1]}'), sans-serif`);
  $el.attr('style', replaced);
  return true;
}

function migratePostHtml(html) {
  if (!html || !html.includes('data-post-field') && !html.includes('faq-item')) {
    return { html, changed: false };
  }

  const $ = cheerio.load(html, null, false);
  let changed = false;

  const fontScopeSelector = [
    '[data-post-field]',
    '[data-post-field] *',
    '.faq-item',
    '.faq-item *',
  ].join(', ');
  $(fontScopeSelector).each((_, el) => {
    if (rewriteFontFamily($(el))) changed = true;
  });

  const faqScope = $('[data-post-field="faq"], .faq-item');
  const colorCounts = new Map();
  faqScope.each((_, el) => {
    const style = $(el).attr('style') || '';
    extractHexColors(style).forEach((hex) => {
      const base = hex.length > 7 ? hex.slice(0, 7) : hex; // strip alpha suffix
      if (KNOWN_NEUTRALS.has(base)) return;
      colorCounts.set(base, (colorCounts.get(base) || 0) + 1);
    });
  });

  let brandHex = null;
  let bestCount = 0;
  for (const [hex, count] of colorCounts.entries()) {
    if (count > bestCount) {
      brandHex = hex;
      bestCount = count;
    }
  }

  if (brandHex && bestCount >= 2) {
    faqScope.each((_, el) => {
      const $el = $(el);
      const style = $el.attr('style');
      if (!style) return;
      let newStyle = style;
      const existingClass = $el.attr('class') || '';
      const addedClasses = new Set();

      // Solid brand-color usages (background:#hex; or color:#hex;)
      const solidRe = new RegExp(`(background|color)\\s*:\\s*${brandHex}(?![0-9a-fA-F])`, 'gi');
      newStyle = newStyle.replace(solidRe, (full, prop) => {
        addedClasses.add(prop === 'background' ? 'bcc-brand-bg' : 'bcc-brand-text');
        return `${prop}:var(--brand-color, ${brandHex})`;
      });

      // Alpha-tinted usages of the same hex (e.g. #3b82f61a / #3b82f633)
      const alphaRe = new RegExp(`(background|border(?:-color)?)\\s*:\\s*${brandHex}[0-9a-fA-F]{2}`, 'gi');
      newStyle = newStyle.replace(alphaRe, (full, prop) => {
        addedClasses.add('bcc-brand-tint');
        const pct = full.toLowerCase().includes('border') ? 20 : 10;
        return `${prop}:color-mix(in srgb, var(--brand-color, ${brandHex}) ${pct}%, transparent)`;
      });

      if (newStyle !== style) {
        $el.attr('style', newStyle);
        if (addedClasses.size > 0) {
          const merged = new Set(existingClass.split(/\s+/).filter(Boolean));
          addedClasses.forEach((c) => merged.add(c));
          $el.attr('class', Array.from(merged).join(' '));
        }
        changed = true;
      }
    });
  }

  return { html: $.html(), changed };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bcc_seo');
  console.log(`Connected. Mode: ${APPLY ? 'APPLY (writing changes)' : 'DRY RUN (no writes)'}`);

  const posts = await BlogPost.find({ isDeleted: false, html: { $exists: true, $ne: '' } });
  console.log(`Scanning ${posts.length} post(s)...`);

  let touched = 0;
  for (const post of posts) {
    const { html, changed } = migratePostHtml(post.html);
    if (!changed) continue;

    touched += 1;
    console.log(`- Post ${post._id} ("${post.title}") would be updated`);

    if (APPLY) {
      post.html = html;
      await post.save();
    }
  }

  console.log(`${touched} post(s) ${APPLY ? 'updated' : 'would be updated'}.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});