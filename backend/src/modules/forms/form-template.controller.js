const FormTemplate = require('./form-template.model');

exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await FormTemplate.find({ status: 'Published' }).sort({ templateName: 1 });

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
