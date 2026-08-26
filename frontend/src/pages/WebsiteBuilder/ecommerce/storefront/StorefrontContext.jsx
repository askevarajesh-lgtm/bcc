import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTemplates, getProducts, getSettings, getCart, saveCart } from '../utils/storage';
import { useEcommerce } from '../contexts/EcommerceContext';

const StorefrontContext = createContext();

export const StorefrontProvider = ({ children, templateId }) => {
  const { workspaceId, websiteId } = useEcommerce();
  const [template, setTemplate] = useState(null);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [cart, setCart] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(() => {
    return sessionStorage.getItem(`storefront_page_${workspaceId}_${websiteId}_${templateId}`) || '';
  });
  const [selectedProductId, setSelectedProductId] = useState(() => {
    return sessionStorage.getItem(`storefront_product_${workspaceId}_${websiteId}_${templateId}`) || null;
  });

  useEffect(() => {
    if (currentPageId) sessionStorage.setItem(`storefront_page_${workspaceId}_${websiteId}_${templateId}`, currentPageId);
    if (selectedProductId) sessionStorage.setItem(`storefront_product_${workspaceId}_${websiteId}_${templateId}`, selectedProductId);
  }, [currentPageId, selectedProductId, workspaceId, websiteId, templateId]);

  useEffect(() => {
    if (!workspaceId || !websiteId) return;

    const loadStore = async () => {
      const templates = await getTemplates(workspaceId, websiteId);
      const activeTemplate = templates[templateId] || Object.values(templates)[0];

      if (activeTemplate && activeTemplate.pages && !sessionStorage.getItem(`storefront_page_${workspaceId}_${websiteId}_${templateId}`)) {
        setTemplate(activeTemplate);
        let startPage = Object.keys(activeTemplate.pages).find(k => k.toLowerCase().includes('index'))
          || Object.keys(activeTemplate.pages)[0];
        setCurrentPageId(startPage || '');
      } else if (activeTemplate) {
        setTemplate(activeTemplate);
      }

      const storeProducts = await getProducts(workspaceId, websiteId);
      setProducts(storeProducts.filter(p => p.status === 'Active'));

      const storeSettings = await getSettings(workspaceId, websiteId);
      setSettings(storeSettings);

      const savedCart = getCart(workspaceId, websiteId);
      setCart(savedCart || []);
    };

    loadStore();
  }, [templateId, workspaceId, websiteId]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      let newCart;
      const pid = product._id || product.id;
      const existing = prev.find(item => (item._id || item.id) === pid);
      if (existing) {
        if (existing.quantity + quantity > product.stock) {
          return prev; // Not enough stock (should be handled by caller visually)
        }
        newCart = prev.map(item => (item._id || item.id) === pid ? { ...item, quantity: item.quantity + quantity } : item);
      } else {
        if (product.stock < quantity) return prev;
        newCart = [...prev, { ...product, id: pid, _id: pid, quantity }];
      }
      saveCart(workspaceId, websiteId, newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = prev.filter(item => (item._id || item.id) !== productId);
      saveCart(workspaceId, websiteId, newCart);
      return newCart;
    });
  };

  const updateQty = (productId, quantity) => {
    setCart(prev => {
      const newCart = prev.map(item => (item._id || item.id) === productId ? { ...item, quantity } : item);
      saveCart(workspaceId, websiteId, newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    saveCart(workspaceId, websiteId, []);
  };

  const navigateTo = (pageId, productId = null) => {
    if (template?.pages?.[pageId]) {
      setCurrentPageId(pageId);
    }
    if (productId) {
      setSelectedProductId(productId);
    }
  };

  return (
    <StorefrontContext.Provider value={{
      template,
      products,
      settings,
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      currentPageId,
      navigateTo,
      selectedProductId,
      setSelectedProductId,
      workspaceId,
      websiteId
    }}>
      {children}
    </StorefrontContext.Provider>
  );
};

export const useStorefront = () => useContext(StorefrontContext);
