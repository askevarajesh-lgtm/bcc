const Template = require('./template.model');

exports.getTemplates = async (req, res, next) => {
  try {
    const { type } = req.query; // 'website', 'store', 'funnel', 'form'
    
    let query = { isDeleted: false };
    if (type) {
      query.type = type;
    }

    const templates = await Template.find(query).sort({ createdAt: -1 });

    // Group by category to help frontend UI easily
    const categories = {};
    templates.forEach(t => {
      const cat = t.category || 'Uncategorized';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(t);
    });

    const categoryList = Object.keys(categories).map(cat => ({
      name: cat,
      count: categories[cat].length
    })).sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: {
        templates,
        categories: categoryList
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadTemplate = async (req, res, next) => {
  try {
    const { name, type, category, description, featuresCount } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Name and type are required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No ZIP file uploaded' });
    }

    const template = new Template({
      name,
      type,
      category: category || 'Custom Uploads',
      description: description || '',
      featuresCount: featuresCount ? parseInt(featuresCount) : 1,
      zipUrl: req.file.path && req.file.path.startsWith('http') ? req.file.path : `uploads/templates/${req.file.filename}`, // Local or Cloudinary URL
      isRealData: true
    });

    const savedTemplate = await template.save();

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: 'Template uploaded successfully'
    });
  } catch (err) {
    next(err);
  }
};
