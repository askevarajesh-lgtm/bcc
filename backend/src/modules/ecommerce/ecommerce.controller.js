const EcommerceProduct = require('./models/EcommerceProduct');
const EcommerceOrder = require('./models/EcommerceOrder');
const EcommerceCustomer = require('./models/EcommerceCustomer');
const EcommercePayment = require('./models/EcommercePayment');
const EcommerceShipping = require('./models/EcommerceShipping');
const EcommerceSettings = require('./models/EcommerceSettings');

// Helper to construct isolated query
const getIsolatedQuery = (req) => {
  if (!req.workspaceId) throw new Error('Unauthorized: Missing workspaceId');
  if (!req.params.websiteId) throw new Error('Bad Request: Missing websiteId');
  return { workspaceId: req.workspaceId, websiteId: req.params.websiteId };
};

// --- PRODUCTS ---
exports.getProducts = async (req, res, next) => {
  try {
    const products = await EcommerceProduct.find(getIsolatedQuery(req)).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) { next(error); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const query = getIsolatedQuery(req);
    const product = new EcommerceProduct({ ...req.body, ...query });
    await product.save();
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const query = { ...getIsolatedQuery(req), _id: req.params.productId };
    const product = await EcommerceProduct.findOneAndUpdate(query, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const query = { ...getIsolatedQuery(req), _id: req.params.productId };
    const product = await EcommerceProduct.findOneAndDelete(query);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) { next(error); }
};

// --- SETTINGS ---
exports.getSettings = async (req, res, next) => {
  try {
    const query = getIsolatedQuery(req);
    let settings = await EcommerceSettings.findOne(query);
    if (!settings) {
      settings = new EcommerceSettings({
        ...query,
        paymentMethods: [
          { id: 'COD', name: 'Cash on Delivery', enabled: true },
          { id: 'Razorpay', name: 'Razorpay', enabled: false },
          { id: 'Stripe', name: 'Stripe', enabled: false }
        ],
        shippingMethods: [
          { id: 'standard', name: 'Standard Delivery', price: 50, enabled: true },
          { id: 'express', name: 'Express Delivery', price: 120, enabled: false }
        ]
      });
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const query = getIsolatedQuery(req);
    const settings = await EcommerceSettings.findOneAndUpdate(query, req.body, { new: true, upsert: true });
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

// --- READONLY ADMIN ENTITIES ---
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await EcommerceOrder.find(getIsolatedQuery(req)).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) { next(error); }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await EcommerceCustomer.find(getIsolatedQuery(req)).sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (error) { next(error); }
};

exports.getPayments = async (req, res, next) => {
  try {
    const payments = await EcommercePayment.find(getIsolatedQuery(req)).sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error) { next(error); }
};

exports.getShipping = async (req, res, next) => {
  try {
    const shipping = await EcommerceShipping.find(getIsolatedQuery(req)).sort({ createdAt: -1 });
    res.json({ success: true, data: shipping });
  } catch (error) { next(error); }
};

// --- ATOMIC CHECKOUT ---
exports.checkout = async (req, res, next) => {
  try {
    const query = getIsolatedQuery(req);
    const { customerDetails, cart, paymentMethod, shippingMethodId, idempotencyKey } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty or invalid' });
    }
    
    if (!customerDetails || !customerDetails.name || !customerDetails.email) {
      return res.status(400).json({ success: false, message: 'Valid customer name and email are required' });
    }

    if (idempotencyKey) {
      const existingOrder = await EcommerceOrder.findOne({ ...query, idempotencyKey });
      if (existingOrder) {
        return res.json({ success: true, orderId: existingOrder._id, duplicate: true });
      }
    }

    // Server-side Settings Validation
    const settings = await EcommerceSettings.findOne(query);
    if (!settings) {
      return res.status(400).json({ success: false, message: 'Settings not configured' });
    }

    // Validate shipping method & calculate fee
    let shippingFee = 0;
    let shippingMethodName = 'Standard';
    if (settings.shippingEnabled) {
      let method = null;
      if (settings.shippingMethods && settings.shippingMethods.length > 0) {
        method = settings.shippingMethods.find(m => m.id === shippingMethodId && m.enabled) 
              || settings.shippingMethods.find(m => m.enabled);
      }
      if (method) {
        shippingFee = method.price;
        shippingMethodName = method.name;
      } else {
        shippingFee = settings.shippingFee || 0;
      }
    }

    // Validate payment method
    let selectedPayment = settings.paymentMethods?.find(m => m.id === paymentMethod && m.enabled);
    if (!selectedPayment) {
      return res.status(400).json({ success: false, message: 'Invalid or disabled payment method' });
    }

    let subtotal = 0;
    const validatedItems = [];
    const stockUpdates = [];

    // 1. Fetch all products and validate stock/price
    for (const item of cart) {
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
         return res.status(400).json({ success: false, message: `Invalid quantity for product ${item.name}` });
      }

      const product = await EcommerceProduct.findOne({ ...query, _id: item.id, status: 'Active' });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found or inactive: ${item.name}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      const priceToUse = product.salePrice ? product.salePrice : product.price;
      subtotal += priceToUse * item.quantity;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: priceToUse,
        quantity: item.quantity,
        image: product.image
      });

      stockUpdates.push({
        updateOne: {
          filter: { ...query, _id: product._id, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } }
        }
      });
    }

    const finalTotal = subtotal + shippingFee;

    // 2. Perform atomic stock deduction
    const bulkWriteResult = await EcommerceProduct.bulkWrite(stockUpdates);
    if (bulkWriteResult.modifiedCount !== stockUpdates.length) {
       return res.status(400).json({ success: false, message: 'Checkout failed due to insufficient stock.' });
    }

    // 3. Customer deduplication using safe atomic upsert
    const normalizedEmail = customerDetails.email.toLowerCase().trim();
    const customer = await EcommerceCustomer.findOneAndUpdate(
      { ...query, email: normalizedEmail },
      { 
        $inc: { ordersCount: 1, totalSpent: finalTotal },
        $set: { name: customerDetails.name, address: customerDetails.address }
      },
      { new: true, upsert: true }
    );

    // 4. Create Order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const order = new EcommerceOrder({
      ...query,
      orderNumber,
      idempotencyKey,
      customerId: customer._id,
      customerName: customer.name,
      items: validatedItems,
      subtotal,
      shippingFee,
      total: finalTotal,
      paymentMethod: selectedPayment.name,
      shippingMethodId,
      status: 'Pending'
    });
    await order.save();

    // 5. Create Payment & Shipping (Only if order saves successfully)
    try {
      const payment = new EcommercePayment({
        ...query,
        orderId: order._id,
        customerName: customer.name,
        method: selectedPayment.name,
        amount: finalTotal,
        status: 'Pending'
      });
      await payment.save();

      if (settings.shippingEnabled) {
        const shipping = new EcommerceShipping({
          ...query,
          orderId: order._id,
          customerName: customer.name,
          address: customerDetails.address,
          methodName: shippingMethodName,
          status: 'Pending',
          trackingId: `TRK${Date.now()}`
        });
        await shipping.save();
      }
    } catch (postOrderErr) {
      console.error('Error creating payment/shipping records:', postOrderErr);
      // We do not fail the checkout if payment/shipping record creation fails because the order is already placed
      // In a real transactional system, we would rollback.
    }

    res.json({ success: true, orderId: order._id, orderNumber });
  } catch (error) { next(error); }
};
