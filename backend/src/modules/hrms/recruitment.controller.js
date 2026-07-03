const Recruitment = require('./models/recruitment.model');

exports.getRecruitments = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const recruitments = await Recruitment.find({ tenantCompanyId })
      .populate('departmentId', 'name')
      .populate('designationId', 'title')
      .populate('hiringManagerId', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: recruitments.length, data: recruitments });
  } catch (error) {
    next(error);
  }
};

exports.createRecruitment = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const recruitment = await Recruitment.create({
      ...req.body,
      tenantCompanyId,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: recruitment });
  } catch (error) {
    next(error);
  }
};

exports.addCandidate = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const recruitment = await Recruitment.findOne({ _id: req.params.id, tenantCompanyId });
    
    if (!recruitment) return res.status(404).json({ success: false, message: 'Job opening not found' });

    recruitment.candidates.push(req.body);
    await recruitment.save();

    res.status(201).json({ success: true, data: recruitment });
  } catch (error) {
    next(error);
  }
};

exports.updateCandidateStatus = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { status, feedback } = req.body;
    
    const recruitment = await Recruitment.findOne({ _id: req.params.id, tenantCompanyId });
    if (!recruitment) return res.status(404).json({ success: false, message: 'Job opening not found' });

    const candidate = recruitment.candidates.id(req.params.candidateId);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    if (status) candidate.status = status;
    if (feedback) candidate.feedback = feedback;

    await recruitment.save();
    res.status(200).json({ success: true, data: recruitment });
  } catch (error) {
    next(error);
  }
};
