const Store = require('./store.model');
const Product = require('./product.model');
const StoreCollection = require('./store-collection.model');
const Discount = require('./discount.model');
const StorePage = require('./store-page.model');
const Order = require('./order.model');

// Create Store
exports.createStore = async (req, res, next) => {
  try {
    const { method, storeName, currency, status, installDemo, templateName } = req.body;
    const workspaceId = req.workspaceId;

    if (!storeName) {
      return res.status(400).json({ success: false, error: 'Store name is required' });
    }

    const slug = storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slugExists = await Store.findOne({ workspaceId, slug, isDeleted: false });
    if (slugExists) {
      return res.status(400).json({ success: false, error: 'Store slug is already in use' });
    }

    const store = new Store({
      workspaceId,
      storeName,
      slug,
      currency: currency || 'INR',
      status: status || 'Draft',
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    const savedStore = await store.save();

    // Create default store pages
    const pageTypes = ['Store home', 'Catalog', 'Cart', 'Checkout', 'Blog'];
    const pageSlugs = ['home', 'catalog', 'cart', 'checkout', 'blog'];
    for (let i = 0; i < pageTypes.length; i++) {
      await new StorePage({
        storeId: savedStore._id,
        pageName: `${slug} — ${pageSlugs[i]}`,
        slug: `store-${slug}-${pageSlugs[i]}`,
        type: pageTypes[i],
        status: 'Draft'
      }).save();
    }

    // Install Demo Products if checked
    if (installDemo) {
      // Create categories
      const catNames = ['Interior', 'Exterior', 'Tools'];
      const collections = [];
      for (const name of catNames) {
        const col = await new StoreCollection({
          storeId: savedStore._id,
          name,
          slug: name.toLowerCase(),
          active: 'Yes'
        }).save();
        collections.push(col);
      }

      // Create products
      const productsData = [
        { name: 'Phone Mount Pro', price: 24.00, stock: 50 },
        { name: 'Ceramic Coating Kit', price: 89.00, stock: 50 },
        { name: 'All-Weather Mats', price: 59.00, stock: 50 },
        { name: 'Jump Starter Pack', price: 119.00, stock: 50 },
        { name: 'LED Work Light', price: 35.00, stock: 50 },
        { name: 'Memory Foam Seat Cushion', price: 45.00, stock: 50 }
      ];
      for (const prod of productsData) {
        await new Product({
          storeId: savedStore._id,
          name: prod.name,
          price: prod.price,
          stock: prod.stock
        }).save();
      }

      // Create discount code
      await new Discount({
        storeId: savedStore._id,
        code: 'DRIVE10',
        type: 'Percent',
        value: '10.00%',
        uses: 0,
        active: 'Yes'
      }).save();
    }

    res.status(201).json({ success: true, data: savedStore });
  } catch (error) {
    next(error);
  }
};

// List Stores
exports.getStores = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const query = { workspaceId, isDeleted: false };
    const stores = await Store.find(query).sort({ updatedAt: -1 });
    
    const data = await Promise.all(stores.map(async (st) => {
      const prodCount = await Product.countDocuments({ storeId: st._id, isDeleted: false });
      return {
        ...st.toObject(),
        catalog: prodCount > 0 ? `${prodCount} Products` : "Empty Catalog"
      };
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Get Store Details
exports.getStoreDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await Store.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

// Update Store Settings (General)
exports.updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const store = await Store.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    // Block duplicate slugs
    if (updateData.slug && updateData.slug !== store.slug) {
      const cleanSlug = updateData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const slugExists = await Store.findOne({ workspaceId: req.workspaceId, slug: cleanSlug, _id: { $ne: id }, isDeleted: false });
      if (slugExists) {
        return res.status(400).json({ success: false, error: 'Store slug is already in use' });
      }
      store.slug = cleanSlug;
    }

    // Direct mappings
    if (updateData.storeName) store.storeName = updateData.storeName;
    if (updateData.status) store.status = updateData.status;
    if (updateData.description !== undefined) store.description = updateData.description;
    if (updateData.currency) store.currency = updateData.currency;
    if (updateData.contactEmail !== undefined) store.contactEmail = updateData.contactEmail;
    if (updateData.seoTitle !== undefined) store.seoTitle = updateData.seoTitle;
    if (updateData.seoDescription !== undefined) store.seoDescription = updateData.seoDescription;
    if (updateData.ogImageUrl !== undefined) store.ogImageUrl = updateData.ogImageUrl;
    if (updateData.faviconUrl !== undefined) store.faviconUrl = updateData.faviconUrl;
    if (updateData.chatWidgetId !== undefined) store.chatWidgetId = updateData.chatWidgetId;

    if (updateData.trackingPixels) {
      store.trackingPixels = { ...store.trackingPixels, ...updateData.trackingPixels };
    }
    if (updateData.frontendDesign) {
      store.frontendDesign = { ...store.frontendDesign, ...updateData.frontendDesign };
    }

    store.updatedBy = req.user?._id;
    const saved = await store.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// Delete Store
exports.deleteStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await Store.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    store.isDeleted = true;
    store.updatedBy = req.user?._id;
    await store.save();

    res.json({ success: true, message: 'Store soft-deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Update Shipping & Policies
exports.updatePolicies = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { salesTaxRate, checkoutFooterNote, shippingInformation, refundPolicy, privacyPolicy } = req.body;

    const store = await Store.findOne({ _id: storeId, workspaceId: req.workspaceId, isDeleted: false });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    store.policies = {
      salesTaxRate: salesTaxRate !== undefined ? Number(salesTaxRate) : store.policies.salesTaxRate,
      checkoutFooterNote: checkoutFooterNote || "",
      shippingInformation: shippingInformation || "",
      refundPolicy: refundPolicy || "",
      privacyPolicy: privacyPolicy || ""
    };
    
    await store.save();
    res.json({ success: true, data: store.policies });
  } catch (error) {
    next(error);
  }
};

// Update Payments Gateway settings
exports.updatePayments = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { checkoutGateway, stripeOverride } = req.body;

    const store = await Store.findOne({ _id: storeId, workspaceId: req.workspaceId, isDeleted: false });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    store.payments = {
      checkoutGateway: checkoutGateway || store.payments.checkoutGateway,
      stripeOverride: stripeOverride ? { ...store.payments.stripeOverride, ...stripeOverride } : store.payments.stripeOverride
    };

    await store.save();
    res.json({ success: true, data: store.payments });
  } catch (error) {
    next(error);
  }
};

// Update Email Sender Settings
exports.updateEmailSender = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { useCustomSender, fromEmail, fromName, replyTo } = req.body;

    const store = await Store.findOne({ _id: storeId, workspaceId: req.workspaceId, isDeleted: false });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    store.emailSender = {
      useCustomSender: useCustomSender !== undefined ? useCustomSender : store.emailSender.useCustomSender,
      fromEmail: fromEmail !== undefined ? fromEmail : store.emailSender.fromEmail,
      fromName: fromName !== undefined ? fromName : store.emailSender.fromName,
      replyTo: replyTo !== undefined ? replyTo : store.emailSender.replyTo
    };

    await store.save();
    res.json({ success: true, data: store.emailSender });
  } catch (error) {
    next(error);
  }
};

// Products CRUD
exports.getProducts = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const products = await Product.find({ storeId, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

exports.addProduct = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { name, price, stock, images } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Product name and price are required' });
    }

    const product = new Product({
      storeId,
      name,
      price: Number(price),
      stock: stock !== undefined ? Number(stock) : 0,
      images: images || []
    });

    const saved = await product.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { name, price, stock, images } = req.body;

    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (name) product.name = name;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (images) product.images = images;

    const saved = await product.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    product.isDeleted = true;
    await product.save();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// Collections CRUD
exports.getCollections = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const cols = await StoreCollection.find({ storeId, isDeleted: false }).sort({ createdAt: 1 });
    res.json({ success: true, data: cols });
  } catch (error) {
    next(error);
  }
};

