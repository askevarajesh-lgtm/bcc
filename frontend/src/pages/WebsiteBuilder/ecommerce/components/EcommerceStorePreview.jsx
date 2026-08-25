import React, { useState, useEffect, useRef } from 'react';
import { Button, Drawer, Badge, List, Typography, Divider, message, Space, Input, Form, Select } from 'antd';
import { ShoppingCart, X, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { getStorageData, processCheckout } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import { resolveAssetUrls } from '../utils/zipExtractor';

import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;

const EcommerceStorePreview = ({ templateId: propTemplateId }) => {
  const { templateId: paramTemplateId } = useParams();
  const [template, setTemplate] = useState(null);
  const [currentPageId, setCurrentPageId] = useState('');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: 'Demo User', email: 'demo@example.com', address: '123 Test St' });
  const [paymentMethod, setPaymentMethod] = useState('Card');
  
  const containerRef = useRef(null);
  const workspaceId = 'default';
  const websiteId = 'default';

  useEffect(() => {
    const templates = getStorageData(workspaceId, websiteId, 'templates', {});
    const targetTemplateId = paramTemplateId || propTemplateId || Object.keys(templates)[0];
    const activeTemplate = templates[targetTemplateId];
    
    if (activeTemplate && activeTemplate.pages) {
      setTemplate(activeTemplate);
      // Try to find index/home
      let startPage = Object.keys(activeTemplate.pages).find(k => k.toLowerCase().includes('index')) 
                   || Object.keys(activeTemplate.pages)[0];
      setCurrentPageId(startPage || '');
    }

    const storeProducts = getStorageData(workspaceId, websiteId, 'products', []);
    setProducts(storeProducts.filter(p => p.status === 'Active'));
  }, [paramTemplateId, propTemplateId]);

  useEffect(() => {
    if (!template || !currentPageId || !template.pages[currentPageId]) return;
    
    const page = template.pages[currentPageId];
    let html = resolveAssetUrls(page.html, template.assets || {});

    // Parse and dynamically map products if they exist
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (page.mapping) {
      // Very basic dynamic injection based on mapping
      const { productGrid, productCard, productImage, productName, productPrice, addBtn } = page.mapping;
      
      if (productGrid && productCard) {
        const gridEl = doc.querySelector(productGrid);
        if (gridEl) {
          const cardTemplate = gridEl.querySelector(productCard);
          if (cardTemplate) {
            // Remove existing static cards
            gridEl.innerHTML = '';
            
            // Generate dynamic cards
            products.forEach(product => {
              const cardClone = cardTemplate.cloneNode(true);
              
              if (productImage) {
                const imgEl = cardClone.querySelector(productImage);
                if (imgEl) imgEl.src = product.image || '';
              }
              if (productName) {
                const nameEl = cardClone.querySelector(productName);
                if (nameEl) nameEl.textContent = product.name;
              }
              if (productPrice) {
                const priceEl = cardClone.querySelector(productPrice);
                if (priceEl) priceEl.textContent = formatCurrency(product.price, workspaceId, websiteId);
              }
              if (addBtn) {
                const btnEl = cardClone.querySelector(addBtn);
                if (btnEl) {
                  btnEl.setAttribute('data-add-product', product.id);
                  btnEl.style.cursor = 'pointer';
                }
              }
              
              gridEl.appendChild(cardClone);
            });
          }
        }
      }
    }

    setRenderedHtml(doc.documentElement.outerHTML);
  }, [currentPageId, template, products]);

  useEffect(() => {
    // Attach event listeners to the rendered template
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e) => {
      // Handle Add to Cart
      const addBtn = e.target.closest('[data-add-product]');
      if (addBtn) {
        e.preventDefault();
        const productId = addBtn.getAttribute('data-add-product');
        const product = products.find(p => p.id === productId);
        if (product) {
          setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
              if (existing.quantity >= product.stock) {
                message.warning('Not enough stock!');
                return prev;
              }
              return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            if (product.stock < 1) {
              message.warning('Out of stock!');
              return prev;
            }
            return [...prev, { ...product, quantity: 1 }];
          });
          message.success(`${product.name} added to cart`);
        }
        return;
      }

      // Handle Internal Navigation
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          e.preventDefault();
          // Normalize relative paths like ./cart.html to cart.html
          let targetPath = href.replace(/^\.\//, '').split('#')[0];
          
          if (template && template.pages[targetPath]) {
            setCurrentPageId(targetPath);
          } else {
            console.log("Navigating to unmatched route:", href);
          }
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [renderedHtml, template, products]);

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQ = item.quantity + delta;
        if (product && newQ > product.stock) {
          message.warning('Not enough stock!');
          return item;
        }
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = 50;
  const finalTotal = cartTotal > 0 ? cartTotal + shippingFee : 0;

  const doCheckout = () => {
    if (cart.length === 0) return message.warning('Cart is empty');
    
    const result = processCheckout(workspaceId, websiteId, customerDetails, cart, paymentMethod);
    
    if (result.success) {
      message.success(`Order ${result.orderId} placed successfully!`);
      setCart([]);
      setIsCheckoutDrawerOpen(false);
      
      // Reload products to get updated stock
      const storeProducts = getStorageData(workspaceId, websiteId, 'products', []);
      setProducts(storeProducts.filter(p => p.status === 'Active'));
    } else {
      message.error(result.message);
    }
  };

  const page = template?.pages?.[currentPageId];
  const isCartRole = page?.role === 'Cart';
  const isCheckoutRole = page?.role === 'Checkout';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Store Preview Toolbar */}
      <div style={{ background: '#1e293b', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Store Preview</Text>
          <Text style={{ color: '#94a3b8' }}>{page?.name} ({currentPageId})</Text>
        </Space>
        <Space>
          <Badge count={cart.length} showZero>
            <Button size="small" type="primary" onClick={() => setIsCheckoutDrawerOpen(true)}>
              Cart Checkout Demo
            </Button>
          </Badge>
        </Space>
      </div>

      {/* Dynamic Content */}
      <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        {!template ? (
          <div style={{ padding: 40, textAlign: 'center' }}>No template active.</div>
        ) : (
          <div ref={containerRef} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        )}
      </div>

      {/* For MVP Checkout Drawer is a reliable fallback for actual cart/checkout data simulation */}
      <Drawer
        title="Checkout System (Application Overlay)"
        placement="right"
        onClose={() => setIsCheckoutDrawerOpen(false)}
        open={isCheckoutDrawerOpen}
        width={450}
      >
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Your cart is empty.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <List
                itemLayout="horizontal"
                dataSource={cart}
                renderItem={item => (
                  <List.Item actions={[<Button type="text" danger icon={<X size={16} />} onClick={() => removeFromCart(item.id)} />]}>
                    <List.Item.Meta
                      avatar={<img src={item.image} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
                      title={item.name}
                      description={
                        <Space>
                          <span>{formatCurrency(item.price, workspaceId, websiteId)}</span>
                          <Space style={{ marginLeft: 16 }}>
                            <Button size="small" onClick={() => updateQuantity(item.id, -1)}>-</Button>
                            <span>{item.quantity}</span>
                            <Button size="small" onClick={() => updateQuantity(item.id, 1)}>+</Button>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
              <Form layout="vertical">
                <Form.Item label="Name"><Input value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} /></Form.Item>
                <Form.Item label="Email"><Input value={customerDetails.email} onChange={e => setCustomerDetails({...customerDetails, email: e.target.value})} /></Form.Item>
                <Form.Item label="Payment Method">
                  <Select value={paymentMethod} onChange={setPaymentMethod}>
                    <Select.Option value="Card">Card</Select.Option>
                    <Select.Option value="UPI">UPI</Select.Option>
                    <Select.Option value="COD">Cash on Delivery</Select.Option>
                  </Select>
                </Form.Item>
              </Form>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Total</Title>
                <Title level={4} style={{ margin: 0 }}>{formatCurrency(finalTotal, workspaceId, websiteId)}</Title>
              </div>
              <Button type="primary" block size="large" onClick={doCheckout}>Place Order</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EcommerceStorePreview;
