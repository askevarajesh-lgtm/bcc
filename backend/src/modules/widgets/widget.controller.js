const ChatWidget = require('./chat-widget.model');
const Website = require('../websites/website.model');
const Store = require('../stores/store.model');

// Create Widget
exports.createWidget = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    const workspaceId = req.workspaceId;

    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Widget name and type are required' });
    }

    const widget = new ChatWidget({
      workspaceId,
      name,
      type,
      status: 'Draft',
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    const saved = await widget.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// List Widgets
exports.getWidgets = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const { search } = req.query;

    const query = { workspaceId, isDeleted: false };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const widgets = await ChatWidget.find(query).sort({ createdAt: -1 });

    // Aggregate assignments counts across websites and stores
    const data = await Promise.all(widgets.map(async (widget) => {
      const websitesCount = await Website.countDocuments({ chatWidgetId: widget._id, isDeleted: false });
      const storesCount = await Store.countDocuments({ chatWidgetId: widget._id, isDeleted: false });
      return {
        ...widget.toObject(),
        assignments: websitesCount + storesCount
      };
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Get details
exports.getWidgetDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const widget = await ChatWidget.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' });
    }
    res.json({ success: true, data: widget });
  } catch (error) {
    next(error);
  }
};

// Update widget configuration
exports.updateWidget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const widget = await ChatWidget.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' });
    }

    if (updateData.name) widget.name = updateData.name;
    if (updateData.status) widget.status = updateData.status;
    if (updateData.greeting !== undefined) widget.greeting = updateData.greeting;
    if (updateData.brandColor !== undefined) widget.brandColor = updateData.brandColor;
    if (updateData.launcherPosition !== undefined) widget.launcherPosition = updateData.launcherPosition;
    if (updateData.launcherLabel !== undefined) widget.launcherLabel = updateData.launcherLabel;
    if (updateData.channels) widget.channels = updateData.channels;
    if (updateData.whatsappPhone !== undefined) widget.whatsappPhone = updateData.whatsappPhone;
    if (updateData.supportEmail !== undefined) widget.supportEmail = updateData.supportEmail;

    widget.updatedBy = req.user?._id;
    const saved = await widget.save();

    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Delete widget
exports.deleteWidget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const widget = await ChatWidget.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' });
    }

    widget.isDeleted = true;
    widget.updatedBy = req.user?._id;
    await widget.save();

    // Clear references in websites and stores
    await Website.updateMany({ chatWidgetId: id }, { chatWidgetId: null });
    await Store.updateMany({ chatWidgetId: id }, { chatWidgetId: null });

    res.json({ success: true, message: 'Widget deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get Public Widget Details (no auth required)
exports.getPublicWidgetDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const widget = await ChatWidget.findOne({ _id: id, isDeleted: false });
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' });
    }
    res.json({ success: true, data: widget });
  } catch (error) {
    next(error);
  }
};
