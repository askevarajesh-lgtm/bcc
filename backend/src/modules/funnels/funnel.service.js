const { Funnel, FunnelStep, FunnelPage } = require('./funnel.model');
const { STEP_TYPES, FUNNEL_STATUS } = require('./funnel.constants');

class FunnelService {
  async createFunnel(workspaceId, data, userId) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Check if slug exists in workspace
    const slugExists = await Funnel.findOne({ workspaceId, slug, isDeleted: false });
    if (slugExists) {
      throw new Error('A funnel with that slug already exists in this workspace');
    }

    const funnel = new Funnel({
      ...data,
      workspaceId,
      slug,
      createdBy: userId,
      updatedBy: userId
    });

    await funnel.save();
    return funnel;
  }

  async getFunnels(workspaceId, query) {
    const { search, page = 1, limit = 10, sortBy = 'updatedAt:desc' } = query;
    const filter = { workspaceId, isDeleted: false };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const sortObj = {};
    const [field, order] = sortBy.split(':');
    sortObj[field] = order === 'asc' ? 1 : -1;

    const total = await Funnel.countDocuments(filter);
    const funnels = await Funnel.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const data = await Promise.all(funnels.map(async (fun) => {
      const stepsCount = await FunnelStep.countDocuments({ funnelId: fun._id, isDeleted: false });
      return {
        ...fun.toObject(),
        stepsCount
      };
    }));

    return { total, page: Number(page), limit: Number(limit), data };
  }

  async getFunnelById(funnelId, workspaceId) {
    const funnel = await Funnel.findOne({ _id: funnelId, workspaceId, isDeleted: false });
    if (!funnel) throw new Error('Funnel not found');
    return funnel;
  }

  async updateFunnel(funnelId, workspaceId, data, userId) {
    const funnel = await Funnel.findOne({ _id: funnelId, workspaceId, isDeleted: false });
    if (!funnel) throw new Error('Funnel not found');

    if (data.name) funnel.name = data.name;
    if (data.slug) {
      const slug = data.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const slugExists = await Funnel.findOne({ workspaceId, slug, _id: { $ne: funnelId }, isDeleted: false });
      if (slugExists) throw new Error('Slug is already in use');
      funnel.slug = slug;
    }
    if (data.status) funnel.status = data.status;
    if (data.description !== undefined) funnel.description = data.description;
    
    funnel.updatedBy = userId;
    await funnel.save();
    return funnel;
  }

  async deleteFunnel(funnelId, workspaceId, userId) {
    const funnel = await Funnel.findOne({ _id: funnelId, workspaceId, isDeleted: false });
    if (!funnel) throw new Error('Funnel not found');

    funnel.isDeleted = true;
    funnel.updatedBy = userId;
    await funnel.save();

    await FunnelStep.updateMany({ funnelId }, { isDeleted: true });
    // Soft delete associated pages
    await FunnelPage.updateMany({ websiteId: funnelId }, { isDeleted: true });
    return true;
  }

  async publishFunnel(funnelId, workspaceId, userId) {
    const funnel = await this.getFunnelById(funnelId, workspaceId);
    funnel.status = FUNNEL_STATUS.ACTIVE;
    funnel.updatedBy = userId;
    await funnel.save();
    return funnel;
  }

  async unpublishFunnel(funnelId, workspaceId, userId) {
    const funnel = await this.getFunnelById(funnelId, workspaceId);
    funnel.status = FUNNEL_STATUS.DRAFT;
    funnel.updatedBy = userId;
    await funnel.save();
    return funnel;
  }

  async addStep(funnelId, workspaceId, data) {
    // Verify funnel ownership implicitly via find
    const funnel = await this.getFunnelById(funnelId, workspaceId);
    if(!funnel) throw new Error("Funnel not found");

    const { stepName, stepType = STEP_TYPES.LANDING, path } = data;
    
    const lastStep = await FunnelStep.findOne({ funnelId, isDeleted: false }).sort({ stepOrder: -1 });
    const stepOrder = lastStep ? lastStep.stepOrder + 1 : 0;
    
    // We use websiteId to store funnelId for the shared pages collection abstraction
    const pagePath = path || `/${stepName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
    
    const pageExists = await FunnelPage.findOne({ websiteId: funnelId, path: pagePath, isDeleted: false });
    if (pageExists) {
        throw new Error('Page path already exists for this funnel');
    }

    const page = new FunnelPage({
      websiteId: funnelId,
      title: stepName,
      path: pagePath,
      pageType: 'funnel'
    });
    await page.save();

    const step = new FunnelStep({
      funnelId,
      stepName,
      stepType,
      stepOrder,
      pageId: page._id
    });
    await step.save();

    return step;
  }

  async getSteps(funnelId, workspaceId) {
    await this.getFunnelById(funnelId, workspaceId); // Validate access
    return await FunnelStep.find({ funnelId, isDeleted: false }).sort({ stepOrder: 1 }).populate('pageId');
  }
}

module.exports = new FunnelService();
