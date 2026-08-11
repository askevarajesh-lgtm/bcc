const cheerio = require('cheerio');
const AiSettings = require('../../aiStudio/models/aiSettings.model');
const cryptoUtils = require('../../../utils/crypto');
const AiClientWrapper = require('../../../utils/aiClientWrapper');
const { DEFAULT_AI_MODEL } = require('../../aiCore/config/aiDefaults');

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch (e) {
    return false;
  }
}

function sanitizeHtml(html) {
  if (!html) return '';
  const $ = cheerio.load(html, { decodeEntities: false }, false);

  // Remove dangerous tags
  $('script, iframe, object, embed, applet, meta, link').remove();

  // Remove dangerous attributes
  $('*').each((i, el) => {
    const attribs = el.attribs;
    for (const attr in attribs) {
      if (attr.toLowerCase().startsWith('on')) {
        $(el).removeAttr(attr);
      } else if (attr.toLowerCase() === 'href') {
        if (!isSafeUrl(attribs[attr]) && !attribs[attr].startsWith('#') && !attribs[attr].startsWith('/')) {
           $(el).removeAttr(attr);
        }
      } else if (attr.toLowerCase() === 'src') {
        if (!validateImageUrl(attribs[attr])) {
          $(el).removeAttr(attr);
        }
      }
    }
  });

  return $.html();
}

function sanitizeCss(css) {
  if (!css) return '';
  // Basic CSS sanitization: remove behavior, expression
  let cleanCss = css.replace(/behavior\s*:/gi, 'ignore:');
  cleanCss = cleanCss.replace(/expression\s*\(/gi, 'ignore(');
  return cleanCss;
}

function validateImageUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch (e) {
    return false;
  }
}

function getAiWorkspaceId(workspaceId, user) {
  if (!user) return workspaceId;
  
  const clientRoles = ['agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user', 'client'];
  if (clientRoles.includes(user.role)) {
    return user.brandId || user._id;
  }
  
  return user.agencyId || user._id;
}

async function getClaudeClient(workspaceId, user) {
  const aiWorkspaceId = getAiWorkspaceId(workspaceId, user);
  const settings = await AiSettings.findOne({ workspaceId: aiWorkspaceId });
  if (!settings) {
    throw new Error('AI Settings not found for this workspace. Please configure your Claude API key in AI Settings.');
  }

  let apiKey = null;
  let decryptionSuccessful = false;
  if (settings.anthropicApiKey) {
    try {
      apiKey = cryptoUtils.decrypt(settings.anthropicApiKey);
      decryptionSuccessful = Boolean(apiKey);
    } catch (e) {
      console.error("AI WEBSITE DECRYPTION ERROR:", e.message);
    }
  } else if (settings.contentAnthropicApiKey) {
    try {
      apiKey = cryptoUtils.decrypt(settings.contentAnthropicApiKey);
      decryptionSuccessful = Boolean(apiKey);
    } catch (e) {
      console.error("AI WEBSITE DECRYPTION ERROR:", e.message);
    }
  }

  console.log("=== AI WEBSITE KEY CHECK ===");
  console.log("hasAnthropicKey:", Boolean(settings.anthropicApiKey));
  console.log("hasContentAnthropicKey:", Boolean(settings.contentAnthropicApiKey));
  console.log("decryptionSuccessful:", decryptionSuccessful);
  console.log("============================");

  if (!apiKey) {
    throw new Error('Claude API key is not configured. Please configure your Claude API key in AI Settings.');
  }

  return {
    client: new AiClientWrapper(apiKey, 'anthropic'),
    model: settings.model || DEFAULT_AI_MODEL
  };
}

const SYSTEM_PROMPT = `You are an expert web designer, UX architect, and conversion copywriter.
Your task is to generate a complete, production-ready website based on the provided business details.

CRITICAL RULES:
1. OUTPUT STRICT JSON ONLY. No markdown formatting, no explanations, no \`\`\`json blocks. Just the raw JSON object.
2. DO NOT use Lorem Ipsum or placeholder text like "Your Company Here" or "Add text". Write real, compelling copy specific to the business.
3. Use HTTPS image URLs only (e.g. from Unsplash or other public sources). Do NOT use data:, base64, blob:, or local file paths.
4. The generated HTML MUST be directly compatible with GrapesJS. DO NOT include <html>, <head>, or <body> tags. Output semantic HTML sections (e.g., <header>, <main>, <section>, <footer>).
5. CSS must be standalone and directly loadable. Do NOT use Tailwind classes, React, Vue, or custom JavaScript.
6. Make the design visually stunning, responsive, and appropriate for the given industry and tone.

EXPECTED JSON STRUCTURE:
{
  "site": {
    "title": "...",
    "tagline": "...",
    "primaryColor": "#...",
    "fontFamily": "..."
  },
  "pages": [
    {
      "title": "Home",
      "slug": "home",
      "isHome": true,
      "metaTitle": "...",
      "metaDescription": "...",
      "html": "...",
      "css": "..."
    },
    {
      "title": "About",
      "slug": "about",
      "isHome": false,
      "metaTitle": "...",
      "metaDescription": "...",
      "html": "...",
      "css": "..."
    },
    {
      "title": "Contact",
      "slug": "contact",
      "isHome": false,
      "metaTitle": "...",
      "metaDescription": "...",
      "html": "...",
      "css": "..."
    }
  ]
}

Ensure you generate at least Home, About, and Contact pages. Make them look cohesive and professional.`;

