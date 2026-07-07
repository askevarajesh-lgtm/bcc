const SeoWebsite = require('./models/seoProject.model');    // collection: seowebsites
const SeoKeyword  = require('./models/seoKeyword.model');    // collection: seokeywords
const dataForSeoService = require('./dataForSeo.service');

/**
 * Get all SEO projects for the current agency/client context
 */
exports.getProjects = async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    
    // Fetch all SeoWebsites (SEO Projects) for this company
    const query = { companyId, isDeleted: false };
    if (req.user.role === 'agency_client') {
      query.clientId = req.user._id;
    } else if (req.query.clientId) {
      query.clientId = req.query.clientId;
    }

    const websites = await SeoWebsite.find(query)
      .populate('clientId', 'name companyName brandName')
      .sort({ createdAt: -1 });

    // Map `_id` to `id` for frontend consistency if needed, though Mongoose returns _id
    res.status(200).json({ success: true, count: websites.length, data: websites });
  } catch (error) {
    console.error('Error fetching SEO projects:', error);
    res.status(500).json({ success: false, message: 'Server error fetching SEO projects' });
  }
};

/**
 * Create a new SEO Project (Website)
 */
exports.createProject = async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const { domain, name, clientId, projectId, targetLocations, searchEngines, languages } = req.body;
    
    if (!domain || !name) {
      return res.status(400).json({ success: false, message: 'Domain and name are required.' });
    }

    // clientId defaults to the logged-in user if not provided
    const resolvedClientId = clientId || req.user._id;

    // Prevent duplicate domain per company
    const existing = await SeoWebsite.findOne({ domain, companyId, isDeleted: false });
    if (existing) {
      return res.status(400).json({ success: false, message: 'SEO tracking for this domain already exists.' });
    }

    const website = await SeoWebsite.create({
      companyId,
      clientId: resolvedClientId,
      projectId: projectId || null,
      domain,
      name,
      targetLocations: targetLocations || [{ location_code: 2840, location_name: 'United States', country_iso_code: 'US' }],
      searchEngines: searchEngines || ['google'],
      languages: languages || ['en'],
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: website });
  } catch (error) {
    console.error('Error creating SEO website:', error);
    res.status(500).json({ success: false, message: 'Server error creating SEO website' });
  }
};

/**
 * Test DataForSeo Integration Connection
 */
