const SeoWebsite = require('../models/seoProject.model');
const SeoAudit = require('../models/seoAudit.model');
const OptimizationScore = require('../models/optimizationScore.model');
const dataForSeoService = require('../dataForSeo.service');
const SemrushProject = require('../../semrush/models/semrushProject.model');

exports.calculateScores = async (projectId, companyId, clientId) => {
  let website = await SemrushProject.findOne({ _id: projectId, companyId, isActive: true });
  if (!website) {
    website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
  }
  if (!website) throw new Error('SEO Project not found');
  
  const domain = website.domain;

  // 1. Fetch Semrush Metrics (using existing stats)
  const seoMetrics = {
    authorityScore: website.stats?.domainAuthority || null,
    technicalScore: website.stats?.lastAuditScore || null,
    contentScore: null,
    organicTraffic: website.stats?.organicTraffic || null,
    backlinks: website.stats?.backlinks || null,
    coreWebVitals: null,
    schemaScore: null
  };

  const geoMetrics = {
    websiteAuthority: seoMetrics.authorityScore,
    topicalAuthority: null,
    keywordCoverage: null,
    semanticCoverage: null,
    entityCoverage: null,
    contentFreshness: null,
    eeatSignals: null,
    aiReadability: null,
    llmFormatting: null,
    historicalGrowth: null,
    aiVisibilityPrediction: null
  };

  const aeoMetrics = {
    faqSchema: null,
    qAndACoverage: null,
    answerIntent: null,
    snippetOptimization: null,
    voiceSearchScore: null,
    conversationalContent: null,
    semanticQuestions: null,
    answerAccuracy: null
  };

  // Save to DB (historical snapshot)
  const scoreRecord = await OptimizationScore.create({
    projectId,
    companyId,
    clientId: website.clientId,
    domain,
    overallScore: null,
    seoScore: null,
    geoScore: null,
    aeoScore: null,
    seoMetrics,
    geoMetrics,
    aeoMetrics,
    issues: [],
    recommendations: []
  });

  return scoreRecord;
};
