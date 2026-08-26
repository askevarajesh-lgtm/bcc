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
      const href = e.detail;
      // Strip leading ./ and # hashes to find the page ID
      const targetPath = href.replace(/^\.\//, '').split('#')[0];
      if (template.pages[targetPath]) {
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
