const Performance = require('./models/performance.model');

exports.getPerformances = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const query = { tenantCompanyId };
    
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.reviewCycle) query.reviewCycle = req.query.reviewCycle;

    const performances = await Performance.find(query)
      .populate('employeeId', 'firstName lastName profilePhoto employeeCode designationId departmentId')
      .populate('reviewerId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: performances.length, data: performances });
  } catch (error) {
    next(error);
  }
};

exports.createPerformanceReview = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    
    // Check for existing review
    const existing = await Performance.findOne({ 
      tenantCompanyId, 
      employeeId: req.body.employeeId, 
      reviewCycle: req.body.reviewCycle 
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Review for this cycle already exists' });
    }

    const performance = await Performance.create({
      ...req.body,
      tenantCompanyId
    });

    res.status(201).json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
};

exports.updatePerformanceReview = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    
    // If calculating rating based on KPIs
    let { rating, kpis } = req.body;
    if (kpis && kpis.length > 0 && !rating) {
      const sum = kpis.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const kpisWithScore = kpis.filter(k => k.score).length;
      if (kpisWithScore > 0) {
         rating = sum / kpisWithScore;
         req.body.rating = rating;
      }
    }

    const performance = await Performance.findOneAndUpdate(
      { _id: req.params.id, tenantCompanyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!performance) return res.status(404).json({ success: false, message: 'Performance review not found' });
    res.status(200).json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
};