exports.testIntegration = async (req, res) => {
  try {
    const balance = await dataForSeoService.getAccountBalance();
    res.status(200).json({
      success: true,
      message: dataForSeoService.isConfigured ? 'DataForSEO connected' : 'No credentials – API calls will return empty results',
      isConfigured: dataForSeoService.isConfigured,
      data: balance
    });
  } catch (error) {
    console.error('Error testing DataForSEO integration:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a SEO Project
 */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const website = await SeoWebsite.findOneAndUpdate(
      { _id: id, companyId, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!website) {
      return res.status(404).json({ success: false, message: 'SEO website not found' });
    }

    res.status(200).json({ success: true, data: website });
  } catch (error) {
    console.error('Error updating SEO website:', error);
    res.status(500).json({ success: false, message: 'Server error updating SEO website' });
  }
};

/**
 * Soft Delete a SEO Project
 */
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const website = await SeoWebsite.findOneAndUpdate(
      { _id: id, companyId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!website) {
      return res.status(404).json({ success: false, message: 'SEO website not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting SEO website:', error);
    res.status(500).json({ success: false, message: 'Server error deleting SEO website' });
  }
};

/**
 * Get aggregated Dashboard Statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const seoQuery = { companyId, isDeleted: false };
    if (req.user.role === 'agency_client') seoQuery.clientId = req.user._id;
    else if (req.query.clientId) seoQuery.clientId = req.query.clientId;

    // All stats come from SEO Websites — fully independent of CRM Projects
    const seoWebsites = await SeoWebsite.find(seoQuery);
    const totalProjects = seoWebsites.length;
    const websiteIds = seoWebsites.map(sw => sw._id);

    let totalKeywords = 0;
    let totalRankingsInTop10 = 0;
    let averageAuditScore = 0;
    let validAudits = 0;

    seoWebsites.forEach(sw => {
      totalKeywords      += sw.stats?.totalKeywords  || 0;
      totalRankingsInTop10 += sw.stats?.top10Rankings || 0;
      if (sw.stats?.lastAuditScore > 0) {
        averageAuditScore += sw.stats.lastAuditScore;
        validAudits++;
      }
    });

    if (validAudits > 0) averageAuditScore = Math.round(averageAuditScore / validAudits);

    // Real keyword trend from DB (weekly)
    const sevenWeeksAgo = new Date();
    sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49);

    const keywordTrendRaw = await SeoKeyword.aggregate([
      { $match: { projectId: { $in: websiteIds }, createdAt: { $gte: sevenWeeksAgo }, isDeleted: false } },
      { $group: { _id: { week: { $week: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      { $limit: 7 }
    ]);
    const keywordTrend = keywordTrendRaw.length > 0 ? keywordTrendRaw.map(w => w.count) : [0];

    const auditScoreTrend = seoWebsites
      .filter(sw => sw.stats?.lastAuditScore > 0)
      .map(sw => sw.stats.lastAuditScore)
      .slice(-7);

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalKeywords,
        totalRankingsInTop10,
        averageAuditScore,
        keywordTrend,
        auditScoreTrend: auditScoreTrend.length > 0 ? auditScoreTrend : [0]
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard stats' });
  }
};

/**
 * Get real API credit usage from DataForSEO (or indicate no credentials)
 */
exports.getApiCreditUsage = async (req, res) => {
  try {
    if (!dataForSeoService.isConfigured) {
      return res.status(200).json({
        success: true,
        isConfigured: false,
        data: { limit: 0, used: 0, remaining: 0, resetDate: null }
      });
    }
    const balance = await dataForSeoService.getAccountBalance();
    res.status(200).json({
      success: true,
      isConfigured: true,
      data: {
        limit:     balance.balance,
        used:      balance.spent_today,
        remaining: balance.balance,
        currency:  balance.currency,
        resetDate: null
      }
    });
  } catch (error) {
    console.error('Error fetching API credit usage:', error);
    res.status(500).json({ success: false, message: 'Server error fetching API credit usage' });
  }
};

/**
 * Perform Live Keyword Research via DataForSEO
 */
exports.researchKeywords = async (req, res) => {
  try {
    const { keyword, location = 2840, language = 'en' } = req.body;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }

    // 1. Get keyword ideas (related terms + volume)
    const ideas = await dataForSeoService.getKeywordIdeas(keyword, location, language, 50);

    // 2. If we have ideas, enrich with difficulty in bulk
    let enriched = ideas;
    if (ideas.length > 0) {
      const kwList = ideas.map(i => i.keyword).filter(Boolean);
      const difficulties = await dataForSeoService.getKeywordDifficulty(kwList, location, language);
      const diffMap = {};
      difficulties.forEach(d => { if (d.keyword) diffMap[d.keyword] = d.keyword_difficulty; });
      enriched = ideas.map(i => ({
        ...i,
        keyword_difficulty: diffMap[i.keyword] ?? i.keyword_difficulty ?? 0
      }));
    }

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error('Error in keyword research:', error);
    res.status(500).json({ success: false, message: 'Server error in keyword research' });
  }
};

/**
 * Get Tracked Keywords for a Project
 */
exports.getTrackedKeywords = async (req, res) => {
  try {
    const { projectId } = req.params;  // This is the SeoWebsite _id
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, message: 'SEO website not found' });
    }

    const keywords = await SeoKeyword.find({ projectId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: keywords.length, data: keywords });
  } catch (error) {
    console.error('Error fetching tracked keywords:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tracked keywords' });
  }
};

/**
 * Add Keywords to Tracking
 */
exports.addKeywordsToTracking = async (req, res) => {
  try {
    const { projectId } = req.params;  // SeoWebsite _id
    const { keywords } = req.body;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of keywords is required' });
    }

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, message: 'SEO website not found' });
    }

    const keywordDocs = keywords.map(kw => ({
      projectId,
      agencyId: companyId,
      keyword: typeof kw === 'string' ? kw : (kw.keyword || ''),
      locationCode: website.targetLocations[0]?.location_code || 2840,
      languageCode: website.languages[0] || 'en',
      metrics: {
        searchVolume: kw.search_volume || kw.searchVolume || 0,
        cpc: parseFloat(kw.cpc) || 0,
        keywordDifficulty: kw.keyword_difficulty || kw.keywordDifficulty || 0,
        intent: kw.search_intent_info?.main_intent || kw.intent || 'unknown'
      }
    })).filter(k => k.keyword);

    let insertedCount = 0;
    try {
      const result = await SeoKeyword.insertMany(keywordDocs, { ordered: false });
      insertedCount = result.length;
    } catch (bulkErr) {
      insertedCount = bulkErr.insertedDocs?.length || bulkErr.result?.nInserted || 0;
    }

    const realCount = await SeoKeyword.countDocuments({ projectId, isDeleted: false });
    await SeoWebsite.findByIdAndUpdate(projectId, { $set: { 'stats.totalKeywords': realCount } });

    res.status(201).json({ success: true, count: insertedCount, data: [] });
  } catch (error) {
    console.error('Error adding keywords:', error);
    res.status(500).json({ success: false, message: 'Server error adding keywords' });
  }
};

