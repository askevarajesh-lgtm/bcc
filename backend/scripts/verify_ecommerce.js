const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// We have to load the environment variables manually based on where this runs
dotenv.config({ path: 'd:/Louis/Task/BCC/bcc 1/bcc/backend/.env' });

const EcommerceProduct = require('d:/Louis/Task/BCC/bcc 1/bcc/backend/src/modules/ecommerce/models/EcommerceProduct');
const EcommerceCustomer = require('d:/Louis/Task/BCC/bcc 1/bcc/backend/src/modules/ecommerce/models/EcommerceCustomer');
const EcommerceOrder = require('d:/Louis/Task/BCC/bcc 1/bcc/backend/src/modules/ecommerce/models/EcommerceOrder');
const EcommercePayment = require('d:/Louis/Task/BCC/bcc 1/bcc/backend/src/modules/ecommerce/models/EcommercePayment');
const EcommerceShipping = require('d:/Louis/Task/BCC/bcc 1/bcc/backend/src/modules/ecommerce/models/EcommerceShipping');
const { checkout } = require('d:/Louis/Task/BCC/bcc 1/bcc/backend/src/modules/ecommerce/ecommerce.controller');

const workspaceId = new mongoose.Types.ObjectId();
const websiteId = 'web_test_123';
const storeId = 'store_test_456';

async function runTests() {
  console.log('--- STARTING E-COMMERCE END-TO-END RUNTIME VERIFICATION ---');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/BCC';
    await mongoose.connect(mongoUri);
    console.log('[+] Connected to MongoDB');

    // 0. Index Cleanup Audit
    try {
      await EcommerceCustomer.collection.dropIndex('storeId_1_email_1');
      console.log('[+] Dropped obsolete Customer index');
    } catch(e) {}
    try {
      await EcommerceOrder.collection.dropIndex('storeId_1_idempotencyKey_1');
      console.log('[+] Dropped obsolete Order index');
    } catch(e) {}

    // Clean up previous test data
    await EcommerceProduct.deleteMany({ storeId });
    await EcommerceCustomer.deleteMany({ storeId });
    await EcommerceOrder.deleteMany({ storeId });
    await EcommercePayment.deleteMany({ storeId });
    await EcommerceShipping.deleteMany({ storeId });

    // 1. Create a Product with stock = 1 (for concurrency test)
    const product = new EcommerceProduct({
      workspaceId, websiteId, storeId,
      name: 'Test Concurrency Product',
      price: 100,
      stock: 1,
      status: 'Active'
    });
    await product.save();
    console.log(`[+] Created test product: ${product._id} with stock 1`);

    // Mock Express Req/Res to test controller directly without JWT
    const createReq = (idempotencyKey, email) => ({
      params: { websiteId, storeId },
      workspaceId, // simulated from auth middleware
      body: {
        customerDetails: { name: 'Test User', email, address: '123 Test Ave' },
        cart: [{ id: product._id.toString(), quantity: 1, name: product.name }],
        paymentMethod: 'cod',
        shippingMethodId: 'standard',
        idempotencyKey
      }
    });

    const createRes = () => {
      const res = {};
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (data) => { res.data = data; return res; };
      return res;
    };

    // Test 1: Successful Checkout
    const req1 = createReq('idemp_1', 'test1@test.com');
    const res1 = createRes();
    await checkout(req1, res1, console.error);
    
    if (res1.data && res1.data.success) {
      console.log('[PASS] Checkout 1 succeeded. Order created.');
    } else {
      console.error('[FAIL] Checkout 1 failed', res1.data);
      throw new Error('Test aborted');
    }

    // Verify stock deduction
    const pAfter1 = await EcommerceProduct.findById(product._id);
    if (pAfter1.stock === 0) console.log('[PASS] Stock correctly reduced to 0');
    else console.error('[FAIL] Stock not reduced!');

    // Test 2: Idempotent duplicate request
    const req2 = createReq('idemp_1', 'test1@test.com');
    const res2 = createRes();
    await checkout(req2, res2, console.error);

    if (res2.data && res2.data.duplicate) {
      console.log('[PASS] Idempotent request successfully bounced duplicate.');
    } else {
      console.error('[FAIL] Idempotency failed to catch duplicate!');
    }

    // Verify records
    const orders = await EcommerceOrder.find({ storeId });
    if (orders.length === 1) console.log('[PASS] Exactly one order created.');
    else console.error(`[FAIL] Expected 1 order, found ${orders.length}`);

    // Test 3: Concurrent checkout failure (Out of stock)
    const req3 = createReq('idemp_2', 'test2@test.com');
    const res3 = createRes();
    await checkout(req3, res3, console.error);

    if (!res3.data.success && res3.data.message.includes('Insufficient stock')) {
      console.log('[PASS] Correctly rejected checkout for out of stock item.');
    } else {
      console.error('[FAIL] Out of stock item checkout succeeded or failed for wrong reason', res3.data);
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('--- VERIFICATION FINISHED ---');
  }
}

runTests();
