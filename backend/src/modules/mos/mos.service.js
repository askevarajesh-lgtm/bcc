const User = require('../auth/user.model');
const { MosConfig, MosScoreHistory } = require('./mos.model');
const mongoose = require('mongoose');

/**
 * Normalizes a raw score to a 0-100 scale based on some bounds.
 */
function normalizeScore(raw, min, max) {
  if (raw <= min) return 0;
  if (raw >= max) return 100;
  return Math.round(((raw - min) / (max - min)) * 100);
}

/**
 * Calculates scores for all active clients under an agency.
 */
exports.calculateAgencyMOS = async (agencyId) => {
  // Get active brands for the agency
  const brands = await User.find({
    agencyId,
    role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] }
  });

  // If no brands are found (e.g. fresh environment or sandbox), inject some mock brands for demonstration
  if (brands.length === 0) {
    brands.push(
      { _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a10001'), companyName: 'Acme Corp', name: 'Acme Corp' },
      { _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a10002'), companyName: 'Global Tech', name: 'Global Tech' },
      { _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a10003'), companyName: 'Stark Industries', name: 'Stark Industries' }
    );
  }

  // Get current weights or use defaults
  let config = await MosConfig.findOne({ agencyId });
  if (!config) {
    config = {
      weights: {
        website: 15, seo: 25, geo: 10, social: 10, ads: 15, leads: 15, revenue: 10, cx: 0
      }
    };
  }
  const { weights } = config;

  const results = [];
  const monthYear = new Date().toISOString().substring(0, 7); // YYYY-MM

  for (const brand of brands) {
    const brandId = brand._id;
    // In a full implementation, you'd query each module's models here based on brandId (or workspaceId)
    // For now, we simulate pulling from available collections with some jitter or fallback values 
    // to ensure the system is robust even if some collections don't have data yet.
    
    // Website score logic
    // const websites = await Website.find({ workspaceId: brandId });
    // const websiteScore = websites.length > 0 ? 80 : 0; // Example
    
    // Mocking the raw data fetching. In real scenario, replace with actual DB queries
    // using the brandId (workspace).
    const rawScores = {
      website: Math.floor(Math.random() * (95 - 40) + 40), // Simulate a score
      seo: Math.floor(Math.random() * (95 - 40) + 40),
      geo: Math.floor(Math.random() * (95 - 40) + 40),
      social: Math.floor(Math.random() * (95 - 40) + 40),
      ads: Math.floor(Math.random() * (95 - 40) + 40),
      leads: Math.floor(Math.random() * (95 - 40) + 40),
      revenue: Math.floor(Math.random() * (95 - 40) + 40),
      cx: Math.floor(Math.random() * (95 - 40) + 40),
    };

    // Calculate final weighted score
    let overallMos = 0;
    Object.keys(weights).forEach(key => {
      // weight is a percentage (e.g. 15 for 15%)
      overallMos += (rawScores[key] * (weights[key] / 100));
    });
    
    overallMos = Math.round(overallMos);

    // Identify weakest signals
    const sortedSignals = Object.entries(rawScores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3); // top 3 weakest

    const weakestSignals = sortedSignals.map(([signal, score]) => {
      return {
        signalName: signal.charAt(0).toUpperCase() + signal.slice(1),
        score,
        priority: score < 50 ? 'High' : 'Medium',
        actions: [`Review ${signal} strategy`, `Audit ${signal} performance`],
        points: ['+5 pts', '+3 pts']
      };
    });

    // Save to history for the month
    // We use findOneAndUpdate to keep only the latest snapshot per month per client
    const updatedHistory = await MosScoreHistory.findOneAndUpdate(
      { clientId: brandId, agencyId, monthYear },
      {
        clientId: brandId,
        agencyId,
        signals: rawScores,
        weakestSignals,
        overallMos,
        monthYear
      },
      { upsert: true, new: true }
    );

    results.push({
      client: brand.companyName || brand.name,
      clientId: brand._id,
      overallMos,
      signals: rawScores,
      weakestSignals
    });
  }

  return results;
};
