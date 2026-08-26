const marketplaceService = require('./marketplace.service');

const getPurchasedModules = async (req, res) => {
  try {
    const modules = await marketplaceService.getPurchasedModules(req.companyId);
    return res.status(200).json({ success: true, message: 'Purchased modules retrieved successfully', data: { modules } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const initiatePurchase = async (req, res) => {
  try {
    const { moduleName, amount } = req.body;
    if (!moduleName || !amount) {
      return res.status(400).json({ success: false, message: 'moduleName and amount are required' });
    }
    
    // Convert USD to INR mapping if necessary, but here we assume amount sent is in INR or mapped.
    // The marketplace shows prices in USD or INR, we'll assume amount is the final value to charge.
    const orderData = await marketplaceService.initiatePurchase(req.companyId, moduleName, amount);
    
    return res.status(200).json({ success: true, message: 'Purchase initiated successfully', data: orderData });
  } catch (error) {
    console.error("Marketplace Initiate Purchase Error:", error);
    let errorMsg = error.error?.description || error.message || 'An unexpected error occurred during purchase initiation';
    if (errorMsg === 'Authentication failed') {
      errorMsg = 'Razorpay Integration Error: Authentication failed. Please check your payment integration API keys in settings.';
    }
    return res.status(400).json({ success: false, message: errorMsg, details: error });
  }
};

const verifyPurchase = async (req, res) => {
  try {
    const { moduleName, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    
    if (!moduleName || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification details' });
    }

    const purchase = await marketplaceService.verifyPurchase(
      req.companyId,
      moduleName,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    return res.status(200).json({ success: true, message: 'Payment verified and module unlocked', data: { purchase } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPurchasedModules,
  initiatePurchase,
  verifyPurchase
};
