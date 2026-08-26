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
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          e.preventDefault();
          // Let the parent router handle this via context or custom event
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
