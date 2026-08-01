const Razorpay = require('razorpay');
const crypto = require('crypto');
const MarketplacePurchase = require('./marketplace.model');
const Integration = require('../integrations/integration.model');

// Helper to get platform Razorpay credentials
const getRazorpayCredentials = async () => {
  const paymentIntegration = await Integration.findOne({ type: 'payment', companyId: null });
  if (!paymentIntegration || !paymentIntegration.isActive) {
    throw new Error('Platform payment integration is not configured or inactive.');
  }

  const { razorpayKeyId, razorpayKeySecret } = paymentIntegration.config || {};
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('Razorpay API keys are missing in the platform configuration.');
  }

  return { razorpayKeyId, razorpayKeySecret };
};

const getPurchasedModules = async (companyId) => {
  const purchases = await MarketplacePurchase.find({
    companyId,
    status: 'completed'
  }).select('moduleName -_id');

  return purchases.map(p => p.moduleName);
};

const initiatePurchase = async (companyId, moduleName, amountInInr) => {
  // Check if already purchased
  const existingPurchase = await MarketplacePurchase.findOne({
    companyId,
    moduleName,
    status: 'completed'
  });
  if (existingPurchase) {
    throw new Error('Module already purchased.');
  }

  const { razorpayKeyId, razorpayKeySecret } = await getRazorpayCredentials();

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  const amountInPaise = amountInInr * 100;
  
  // Create Razorpay Order
  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `rcpt_${Date.now().toString().slice(-10)}`,
    payment_capture: 1 // auto capture
  };

  const order = await razorpay.orders.create(options);

  // Save pending purchase
  const purchase = await MarketplacePurchase.create({
    companyId,
    moduleName,
    razorpayOrderId: order.id,
    amount: amountInPaise,
    currency: 'INR',
    status: 'pending'
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpayKeyId
  };
};

const verifyPurchase = async (companyId, moduleName, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const { razorpayKeySecret } = await getRazorpayCredentials();

  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    // Update purchase to failed
    await MarketplacePurchase.updateOne(
      { razorpayOrderId },
      { status: 'failed', razorpayPaymentId }
    );
    throw new Error('Invalid payment signature');
  }

  // Update purchase to completed
  const purchase = await MarketplacePurchase.findOneAndUpdate(
    { razorpayOrderId, companyId, moduleName },
    { status: 'completed', razorpayPaymentId },
    { returnDocument: 'after' }
  );

  if (!purchase) {
    throw new Error('Purchase record not found for the given order ID');
  }

  return purchase;
};

module.exports = {
  getPurchasedModules,
  initiatePurchase,
  verifyPurchase
};
