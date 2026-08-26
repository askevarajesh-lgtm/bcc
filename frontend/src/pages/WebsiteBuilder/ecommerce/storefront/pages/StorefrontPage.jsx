import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveAssetUrls } from '../../utils/zipExtractor';

const StorefrontPage = ({ page, assets, children, portalSelector }) => {
  const containerRef = useRef(null);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (!page || !assets || !containerRef.current) return;
    
    // Resolve assets
    const html = resolveAssetUrls(page.html, assets);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // If we have a specific portal target, find it and mark it
    let targetEl = portalSelector ? doc.querySelector(portalSelector) : null;
    
    // Fallback: If grid was not found, but a card was mapped, try to use the card's parent as the grid
    if (!targetEl && page.mapping?.productCard) {
      const cardEl = doc.querySelector(page.mapping.productCard);
      if (cardEl) {
        let current = cardEl;
        let levels = 0;
        // Traverse up to find the column wrapper. Stop when parent has multiple children or is a known grid wrapper.
        // NEVER traverse into BODY or HTML.
        while (
          current.parentElement && 
          current.parentElement.tagName !== 'BODY' &&
          current.parentElement.tagName !== 'HTML' &&
          current.parentElement.children.length === 1 && 
          (!current.parentElement.className || (typeof current.parentElement.className === 'string' && !current.parentElement.className.includes('row') && !current.parentElement.className.includes('grid'))) &&
          levels < 3
        ) {
          current = current.parentElement;
          levels++;
        }
        // The parent of the column wrapper is the grid container!
        targetEl = current.parentElement;
        
        // Safety check: Never wipe the entire body or html
        if (!targetEl || targetEl.tagName === 'BODY' || targetEl.tagName === 'HTML') {
          targetEl = current;
        }
      }
    }
    
    if (targetEl) {
      targetEl.innerHTML = '';
      targetEl.setAttribute('id', 'storefront-react-portal');
    }
    
    // Inject the HTML
    containerRef.current.innerHTML = doc.documentElement.innerHTML;
    
    if (targetEl) {
      const mountedTarget = containerRef.current.querySelector('#storefront-react-portal');
      setPortalTarget(mountedTarget);
    }
  }, [page, assets, portalSelector]);

  // Handle internal navigation clicks (just like original preview did)
  useEffect(() => {
    const handleClick = (e) => {
      // Find the closest actionable element
      const actionable = e.target.closest('a, button, [role="button"], [data-cart], [class*="cart"], [id*="cart"]');
      
      if (!actionable) return;
      
      const text = (actionable.textContent || '').toLowerCase().trim();
      // Let Add to Cart buttons be handled by their respective click handlers (e.g., ProductCard)
      if (text.includes('add to cart') || actionable.closest('[data-ecommerce-action="add-to-cart"]')) {
        return;
      }

      const href = actionable.getAttribute('href') || '';
      const className = (actionable.className || '').toString().toLowerCase();
      const id = (actionable.id || '').toLowerCase();
      
      const isCartUrl = [
        'cart.html', './cart.html', '/cart.html', '#cart', 
        'cart', 'shopping-cart', 'shopping_cart', 'basket', '#shopping-cart'
      ].includes(href.toLowerCase());

      const cartKeywords = ['cart', 'shopping-cart', 'shopping_cart', 'basket', 'view cart', 'cart icon', 'shopping bag'];
      const hasCartClassOrId = cartKeywords.some(kw => className.includes(kw) || id.includes(kw));
      const hasCartText = cartKeywords.some(kw => text === kw);
      
      // If it looks like a cart click, dispatch navigation
      if (isCartUrl || hasCartClassOrId || hasCartText) {
         e.preventDefault();
         e.stopPropagation();
         window.dispatchEvent(new CustomEvent('storefront_navigate', { detail: 'cart' }));
         return;
      }

      // Check for checkout clicks
      const isCheckoutUrl = [
        'checkout.html', './checkout.html', '/checkout.html', '#checkout', 
        'checkout'
      ].includes(href.toLowerCase());
      const hasCheckoutText = text === 'checkout';

      if (isCheckoutUrl || hasCheckoutText) {
         e.preventDefault();
         e.stopPropagation();
         window.dispatchEvent(new CustomEvent('storefront_navigate', { detail: 'checkout' }));
         return;
      }
      
      // Fallback for regular links
      if (actionable.tagName === 'A') {
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('storefront_navigate', { detail: href }));
        }
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleClick);
    }
    return () => {
      if (container) {
        container.removeEventListener('click', handleClick);
      }
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="storefront-page-wrapper" />
      {portalTarget && children ? createPortal(children, portalTarget) : null}
      {!portalTarget && children}
    </>
  );
};

export default StorefrontPage;
