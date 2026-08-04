// const mongoose = require('mongoose');

// const AutomationTemplateSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: { type: String, required: true },
  
//   type: {
//     type: String,
//     enum: ['official', 'community', 'private', 'workspace'],
//     default: 'workspace'
//   },
  
//   category: {
//     type: String,
//     enum: ['Technical SEO', 'Content', 'Backlinks', 'Rank Tracking', 'Reporting', 'Agency', 'Local SEO', 'E-commerce', 'General'],
//     default: 'General'
//   },

//   nodes: { type: [mongoose.Schema.Types.Mixed], default: [] },
//   edges: { type: [mongoose.Schema.Types.Mixed], default: [] },
//   variables: { type: mongoose.Schema.Types.Mixed, default: {} },

//   tags: [{ type: String }],
  
//   ratings: {
//     average: { type: Number, default: 0 },
//     count: { type: Number, default: 0 }
//   },

//   versionCompatibility: { type: String, default: '1.0.0' },

//   isFeatured: { type: Boolean, default: false },

//   agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // If private/workspace
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

// }, { timestamps: true });

// AutomationTemplateSchema.index({ type: 1, category: 1 });

// module.exports = mongoose.model('AutomationTemplate', AutomationTemplateSchema, 'automation_templates');
