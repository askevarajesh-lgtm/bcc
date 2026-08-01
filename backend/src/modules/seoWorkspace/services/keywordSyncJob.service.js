const WorkspaceKeyword = require('../models/workspaceKeyword.model');
const ProviderUsage = require('../models/providerUsage.model');
const KeywordAuditTrail = require('../models/keywordAuditTrail.model');
const KeywordHistorySnapshot = require('../models/keywordHistorySnapshot.model');
const keywordIntelligence = require('./keywordIntelligence.service');
const logger = require('../../aiCore/logger.service');

const TAG = 'KeywordSyncJob';

class KeywordSyncJob {
  /**
   * Enterprise GSC & DataForSEO Synchronization
   * Ensures GSC -> DataForSEO -> Unavailable priority.
   */
  async syncRankings(projectId, agencyId, keywordsToSync, gscData = [], dfsData = []) {
    logger.info(TAG, `Starting Enterprise Sync for ${keywordsToSync.length} keywords in Project ${projectId}`);
    
    // Convert arrays to lookup maps
    const gscMap = new Map(gscData.map(d => [d.keyword.toLowerCase(), d]));
    const dfsMap = new Map(dfsData.map(d => [d.keyword.toLowerCase(), d]));
    
    const bulkOps = [];
    const auditOps = [];
    const historyOps = [];
    
    for (const kw of keywordsToSync) {
      const keyword = kw.keyword.toLowerCase();
      
      const gscMatch = gscMap.get(keyword);
      const dfsMatch = dfsMap.get(keyword);
      
      const gscRank = gscMatch?.position || null;
      const dfsRank = dfsMatch?.rank || null;
      const gscUrl = gscMatch?.page || null;
      const dfsUrl = dfsMatch?.url || null;
      
      // ENTERPRISE EVIDENCE ENGINE: Resolve Priority
      const resolved = keywordIntelligence.resolveRankingPriority(gscRank, dfsRank, gscUrl, dfsUrl);
      
      // Update logic
      const updateData = {
        'ranking.currentRank': resolved.rank,
        'ranking.url': resolved.url,
        'ranking.rankingSource': resolved.source,
        'ranking.status': resolved.rank ? 'FOUND' : 'UNAVAILABLE'
      };
      
      if (resolved.rank && (kw.ranking.bestRank === null || resolved.rank < kw.ranking.bestRank)) {
        updateData['ranking.bestRank'] = resolved.rank;
      }
      
      if (kw.ranking.currentRank !== resolved.rank) {
        updateData['ranking.previousRank'] = kw.ranking.currentRank;
        
        let trend = 'None';
        if (kw.ranking.currentRank === null && resolved.rank !== null) trend = 'New';
        else if (kw.ranking.currentRank !== null && resolved.rank === null) trend = 'Lost Visibility';
        else if (resolved.rank < kw.ranking.currentRank) trend = 'Improved';
        else if (resolved.rank > kw.ranking.currentRank) trend = 'Declined';
        else trend = 'Stable';
        
        updateData['ranking.trend'] = trend;
        
        // ENTERPRISE AUDIT TRAIL
        auditOps.push({
          insertOne: {
            document: {
              keywordId: kw._id,
              projectId,
              keyword: kw.keyword,
              action: 'RANK_CHANGED',
              source: resolved.source,
              reason: `Sync Job: Rank changed to ${resolved.rank}`,
              previousValue: kw.ranking.currentRank,
              newValue: resolved.rank
            }
          }
        });
      }
      
      bulkOps.push({
        updateOne: {
          filter: { _id: kw._id },
          update: { $set: updateData }
        }
      });
      
      // HISTORY SNAPSHOT
      historyOps.push({
        insertOne: {
          document: {
            keywordId: kw._id,
            projectId,
            keyword: kw.keyword,
            date: new Date(),
            snapshotType: 'daily',
            ranking: {
              rank: resolved.rank,
              url: resolved.url,
              source: resolved.source,
              searchEngine: 'Google',
              device: 'Unknown'
            },
            metrics: kw.metrics
          }
        }
      });
    }
    
    // Execute Operations via Batched Processing
    if (bulkOps.length > 0) {
      await WorkspaceKeyword.bulkWrite(bulkOps);
    }
    if (auditOps.length > 0) {
      await KeywordAuditTrail.bulkWrite(auditOps);
    }
    if (historyOps.length > 0) {
      try {
        await KeywordHistorySnapshot.bulkWrite(historyOps, { ordered: false });
      } catch (e) {
        // Ignore duplicate key errors for daily snapshots
      }
    }
    
    logger.info(TAG, `Completed Enterprise Sync for Project ${projectId}`);
  }
}

module.exports = new KeywordSyncJob();
