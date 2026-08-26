import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import StorefrontPage from './StorefrontPage';
import CartItem from '../components/CartItem';
import { useStorefront } from '../StorefrontContext';
import { formatCurrency } from '../../utils/currency';

const CartPage = () => {
  const { template, currentPageId, cart, workspaceId, websiteId, storeId } = useStorefront();
  const page = template?.pages?.[currentPageId];
  
  const { modifiedPage, itemTemplateHtml } = useMemo(() => {
    if (!page) return { modifiedPage: null, itemTemplateHtml: '' };

    const modPage = { ...page };
    const parser = new DOMParser();
    const doc = parser.parseFromString(page.html, 'text/html');
    
    let itemTemplateHtml = '<tr></tr>';
    let itemTemplate = null;
    let mountParent = null;
    
    // 1. Try explicit mapping first
    if (page.mapping) {
      const { cartContainer, cartItem } = page.mapping;
      if (cartContainer && cartItem) {
        const container = doc.querySelector(cartContainer);
        if (container) {
          itemTemplate = container.querySelector(cartItem);
          if (itemTemplate) mountParent = itemTemplate.parentElement;
        }
      }
    }

    // 2. Fallback: search for table-based cart
    if (!itemTemplate) {
      const tables = Array.from(doc.querySelectorAll('table'));
      for (const table of tables) {
        const text = table.textContent.toLowerCase();
        if (text.includes('product') && text.includes('price') && (text.includes('quantity') || text.includes('qty'))) {
          const tbody = table.querySelector('tbody') || table;
          const rows = Array.from(tbody.querySelectorAll('tr'));
          const itemRow = rows.find(r => !r.querySelector('th'));
          
          mountParent = tbody;
          if (itemRow) {
            itemTemplate = itemRow;
          } else {
            // Found cart table but no rows (empty raw template)
            const tr = doc.createElement('tr');
            tr.innerHTML = `
              <td class="product-name" style="padding: 15px;">Product</td>
              <td class="product-price" style="padding: 15px;">$0.00</td>
              <td class="product-quantity" style="padding: 15px;"><input type="number" value="1" min="1" style="width:60px" /></td>
              <td class="product-subtotal" style="padding: 15px;">$0.00</td>
              <td class="product-remove" style="padding: 15px;"><button class="btn-remove">X</button></td>
            `;
            tbody.appendChild(tr);
            itemTemplate = tr;
          }
          break;
        }
      }
    }

    // 3. Fallback: search for div-based grid cart
    if (!itemTemplate) {
      const allDivs = Array.from(doc.querySelectorAll('div, section, ul'));
      for (const div of allDivs) {
        // Look for the header row
        const text = div.textContent.toLowerCase().replace(/\s+/g, ' ');
        if (text.includes('product') && text.includes('price') && (text.includes('quantity') || text.includes('qty')) && text.length < 200) {
          let next = div.nextElementSibling;
          mountParent = div.parentElement;
          if (next && (next.tagName === 'DIV' || next.tagName === 'LI' || next.tagName === 'ARTICLE')) {
            itemTemplate = next;
          } else {
            // Found header but no items
            const fallbackDiv = doc.createElement('div');
            fallbackDiv.style.display = 'flex';
            fallbackDiv.style.justifyContent = 'space-between';
            fallbackDiv.style.padding = '15px 0';
            fallbackDiv.style.borderBottom = '1px solid #eee';
            fallbackDiv.innerHTML = `
              <div class="product-name" style="flex:2">Product</div>
              <div class="product-price" style="flex:1">$0.00</div>
              <div class="product-quantity" style="flex:1"><input type="number" value="1" min="1" style="width:60px" /></div>
              <div class="product-subtotal" style="flex:1">$0.00</div>
              <div class="product-remove"><button class="btn-remove">X</button></div>
            `;
            if (div.nextSibling) {
              mountParent.insertBefore(fallbackDiv, div.nextSibling);
            } else {
              mountParent.appendChild(fallbackDiv);
            }
            itemTemplate = fallbackDiv;
          }
          break;
        }
      }
    }

    if (itemTemplate && mountParent) {
      itemTemplateHtml = itemTemplate.outerHTML;
      
      const mountPoint = doc.createElement(itemTemplate.tagName === 'TR' ? 'tbody' : 'div');
      mountPoint.id = 'storefront-react-cart-list';
      if (mountPoint.tagName === 'DIV') mountPoint.style.display = 'contents';
      
      mountParent.insertBefore(mountPoint, itemTemplate);
      
      // Remove placeholder items (assume siblings with the same tag are also items)
      let current = itemTemplate;
      let count = 0;
      while (current && current.tagName === itemTemplate.tagName && count < 10) {
        let next = current.nextElementSibling;
        // Safety check: don't remove totals if they happen to share the same tag name and parent
        if (current.textContent.toLowerCase().includes('total')) break;
        current.remove();
        current = next;
        count++;
      }
    }

    // 4. Find Totals heuristically to mark them for native DOM updates
    let totalEls = [];
    if (page.mapping && page.mapping.cartTotal) {
      const el = doc.querySelector(page.mapping.cartTotal);
      if (el) totalEls.push(el);
    }

    if (totalEls.length === 0) {
      const allEls = Array.from(doc.querySelectorAll('td, span, div, strong, b, p, h3, h4'));
      for (const el of allEls) {
        const text = el.textContent.toLowerCase().trim();
        if (text === 'total' || text === 'grand total' || text === 'sub total' || text === 'subtotal') {
          // Check next sibling
          let next = el.nextElementSibling;
          if (next && next.textContent.match(/[\$\£\€\₹]/)) {
            totalEls.push(next);
          } else if (el.parentElement && el.parentElement.nextElementSibling) {
            let parentNext = el.parentElement.nextElementSibling;
            if (parentNext.textContent.match(/[\$\£\€\₹]/)) {
              totalEls.push(parentNext);
            }
          }
        }
      }
    }

    totalEls.forEach(el => {
      el.setAttribute('data-cart-total-node', 'true');
    });

    modPage.html = doc.documentElement.innerHTML;
    return { modifiedPage: modPage, itemTemplateHtml };
  }, [page]);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Native DOM update for totals to prevent wiping the DOM with re-renders
  useEffect(() => {
    const totalNodes = document.querySelectorAll('[data-cart-total-node="true"]');
    totalNodes.forEach(node => {
      node.textContent = formatCurrency(total, workspaceId, websiteId, storeId);
    });
  }, [total, workspaceId, websiteId, storeId]);

  const { navigateTo } = useStorefront();
  
  // Intercept Proceed to Checkout button clicks on the Cart Page
  useEffect(() => {
    const handleCheckoutClick = (e) => {
      const btn = e.target.closest('a, button');
      if (btn) {
        const text = btn.textContent.toLowerCase();
        const href = btn.getAttribute('href') || '';
        if (text.includes('checkout') || href.toLowerCase().includes('checkout')) {
          e.preventDefault();
          e.stopPropagation();
          const checkoutPageId = Object.keys(template.pages).find(k => template.pages[k].role === 'Checkout');
          if (checkoutPageId) {
            navigateTo(checkoutPageId);
          } else {
            console.warn('Checkout page not found in template');
          }
        }
      }
    };
    
    document.addEventListener('click', handleCheckoutClick, true); // use capture phase to override default links
    return () => document.removeEventListener('click', handleCheckoutClick, true);
  }, [template, navigateTo]);

  if (!modifiedPage) return null;

  return (
    <StorefrontPage page={modifiedPage} assets={template.assets}>
      <CartListPortal cart={cart} itemTemplateHtml={itemTemplateHtml} />
    </StorefrontPage>
  );
};

const CartListPortal = ({ cart, itemTemplateHtml }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;
  const target = document.getElementById('storefront-react-cart-list');
  if (!target) return null;

  return createPortal(
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

export default CartPage;
