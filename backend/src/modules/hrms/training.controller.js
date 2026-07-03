const Training = require('./models/training.model');

exports.getTrainings = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const trainings = await Training.find({ tenantCompanyId })
      .populate('mandatoryFor', 'name')
      .populate('enrolledEmployees.employeeId', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: trainings.length, data: trainings });
  } catch (error) {
    next(error);
  }
};

exports.createTraining = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const training = await Training.create({
      ...req.body,
      tenantCompanyId,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: training });
  } catch (error) {
    next(error);
  }
};

exports.updateTrainingProgress = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { employeeId, progress, status } = req.body;

    const training = await Training.findOne({ _id: req.params.id, tenantCompanyId });
    if (!training) return res.status(404).json({ success: false, message: 'Training not found' });

    let enrollment = training.enrolledEmployees.find(e => e.employeeId.toString() === employeeId);
    
    if (enrollment) {
      if (progress !== undefined) enrollment.progress = progress;
      if (status !== undefined) enrollment.status = status;
      if (status === 'Completed' || progress === 100) {
        enrollment.status = 'Completed';
        enrollment.progress = 100;
        enrollment.completedAt = new Date();
      }
    } else {
      // Auto enroll if not found
      training.enrolledEmployees.push({
        employeeId,
        progress: progress || 0,
        status: status || 'In Progress',
        completedAt: (status === 'Completed' || progress === 100) ? new Date() : null
      });
    }

    await training.save();
    res.status(200).json({ success: true, data: training });
  } catch (error) {
    next(error);
  }
};
