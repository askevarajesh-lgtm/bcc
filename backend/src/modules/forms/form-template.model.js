const mongoose = require('mongoose');

const FormTemplateSchema = new mongoose.Schema({
  templateName: { type: String, required: true, trim: true, unique: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  thumbnail: { type: String, default: 'default-thumbnail.jpg', trim: true },
  fields: [{
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
    options: [{ type: String }]
  }],
  isDefault: { type: Boolean, default: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Published' }
}, { timestamps: true });

module.exports = mongoose.model('FormTemplate', FormTemplateSchema);
