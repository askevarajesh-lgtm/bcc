const mongoose = require('mongoose');

const deliverableCommentSchema = new mongoose.Schema({
  deliverableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deliverable',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DeliverableComment', deliverableCommentSchema);
