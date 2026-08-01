const mongoose = require('mongoose');

const ContentBlockSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['FAQ', 'CTA', 'Introduction', 'Conclusion', 'Testimonial', 'ProductFeature', 'SchemaSnippet', 'Callout', 'Custom'],
    required: true
  },
  
  content: { type: String, required: true }, // The actual reusable text/html
  tags: [{ type: String }],
  
  usageCount: { type: Number, default: 0 },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

ContentBlockSchema.index({ workspaceId: 1, type: 1 });

module.exports = mongoose.model('ContentBlock', ContentBlockSchema);
