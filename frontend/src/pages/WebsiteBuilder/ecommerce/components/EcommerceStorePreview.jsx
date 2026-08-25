import React, { useState, useEffect } from 'react';
import { Button, Drawer, Badge, List, Typography, Divider, message, Space } from 'antd';
import { ShoppingCart, X, CreditCard, ArrowRight } from 'lucide-react';
import { getStorageData, setStorageData } from '../utils/storage';
import { formatCurrency } from '../utils/currency';

const { Title, Text } = Typography;

const EcommerceStorePreview = ({ templateId }) => {
  const [template, setTemplate] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: 'Demo User', email: 'demo@example.com', address: '123 Test St' });
  
  const workspaceId = 'default';
  const websiteId = 'default';

  useEffect(() => {
    // Load template
    const templates = getStorageData(workspaceId, websiteId, 'templates', {});
    const activeTemplate = templates[templateId] || { html: '<div>No template found. Please build one first.</div>', css: '', mapping: {} };
    setTemplate(activeTemplate);

    // Load products
    const storeProducts = getStorageData(workspaceId, websiteId, 'products', []);
    setProducts(storeProducts.filter(p => p.status === 'Active'));
  }, [templateId]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    message.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = 50; // Demo static fee
  const finalTotal = cartTotal > 0 ? cartTotal + shippingFee : 0;

  const handleCheckout = () => {
    if (cart.length === 0) return message.warning('Cart is empty');

    // Create Order
    const newOrder = {
      id: `ORD-${Date.now()}`,
      customerName: customerDetails.name,
      customerEmail: customerDetails.email,
      shippingAddress: customerDetails.address,
      items: cart,
      subtotal: cartTotal,
      shippingFee,
      total: finalTotal,
      status: 'Pending',
      date: new Date().toISOString()
    };

    const existingOrders = getStorageData(workspaceId, websiteId, 'orders', []);
    setStorageData(workspaceId, websiteId, 'orders', [newOrder, ...existingOrders]);

    // Reduce Stock
    const allProducts = getStorageData(workspaceId, websiteId, 'products', []);
    const updatedProducts = allProducts.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });
    setStorageData(workspaceId, websiteId, 'products', updatedProducts);

    message.success(`Order ${newOrder.id} placed successfully!`);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  // Runtime Renderer
  // In a real implementation, this would parse template.html and replace node contents based on template.mapping
  // For the MVP showcase, we render a simulated layout.
  
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
      {/* Fake Store Header */}
      <header style={{ background: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Title level={4} style={{ margin: 0 }}>My Awesome Store</Title>
        <Badge count={cart.length} showZero>
          <Button icon={<ShoppingCart size={20} />} onClick={() => setIsCartOpen(true)}>Cart</Button>
        </Badge>
      </header>

      {/* Dynamic Product Grid */}
      <main style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 32 }}>Featured Products</Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {products.map(product => (
            <div key={product.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ height: 200, background: '#eee', backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ padding: 20 }}>
                <Title level={5} style={{ margin: '0 0 8px' }}>{product.name}</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{product.category}</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(product.price, workspaceId, websiteId)}</span>
                  <Button type="primary" onClick={() => addToCart(product)}>Add to Cart</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer */}
      <Drawer
        title="Your Cart"
        placement="right"
        onClose={() => setIsCartOpen(false)}
        open={isCartOpen}
        width={400}
      >
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">Your cart is empty.</Text></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <List
                itemLayout="horizontal"
                dataSource={cart}
                renderItem={item => (
                  <List.Item
                    actions={[<Button type="text" danger icon={<X size={16} />} onClick={() => removeFromCart(item.id)} />]}
                  >
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Subtotal</Text>
                <Text strong>{formatCurrency(cartTotal, workspaceId, websiteId)}</Text>
              </div>
              <Button type="primary" block size="large" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}>
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Checkout Drawer */}
      <Drawer
        title="Checkout"
        placement="right"
        onClose={() => setIsCheckoutOpen(false)}
        open={isCheckoutOpen}
        width={400}
      >
        <Title level={5}>Order Summary</Title>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text>Subtotal ({cart.length} items)</Text>
          <Text>{formatCurrency(cartTotal, workspaceId, websiteId)}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text>Shipping</Text>
          <Text>{formatCurrency(shippingFee, workspaceId, websiteId)}</Text>
        </div>
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>Total</Title>
          <Title level={4} style={{ margin: 0 }}>{formatCurrency(finalTotal, workspaceId, websiteId)}</Title>
        </div>

        <Title level={5} style={{ marginTop: 32 }}>Shipping Details (Demo)</Title>
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <Text strong style={{ display: 'block' }}>{customerDetails.name}</Text>
          <Text style={{ display: 'block' }}>{customerDetails.email}</Text>
          <Text style={{ display: 'block' }}>{customerDetails.address}</Text>
        </div>

        <Title level={5}>Payment Method (Demo)</Title>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <Button icon={<CreditCard size={16} />} style={{ flex: 1 }}>Card</Button>
          <Button style={{ flex: 1 }}>UPI</Button>
          <Button style={{ flex: 1 }}>COD</Button>
        </div>

        <Button type="primary" block size="large" onClick={handleCheckout} style={{ height: 50, fontSize: 16 }}>
          Place Order <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </Button>
      </Drawer>
    </div>
  );
};

export default EcommerceStorePreview;
