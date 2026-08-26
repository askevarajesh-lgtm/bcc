import React, { useEffect, useState } from 'react';
import StorefrontPage from './StorefrontPage';
import CartItem from '../components/CartItem';
import { useStorefront } from '../StorefrontContext';
import { formatCurrency } from '../../utils/currency';

const CartPage = () => {
  const { template, currentPageId, cart, workspaceId, websiteId } = useStorefront();
  const page = template?.pages?.[currentPageId];
  
  if (!page) return null;

  const modifiedPage = { ...page };
  const parser = new DOMParser();
  const doc = parser.parseFromString(page.html, 'text/html');
  
  let itemTemplateHtml = '<tr></tr>';
  
  if (page.mapping) {
    const { cartContainer, cartItem, cartTotal } = page.mapping;
    if (cartContainer && cartItem) {
      const cartEl = doc.querySelector(cartContainer);
      if (cartEl) {
        const itemTemplate = cartEl.querySelector(cartItem);
        if (itemTemplate) {
          itemTemplateHtml = itemTemplate.outerHTML;
          const parentEl = itemTemplate.parentElement;
          if (parentEl) {
            parentEl.innerHTML = '';
            parentEl.setAttribute('id', 'storefront-react-cart-list');
          }
        }
      }
    }
    if (cartTotal) {
      const totalEl = doc.querySelector(cartTotal);
      if (totalEl) {
        totalEl.innerHTML = '';
        totalEl.setAttribute('id', 'storefront-react-cart-total');
      }
    }
  }

  modifiedPage.html = doc.documentElement.innerHTML;
  
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <StorefrontPage page={modifiedPage} assets={template.assets}>
      {/* We need to inject portals manually because StorefrontPage only supports one portal target by default,
          but here we'll use a hack to render the total if we need it. 
          Actually, since StorefrontPage renders children, we can use React Portals directly inside the children. */}
      <CartListPortal cart={cart} itemTemplateHtml={itemTemplateHtml} />
      <CartTotalPortal total={total} workspaceId={workspaceId} websiteId={websiteId} />
    </StorefrontPage>
  );
};

const CartListPortal = ({ cart, itemTemplateHtml }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;
  const target = document.getElementById('storefront-react-cart-list');
  if (!target) return null;

  return require('react-dom').createPortal(
    <>
      {cart.length === 0 ? (
        <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center' }}>Your cart is empty.</td></tr>
      ) : (
        cart.map(item => <CartItem key={item.id} item={item} templateHtml={itemTemplateHtml} />)
      )}
    </>,
    target
  );
};

const CartTotalPortal = ({ total, workspaceId, websiteId }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;
  const target = document.getElementById('storefront-react-cart-total');
  if (!target) return null;

  return require('react-dom').createPortal(
    <>{formatCurrency(total, workspaceId, websiteId)}</>,
    target
  );
};

export default CartPage;
