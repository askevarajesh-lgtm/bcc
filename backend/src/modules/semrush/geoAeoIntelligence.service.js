const semrushService = require('./semrush.service');
const { OpenAI } = require('openai');

class GeoAeoIntelligenceService {
  async evaluateDomain(domain, options = {}) {
    try {
      const generateUnavailableMetric = (source = 'Semrush') => ({
        value: null,
        source,
        sourceType: 'api',
        status: 'unavailable',
        measuredAt: new Date()
      });

      // Fetch Semrush Overview to get SERP feature data
      // (This will hit the cache if already fetched during the refresh job)
      let aiOverviewPercent = null;
      let faqFeaturePercent = null;
      let semrushContext = '';

      try {
        const overviewData = await semrushService.getDomainOverview(domain, 'global', 'us', options.force);
        if (overviewData && overviewData.length > 0) {
          const data = overviewData[0];
          if (data.serpFeatures) {
            aiOverviewPercent = Number(data.serpFeatures.aiOverviews);
          }
          semrushContext = `
            Actual metrics for this domain from Semrush:
            - Organic Traffic: ${data.Ot || data['Organic Traffic'] || 'N/A'}
            - Organic Keywords: ${data.Or || data['Organic Keywords'] || 'N/A'}
            - Authority Score / Rank: ${data.Rk || data['Rank'] || 'N/A'}
            - Top Keywords Intent Distribution: ${JSON.stringify(data.intentDistribution || [])}
            - Position Distribution: ${JSON.stringify(data.positionDistribution || {})}
            - SERP Features Breakdown: ${JSON.stringify(data.serpFeatures || {})}
          `;
        }
      } catch (err) {
        console.error('[INTELLIGENCE_GEOAEO] Failed to fetch Semrush data for AI/SERP features:', err.message);
      }

      const generateAvailableMetric = (val, source = 'Semrush') => ({
        value: typeof val === 'number' && !isNaN(val) ? val : 0,
        source,
        sourceType: 'api',
        status: 'available',
        measuredAt: new Date()
      });

      // OpenAI Evaluation for GEO/AEO and Recommendations
      let aiScores = { geo: {}, aeo: {}, recommendations: [] };
      try {
        if (process.env.OPENAI_API_KEY) {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const prompt = `
            You are an expert SEO, GEO (Generative Engine Optimization), and AEO (Answer Engine Optimization) analyst.
            Evaluate the domain: ${domain}
            
            ${semrushContext ? `Use the following real metrics to ground your evaluation:\n${semrushContext}` : `Since you cannot crawl the site live, provide a realistic industry-standard estimate based on the domain's known authority and niche.`}
            
            Return a JSON object containing estimated scores (0-100) and actionable recommendations.
            IMPORTANT: Do not return flat or generic scores. Ensure the scores accurately reflect the domain's actual performance metrics provided above. A domain with high authority, high traffic, and strong SERP features should score high (80-95). A domain with poor metrics should score low (20-40). Generate realistic, varied scores (e.g., 42, 67, 89) instead of generic rounded numbers.

            Expected JSON format:
            {
              "geo": {
                "eeatSignals": 0,
                "aiReadability": 0,
                "llmFormatting": 0,
                "semanticCoverage": 0
              },
              "aeo": {
                "faqSchema": 0,
                "answerIntent": 0,
                "voiceSearchScore": 0,
                "conversationalContent": 0
              },
              "recommendations": [
                {
                  "title": "Short, punchy title",
                  "description": "Brief description of the issue or opportunity",
                  "category": "SEO" | "GEO" | "AEO",
                  "type": "Content Gap" | "Technical" | "Strategy",
                  "about": "Detailed explanation of what the issue is and why it matters.",
                  "howToFix": "Step-by-step or descriptive text on how to fix the issue."
                }
              ]
            }
            Return ONLY the raw JSON object, without any markdown formatting like \`\`\`json.
          `;

          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            response_format: { type: 'json_object' }
          });

          const rawJson = response.choices[0].message.content.trim();
          aiScores = JSON.parse(rawJson);
        }
      } catch (err) {
        console.error('[INTELLIGENCE_GEOAEO] OpenAI evaluation failed:', err.message);
      }

      const generateAiMetric = (val, source = 'OpenAI AI Estimate') => ({
        value: typeof val === 'number' && !isNaN(val) ? val : 0,
        source,
        sourceType: 'ai_estimate',
        status: 'available',
        measuredAt: new Date()
      });

      return {
        success: true,
        geo: {
          eeatSignals: aiScores.geo?.eeatSignals !== undefined ? generateAiMetric(aiScores.geo.eeatSignals) : generateUnavailableMetric(),
          aiReadability: aiScores.geo?.aiReadability !== undefined ? generateAiMetric(aiScores.geo.aiReadability) : generateUnavailableMetric(),
          llmFormatting: aiScores.geo?.llmFormatting !== undefined ? generateAiMetric(aiScores.geo.llmFormatting) : generateUnavailableMetric(),
          semanticCoverage: aiScores.geo?.semanticCoverage !== undefined ? generateAiMetric(aiScores.geo.semanticCoverage) : generateUnavailableMetric(),
          // Use actual Semrush AI Overview data if available
          aiOverviewPresence: aiOverviewPercent !== null ? generateAvailableMetric(aiOverviewPercent) : generateUnavailableMetric()
        },
        aeo: {
          faqSchema: aiScores.aeo?.faqSchema !== undefined ? generateAiMetric(aiScores.aeo.faqSchema) : generateUnavailableMetric(),
          answerIntent: aiScores.aeo?.answerIntent !== undefined ? generateAiMetric(aiScores.aeo.answerIntent) : generateUnavailableMetric(),
          voiceSearchScore: aiScores.aeo?.voiceSearchScore !== undefined ? generateAiMetric(aiScores.aeo.voiceSearchScore) : generateUnavailableMetric(),
          conversationalContent: aiScores.aeo?.conversationalContent !== undefined ? generateAiMetric(aiScores.aeo.conversationalContent) : generateUnavailableMetric()
        },
        recommendations: aiScores.recommendations || []
      };

    } catch (error) {
      console.error(`[INTELLIGENCE_GEOAEO] Evaluation failed:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = GeoAeoIntelligenceService;

