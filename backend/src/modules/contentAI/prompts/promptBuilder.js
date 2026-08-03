class PromptBuilder {
  /**
   * Centralized method for generating prompts.
   */
  buildPrompt(contentType, brief) {
    switch (contentType) {
      case 'blogPost':
        return this._buildBlogPrompt(brief);
      case 'landingPage':
        return this._buildLandingPagePrompt(brief);
      case 'product':
        return this._buildProductPrompt(brief);
      case 'rewrite':
        return this._buildRewritePrompt(brief);
      case 'improve':
        return this._buildImprovementPrompt(brief);
      default:
        throw new Error(`Unknown content type for prompt builder: ${contentType}`);
    }
  }

  _buildBlogPrompt(brief) {
    return `
You are an expert SEO Content Writer.
Write a comprehensive, engaging blog post about "${brief.keywords.primary}".

TARGET AUDIENCE: ${brief.targetAudience}
SEARCH INTENT: ${brief.searchIntent}
TONE: ${brief.tone}

KEYWORDS TO INCLUDE:
- Primary: ${brief.keywords.primary}
- Secondary: ${brief.keywords.secondary.join(', ')}

ENTITIES TO MENTION:
${brief.entities.required.join(', ')}

STRUCTURE:
Target Word Count: ${brief.structure.recommendedWordCount || 1000} words
Use appropriate H2 and H3 tags. Ensure high readability, short paragraphs, and clear formatting (use lists and bold text where appropriate).
`;
  }

  _buildLandingPagePrompt(brief) {
    return `
You are an expert Conversion Copywriter.
Write a high-converting landing page focused on "${brief.keywords.primary}".
Ensure strong CTAs, benefit-driven headlines, and trust signals.
Target Audience: ${brief.targetAudience}
Tone: ${brief.tone}
`;
  }

  _buildProductPrompt(brief) {
    return `
You are an eCommerce SEO Copywriter.
Write a product description for "${brief.keywords.primary}".
Highlight features, benefits, and include the secondary keywords: ${brief.keywords.secondary.join(', ')}.
`;
  }

  _buildRewritePrompt(brief) {
    return `
You are an expert Editor.
Rewrite the provided content to improve flow, readability, and engagement, while preserving all existing HTML formatting.
`;
  }

  _buildImprovementPrompt(brief) {
    return `
You are an SEO Optimization AI.
Review the provided content and improve its SEO score by naturally integrating the following keywords: ${brief.keywords.primary}, ${brief.keywords.secondary.join(', ')}.
Ensure required entities are present: ${brief.entities.required.join(', ')}.
Do NOT change the overall meaning of the content, just optimize the keyword density and entity coverage.
`;
  }
}

module.exports = new PromptBuilder();
