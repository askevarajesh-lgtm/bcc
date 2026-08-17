const SeoWebsite = require('../models/seoProject.model');
const SeoAudit = require('../models/seoAudit.model');
const OptimizationScore = require('../models/optimizationScore.model');
const dataForSeoService = require('../dataForSeo.service');
const SemrushProject = require('../../semrush/models/semrushProject.model');

const axios = require('axios');
const cheerio = require('cheerio');
const { Anthropic } = require('@anthropic-ai/sdk');

// Initialize Anthropic Client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Helper to fetch and extract text from a domain
const scrapeWebsiteText = async (domain) => {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, noscript, iframe, img, svg').remove();
    
    // Extract readable text
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    // Return first 15000 characters to keep within prompt limits safely
    return text.substring(0, 15000); 
  } catch (error) {
    console.error(`Scraping failed for ${domain}:`, error.message);
    return null;
  }
};

const analyzePageWithAI = async (domain) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is missing from .env. Real data cannot be generated.');
  }

  const content = await scrapeWebsiteText(domain);
  if (!content) {
    throw new Error(`Could not scrape readable content from ${domain} for AI analysis.`);
  }

  const prompt = `You are an expert Enterprise SEO, GEO (Generative Engine Optimization), and AEO (Answer Engine Optimization) analyst.
Analyze the following website content for ${domain}:
<content>
${content}
</content>

Based on the content, evaluate the website and return a strictly formatted JSON object with the following schema exactly (NO markdown formatting, just raw JSON):
{
  "issues": [
    { "category": "GEO or AEO", "priority": "High or Medium", "title": "<Short title>", "description": "<Detailed description>" }
  ],
  "recommendations": [
    { "category": "GEO or AEO", "type": "Missing Entities or Weak Headings etc.", "title": "<Actionable title>", "description": "<How to fix>" }
  ]
}
Ensure there are exactly 2 issues and 2 recommendations. Be critical but fair in your scoring. Return ONLY the raw JSON string.`;

  try {
    // We will use claude-haiku-4-5-20251001 as it is fast, cheap, and available in the 2026 API tier.
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      temperature: 0.2,
      system: "You are an expert SEO analyzer that only outputs valid JSON.",
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    let jsonStr = message.content[0].text;
    // Strip markdown if Claude includes it despite instructions
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/\`\`\`/g, '').trim();
    }

    const result = JSON.parse(jsonStr);
    return {
      eeatSignals: result.eeatSignals || null,
      aiReadability: result.aiReadability || null,
      llmFormatting: result.llmFormatting || null,
      schemaUsage: result.schemaUsage || null,
      answerIntent: result.answerIntent || null,
      voiceSearchOptimization: result.voiceSearchOptimization || null,
      issues: result.issues || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude AI Analysis Failed: ${error.message}`);
  }
};

exports.calculateScores = async (projectId, companyId, clientId) => {
  let website = await SemrushProject.findOne({ _id: projectId, companyId, isActive: true });
  if (!website) {
    website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
  }
  if (!website) throw new Error('SEO Project not found');
  
  const domain = website.domain;

  // 1. Fetch Semrush / DataForSEO Metrics (using existing stats)
  const seoMetrics = {
    authorityScore: website.stats?.domainAuthority || null,
    technicalScore: website.stats?.lastAuditScore || null,
    contentScore: null,
    organicTraffic: website.stats?.organicTraffic || null,
    backlinks: website.stats?.backlinks || null,
    coreWebVitals: null,
    schemaScore: null
  };

  // 2. Fetch AI Analysis
  const aiAnalysis = await analyzePageWithAI(domain);

  // 3. Compute deterministic scores (Set to null temporarily until Phase 6)
  const seoScore = null;

  const geoMetrics = {
    websiteAuthority: seoMetrics.authorityScore,
    topicalAuthority: null,
    keywordCoverage: null,
    semanticCoverage: null,
    entityCoverage: null,
    contentFreshness: null,
    eeatSignals: aiAnalysis.eeatSignals,
    aiReadability: aiAnalysis.aiReadability,
    llmFormatting: aiAnalysis.llmFormatting,
    historicalGrowth: null,
    aiVisibilityPrediction: null
  };

  const geoScore = null;

  const aeoMetrics = {
    faqSchema: aiAnalysis.schemaUsage,
    qAndACoverage: null,
    answerIntent: aiAnalysis.answerIntent,
    snippetOptimization: null,
    voiceSearchScore: aiAnalysis.voiceSearchOptimization,
    conversationalContent: null,
    semanticQuestions: null,
    answerAccuracy: null
  };

  const aeoScore = null;

  const overallScore = null;

  // Save to DB (historical snapshot)
  const scoreRecord = await OptimizationScore.create({
    projectId,
    companyId,
    clientId: website.clientId,
    domain,
    overallScore,
    seoScore,
    geoScore,
    aeoScore,
    seoMetrics,
    geoMetrics,
    aeoMetrics,
    issues: aiAnalysis.issues,
    recommendations: aiAnalysis.recommendations
  });

  return scoreRecord;
};
