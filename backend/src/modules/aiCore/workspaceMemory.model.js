const mongoose = require('mongoose');

const workspaceMemorySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceProject',
    required: false // If null, it's a cross-client shared best practice
  },
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    // Was `ref: 'Agency'` — no such model is registered anywhere in the
    // codebase (see bcc-platform-analysis.md §8), so populate('agencyId')
    // silently returned null. Every other tenant field in this exact module
    // already correctly uses `ref: 'User'`; fixed to match, per
    // seo-mongodb-schema-plan.md §0/§4.
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['best_practice', 'brand_voice', 'do_not_do', 'approved_terminology', 'recurring_issue'],
    default: 'best_practice'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceMemory', workspaceMemorySchema);