async function generateWebsite({ workspaceId, user, name, industry, businessBrief, tone }) {
  const { client, model } = await getClaudeClient(workspaceId, user);

  const prompt = `Please generate a website with the following details:
Website Name: ${name}
Industry: ${industry || 'General Business'}
Business Description: ${businessBrief}
Desired Tone: ${tone || 'Professional'}

Remember to return ONLY valid JSON.`;

  let responseText = null;

  const attemptGeneration = async (isRetry = false) => {
    const retryInstruction = isRetry ? '\n\nYOU FAILED PREVIOUSLY. Return ONLY one complete JSON object. Do not stop before all required pages are complete. Do not use markdown fences.' : '';
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + retryInstruction },
      { role: 'user', content: prompt }
    ];

    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 8192,
      response_format: { type: 'json_object' }
    });

    console.log("=== AI WEBSITE CLAUDE RESPONSE ===");
    console.log("AI WEBSITE MODEL:", model);
    console.log("response exists:", !!res);
    console.log("choices:", res?.choices?.length);
    console.log("content type:", typeof res?.choices?.[0]?.message?.content);
    console.log("content length:", res?.choices?.[0]?.message?.content?.length);
    console.log("raw content:");
    console.log(res?.choices?.[0]?.message?.content);
    console.log("==================================");

    return res.choices[0].message.content;
  };

  try {
    responseText = await attemptGeneration(false);
  } catch (error) {
    throw new Error('Failed to generate website with Claude: ' + error.message);
  }

  // Parse JSON
  let websiteData = null;
  const parseJson = (text) => {
    let cleanText = text.trim();
    if (cleanText.startsWith('\`\`\`json')) cleanText = cleanText.substring(7);
    if (cleanText.startsWith('\`\`\`')) cleanText = cleanText.substring(3);
    if (cleanText.endsWith('\`\`\`')) cleanText = cleanText.substring(0, cleanText.length - 3);
    cleanText = cleanText.trim();
    return JSON.parse(cleanText);
  };

  if (!responseText) {
    throw new Error("Claude returned an empty response.");
  }

  if (typeof responseText !== "string") {
    throw new Error("Claude returned an unexpected response format.");
  }

  try {
    websiteData = parseJson(responseText);
  } catch (e) {
    console.error("AI WEBSITE JSON PARSE ERROR:", e.message);
    console.error("AI WEBSITE RESPONSE LENGTH:", responseText?.length);
    
    // Retry once
    try {
      responseText = await attemptGeneration(true);
      if (!responseText || typeof responseText !== "string") throw new Error("Invalid response format on retry");
      websiteData = parseJson(responseText);
    } catch (retryError) {
      console.error("AI WEBSITE JSON PARSE ERROR (RETRY):", retryError.message);
      throw new Error('Claude returned invalid JSON structure. Please try again.');
    }
  }

  // Validate Structure
  if (!websiteData.site || !websiteData.pages || !Array.isArray(websiteData.pages)) {
    throw new Error('Claude returned an incomplete website structure. Please try again.');
  }

  const hasHome = websiteData.pages.some(p => p.slug === 'home' || p.isHome);
  if (!hasHome || websiteData.pages.length < 3) {
    throw new Error('Claude did not generate the minimum required pages (Home, About, Contact). Please try again.');
  }

  console.log(
    "AI WEBSITE PAGES:",
    websiteData.pages.map(p => ({
      title: p.title,
      slug: p.slug,
      htmlLength: p.html?.length,
      cssLength: p.css?.length
    }))
  );

  // Sanitize
  websiteData.pages.forEach(page => {
    page.html = sanitizeHtml(page.html);
    page.css = sanitizeCss(page.css);
  });

  return websiteData;
}

module.exports = { generateWebsite };
