const PlanUpgradeRequest = require('./planUpgradeRequest.model');
const User = require('../auth/user.model');
const { dispatchSystemNotification } = require('../tasks/notification.service');

// Create a new plan upgrade request (for Brand Admins)
exports.createUpgradeRequest = async (req, res, next) => {
  try {
    const isBrandAdmin = ['brand_super_admin'].includes(req.user.role);
    if (!isBrandAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to request plan upgrade' });
    }

    const { requestedModules, remarks } = req.body;
    
    // BrandId is the user's brandId or their own ID if they are the brand record
    const brandId = req.user.brandId || req.user._id;

    const brand = await User.findById(brandId);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    const upgradeRequest = await PlanUpgradeRequest.create({
      brandId,
      currentPlan: brand.packageName || 'Unknown Plan',
      requestedModules: requestedModules || [],
      remarks: remarks || '',
      status: 'Pending'
    });

    // Notify Commander Admin(s) manually to bypass company settings requirement
    const Notification = require('../tasks/notification.model');
    const admins = await User.find({ role: { $in: ['commander_admin', 'supreme_super_admin'] }, isActive: true });
    
    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        userId: admin._id,
        type: 'plan_upgrade',
        title: 'Plan Upgrade Requested',
        message: `${brand.companyName || brand.name} requested a plan upgrade.`,
        metadata: { requestId: upgradeRequest._id },
        channels: { inApp: true, email: false }
      }));
      await Notification.insertMany(notifications);
    }

    // Create SLA Record for Commander Admin
    const SlaRecord = require('../sla/sla.model');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const slaId = `SLA-REQ-${Date.now().toString().slice(-4)}${randomStr}`;

    const newSla = new SlaRecord({
      slaId,
      clientId: brandId,
      clientType: 'Brand',
      triggerType: 'Client Issue',
      entityId: upgradeRequest._id,
      entityType: 'SupportTicket', 
      title: 'Module Upgrade Request',
      description: `Requested modules: ${(requestedModules || []).join(', ')}. Remarks: ${remarks || 'None'}`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
      priority: 'High',
      status: 'Normal',
      activityTimeline: [{
        action: 'SLA Created',
        details: 'Plan Upgrade Request submitted',
        createdBy: req.user ? req.user._id : null
      }]
    });
    await newSla.save();

    res.status(201).json({ success: true, data: upgradeRequest });
  } catch (error) {
    next(error);
  }
};

// Get upgrade requests (for Commander Admin)
exports.getUpgradeRequests = async (req, res, next) => {
  try {
    const isCommander = ['commander_admin', 'supreme_super_admin'].includes(req.user.role);
    const isBrandAdmin = ['brand_super_admin'].includes(req.user.role);

    if (!isCommander && !isBrandAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let filter = {};
    if (isBrandAdmin) {
      const brandId = req.user.brandId || req.user._id;
      filter.brandId = brandId;
    }

    const requests = await PlanUpgradeRequest.find(filter)
      .populate('brandId', 'companyName email logo')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// Update request status (for Commander Admin)
exports.updateUpgradeRequestStatus = async (req, res, next) => {
  try {
    const isCommander = ['commander_admin', 'supreme_super_admin'].includes(req.user.role);
    if (!isCommander) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const upgradeRequest = await PlanUpgradeRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!upgradeRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.status(200).json({ success: true, data: upgradeRequest });
  } catch (error) {
    next(error);
  }
};
