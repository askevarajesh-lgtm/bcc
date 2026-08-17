const axios = require('axios');
const cheerio = require('cheerio');
const aiOrchestrator = require('../contentAI/providers/AIOrchestrator');

class GeoAeoIntelligenceService {
  /**
   * Fetches the homepage content of a domain and evaluates GEO/AEO metrics.
   * Uses AIOrchestrator to generate scores deterministically based on visible text.
   */
  async evaluateDomain(domain) {
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      let html = '';
      
      try {
        const response = await axios.get(url, { timeout: 15000 });
        html = response.data;
      } catch (err) {
        console.error(`[INTELLIGENCE_GEOAEO] Failed to fetch domain ${domain}:`, err.message);
        throw new Error('Failed to fetch domain content');
      }

      const $ = cheerio.load(html);
      
      // Remove scripts, styles, noscript, etc.
      $('script, style, noscript, iframe, img, svg').remove();
      
      let textContent = $('body').text().replace(/\s+/g, ' ').trim();
      
      // Truncate to avoid blowing up token limits
      if (textContent.length > 20000) {
        textContent = textContent.substring(0, 20000);
      }

      const prompt = `Evaluate the following homepage content for a domain: "${domain}"

Content:
"""
${textContent}
"""

Please analyze the content and provide a JSON response containing scores from 0 to 100 for the following 8 metrics. Your evaluation must be objective based ONLY on the provided text.

Metrics to evaluate:
GEO (Generative Engine Optimization):
- eeatSignals: (Experience, Expertise, Authoritativeness, Trustworthiness) Evidence of expert authorship, clear contact info, and trustworthy claims.
- aiReadability: How easily an LLM can parse and summarize the content.
- llmFormatting: Use of clear semantic HTML structures (headings, lists) that LLMs prefer.
- semanticCoverage: Depth and breadth of the topics covered relating to the domain's core intent.

AEO (Answer Engine Optimization):
- faqSchema: Evidence of FAQ-style content or structured Q&A formats.
- answerIntent: How well the content directly answers user questions quickly.
- voiceSearchScore: Suitability of the content to be read aloud as a voice search answer (short, concise).
- conversationalContent: Use of natural, conversational language over dense academic text.

You MUST reply with ONLY a valid JSON object matching this exact schema:
{
  "eeatSignals": number,
  "aiReadability": number,
  "llmFormatting": number,
  "semanticCoverage": number,
  "faqSchema": number,
  "answerIntent": number,
  "voiceSearchScore": number,
  "conversationalContent": number
}
`;

      const systemInstruction = "You are an expert SEO, GEO, and AEO analysis AI. You output strictly valid JSON with no markdown formatting, no comments, and no explanation.";

      // We ask the Orchestrator for the JSON
      const resultText = await aiOrchestrator.generateContent(prompt, systemInstruction, { maxTokens: 1000 });
      
      // Clean up the response if it has markdown ticks
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI returned invalid JSON format');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Normalize into Intelligence canonical metric schema
      const generateMetric = (val) => ({
        value: typeof val === 'number' ? val : 0,
        source: 'Anthropic Claude',
        sourceType: 'ai_derived',
        status: 'available',
        measuredAt: new Date()
      });

      return {
        success: true,
        geo: {
          eeatSignals: generateMetric(parsed.eeatSignals),
          aiReadability: generateMetric(parsed.aiReadability),
          llmFormatting: generateMetric(parsed.llmFormatting),
          semanticCoverage: generateMetric(parsed.semanticCoverage)
        },
        aeo: {
          faqSchema: generateMetric(parsed.faqSchema),
          answerIntent: generateMetric(parsed.answerIntent),
          voiceSearchScore: generateMetric(parsed.voiceSearchScore),
          conversationalContent: generateMetric(parsed.conversationalContent)
        }
      };

    } catch (error) {
      console.error(`[INTELLIGENCE_GEOAEO] AI Evaluation failed:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new GeoAeoIntelligenceService();
