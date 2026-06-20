const Funnel = require('../models/Funnel');
const FunnelStep = require('../models/FunnelStep');

// Create Funnel
exports.createFunnel = async (req, res, next) => {
  try {
    const { name, type, description, templateName } = req.body;
    const workspaceId = req.workspaceId;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Funnel name is required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check slug uniqueness within workspace
    const slugExists = await Funnel.findOne({ workspaceId, slug, isDeleted: false });
    if (slugExists) {
      return res.status(400).json({ success: false, error: 'A funnel with that slug already exists in this workspace' });
    }

    const funnel = new Funnel({
      workspaceId,
      name,
      slug,
      status: 'Draft',
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    const savedFunnel = await funnel.save();
    const steps = [];

    // Determine steps based on type/template
    if (type === 'template' || type === 'templates') {
      // 3 Steps
      const stepNames = ['Landing Page', 'Checkout', 'Thank You'];
      const stepPaths = ['/landing-page', '/checkout', '/thank-you'];
      for (let i = 0; i < 3; i++) {
        const step = new FunnelStep({
          funnelId: savedFunnel._id,
          name: stepNames[i],
          type: i === 1 ? 'checkout' : 'landing',
          path: stepPaths[i],
          status: 'Draft',
          order: i
        });
        await step.save();
        steps.push(step);
      }
    } else if (type === 'ai') {
      // 2 Steps
      const stepNames = ['Landing Page', 'Contact Page'];
      const stepPaths = ['/landing-page', '/contact'];
      for (let i = 0; i < 2; i++) {
        const step = new FunnelStep({
          funnelId: savedFunnel._id,
          name: stepNames[i],
          type: 'landing',
          path: stepPaths[i],
          status: 'Draft',
          order: i
        });
        await step.save();
        steps.push(step);
      }
    } else {
      // Blank - 1 Step
      const step = new FunnelStep({
        funnelId: savedFunnel._id,
        name: 'Landing Page',
        type: 'landing',
        path: '/landing-page',
        status: 'Draft',
        order: 0
      });
      await step.save();
      steps.push(step);
    }

    res.status(201).json({
      success: true,
      data: {
        ...savedFunnel.toObject(),
        steps
      }
    });
  } catch (error) {
    next(error);
  }
};

// List Funnels
exports.getFunnels = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const { search, page = 1, limit = 10, sortBy = 'updatedAt:desc' } = req.query;

    const query = { workspaceId, isDeleted: false };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const sortObj = {};
    const [field, order] = sortBy.split(':');
    sortObj[field] = order === 'asc' ? 1 : -1;

    const total = await Funnel.countDocuments(query);
    const funnels = await Funnel.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Aggregate step counters
    const data = await Promise.all(funnels.map(async (fun) => {
      const stepsCount = await FunnelStep.countDocuments({ funnelId: fun._id, isDeleted: false });
      return {
        ...fun.toObject(),
        stepsCount,
        eventsCount: 0 // Mock counter placeholder
      };
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Funnel Details + Steps
exports.getFunnelDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const funnel = await Funnel.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!funnel) {
      return res.status(404).json({ success: false, error: 'Funnel not found' });
    }

    const steps = await FunnelStep.find({ funnelId: id, isDeleted: false }).sort({ order: 1 });

    res.json({
      success: true,
      data: {
        ...funnel.toObject(),
        steps
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update Funnel Settings
exports.updateFunnel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, domain, faviconUrl, status, trackingPixels } = req.body;

    const funnel = await Funnel.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!funnel) {
      return res.status(404).json({ success: false, error: 'Funnel not found' });
    }

    if (name) funnel.name = name;
    if (slug) {
      const cleanSlug = slug.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').toLowerCase();
      // Verify slug is not taken by another funnel
      const slugExists = await Funnel.findOne({ 
        workspaceId: req.workspaceId, 
        slug: cleanSlug, 
        _id: { $ne: id }, 
        isDeleted: false 
      });
      if (slugExists) {
        return res.status(400).json({ success: false, error: 'Slug is already in use by another funnel' });
      }
      funnel.slug = cleanSlug;
    }
    if (status) funnel.status = status;
    if (faviconUrl !== undefined) funnel.faviconUrl = faviconUrl;
    if (trackingPixels) {
      funnel.trackingPixels = { ...funnel.trackingPixels, ...trackingPixels };
    }
    
    // Domain binding (mock/internal lookup placeholder)
    if (domain !== undefined) {
      funnel.domain = domain;
    }

    funnel.updatedBy = req.user?._id;
    const saved = await funnel.save();

    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Delete Funnel
exports.deleteFunnel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const funnel = await Funnel.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!funnel) {
      return res.status(404).json({ success: false, error: 'Funnel not found' });
    }

    funnel.isDeleted = true;
    funnel.updatedBy = req.user?._id;
    await funnel.save();

    // Soft delete associated steps
    await FunnelStep.updateMany({ funnelId: id }, { isDeleted: true });

    res.json({ success: true, message: 'Funnel and steps deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add Step to Funnel
exports.addStep = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, path } = req.body;

    if (!name || !path) {
      return res.status(400).json({ success: false, error: 'Step name and path are required' });
    }

    const funnel = await Funnel.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!funnel) {
      return res.status(404).json({ success: false, error: 'Funnel not found' });
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const pathExists = await FunnelStep.findOne({ funnelId: id, path: cleanPath, isDeleted: false });
    if (pathExists) {
      return res.status(400).json({ success: false, error: 'Step path already exists for this funnel' });
    }

    // Get order index
    const lastStep = await FunnelStep.findOne({ funnelId: id, isDeleted: false }).sort({ order: -1 });
    const order = lastStep ? lastStep.order + 1 : 0;

    const step = new FunnelStep({
      funnelId: id,
      name,
      type: type || 'landing',
      path: cleanPath,
      status: 'Draft',
      order
    });

    const saved = await step.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Delete Step
exports.deleteStep = async (req, res, next) => {
  try {
    const { funnelId, stepId } = req.params;

    const step = await FunnelStep.findOne({ _id: stepId, funnelId, isDeleted: false });
    if (!step) {
      return res.status(404).json({ success: false, error: 'Funnel step not found' });
    }

    step.isDeleted = true;
    await step.save();

    res.json({ success: true, message: 'Step deleted successfully' });
  } catch (error) {
    next(error);
  }
};