/**
 * Remove a Keyword from Tracking
 */
exports.removeKeyword = async (req, res) => {
  try {
    const { projectId, keywordId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, message: 'SEO website not found' });
    }

    await SeoKeyword.findOneAndDelete({ _id: keywordId, projectId });
    const realCount = await SeoKeyword.countDocuments({ projectId, isDeleted: false });
    await SeoWebsite.findByIdAndUpdate(projectId, { $set: { 'stats.totalKeywords': realCount } });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error removing keyword:', error);
    res.status(500).json({ success: false, message: 'Server error removing keyword' });
  }
};

/**
 * Force Refresh Rankings for a Project's Tracked Keywords
 */
exports.refreshRankings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, message: 'SEO website not found' });
    }

    const keywords = await SeoKeyword.find({ projectId });
    if (keywords.length === 0) {
      return res.status(200).json({ success: true, message: 'No keywords to refresh' });
    }

    // Prepare SERP tasks
    const serpTasks = keywords.map(k => ({
      keyword:       k.keyword,
      location_code: website.targetLocations[0]?.location_code || 2840,
      language_code: website.languages[0] || 'en'
    }));

    const tasks = await dataForSeoService.getSerpResults(serpTasks);
    let top10Count = 0;

    for (const task of tasks) {
      if (task.result && task.result.length > 0) {
        const result    = task.result[0];
        const rankItems = result.items || [];
        const targetDomain = website.domain.replace(/^https?:\/\/(www\.)?/, '');

        let foundRank = null;
        let foundUrl  = null;

        for (const item of rankItems) {
          if (item.type === 'organic' && item.url && item.url.includes(targetDomain)) {
            foundRank = item.rank_absolute;
            foundUrl  = item.url;
            break;
          }
        }

        if (foundRank) {
          const kw = await SeoKeyword.findOne({ projectId, keyword: result.keyword });
          await SeoKeyword.findOneAndUpdate(
            { projectId, keyword: result.keyword },
            {
              $set: {
                'ranking.previousRank': kw?.ranking?.currentRank || null,
                'ranking.currentRank': foundRank,
                'ranking.bestRank': (!kw?.ranking?.bestRank || foundRank < kw.ranking.bestRank) ? foundRank : kw.ranking.bestRank,
                'ranking.url': foundUrl,
                updatedAt: new Date()
              }
            }
          );
          if (foundRank <= 10) top10Count++;
        }
      }
    }

    // Update project with real top-10 count from DB
    const dbTop10Count = await SeoKeyword.countDocuments({
      projectId,
      'ranking.currentRank': { $gte: 1, $lte: 10 },
      isDeleted: false
    });
    await SeoWebsite.findByIdAndUpdate(projectId, {
      $set: { 'stats.top10Rankings': dbTop10Count, lastKeywordSync: new Date() }
    });

    res.status(200).json({ success: true, message: 'Rankings updated successfully' });
  } catch (error) {
    console.error('Error refreshing rankings:', error);
    res.status(500).json({ success: false, message: 'Server error refreshing rankings' });
  }
};

/**
 * Run Site Audit
 */
exports.runAudit = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, message: 'SEO website not found' });
    }

    const domain = website.domain.replace(/^https?:\/\/(www\.)?/, '');
    
    // Use dedicated on-page audit method (creates task + fetches summary)
    // Limits max crawl to 1 page (homepage) to ensure an ultra-fast response time (seconds instead of minutes)
    const auditResponse = await dataForSeoService.runOnPageAudit(domain, 1);
    const result = auditResponse?.result;
    
    if (result) {
      const score = Math.round(result.page_metrics?.onpage_score || 0);
      
      // Build structured issues from real crawl data
      const issues = [];
      const metrics = result.page_metrics || {};
      const checks = metrics.checks || {};
      
      if (checks.is_4xx_code > 0) issues.push({ key: '4xx', severity: 'Error', type: '4xx Client Errors', count: checks.is_4xx_code });
      if (metrics.broken_links > 0) issues.push({ key: 'broken', severity: 'Error', type: 'Broken Links', count: metrics.broken_links });
      if (checks.no_title > 0) issues.push({ key: 'no_title', severity: 'Error', type: 'Missing Title Tags', count: checks.no_title });
      if (checks.no_description > 0) issues.push({ key: 'no_desc', severity: 'Warning', type: 'Missing Meta Descriptions', count: checks.no_description });
      if (checks.no_h1_tag > 0) issues.push({ key: 'no_h1', severity: 'Error', type: 'Missing H1 Tags', count: checks.no_h1_tag });
      if (metrics.duplicate_title > 0) issues.push({ key: 'dup_title', severity: 'Warning', type: 'Duplicate Title Tags', count: metrics.duplicate_title });
      if (checks.high_loading_time > 0) issues.push({ key: 'slow', severity: 'Warning', type: 'Slow Page Load', count: checks.high_loading_time });

      // Persist score and sync timestamp
      await SeoWebsite.findByIdAndUpdate(projectId, {
        $set: { 'stats.lastAuditScore': score, lastAuditSync: new Date() }
      });

      res.status(200).json({ success: true, data: { ...result, issues }, score });
    } else {
      res.status(400).json({ success: false, message: 'Failed to retrieve audit data' });
    }
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error running audit' });
  }
};