exports.addCollection = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { name, slug, active } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Collection name is required' });
    }

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    const collection = new StoreCollection({
      storeId,
      name,
      slug: finalSlug,
      active: active || 'Yes'
    });

    const saved = await collection.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.updateCollection = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    const { name, slug, active } = req.body;

    const col = await StoreCollection.findOne({ _id: collectionId, isDeleted: false });
    if (!col) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    if (name) col.name = name;
    if (slug) col.slug = slug;
    if (active) col.active = active;

    const saved = await col.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.deleteCollection = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    const col = await StoreCollection.findOne({ _id: collectionId, isDeleted: false });
    if (!col) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    col.isDeleted = true;
    await col.save();
    res.json({ success: true, message: 'Collection deleted' });
  } catch (error) {
    next(error);
  }
};

// Discounts CRUD
exports.getDiscounts = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const discounts = await Discount.find({ storeId, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: discounts });
  } catch (error) {
    next(error);
  }
};

exports.addDiscount = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { code, type, value, active } = req.body;

    if (!code || !value) {
      return res.status(400).json({ success: false, error: 'Code and value are required' });
    }

    const discount = new Discount({
      storeId,
      code: code.toUpperCase(),
      type: type || 'Percent',
      value,
      active: active || 'Yes'
    });

    const saved = await discount.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.updateDiscount = async (req, res, next) => {
  try {
    const { discountId } = req.params;
    const { code, type, value, active } = req.body;

    const disc = await Discount.findOne({ _id: discountId, isDeleted: false });
    if (!disc) {
      return res.status(404).json({ success: false, error: 'Discount not found' });
    }

    if (code) disc.code = code.toUpperCase();
    if (type) disc.type = type;
    if (value) disc.value = value;
    if (active) disc.active = active;

    const saved = await disc.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.deleteDiscount = async (req, res, next) => {
  try {
    const { discountId } = req.params;
    const disc = await Discount.findOne({ _id: discountId, isDeleted: false });
    if (!disc) {
      return res.status(404).json({ success: false, error: 'Discount not found' });
    }
    disc.isDeleted = true;
    await disc.save();
    res.json({ success: true, message: 'Discount deleted' });
  } catch (error) {
    next(error);
  }
};

// Store Pages CRUD
exports.getStorePages = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const pages = await StorePage.find({ storeId, isDeleted: false }).sort({ createdAt: 1 });
    res.json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
};

exports.addStorePage = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { pageName, slug, type } = req.body;

    if (!pageName || !type) {
      return res.status(400).json({ success: false, error: 'Page name and type are required' });
    }

    const pageSlug = slug || pageName.toLowerCase().replace(/\s+/g, '-');
    const page = new StorePage({
      storeId,
      pageName,
      slug: pageSlug,
      type,
      status: 'Draft'
    });

    const saved = await page.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

exports.updateStorePageStatus = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { status } = req.body;

    const page = await StorePage.findOne({ _id: pageId, isDeleted: false });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Store page not found' });
    }

    page.status = status || 'Draft';
    await page.save();
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

