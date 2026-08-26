const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5500/api';

async function runTests() {
  try {
    // 1. Create a real Website first to pass ownership checks
    // We will do this directly via mongoose to bypass auth for test setup
    await mongoose.connect('mongodb+srv://askevarajesh_db_user:8VdzZrQ8MwAtuZht@m1local.lp8xr7i.mongodb.net/bcc');
    const workspaceId = new mongoose.Types.ObjectId('60d0fe4f5311236168a10000');
    
    // Check if siteA exists, if not create it
    let siteA = await mongoose.connection.collection('websites').findOne({ name: 'Test Site A' });
    if (!siteA) {
      const result = await mongoose.connection.collection('websites').insertOne({
        workspaceId,
        name: 'Test Site A',
        status: 'Published',
        isDeleted: false
      });
      siteA = { _id: result.insertedId };
    }
    const websiteA = siteA._id.toString();

    let siteB = await mongoose.connection.collection('websites').findOne({ name: 'Test Site B' });
    if (!siteB) {
      const result = await mongoose.connection.collection('websites').insertOne({
        workspaceId,
        name: 'Test Site B',
        status: 'Published',
        isDeleted: false
      });
      siteB = { _id: result.insertedId };
    }
    const websiteB = siteB._id.toString();

    console.log('--- ECOMMERCE BACKEND TEST ---');
    console.log('Testing Product Creation (Site A)...');
    
    const p1Res = await axios.post(`${API_URL}/ecommerce/${websiteA}/products`, {
      name: 'Nike Shoe',
      price: 4999,
      stock: 20,
      status: 'Active'
    });
    const nike = p1Res.data.data;
    console.log('Created Nike:', nike._id);

    const p2Res = await axios.post(`${API_URL}/ecommerce/${websiteA}/products`, {
      name: 'Adidas Shoe',
      price: 3999,
      stock: 10,
      status: 'Active'
    });
    const adidas = p2Res.data.data;
    console.log('Created Adidas:', adidas._id);

    // Initialize Settings
    await axios.get(`${API_URL}/ecommerce/${websiteA}/settings`);
    console.log('Initialized Settings');

    const idempotencyKey = 'IDEMP_TEST_123';

    // 2. Checkout
    console.log('Testing Checkout...');
    const checkoutPayload = {
      customerDetails: { name: 'Test User', email: 'test@example.com', address: '123 Test' },
      cart: [
        { id: nike._id, name: nike.name, price: nike.price, quantity: 2 }, // 20 - 2 = 18
        { id: adidas._id, name: adidas.name, price: adidas.price, quantity: 3 } // 10 - 3 = 7
      ],
      paymentMethod: 'COD',
      shippingMethodId: 'standard',
      idempotencyKey
    };
    
    const checkoutRes = await axios.post(`${API_URL}/ecommerce/${websiteA}/checkout`, checkoutPayload);
    console.log(`Checkout Success! Order ID: ${checkoutRes.data.orderId}`);

    // 3. Test Idempotency
    console.log('Testing Idempotency...');
    const duplicateCheckoutRes = await axios.post(`${API_URL}/ecommerce/${websiteA}/checkout`, checkoutPayload);
    if (duplicateCheckoutRes.data.duplicate) {
      console.log('Idempotency Success! Caught duplicate request.');
    } else {
      console.log('TEST FAILED: Idempotency failed to catch duplicate request.');
    }

    // 3. Verify Stock Deduction
    const updatedProductsRes = await axios.get(`${API_URL}/ecommerce/${websiteA}/products`);
    const updatedProducts = updatedProductsRes.data.data;
    const updatedNike = updatedProducts.find(p => p._id === nike._id);
    const updatedAdidas = updatedProducts.find(p => p._id === adidas._id);
    console.log('Nike Stock (Expect 18):', updatedNike.stock);
    console.log('Adidas Stock (Expect 7):', updatedAdidas.stock);

    // 4. Concurrency Test
    console.log('Testing Concurrency with 1 Stock...');
    // Create product with 1 stock
    const p3Res = await axios.post(`${API_URL}/ecommerce/${websiteA}/products`, {
      name: 'Puma Shoe',
      price: 2999,
      stock: 1,
      status: 'Active'
    });
    const puma = p3Res.data.data;

    const concurrentPayload = {
      customerDetails: { name: 'Test User', email: 'test@example.com', address: '123 Test' },
      cart: [{ id: puma._id, name: puma.name, price: puma.price, quantity: 1 }],
      paymentMethod: 'COD',
      shippingMethodId: 'standard'
    };

    try {
      const [res1, res2] = await Promise.allSettled([
        axios.post(`${API_URL}/ecommerce/${websiteA}/checkout`, concurrentPayload),
        axios.post(`${API_URL}/ecommerce/${websiteA}/checkout`, concurrentPayload)
      ]);
      console.log('Concurrent checkout 1 status:', res1.status);
      console.log('Concurrent checkout 2 status:', res2.status);
    } catch (e) {
      console.log('Caught concurrency exception as expected');
    }

    const updatedPumaRes = await axios.get(`${API_URL}/ecommerce/${websiteA}/products`);
    const updatedPuma = updatedPumaRes.data.data.find(p => p._id === puma._id);
    console.log('Puma Stock (Expect 0):', updatedPuma.stock);

    // 5. Customer Deduplication Test
    console.log('Testing Customer Deduplication...');
    await axios.post(`${API_URL}/ecommerce/${websiteA}/checkout`, {
      customerDetails: { name: 'Test User 2', email: 'test@example.com', address: '456 Test' },
      cart: [{ id: updatedAdidas._id, name: updatedAdidas.name, price: updatedAdidas.price, quantity: 1 }],
      paymentMethod: 'COD',
      shippingMethodId: 'standard'
    });

    const customersRes = await axios.get(`${API_URL}/ecommerce/${websiteA}/customers`);
    const customer = customersRes.data.data.find(c => c.email === 'test@example.com');
    console.log('Customer Orders Count (Expect 3):', customer.ordersCount);

    // 6. Website Isolation Test
    console.log('Testing Website Isolation...');
    const siteBRes = await axios.get(`${API_URL}/ecommerce/${websiteB}/products`);
    console.log('Site B Products (Expect 0):', siteBRes.data.data.length);

    console.log('ALL TESTS COMPLETED.');

  } catch (err) {
    console.error('TEST FAILED:', err.response ? err.response.data : err.message);
  }
}

runTests();
