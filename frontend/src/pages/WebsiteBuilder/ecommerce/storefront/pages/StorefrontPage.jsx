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
    if (portalSelector) {
      const targetEl = doc.querySelector(portalSelector);
      if (targetEl) {
        targetEl.innerHTML = '';
        targetEl.setAttribute('id', 'storefront-react-portal');
      }
    }
    
    // Inject the HTML
    containerRef.current.innerHTML = doc.documentElement.innerHTML;
    
    if (portalSelector) {
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
      {!portalSelector && children}
    </>
  );
};

export default StorefrontPage;