exports.deleteStorePage = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const page = await StorePage.findOne({ _id: pageId, isDeleted: false });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Store page not found' });
    }
    page.isDeleted = true;
    await page.save();
    res.json({ success: true, message: 'Store page deleted' });
  } catch (error) {
    next(error);
  }
};

// Orders list
exports.getOrders = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const orders = await Order.find({ storeId, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.fulfillOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { fulfillmentStatus } = req.body;

    const order = await Order.findOne({ _id: orderId, isDeleted: false });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.fulfillmentStatus = fulfillmentStatus || 'Fulfilled';
    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Customers list
exports.getCustomers = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    
    // Aggregation of unique customers from orders
    const customers = await Order.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), isDeleted: false } },
      { $group: {
          _id: '$customerEmail',
          name: { $first: '$customerName' },
          ordersCount: { $sum: 1 },
          lifetimeSpend: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' }
      }}
    ]);

    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

// Get Dashboard Stats
exports.getStoreStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const productsCount = await Product.countDocuments({ storeId: id, isDeleted: false });
    const collectionsCount = await StoreCollection.countDocuments({ storeId: id, isDeleted: false });
    const discountsCount = await Discount.countDocuments({ storeId: id, isDeleted: false });
    const ordersCount = await Order.countDocuments({ storeId: id, isDeleted: false });
    
    const unfulfilledCount = await Order.countDocuments({ storeId: id, fulfillmentStatus: 'Unfulfilled', isDeleted: false });

    // Calculate revenue
    const revenueStats = await Order.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(id), paymentStatus: 'Paid', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const lifetimeSales = revenueStats.length > 0 ? revenueStats[0].total : 0;

    res.json({
      success: true,
      data: {
        productsCount,
        collectionsCount,
        discountsCount,
        ordersCount,
        unfulfilledCount,
        lifetimeSales
      }
    });
  } catch (error) {
    next(error);
  }
};
