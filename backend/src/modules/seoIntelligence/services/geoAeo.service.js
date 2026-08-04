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
  "eeatSignals": <Number 0-100 based on visible expertise, author bios, trust signals>,
  "aiReadability": <Number 0-100 based on clear structure and NLP-friendly writing>,
  "llmFormatting": <Number 0-100 based on scannable points, bullet lists, short paragraphs>,
  "schemaUsage": <Number 0-100 based on likely structured data presence deduced from content>,
  "answerIntent": <Number 0-100 based on direct, concise answers to implied questions>,
  "voiceSearchOptimization": <Number 0-100 based on conversational tone and Q&A formatting>,
  "issues": [
    { "category": "GEO or AEO", "priority": "High or Medium", "title": "<Short title>", "description": "<Detailed description>", "impact": "<e.g., -10 Score>" }
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
      eeatSignals: result.eeatSignals || 60,
      aiReadability: result.aiReadability || 65,
      llmFormatting: result.llmFormatting || 60,
      schemaUsage: result.schemaUsage || 50,
      answerIntent: result.answerIntent || 60,
      voiceSearchOptimization: result.voiceSearchOptimization || 50,
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
    authorityScore: website.stats?.domainAuthority || 40,
    technicalScore: website.stats?.lastAuditScore || 65,
    contentScore: 70, // placeholder
    organicTraffic: website.stats?.totalKeywords * 5 || 0,
    backlinks: website.stats?.totalBacklinks || 0,
    coreWebVitals: 80,
    schemaScore: 50
  };

  // 2. Fetch AI Analysis
  const aiAnalysis = await analyzePageWithAI(domain);

  // 3. Compute deterministic scores
  const seoScore = Math.round(
    (seoMetrics.authorityScore * 0.3) + 
    (seoMetrics.technicalScore * 0.4) + 
    (seoMetrics.coreWebVitals * 0.3)
  );

  const geoMetrics = {
    websiteAuthority: seoMetrics.authorityScore,
    topicalAuthority: 65,
    keywordCoverage: Math.min(100, website.stats?.totalKeywords / 10 || 50),
    semanticCoverage: 70,
    entityCoverage: 60,
    contentFreshness: 80,
    eeatSignals: aiAnalysis.eeatSignals,
    aiReadability: aiAnalysis.aiReadability,
    llmFormatting: aiAnalysis.llmFormatting,
    historicalGrowth: 15,
    aiVisibilityPrediction: 75
  };

  const geoScore = Math.round(
    (geoMetrics.eeatSignals * 0.25) +
    (geoMetrics.aiReadability * 0.25) +
    (geoMetrics.llmFormatting * 0.2) +
    (geoMetrics.semanticCoverage * 0.3)
  );

  const aeoMetrics = {
    faqSchema: aiAnalysis.schemaUsage,
    qAndACoverage: 65,
    answerIntent: aiAnalysis.answerIntent,
    snippetOptimization: 60,
    voiceSearchScore: aiAnalysis.voiceSearchOptimization,
    conversationalContent: 70,
    semanticQuestions: 75,
    answerAccuracy: 85
  };

  const aeoScore = Math.round(
    (aeoMetrics.answerIntent * 0.3) +
    (aeoMetrics.faqSchema * 0.2) +
    (aeoMetrics.voiceSearchScore * 0.2) +
    (aeoMetrics.conversationalContent * 0.3)
  );

  const overallScore = Math.round((seoScore + geoScore + aeoScore) / 3);

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
