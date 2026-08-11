const cheerio = require('cheerio');
const {
  getClaudeClient,
  sanitizeHtml,
  sanitizeCss
} = require('./websiteAiGeneration.service');

const SYSTEM_PROMPT = `You are an expert website editor.

You are editing an EXISTING website.
Do not regenerate the entire website unless the requested operation requires it.

You MUST return exactly one JSON object.

The operation field MUST be exactly one of:
CREATE_PAGE
MODIFY_PAGE
MODIFY_SECTION
UPDATE_CONTENT
UPDATE_SEO
UPDATE_THEME
DELETE_PAGE

Never invent another operation.

For global theme changes use UPDATE_THEME.
For UPDATE_THEME:
{
  "operation": "UPDATE_THEME",
  "theme": {
    "primaryColor": "#hex",
    "fontFamily": "...",
    "tagline": "..."
  }
}
Only include theme properties requested by the user.
If the user says to keep an existing property unchanged, do not invent a replacement value.

For content changes, preserve all unrelated content.
For page changes, modify only the requested page.
For section changes, preserve all unrelated sections.
For delete operations, never delete the Home page.

Return ONLY valid JSON.
No markdown.
No code fences.
No explanation.

All HTML must be GrapesJS-compatible.
Do not use html/head/body wrappers.
CSS must be standalone.
Images must use HTTP/HTTPS public image URLs only.
Never use: data: blob: base64 local file paths file://
Never include JavaScript.
Never include script tags.
Never include inline event handlers.
Never use javascript: URLs.
Keep generated HTML/CSS reasonably compact.`;

const SUPPORTED_OPERATIONS = [
  'CREATE_PAGE',
  'MODIFY_PAGE',
  'MODIFY_SECTION',
  'UPDATE_CONTENT',
  'UPDATE_SEO',
  'UPDATE_THEME',
  'DELETE_PAGE'
];

