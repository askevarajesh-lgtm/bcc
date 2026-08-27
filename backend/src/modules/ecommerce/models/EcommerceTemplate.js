const mongoose = require('mongoose');

const ecommerceTemplateSchema = new mongoose.Schema({
  templateId: { type: String, required: true, unique: true },
  workspaceId: { type: String, required: true },
  websiteId: { type: String, required: true },
  name: { type: String, required: true },
  pages: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  assets: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('EcommerceTemplate', ecommerceTemplateSchema);
