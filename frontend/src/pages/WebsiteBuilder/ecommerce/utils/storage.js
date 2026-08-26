// storage.js - Centralized E-commerce Data Layer
import api from '../../../../services/api';

const getScopedKey = (workspaceId, websiteId, entity) => {
  if (!workspaceId || !websiteId) {
    console.warn("storage.js: Missing workspaceId or websiteId! Falling back to 'default'.");
  }
  return `ecommerce_${workspaceId || 'default'}_${websiteId || 'default'}_${entity}`;
};

export const getStorageData = (workspaceId, websiteId, entity, defaultValue = []) => {
  try {
    const key = getScopedKey(workspaceId, websiteId, entity);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${entity} from localStorage`, error);
    return defaultValue;
  }
};

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EcommerceStoreDB', 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('templates');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const setStorageData = (workspaceId, websiteId, entity, data) => {
  try {
    const key = getScopedKey(workspaceId, websiteId, entity);
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('ecommerce_data_updated', {
      detail: { workspaceId, websiteId, entity }
    }));
  } catch (error) {
    console.error(`Error writing ${entity} to localStorage`, error);
  }
};

// --- Products (Backend) ---
export const getProducts = async (workspaceId, websiteId) => {
  try {
    const res = await api.get(`/ecommerce/${websiteId}/products`);
    return res.data.data;
  } catch (e) {
    console.error('Failed to get products', e);
    return [];
  }
};

export const createProduct = async (workspaceId, websiteId, productData) => {
  try {
    const res = await api.post(`/ecommerce/${websiteId}/products`, productData);
    return res.data.data;
  } catch (e) {
    console.error('Failed to create product', e);
    throw e;
  }
};

export const updateProduct = async (workspaceId, websiteId, productId, updateData) => {
  try {
    const res = await api.put(`/ecommerce/${websiteId}/products/${productId}`, updateData);
    return res.data.data;
  } catch (e) {
    console.error('Failed to update product', e);
    throw e;
  }
};

export const deleteProduct = async (workspaceId, websiteId, productId) => {
  try {
    await api.delete(`/ecommerce/${websiteId}/products/${productId}`);
  } catch (e) {
    console.error('Failed to delete product', e);
    throw e;
  }
};

// --- Orders (Backend) ---
export const getOrders = async (workspaceId, websiteId) => {
  try {
    const res = await api.get(`/ecommerce/${websiteId}/orders`);
    return res.data.data;
  } catch (e) {
    console.error('Failed to get orders', e);
    return [];
  }
};

export const updateOrderStatus = async (workspaceId, websiteId, orderId, status) => {
  // Not implemented in backend yet, doing a mock success for admin UI
  console.warn('updateOrderStatus backend endpoint missing. Status update not saved to DB.');
  return { id: orderId, status };
};

// --- Customers (Backend) ---
export const getCustomers = async (workspaceId, websiteId) => {
  try {
    const res = await api.get(`/ecommerce/${websiteId}/customers`);
    return res.data.data;
  } catch (e) {
    console.error('Failed to get customers', e);
    return [];
  }
};

// --- Payments (Backend) ---
export const getPayments = async (workspaceId, websiteId) => {
  try {
    const res = await api.get(`/ecommerce/${websiteId}/payments`);
    return res.data.data;
  } catch (e) {
    console.error('Failed to get payments', e);
    return [];
  }
};

// --- Shipping (Backend) ---
export const getShipping = async (workspaceId, websiteId) => {
  try {
    const res = await api.get(`/ecommerce/${websiteId}/shipping`);
    return res.data.data;
  } catch (e) {
    console.error('Failed to get shipping', e);
    return [];
  }
};

// --- Templates (Async IndexedDB) ---
export const getTemplates = async (workspaceId, websiteId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['templates'], 'readonly');
      const store = transaction.objectStore('templates');
      const key = getScopedKey(workspaceId, websiteId, 'templates');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || {});
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Falling back to localStorage for templates", e);
    return getStorageData(workspaceId, websiteId, 'templates', {});
  }
};

export const saveTemplate = async (workspaceId, websiteId, templateId, templateData) => {
  const templates = await getTemplates(workspaceId, websiteId);
  templates[templateId] = templateData;
  try {
    const db = await initDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(['templates'], 'readwrite');
      const store = transaction.objectStore('templates');
      const key = getScopedKey(workspaceId, websiteId, 'templates');
      const request = store.put(templates, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Falling back to localStorage for templates", e);
    setStorageData(workspaceId, websiteId, 'templates', templates);
  }
};

export const updateTemplate = async (workspaceId, websiteId, templateId, updateData) => {
  const templates = await getTemplates(workspaceId, websiteId);
  if (templates[templateId]) {
    templates[templateId] = { ...templates[templateId], ...updateData, updatedAt: new Date().toISOString() };
    try {
      const db = await initDB();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(['templates'], 'readwrite');
        const store = transaction.objectStore('templates');
        const request = store.put(templates, getScopedKey(workspaceId, websiteId, 'templates'));
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      setStorageData(workspaceId, websiteId, 'templates', templates);
    }
  }
};

export const deleteTemplate = async (workspaceId, websiteId, templateId) => {
  const templates = await getTemplates(workspaceId, websiteId);
  delete templates[templateId];
  try {
    const db = await initDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(['templates'], 'readwrite');
      const store = transaction.objectStore('templates');
      const request = store.put(templates, getScopedKey(workspaceId, websiteId, 'templates'));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    setStorageData(workspaceId, websiteId, 'templates', templates);
  }
};

// --- Cart (Local Storage) ---
export const getCart = (workspaceId, websiteId) => getStorageData(workspaceId, websiteId, 'cart', []);
export const saveCart = (workspaceId, websiteId, cartData) => setStorageData(workspaceId, websiteId, 'cart', cartData);
export const clearCart = (workspaceId, websiteId) => setStorageData(workspaceId, websiteId, 'cart', []);

// --- Settings (Backend) ---
export const getSettings = async (workspaceId, websiteId) => {
  try {
    const res = await api.get(`/ecommerce/${websiteId}/settings`);
    return res.data.data;
  } catch (e) {
    console.error('Failed to get settings', e);
    return {
      storeName: 'My Awesome Store',
      storeDescription: '',
      currency: 'INR',
      currencySymbol: '₹',
      shippingEnabled: true,
      shippingFee: 50,
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      paymentMethods: [
        { id: 'COD', name: 'Cash on Delivery', enabled: true }
      ],
      shippingMethods: [
        { id: 'standard', name: 'Standard Delivery', price: 50, enabled: true }
      ]
    };
  }
};

export const saveSettings = async (workspaceId, websiteId, settings) => {
  try {
    const res = await api.put(`/ecommerce/${websiteId}/settings`, settings);
    return res.data.data;
  } catch (e) {
    console.error('Failed to save settings', e);
    throw e;
  }
};


// --- Checkout Process (Backend) ---
export const processCheckout = async (workspaceId, websiteId, customerDetails, cart, paymentMethod, shippingMethodId = null) => {
  try {
    const payload = {
      customerDetails,
      cart,
      paymentMethod,
      shippingMethodId
    };
    const res = await api.post(`/ecommerce/${websiteId}/checkout`, payload);
    return { success: true, orderId: res.data.orderId, order: res.data.orderId };
  } catch (e) {
    console.error('Checkout failed', e);
    if (e.response && e.response.data && e.response.data.message) {
      return { success: false, message: e.response.data.message };
    }
    return { success: false, message: 'Checkout failed due to a server error.' };
  }
};
