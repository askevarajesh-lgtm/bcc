const mongoose = require('mongoose');
const { MosScoreHistory } = require('../mos/mos.model');

// Load models
const User = mongoose.model('User');
const Lead = mongoose.model('Lead');
const Deal = mongoose.model('Deal');

exports.getSidebarCounts = async (req, res, next) => {
  try {
    const { role } = req.user;
    
    // Determine the relevant scoping ID based on the user's role
    const companyId = req.companyId; // Usually set by authMiddleware
    let allRelatedUserIds = [];

    // For Commander Admin, we want to see the count of users, leads, etc., 
    // across all clients they created.
    if (role === 'commander_admin') {
      const relatedClients = await User.find({ createdBy: req.user._id }, '_id');
      allRelatedUserIds = relatedClients.map(c => c._id);
      allRelatedUserIds.push(req.user._id); // Include themselves
    } else {
      if (companyId) {
        allRelatedUserIds = [companyId];
      } else {
        allRelatedUserIds = [req.user._id];
      }
    }

    // 1. People Count
    const peopleQuery = { status: 'active' };
    if (role === 'commander_admin') {
      peopleQuery.$or = [
        { _id: { $in: allRelatedUserIds } },
        { createdBy: { $in: allRelatedUserIds } },
        { agencyId: { $in: allRelatedUserIds } },
        { brandId: { $in: allRelatedUserIds } }
      ];
    } else if (companyId) {
      peopleQuery.$or = [
        { agencyId: companyId },
        { brandId: companyId },
        { workspaceId: companyId }
      ];
    }
    const peopleCount = await User.countDocuments(peopleQuery);

    // 2. Leads Count
    const leadsQuery = {};
    if (role === 'commander_admin') {
      leadsQuery.companyId = { $in: allRelatedUserIds };
    } else if (companyId) {
      leadsQuery.companyId = companyId;
    }
    const leadsCount = await Lead.countDocuments(leadsQuery);

    // 3. Sales Pipeline (Deals) Count
    const pipelineQuery = {};
    if (role === 'commander_admin') {
      pipelineQuery.companyId = { $in: allRelatedUserIds };
    } else if (companyId) {
      pipelineQuery.companyId = companyId;
    }
    const pipelineCount = await Deal.countDocuments(pipelineQuery);

    // 4. MOS Score
    // Calculate an average MOS score for the current month for the related agencies
    const monthYear = new Date().toISOString().substring(0, 7);
    const mosQuery = { monthYear };
    
    if (role === 'commander_admin') {
      mosQuery.agencyId = { $in: allRelatedUserIds };
    } else if (companyId) {
      mosQuery.agencyId = companyId;
    }

    const currentScores = await MosScoreHistory.find(mosQuery);
    let mosScore = 68; // Default fallback if no data
    if (currentScores.length > 0) {
      mosScore = Math.round(currentScores.reduce((sum, s) => sum + s.overallMos, 0) / currentScores.length);
    }

    return res.status(200).json({
      success: true,
      data: {
        people: peopleCount,
        leads: leadsCount,
        pipeline: pipelineCount,
        mosScore: mosScore
      }
    });

  } catch (error) {
    next(error);
  }
};