/**
 * Get Backlink Profile
 */
exports.getBacklinks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) {
      return res.status(404).json({ success: false, message: 'SEO website not found' });
    }

    const domain = website.domain.replace(/^https?:\/\/(www\.)?/, '');
    
    // Use dedicated backlink service methods
    const [summary, referringDomains] = await Promise.all([
      dataForSeoService.getBacklinkSummary(domain),
      dataForSeoService.getReferringDomains(domain, 25)
    ]);

    const result = summary
      ? {
          ...summary,
          items: referringDomains.map(rd => ({
            url_from:  rd.domain,
            anchor:    rd.referring_links_types ? Object.keys(rd.referring_links_types)[0] : '',
            rank:      rd.rank || 0,
            backlinks: rd.backlinks || 0
          }))
        }
      : null;

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching backlinks:', error);
    res.status(500).json({ success: false, message: 'Server error fetching backlinks' });
  }
};

/**
 * Domain Overview – organic traffic, keyword counts, ETV
 */
exports.getDomainOverview = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) return res.status(404).json({ success: false, message: 'SEO website not found' });

    const domain = website.domain.replace(/^https?:\/\/(www\.)?/, '');
    const locationCode = website.targetLocations[0]?.location_code || 2840;
    const languageCode = website.languages[0] || 'en';

    const overview = await dataForSeoService.getDomainOverview(domain, locationCode, languageCode);
    res.status(200).json({ success: true, data: overview });
  } catch (error) {
    console.error('Error fetching domain overview:', error);
    res.status(500).json({ success: false, message: 'Server error fetching domain overview' });
  }
};

/**
 * Competitor Analysis – top organic competitors for the project domain
 */
exports.getCompetitors = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) return res.status(404).json({ success: false, message: 'SEO website not found' });

    const domain = website.domain.replace(/^https?:\/\/(www\.)?/, '');
    const locationCode = website.targetLocations[0]?.location_code || 2840;
    const languageCode = website.languages[0] || 'en';

    const competitors = await dataForSeoService.getCompetitors(domain, locationCode, languageCode);
    res.status(200).json({ success: true, count: competitors.length, data: competitors });
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({ success: false, message: 'Server error fetching competitors' });
  }
};

/**
 * Page Speed / Lighthouse Audit for a specific URL
 * Body: { url, strategy: 'desktop'|'mobile' }
 */
exports.getPageSpeed = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { url, strategy = 'desktop' } = req.body;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) return res.status(404).json({ success: false, message: 'SEO website not found' });

    const result = await dataForSeoService.getPageSpeed(url, strategy);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching page speed:', error);
    res.status(500).json({ success: false, message: 'Server error fetching page speed' });
  }
};

/**
 * Local SEO / Google Maps results for the project domain's primary keyword
 * Query: ?keyword=...
 */
exports.getLocalSeo = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { keyword } = req.query;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    if (!keyword) return res.status(400).json({ success: false, message: 'keyword query param is required' });

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) return res.status(404).json({ success: false, message: 'SEO website not found' });

    const locationCode = website.targetLocations[0]?.location_code || 2840;
    const languageCode = website.languages[0] || 'en';

    const items = await dataForSeoService.getLocalSeoResults(keyword, locationCode, languageCode);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Error fetching local SEO results:', error);
    res.status(500).json({ success: false, message: 'Server error fetching local SEO results' });
  }
};

/**
 * Content Analysis for a specific URL
 * Body: { url }
 */
exports.getContentAnalysis = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { url } = req.body;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

    const website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!website) return res.status(404).json({ success: false, message: 'SEO website not found' });

    const result = await dataForSeoService.getContentAnalysis(url);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching content analysis:', error);
    res.status(500).json({ success: false, message: 'Server error fetching content analysis' });
  }
};
