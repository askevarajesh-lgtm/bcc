const SubscriptionPlan = require('./subscription.model');

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
};

exports.getPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    if (req.body.popular) {
      await SubscriptionPlan.updateMany({}, { popular: false });
    }
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    if (req.body.popular) {
      await SubscriptionPlan.updateMany({ _id: { $ne: req.params.id } }, { popular: false });
    }
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
