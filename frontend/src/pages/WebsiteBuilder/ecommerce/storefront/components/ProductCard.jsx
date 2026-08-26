import React, { useEffect, useRef, useMemo } from 'react';
import { useStorefront } from '../StorefrontContext';
import { formatCurrency } from '../../utils/currency';

const ProductCard = ({ product, templateHtml, mapping }) => {
  const { addToCart, navigateTo, workspaceId, websiteId, storeId } = useStorefront();
  const containerRef = useRef(null);

  // Parse template and inject product data into the original DOM structure
  const processedHtml = useMemo(() => {
    if (!templateHtml) return '';
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(templateHtml, 'text/html');
    const cardEl = doc.body.firstElementChild;
    if (!cardEl) return '';

    // Inject Image
    // Safely target all img tags, plus any specific mapped elements (which might be divs using background-image)
    const imgEls = Array.from(cardEl.querySelectorAll('img'));
    let mappedEls = [];
    if (mapping?.productImage) {
      mappedEls = Array.from(cardEl.querySelectorAll(mapping.productImage));
    }
    
    // Use a Set to ensure unique elements
    const allImageTargets = new Set([...imgEls, ...mappedEls]);
    
    allImageTargets.forEach(el => {
      if (product.image) {
        if (el.tagName === 'IMG') {
          el.src = product.image;
          el.alt = product.name || 'Product';
          el.removeAttribute('srcset'); // Clear lazy load sets
          el.removeAttribute('data-src'); 
          
          // Enforce consistent image sizing so cards align perfectly in the grid
          el.style.width = '100%';
          el.style.aspectRatio = '1 / 1';
          el.style.objectFit = 'cover';
        } else {
          el.style.backgroundImage = `url(${product.image})`;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.style.width = '100%';
          el.style.aspectRatio = '1 / 1';
        }
      }
    });

    // Inject Name
    let nameEls = [];
    if (mapping?.productName) nameEls = Array.from(cardEl.querySelectorAll(mapping.productName));
    if (nameEls.length === 0) nameEls = Array.from(cardEl.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .name'));
    
    nameEls.forEach(el => {
      el.textContent = product.name;
      // Enforce consistent text height (truncate at 2 lines)
      el.style.display = '-webkit-box';
      el.style.webkitLineClamp = '2';
      el.style.webkitBoxOrient = 'vertical';
      el.style.overflow = 'hidden';
      el.style.textOverflow = 'ellipsis';
      // Ensure min-height so 1-line text takes the same space as 2-line text if needed? 
      // Usually flexbox handles that, but clamping is enough for most templates.
    });

    // Inject Price
    let priceEls = [];
    if (mapping?.productPrice) priceEls = Array.from(cardEl.querySelectorAll(mapping.productPrice));
    if (priceEls.length === 0) priceEls = Array.from(cardEl.querySelectorAll('.price, .amount'));
    
    const displayPrice = product.salePrice ? product.salePrice : product.price;
    priceEls.forEach(el => {
      el.textContent = formatCurrency(displayPrice, workspaceId, websiteId, storeId);
    });

    // Adjust Add to Cart button if out of stock
    if (mapping?.addBtn) {
      const btnEls = cardEl.querySelectorAll(mapping.addBtn);
      btnEls.forEach(el => {
        // Tag it so we can find it easily for event binding
        el.setAttribute('data-ecommerce-action', 'add-to-cart');
        if (product.stock <= 0) {
          el.textContent = 'Out of Stock';
          el.style.opacity = '0.5';
          el.style.cursor = 'not-allowed';
          el.disabled = true; // if it's a button
        }
      });
    }

    // Tag the card itself for navigation
    cardEl.setAttribute('data-ecommerce-action', 'view-product');

    return cardEl.outerHTML;
  }, [templateHtml, mapping, product, workspaceId, websiteId, storeId]);

  // Bind native event listeners to the injected HTML
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e) => {
      // Check if clicked element or its parent is the Add to Cart button
      const addBtn = e.target.closest('[data-ecommerce-action="add-to-cart"]');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock > 0) {
          addToCart(product);
        }
        return;
      }

      // Check if clicked element or its parent is the product card link
      const viewBtn = e.target.closest('[data-ecommerce-action="view-product"]');
      if (viewBtn) {
        e.preventDefault();
        e.stopPropagation();
        navigateTo(null, product.id || product._id);
      }
    };

    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [product, addToCart, navigateTo]);

  if (!processedHtml) return null;

  return (
    <div 
      ref={containerRef}
      style={{ display: 'contents' }} 
      dangerouslySetInnerHTML={{ __html: processedHtml }} 
    />
  );
};

export default ProductCard;
