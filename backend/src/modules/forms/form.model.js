const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Published', required: true },
  fields: [{
    label: { type: String, required: true },
    type: { type: String, required: true }, // e.g., text, textarea, select, hidden, date, upload
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    options: [{ type: String }],
    order: { type: Number, required: true }
  }],
  isDeleted: { type: Boolean, default: false, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  updatedBy: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

FormSchema.index({ workspaceId: 1, name: 1 });

module.exports = mongoose.model('Form', FormSchema);
