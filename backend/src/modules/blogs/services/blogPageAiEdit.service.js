const { getClaudeClient, sanitizeHtml, sanitizeCss } = require('../../websites/services/websiteAiGeneration.service');

const SYSTEM_PROMPT = `You are an expert website and GrapesJS page editor.

You are editing ONE existing blog page.

Your job is to apply ONLY the changes explicitly requested by the user.

Preserve all existing content, sections, images, layout, styling, links, and structure unless the user explicitly asks to change them.

Do not regenerate the entire page unnecessarily.

Do not modify unrelated content.

Return ONLY valid JSON.

The output must contain:

{
  "html": "...",
  "css": "..."
}

Rules:
- Preserve existing HTML structure whenever possible.
- Preserve existing images unless the user explicitly requests image changes.
- Preserve existing CSS unless changes are required.
- Never add JavaScript.
- Never add script tags.
- Never add iframe, object, embed, applet, meta, or link tags.
- Never add inline event handlers such as onclick.
- Never use javascript:, data:, or blob: URLs.
- Keep the result compatible with GrapesJS.
- Apply only the requested modification.
- Return JSON only. No markdown. No explanations.`;

async function aiEditBlogPage({ workspaceId, user, blogPost, prompt }) {
  const { client, model } = await getClaudeClient(workspaceId, user);

  const contextPayload = {
    currentHtml: blogPost.html || '',
    currentCss: blogPost.css || '',
    userRequest: prompt
  };

  const messages = [
    {
      role: 'user',
      content: JSON.stringify(contextPayload)
    }
  ];

  try {
    const response = await client.chat.completions.create({
      model: model,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      response_format: { type: 'json_object' }
    });

    if (response._anthropic && response._anthropic.stop_reason === 'max_tokens') {
      throw new Error("AI response was truncated due to length limits. Please try a smaller change.");
    }

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error("Empty response from AI");
    }

    // Try to safely parse the JSON
    let parsedJson;
    try {
      const jsonStrMatch = aiContent.match(/```json\n([\s\S]*?)\n```/);
      let jsonString = jsonStrMatch ? jsonStrMatch[1] : aiContent;
      jsonString = jsonString.trim();
      if (jsonString.startsWith('```')) jsonString = jsonString.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '');
      
      parsedJson = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON Parse Error on AI output:", parseError, "\nRaw Output:", aiContent);
      throw new Error("AI returned an invalid edit format.");
    }

    if (!parsedJson.html || typeof parsedJson.html !== 'string' || !parsedJson.css || typeof parsedJson.css !== 'string') {
       throw new Error("AI response missing html or css strings.");
    }

    // Sanitize output
    const cleanHtml = sanitizeHtml(parsedJson.html);
    const cleanCss = sanitizeCss(parsedJson.css);

    return {
      html: cleanHtml,
      css: cleanCss
    };

  } catch (err) {
    console.error("Claude Blog Page AI Edit Error:", err);
    throw new Error(err.message || "Failed to process AI edit.");
  }
}

module.exports = {
  aiEditBlogPage
};
