// storage.js - Centralized E-commerce Data Layer
import api from '../../../../services/api';

// ---- Helpers ----

const getScopedKey = (workspaceId, websiteId, entity) => {
  return `ecommerce_${workspaceId || 'default'}_${websiteId || 'default'}_${entity}`;
};

// Cart scoped by storeId as well for per-store isolation
const getCartScopedKey = (workspaceId, websiteId, storeId) => {
  return `ecommerce_${workspaceId || 'default'}_${websiteId || 'default'}_${storeId || 'default'}_cart`;
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

// Normalize a MongoDB document so id = _id.toString() consistently
const normalizeId = (doc) => {
  if (!doc) return doc;
  const id = (doc._id || doc.id || '').toString();
  return { ...doc, id, _id: id };
};

const normalizeArray = (arr) => (Array.isArray(arr) ? arr.map(normalizeId) : []);

// ---- IndexedDB for templates ----

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

// ---- Products (Backend) — require storeId ----

export const getProducts = async (workspaceId, websiteId, storeId) => {
  if (!websiteId || !storeId) return [];
  try {
    const res = await api.get(`/ecommerce/${websiteId}/${storeId}/products`);
    return normalizeArray(res.data.data);
  } catch (e) {
    console.error('Failed to get products', e);
    return [];
  }
};

export const createProduct = async (workspaceId, websiteId, storeId, productData) => {
  const res = await api.post(`/ecommerce/${websiteId}/${storeId}/products`, productData);
  return normalizeId(res.data.data);
};

export const updateProduct = async (workspaceId, websiteId, storeId, productId, updateData) => {
  const res = await api.put(`/ecommerce/${websiteId}/${storeId}/products/${productId}`, updateData);
  return normalizeId(res.data.data);
};

export const deleteProduct = async (workspaceId, websiteId, storeId, productId) => {
  await api.delete(`/ecommerce/${websiteId}/${storeId}/products/${productId}`);
};

// ---- Orders (Backend) ----

export const getOrders = async (workspaceId, websiteId, storeId) => {
  if (!websiteId || !storeId) return [];
  try {
    const res = await api.get(`/ecommerce/${websiteId}/${storeId}/orders`);
    return normalizeArray(res.data.data);
  } catch (e) {
    console.error('Failed to get orders', e);
    return [];
  }
};

export const updateOrderStatus = async (workspaceId, websiteId, storeId, orderId, status) => {
  // Backend update-order-status endpoint not yet implemented; log and return mock
  console.warn('updateOrderStatus backend endpoint not yet implemented.');
  return { id: orderId, status };
};

// ---- Customers (Backend) ----

export const getCustomers = async (workspaceId, websiteId, storeId) => {
  if (!websiteId || !storeId) return [];
  try {
    const res = await api.get(`/ecommerce/${websiteId}/${storeId}/customers`);
    return normalizeArray(res.data.data);
  } catch (e) {
    console.error('Failed to get customers', e);
    return [];
  }
};

// ---- Payments (Backend) ----

export const getPayments = async (workspaceId, websiteId, storeId) => {
  if (!websiteId || !storeId) return [];
  try {
    const res = await api.get(`/ecommerce/${websiteId}/${storeId}/payments`);
    return normalizeArray(res.data.data);
  } catch (e) {
    console.error('Failed to get payments', e);
    return [];
  }
};

// ---- Shipping (Backend) ----

export const getShipping = async (workspaceId, websiteId, storeId) => {
  if (!websiteId || !storeId) return [];
  try {
    const res = await api.get(`/ecommerce/${websiteId}/${storeId}/shipping`);
    return normalizeArray(res.data.data);
  } catch (e) {
    console.error('Failed to get shipping', e);
    return [];
  }
};

// ---- Settings (Backend) ----

export const getSettings = async (workspaceId, websiteId, storeId) => {
  if (!websiteId || !storeId) {
    return getDefaultSettings();
  }
  try {
    const res = await api.get(`/ecommerce/${websiteId}/${storeId}/settings`);
    return res.data.data;
  } catch (e) {
    console.error('Failed to get settings', e);
    return getDefaultSettings();
  }
};

const getDefaultSettings = () => ({
  storeName: 'My Awesome Store',
  storeDescription: '',
  currency: 'INR',
  currencySymbol: '₹',
  shippingEnabled: true,
  shippingFee: 50,
  primaryColor: '#3b82f6',
  secondaryColor: '#10b981',
  paymentMethods: [{ id: 'COD', name: 'Cash on Delivery', enabled: true }],
  shippingMethods: [{ id: 'standard', name: 'Standard Delivery', price: 50, enabled: true }]
});

// Synchronous settings read from localStorage cache (for currency formatting)
export const getSettingsSync = (workspaceId, websiteId, storeId) => {
  return getStorageData(workspaceId, websiteId, `settings_${storeId}`, getDefaultSettings());
};

export const saveSettings = async (workspaceId, websiteId, storeId, settings) => {
  const res = await api.put(`/ecommerce/${websiteId}/${storeId}/settings`, settings);
  // Cache in localStorage for synchronous access (currency formatting)
  try {
    const key = getScopedKey(workspaceId, websiteId, `settings_${storeId}`);
    localStorage.setItem(key, JSON.stringify(res.data.data));
  } catch (_) {}
  return res.data.data;
};

// ---- Templates (IndexedDB) ----

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
    console.warn('Falling back to localStorage for templates', e);
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
    console.warn('Falling back to localStorage for templates', e);
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

// ---- Cart (localStorage, scoped per store) ----

export const getCart = (workspaceId, websiteId, storeId) => {
  try {
    const key = getCartScopedKey(workspaceId, websiteId, storeId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCart = (workspaceId, websiteId, storeId, cartData) => {
  try {
    const key = getCartScopedKey(workspaceId, websiteId, storeId);
    localStorage.setItem(key, JSON.stringify(cartData));
  } catch (e) {
    console.error('Failed to save cart', e);
  }
};

export const clearCartStorage = (workspaceId, websiteId, storeId) => {
  saveCart(workspaceId, websiteId, storeId, []);
};

// ---- Checkout ----

// Generate a unique idempotency key for a checkout attempt
const generateIdempotencyKey = () => {
  return `idk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const processCheckout = async (workspaceId, websiteId, storeId, customerDetails, cart, paymentMethod, shippingMethodId = null) => {
  if (!websiteId || !storeId) {
    return { success: false, message: 'No active store selected.' };
  }
  try {
    const idempotencyKey = generateIdempotencyKey();
    const payload = {
      customerDetails,
      cart: cart.map(item => ({
        id: item.id || item._id,
        name: item.name,
        quantity: item.quantity
      })),
      paymentMethod,
      shippingMethodId,
      idempotencyKey
    };
    const res = await api.post(`/ecommerce/${websiteId}/${storeId}/checkout`, payload);
    return { success: true, orderId: res.data.orderId, orderNumber: res.data.orderNumber, duplicate: res.data.duplicate };
  } catch (e) {
    console.error('Checkout failed', e);
    const message = e?.response?.data?.message || 'Checkout failed due to a server error.';
    return { success: false, message };
  }
};
