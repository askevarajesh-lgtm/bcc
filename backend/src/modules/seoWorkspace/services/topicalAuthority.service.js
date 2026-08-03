const WorkspaceKeyword = require('../models/workspaceKeyword.model');

class TopicalAuthorityService {
  /**
   * Analyzes a project's keyword clusters to determine Topical Authority.
   * @param {string} projectId 
   * @returns {Promise<Object>}
   */
  async calculateAuthority(projectId) {
    const keywords = await WorkspaceKeyword.find({ projectId, status: 'Approved' }).lean();

    if (keywords.length === 0) {
      return { authorityScore: 0, topicCoverage: 0, clusters: [], missingTopics: [] };
    }

    // Group by cluster
    const clusterMap = new Map();
    let totalProjectVolume = 0;
    let totalProjectRankingVolume = 0;

    for (const kw of keywords) {
      if (!kw.cluster) continue;
      
      const c = clusterMap.get(kw.cluster) || { 
        topic: kw.cluster, 
        totalVolume: 0, 
        rankingVolume: 0, 
        keywordCount: 0,
        rankingCount: 0,
        keywords: []
      };

      const vol = kw.metrics?.searchVolume || 0;
      c.totalVolume += vol;
      c.keywordCount += 1;
      c.keywords.push(kw);
      totalProjectVolume += vol;

      // If ranking in top 10, consider it 'covered' authority
      if (kw.ranking?.currentRank && kw.ranking.currentRank <= 10) {
        c.rankingVolume += vol;
        c.rankingCount += 1;
        totalProjectRankingVolume += vol;
      }

      clusterMap.set(kw.cluster, c);
    }

    const clusters = Array.from(clusterMap.values()).map(c => {
      const coverage = c.totalVolume > 0 ? (c.rankingVolume / c.totalVolume) * 100 : 0;
      return {
        ...c,
        coverageScore: Math.round(coverage)
      };
    });

    const authorityScore = totalProjectVolume > 0 ? Math.round((totalProjectRankingVolume / totalProjectVolume) * 100) : 0;
    
    // Missing Topics (clusters where we have keywords but 0 rankings)
    const missingTopics = clusters.filter(c => c.rankingCount === 0 && c.totalVolume > 100).map(c => c.topic);

    return {
      authorityScore,
      topicCoverage: clusters.length, // Number of distinct topics we have coverage for
      clusters: clusters.sort((a, b) => b.totalVolume - a.totalVolume),
      missingTopics
    };
  }
}

module.exports = new TopicalAuthorityService();
