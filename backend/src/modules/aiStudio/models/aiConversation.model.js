const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  attachment: {
    url: String,
    name: String,
    type: String,
    size: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const AiConversationSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: {
    type: [MessageSchema],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('AiConversation', AiConversationSchema);
