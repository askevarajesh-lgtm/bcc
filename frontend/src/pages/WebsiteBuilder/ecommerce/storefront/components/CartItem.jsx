import React, { useEffect, useRef, useMemo } from 'react';
import { useStorefront } from '../StorefrontContext';
import { formatCurrency } from '../../utils/currency';

const CartItem = ({ item, templateHtml }) => {
  const { updateQty, removeFromCart, workspaceId, websiteId, storeId } = useStorefront();
  const containerRef = useRef(null);

  // Parse template and inject cart item data into the original DOM structure
  const processedHtml = useMemo(() => {
    if (!templateHtml) return '';
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(templateHtml, 'text/html');
    const itemEl = doc.body.firstElementChild;
    if (!itemEl) return '';

    // The cart item template likely has elements we can guess by content or class.
    // For a generic approach without explicit mappings, we look for common classes or tags.
    // E-commerce templates often use .product-thumbnail, .product-name, .product-price, .product-quantity, .product-remove
    
    const imgEls = itemEl.querySelectorAll('img, [class*="thumb"], [class*="img"]');
    imgEls.forEach(img => {
      if (img.tagName === 'IMG') {
        img.src = item.image || '';
        img.alt = item.name;
      }
    });

    // Name
    const nameEls = itemEl.querySelectorAll('[class*="name"], [class*="title"], h1, h2, h3, h4, h5, a');
    if (nameEls.length > 0) {
      nameEls[0].textContent = item.name;
    } else {
      // fallback: just find the first text node that isn't a price/qty
      const tds = itemEl.querySelectorAll('td');
      if (tds.length >= 2) tds[1].textContent = item.name;
    }

    // Price
    const priceEls = itemEl.querySelectorAll('[class*="price"]');
    if (priceEls.length > 0) {
      priceEls[0].textContent = formatCurrency(item.price, workspaceId, websiteId, storeId);
      if (priceEls.length > 1) { // Maybe subtotal is the second one
        priceEls[1].textContent = formatCurrency(item.price * item.quantity, workspaceId, websiteId, storeId);
      }
    }

    // Quantity Input
    const inputEls = itemEl.querySelectorAll('input[type="number"], input[name="quantity"], [class*="qty"] input');
    inputEls.forEach(input => {
      if (input.tagName === 'INPUT') {
        input.value = item.quantity;
        input.max = item.stock;
        input.min = 1;
        input.setAttribute('data-cart-action', 'update-qty');
      }
    });

    // Remove Button
    const removeEls = itemEl.querySelectorAll('[class*="remove"], [class*="delete"], .btn-remove');
    removeEls.forEach(btn => {
      btn.setAttribute('data-cart-action', 'remove');
    });

    // Inject item ID for event delegation if needed, though we use ref here.
    itemEl.setAttribute('data-cart-item-id', item.id);
    
    // We will extract innerHTML and attributes to avoid the <div> wrapper issue
    const attrs = {};
    Array.from(itemEl.attributes).forEach(attr => {
      if (attr.name === 'class') attrs.className = attr.value;
      else if (attr.name !== 'style') attrs[attr.name] = attr.value;
    });

    return {
      tagName: itemEl.tagName.toLowerCase(),
      innerHtml: itemEl.innerHTML,
      attrs
    };
  }, [templateHtml, item, workspaceId, websiteId, storeId]);

  // Bind native event listeners to the injected HTML
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e) => {
      const removeBtn = e.target.closest('[data-cart-action="remove"]');
      if (removeBtn) {
        e.preventDefault();
        e.stopPropagation();
        removeFromCart(item.id);
      }
    };

    const handleChange = (e) => {
      const input = e.target.closest('[data-cart-action="update-qty"]');
      if (input) {
        const val = parseInt(input.value, 10);
        if (val > 0) {
          updateQty(item.id, val);
        }
      }
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('change', handleChange); // input event better for number inputs
    container.addEventListener('input', handleChange);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('change', handleChange);
      container.removeEventListener('input', handleChange);
    };
  }, [item, removeFromCart, updateQty]);

  if (!processedHtml) return null;

  const Wrapper = processedHtml.tagName;
  const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  const isVoid = voidElements.includes(Wrapper);

  if (isVoid) {
    return (
      <Wrapper 
        ref={containerRef}
        {...processedHtml.attrs}
      />
    );
  }

  return (
    <Wrapper 
      ref={containerRef}
      {...processedHtml.attrs}
      dangerouslySetInnerHTML={{ __html: processedHtml.innerHtml }} 
    />
  );
};

export default CartItem;
