import React, { useState } from 'react';
import { Drawer, Badge, List, Button, Typography, Space } from 'antd';
import { ShoppingCart } from 'lucide-react';
import { StorefrontProvider, useStorefront } from './StorefrontContext';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import StorefrontPage from './pages/StorefrontPage';
import { formatCurrency } from '../utils/currency';
import { useParams } from 'react-router-dom';

const { Text } = Typography;

const StorefrontRendererContent = () => {
  const { template, currentPageId, cart, workspaceId, websiteId, navigateTo } = useStorefront();
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);

  // Intercept navigation events emitted by StorefrontPage
  React.useEffect(() => {
    const handleNavigate = (e) => {
      const href = e.detail || '';
      const lowerHref = href.toLowerCase();
      const pages = Object.values(template?.pages || {});
      
      // Dynamically resolve Cart navigation
      if (lowerHref.includes('cart') || lowerHref === 'cart') {
        const cartPage = pages.find(p => 
          String(p.role || '').toLowerCase() === 'cart' ||
          String(p.name || '').toLowerCase().includes('cart') ||
          String(p.filename || '').toLowerCase().includes('cart')
        );
        if (cartPage) {
          return navigateTo(cartPage.id || Object.keys(template.pages).find(k => template.pages[k] === cartPage));
        } else {
          console.warn('Storefront navigation: Cart page not found in template. Falling back to Quick Cart Drawer.');
          setIsCheckoutDrawerOpen(true);
          return;
        }
      }
      
      // Dynamically resolve Checkout navigation
      if (lowerHref.includes('checkout') || lowerHref === 'checkout') {
        const checkoutPage = pages.find(p => 
          String(p.role || '').toLowerCase() === 'checkout' ||
          String(p.name || '').toLowerCase().includes('checkout') ||
          String(p.filename || '').toLowerCase().includes('checkout')
        );
        if (checkoutPage) {
          return navigateTo(checkoutPage.id || Object.keys(template.pages).find(k => template.pages[k] === checkoutPage));
        } else {
          console.warn('Storefront navigation: Checkout page not found in template');
        }
      }

      // Strip leading ./ and # hashes to find the page ID
      const targetPath = href.replace(/^\.\//, '').split('#')[0];
      if (template?.pages?.[targetPath]) {
        navigateTo(targetPath);
      }
    };
    window.addEventListener('storefront_navigate', handleNavigate);
    return () => window.removeEventListener('storefront_navigate', handleNavigate);
  }, [template, navigateTo]);

  if (!template) {
    return <div style={{ padding: 40, textAlign: 'center' }}>No template active.</div>;
  }

  const page = template.pages[currentPageId];
  if (!page) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Page not found.</div>;
  }

  let PageComponent = null;

  if (page.role === 'Product Listing') {
    PageComponent = <ProductListPage />;
  } else if (page.role === 'Product Detail') {
    PageComponent = <ProductDetailPage />;
  } else if (page.role === 'Cart') {
    PageComponent = <CartPage />;
  } else if (page.role === 'Checkout') {
    PageComponent = <CheckoutPage />;
  } else {
    // Generic page
    PageComponent = <StorefrontPage page={page} assets={template.assets} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1e293b', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>React Storefront Preview</Text>
          <Text style={{ color: '#94a3b8' }}>{page?.name} ({currentPageId})</Text>
        </Space>
        <Space>
          <Badge count={cart.length} showZero>
            <Button size="small" type="primary" onClick={() => setIsCheckoutDrawerOpen(true)}>
              <ShoppingCart size={14} style={{ marginRight: 8 }} />
              Quick Cart Drawer
            </Button>
          </Badge>
        </Space>
      </div>

      <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        {PageComponent}
      </div>

      <Drawer
        title="Quick Cart"
        placement="right"
        onClose={() => setIsCheckoutDrawerOpen(false)}
        open={isCheckoutDrawerOpen}
        width={350}
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
                  <List.Item>
                    <List.Item.Meta
                      avatar={<img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover' }} />}
                      title={item.name}
                      description={`${formatCurrency(item.price, workspaceId, websiteId)} x ${item.quantity}`}
                    />
                  </List.Item>
                )}
              />
            </div>
            <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Button 
                block 
                style={{ marginBottom: 8 }} 
                onClick={() => {
                  const cartPageId = Object.keys(template.pages).find(k => template.pages[k].role === 'Cart');
                  if (cartPageId) navigateTo(cartPageId);
                  setIsCheckoutDrawerOpen(false);
                }}
              >
                View Cart
              </Button>
              <Button 
                type="primary" 
                block 
                onClick={() => {
                  const checkoutPageId = Object.keys(template.pages).find(k => template.pages[k].role === 'Checkout');
                  if (checkoutPageId) navigateTo(checkoutPageId);
                  setIsCheckoutDrawerOpen(false);
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

const StorefrontRenderer = ({ templateId: propTemplateId }) => {
  const { templateId: paramTemplateId } = useParams();
  const targetTemplateId = paramTemplateId || propTemplateId;

  return (
    <StorefrontProvider templateId={targetTemplateId}>
      <StorefrontRendererContent />
    </StorefrontProvider>
  );
};

export default StorefrontRenderer;
