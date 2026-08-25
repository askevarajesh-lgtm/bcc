// storage.js - Simple local storage utility for E-commerce MVP

// Helper to get scoped keys
const getScopedKey = (workspaceId, websiteId, entity) => {
  return `ecommerce_${workspaceId || 'default'}_${websiteId || 'default'}_${entity}`;
};

export const getStorageData = (workspaceId, websiteId, entity, defaultValue = []) => {
  try {
    const key = getScopedKey(workspaceId, websiteId, entity);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return defaultValue;
  }
};

export const setStorageData = (workspaceId, websiteId, entity, data) => {
  try {
    const key = getScopedKey(workspaceId, websiteId, entity);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage', error);
  }
};

export const clearStorageData = (workspaceId, websiteId, entity) => {
  try {
    const key = getScopedKey(workspaceId, websiteId, entity);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage', error);
  }
};

export const processCheckout = (workspaceId, websiteId, customerDetails, cart, paymentMethod) => {
  const products = getStorageData(workspaceId, websiteId, 'products', []);
  const orders = getStorageData(workspaceId, websiteId, 'orders', []);
  const customers = getStorageData(workspaceId, websiteId, 'customers', []);
  const payments = getStorageData(workspaceId, websiteId, 'payments', []);
  const shipping = getStorageData(workspaceId, websiteId, 'shipping', []);
  
  // Validate stock
  for (const item of cart) {
    const product = products.find(p => p.id === item.id);
    if (!product || product.stock < item.quantity) {
      return { success: false, message: `Insufficient stock for ${item.name}` };
    }
  }

  const orderId = `ORD-${Date.now()}`;
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = 50;
  const finalTotal = cartTotal + shippingFee;

  // Deduplicate/Create Customer
  let customer = customers.find(c => c.email.toLowerCase() === customerDetails.email.toLowerCase());
  if (customer) {
    customer.ordersCount = (customer.ordersCount || 0) + 1;
    customer.totalSpent = (customer.totalSpent || 0) + finalTotal;
    customer.name = customerDetails.name;
    customer.address = customerDetails.address;
  } else {
    customer = {
      id: `CUS-${Date.now()}`,
      ...customerDetails,
      ordersCount: 1,
      totalSpent: finalTotal,
      createdAt: new Date().toISOString()
    };
    customers.push(customer);
  }

  // Create Order
  const newOrder = {
    id: orderId,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    shippingAddress: customer.address,
    items: cart,
    subtotal: cartTotal,
    shippingFee,
    total: finalTotal,
    status: 'Pending',
    date: new Date().toISOString()
  };
  orders.unshift(newOrder);

  // Create Payment
  const newPayment = {
    id: `PAY-${Date.now()}`,
    orderId,
    customerId: customer.id,
    amount: finalTotal,
    method: paymentMethod,
    status: 'Completed',
    date: new Date().toISOString()
  };
  payments.unshift(newPayment);

  // Create Shipment
  const newShipment = {
    id: `SHP-${Date.now()}`,
    orderId,
    customerId: customer.id,
    trackingId: `TRK${Date.now()}`,
    status: 'Pending',
    date: new Date().toISOString()
  };
  shipping.unshift(newShipment);

  // Reduce Stock
  const updatedProducts = products.map(p => {
    const cartItem = cart.find(c => c.id === p.id);
    if (cartItem) {
      const newStock = Math.max(0, p.stock - cartItem.quantity);
      return { 
        ...p, 
        stock: newStock,
        status: newStock === 0 ? 'Out of Stock' : p.status 
      };
    }
    return p;
  });

  // Save everything atomically
  setStorageData(workspaceId, websiteId, 'customers', customers);
  setStorageData(workspaceId, websiteId, 'orders', orders);
  setStorageData(workspaceId, websiteId, 'payments', payments);
  setStorageData(workspaceId, websiteId, 'shipping', shipping);
  setStorageData(workspaceId, websiteId, 'products', updatedProducts);

  return { success: true, orderId };
};

export const seedDemoDataIfNeeded = (workspaceId, websiteId) => {
  const products = getStorageData(workspaceId, websiteId, 'products', null);
  if (!products) {
    const demoProducts = [
      { id: '1', name: 'Premium Wireless Headphones', sku: 'AUDIO-01', price: 12999, stock: 45, category: 'Electronics', status: 'Active', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
      { id: '2', name: 'Minimalist Smartwatch', sku: 'WEAR-02', price: 8499, stock: 12, category: 'Electronics', status: 'Active', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80' },
      { id: '3', name: 'Ergonomic Office Chair', sku: 'FURN-03', price: 15500, stock: 8, category: 'Furniture', status: 'Active', image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&q=80' },
      { id: '4', name: 'Mechanical Keyboard', sku: 'COMP-04', price: 4200, stock: 150, category: 'Electronics', status: 'Active', image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80' },
      { id: '5', name: 'Ceramic Coffee Mug', sku: 'HOME-05', price: 899, stock: 300, category: 'Home', status: 'Active', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80' }
    ];
    setStorageData(workspaceId, websiteId, 'products', demoProducts);
  }

  const orders = getStorageData(workspaceId, websiteId, 'orders', null);
  if (!orders) {
    const demoOrders = [
      { id: 'ORD-1001', customerName: 'John Doe', total: 12999, status: 'Delivered', date: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'ORD-1002', customerName: 'Jane Smith', total: 8499, status: 'Shipped', date: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'ORD-1003', customerName: 'Alice Johnson', total: 15500, status: 'Processing', date: new Date(Date.now() - 86400000).toISOString() },
      { id: 'ORD-1004', customerName: 'Bob Brown', total: 4200, status: 'Pending', date: new Date().toISOString() },
    ];
    setStorageData(workspaceId, websiteId, 'orders', demoOrders);
  }

  const settings = getStorageData(workspaceId, websiteId, 'settings', null);
  if (!settings) {
    setStorageData(workspaceId, websiteId, 'settings', {
      currency: 'INR',
      currencySymbol: '₹',
      storeName: 'My Awesome Store',
      storeDescription: 'The best place to buy things.',
    });
  }
};
