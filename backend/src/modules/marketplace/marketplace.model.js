const mongoose = require('mongoose');

const MarketplacePurchaseSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  moduleName: { 
    type: String, 
    required: true,
    enum: ['seo', 'content', 'design', 'ai_studio'], // allowed modules
  },
  razorpayOrderId: { 
    type: String,
    required: true,
    index: true
  },
  razorpayPaymentId: { 
    type: String,
    default: null
  },
  amount: { 
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
}, { timestamps: true });

// Prevent duplicate completed purchases for the same module by the same company
MarketplacePurchaseSchema.index({ companyId: 1, moduleName: 1, status: 1 });

module.exports = mongoose.model('MarketplacePurchase', MarketplacePurchaseSchema);