async function aiEditWebsite({ workspaceId, user, website, pages, targetPage, prompt }) {
  const { client, model } = await getClaudeClient(workspaceId, user);

  // Build the context
  let contextPayload = {
    website: {
      name: website.name,
      description: website.description,
      industry: website.industry || '', 
      theme: website.theme
    },
    userRequest: prompt
  };

  if (targetPage) {
    contextPayload.targetPage = {
      id: targetPage._id.toString(),
      title: targetPage.title,
      slug: targetPage.path.replace(/^\//, ''),
      isHome: targetPage.isHome,
      metaTitle: targetPage.metaTitle,
      metaDescription: targetPage.metaDescription,
      html: targetPage.html,
      css: targetPage.css
    };
  } else if (pages && pages.length > 0) {
    // Context is all pages provided
    contextPayload.pages = pages.map(p => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.path.replace(/^\//, ''),
      isHome: p.isHome,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      html: p.html,
      css: p.css
    }));
  }

  const promptText = `
Here is the context of the website to modify:
${JSON.stringify(contextPayload, null, 2)}

Based on the user request, return the appropriate JSON operation to perform the edit.
Supported operations: ${SUPPORTED_OPERATIONS.join(', ')}

Examples:
1. CREATE_PAGE: { "operation": "CREATE_PAGE", "page": { "title": "...", "slug": "...", "isHome": false, "metaTitle": "...", "metaDescription": "...", "html": "...", "css": "..." } }
2. MODIFY_PAGE: { "operation": "MODIFY_PAGE", "pageSlug": "about", "html": "...", "css": "...", "metaTitle": "...", "metaDescription": "..." }
3. MODIFY_SECTION: { "operation": "MODIFY_SECTION", "pageSlug": "home", "sectionIdentifier": "...", "action": "replace|add|remove", "html": "...", "css": "..." }
4. UPDATE_CONTENT: { "operation": "UPDATE_CONTENT", "pageSlug": "home", "changes": [{ "target": "...", "value": "..." }] }
5. UPDATE_SEO: { "operation": "UPDATE_SEO", "pageSlug": "about", "metaTitle": "...", "metaDescription": "..." }
6. UPDATE_THEME: { "operation": "UPDATE_THEME", "theme": { "primaryColor": "#...", "fontFamily": "...", "tagline": "..." } }
7. DELETE_PAGE: { "operation": "DELETE_PAGE", "pageSlug": "pricing" }

Remember: 
- Return ONLY valid JSON, no markdown fences.
- For UPDATE_CONTENT, 'target' must be a valid CSS selector matching an element in the provided HTML.
- For MODIFY_SECTION, 'sectionIdentifier' must identify a clear section container (e.g. by id or class).
- For CREATE_PAGE or MODIFY_PAGE, include complete valid HTML/CSS.
- For image URLs, use ONLY valid public HTTP/HTTPS images.
`;

  const attemptGeneration = async (isRetry = false) => {
    const retryInstruction = isRetry ? '\n\nYOU FAILED PREVIOUSLY. Return ONLY valid JSON. No markdown fences. Ensure structure matches one of the examples exactly.' : '';
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + retryInstruction },
      { role: 'user', content: promptText }
    ];

    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 16000,
      response_format: { type: 'json_object' }
    });
    return res.choices[0].message.content;
  };

  let responseText = null;
  try {
    responseText = await attemptGeneration(false);
  } catch (error) {
    throw new Error('Failed to generate edit with Claude: ' + error.message);
  }

  const parseJson = (text) => {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
    cleanText = cleanText.trim();
    return JSON.parse(cleanText);
  };

  let editData = null;
  try {
    editData = parseJson(responseText);
  } catch (e) {
    try {
      responseText = await attemptGeneration(true);
      editData = parseJson(responseText);
    } catch (retryError) {
      throw new Error('AI returned invalid JSON structure.');
    }
  }

  console.log("=== AI EDIT RAW RESPONSE ===");
  console.log(responseText);

  console.log("=== AI EDIT PARSED RESPONSE ===");
  console.log(JSON.stringify(editData, null, 2));

  if (!editData || typeof editData !== 'object') {
    throw new Error('AI returned an invalid response format.');
  }

  const rawOperation = editData.operation;
  const operation = String(rawOperation || '').trim().toUpperCase();
  editData.operation = operation;

  console.log("=== AI EDIT OPERATION ===");
  console.log(operation);

  if (!operation) {
    throw new Error('AI response did not include an operation field.');
  }

  if (!SUPPORTED_OPERATIONS.includes(operation)) {
    throw new Error(`AI returned unsupported operation: ${operation}`);
  }

  if (operation === 'UPDATE_THEME') {
    if (!editData.theme || typeof editData.theme !== 'object') {
      throw new Error('AI returned an invalid UPDATE_THEME payload.');
    }
  }

  // Sanitize any generated HTML/CSS
  if (editData.page) {
    editData.page.html = sanitizeHtml(editData.page.html);
    editData.page.css = sanitizeCss(editData.page.css);
  }
  if (editData.html) {
    editData.html = sanitizeHtml(editData.html);
  }
  if (editData.css) {
    editData.css = sanitizeCss(editData.css);
  }
  if (editData.changes && Array.isArray(editData.changes)) {
    editData.changes.forEach(c => {
      c.value = sanitizeHtml(c.value);
    });
  }

  return editData;
}

function applyUpdateContent(html, changes) {
  if (!html || !changes || !Array.isArray(changes)) return html;
  const $ = cheerio.load(html, { decodeEntities: false }, false);
  
  for (const change of changes) {
    if (!change.target || change.value === undefined) continue;
    try {
      const el = $(change.target);
      if (el.length > 0) {
        el.html(change.value); // Already sanitized above
      }
    } catch (e) {
      console.error(`Failed to apply UPDATE_CONTENT to target ${change.target}:`, e);
    }
  }
  
  return $.html();
}

function applyModifySection(html, sectionIdentifier, action, newHtml) {
  if (!html || !sectionIdentifier || !action) return html;
  const $ = cheerio.load(html, { decodeEntities: false }, false);
  
  try {
    let el = $(`#${sectionIdentifier}`);
    if (el.length === 0) el = $(`[data-section='${sectionIdentifier}']`);
    if (el.length === 0) el = $(sectionIdentifier);
    
    if (el.length > 0) {
      if (action === 'remove') {
        el.remove();
      } else if (action === 'replace') {
        el.replaceWith(newHtml);
      } else if (action === 'add') {
        el.after(newHtml);
      }
    } else {
      if (action === 'add') {
         $.root().append(newHtml);
      } else {
         throw new Error(`Could not find the requested section: ${sectionIdentifier}`);
      }
    }
  } catch (e) {
    console.error(`Failed to apply MODIFY_SECTION for ${sectionIdentifier}:`, e);
    throw new Error(`Could not find the requested section: ${sectionIdentifier}`);
  }
  
  return $.html();
}

module.exports = {
  aiEditWebsite,
  applyUpdateContent,
  applyModifySection
};
