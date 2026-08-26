import React, { useState, useEffect, useRef } from 'react';
import { Button, Drawer, Badge, List, Typography, Divider, message, Space, Input, Form, Select } from 'antd';
import { ShoppingCart, X, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { getTemplates, getProducts, processCheckout } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import { resolveAssetUrls } from '../utils/zipExtractor';
import { useEcommerce } from '../contexts/EcommerceContext';

import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;

const EcommerceStorePreview = ({ templateId: propTemplateId }) => {
  const { templateId: paramTemplateId } = useParams();
  const [template, setTemplate] = useState(null);
  const [currentPageId, setCurrentPageId] = useState('');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  
  const containerRef = useRef(null);
  const { workspaceId, websiteId } = useEcommerce();

  useEffect(() => {
    if (!workspaceId || !websiteId) return;
    
    const loadStore = async () => {
      const templates = await getTemplates(workspaceId, websiteId);
      const targetTemplateId = paramTemplateId || propTemplateId || Object.keys(templates)[0];
      const activeTemplate = templates[targetTemplateId];
      
      if (activeTemplate && activeTemplate.pages) {
        setTemplate(activeTemplate);
        // Try to find index/home
        let startPage = Object.keys(activeTemplate.pages).find(k => k.toLowerCase().includes('index')) 
                     || Object.keys(activeTemplate.pages)[0];
        setCurrentPageId(startPage || '');
      }

      const storeProducts = await getProducts(workspaceId, websiteId);
      setProducts(storeProducts.filter(p => p.status === 'Active'));
      
      const savedCart = await import('../utils/storage').then(m => m.getCart(workspaceId, websiteId));
      setCart(savedCart || []);
    };
    
    loadStore();
  }, [paramTemplateId, propTemplateId, workspaceId, websiteId]);

  useEffect(() => {
    if (!template || !currentPageId || !template.pages[currentPageId]) return;
    
    const page = template.pages[currentPageId];
    let html = resolveAssetUrls(page.html, template.assets || {});

    // Parse and dynamically map products if they exist
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (page.mapping) {
      const { 
        productGrid, productCard, productImage, productName, productPrice, addBtn, 
        cartContainer, cartItem, cartTotal, checkoutForm
      } = page.mapping;
      
      // 1. PRODUCT GRID INJECTION
      if (productGrid && productCard) {
        const gridEl = doc.querySelector(productGrid);
        if (gridEl) {
          const cardTemplate = gridEl.querySelector(productCard);
          if (cardTemplate) {
            gridEl.innerHTML = '';
            products.forEach(product => {
              const cardClone = cardTemplate.cloneNode(true);
              
              if (productImage) {
                const imgEl = cardClone.querySelector(productImage);
                if (imgEl) imgEl.src = product.image || '';
              }
              if (productName) {
                const nameEl = cardClone.querySelector(productName);
                if (nameEl) nameEl.textContent = product.name;
              }
              if (productPrice) {
                const priceEl = cardClone.querySelector(productPrice);
                if (priceEl) priceEl.textContent = formatCurrency(product.price, workspaceId, websiteId);
              }
              if (addBtn) {
                const btnEl = cardClone.querySelector(addBtn);
                if (btnEl) {
                  btnEl.setAttribute('data-add-product', product.id);
                  btnEl.style.cursor = 'pointer';
                }
              }
              
              // Attach product ID to the card itself for routing to detail page
              cardClone.setAttribute('data-product-id', product.id);
              cardClone.style.cursor = 'pointer';

              gridEl.appendChild(cardClone);
            });
          }
        }
      }

      // 1.5 PRODUCT DETAIL INJECTION
      if (page.role === 'Product Detail' && selectedProductId) {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
          if (productImage) {
            const imgEls = doc.querySelectorAll(productImage);
            imgEls.forEach(img => img.src = product.image || '');
          }
          if (productName) {
            const nameEls = doc.querySelectorAll(productName);
            nameEls.forEach(el => el.textContent = product.name);
          }
          if (productPrice) {
            const priceEls = doc.querySelectorAll(productPrice);
            priceEls.forEach(el => el.textContent = formatCurrency(product.price, workspaceId, websiteId));
          }
          // Also try to find description
          const descEl = doc.querySelector('.product-description, #description, [class*="desc"]');
          if (descEl && product.description) {
            descEl.textContent = product.description;
          }
          if (addBtn) {
            const btnEls = doc.querySelectorAll(addBtn);
            btnEls.forEach(btn => {
              btn.setAttribute('data-add-product', product.id);
              btn.style.cursor = 'pointer';
            });
          }
          
          // Quantity input
          const qtyInput = doc.querySelector('input[type="number"], .qty, [name="quantity"]');
          if (qtyInput) {
            qtyInput.setAttribute('data-detail-qty', 'true');
            qtyInput.value = 1;
            qtyInput.min = 1;
            qtyInput.max = product.stock;
          }
        }
      }

      // 2. CART INJECTION
      if (page.role === 'Cart' && cartContainer && cartItem) {
        const cartEl = doc.querySelector(cartContainer);
        if (cartEl) {
          const itemTemplate = cartEl.querySelector(cartItem);
          if (itemTemplate) {
            // Find parent to append to (often tbody)
            const parentEl = itemTemplate.parentElement;
            parentEl.innerHTML = '';
            
            let total = 0;
            if (cart.length === 0) {
              parentEl.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Your cart is empty.</td></tr>';
            } else {
              cart.forEach(item => {
                total += item.price * item.quantity;
                const clone = itemTemplate.cloneNode(true);
                
                // Try to map item details (very basic heuristic mapping for the cart template)
                const img = clone.querySelector('img');
                if (img) img.src = item.image;
                
                // Name
                const textNodes = Array.from(clone.querySelectorAll('*')).filter(el => el.children.length === 0 && el.textContent.trim().length > 0);
                if (textNodes.length > 0) textNodes[0].textContent = item.name;
                
                // Price
                const priceEls = Array.from(clone.querySelectorAll('*')).filter(el => el.textContent.includes('$') || el.textContent.includes('£') || el.textContent.includes('€') || el.textContent.includes('₹') || el.classList.contains('price'));
                if (priceEls.length > 0) priceEls[0].textContent = formatCurrency(item.price, workspaceId, websiteId);
                
                // Quantity input
                const qtyInput = clone.querySelector('input[type="number"], .qty');
                if (qtyInput) {
                  qtyInput.value = item.quantity;
                  qtyInput.setAttribute('data-cart-qty-id', item.id);
                }

                // Remove btn
                const rmBtn = clone.querySelector('.remove, .delete, a[href*="remove"]');
                if (rmBtn) {
                  rmBtn.setAttribute('data-remove-cart', item.id);
                  rmBtn.removeAttribute('href');
                  rmBtn.style.cursor = 'pointer';
                }
                
                parentEl.appendChild(clone);
              });
            }
            
            if (cartTotal) {
              const totalEl = doc.querySelector(cartTotal);
              if (totalEl) totalEl.textContent = formatCurrency(total, workspaceId, websiteId);
            }
          }
        }
      }

      // 3. CHECKOUT FORM INJECTION
      if (page.role === 'Checkout' && checkoutForm) {
        const formEl = doc.querySelector(checkoutForm);
        if (formEl) {
          formEl.setAttribute('data-checkout-form', 'true');
          // Add a submit handler interceptor
          const submitBtn = formEl.querySelector('button[type="submit"], input[type="submit"], .place-order, #place_order');
          if (submitBtn) {
            submitBtn.setAttribute('data-checkout-submit', 'true');
          }
        }
      }
    }

    setRenderedHtml(doc.documentElement.outerHTML);
  }, [currentPageId, template, products, cart, workspaceId, websiteId]);

  useEffect(() => {
    // Attach event listeners to the rendered template
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e) => {
      // Handle Add to Cart
      const addBtn = e.target.closest('[data-add-product]');
      if (addBtn) {
        e.preventDefault();
        const productId = addBtn.getAttribute('data-add-product');
        const product = products.find(p => p.id === productId);
        if (product) {
          // Check for quantity override from detail page
          const detailQtyEl = document.querySelector('[data-detail-qty="true"]');
          let qtyToAdd = 1;
          if (detailQtyEl) {
             qtyToAdd = parseInt(detailQtyEl.value, 10) || 1;
          }

          setCart(prev => {
            let newCart;
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
              if (existing.quantity + qtyToAdd > product.stock) {
                message.warning('Not enough stock!');
                return prev;
              }
              newCart = prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item);
            } else {
              if (product.stock < qtyToAdd) {
                message.warning('Out of stock!');
                return prev;
              }
              newCart = [...prev, { ...product, quantity: qtyToAdd }];
            }
            import('../utils/storage').then(m => m.saveCart(workspaceId, websiteId, newCart));
            return newCart;
          });
          message.success(`${product.name} added to cart`);
        }
        return;
      }

      // Handle Remove from cart
      const rmBtn = e.target.closest('[data-remove-cart]');
      if (rmBtn) {
        e.preventDefault();
        const id = rmBtn.getAttribute('data-remove-cart');
        setCart(prev => {
          const newCart = prev.filter(item => item.id !== id);
          import('../utils/storage').then(m => m.saveCart(workspaceId, websiteId, newCart));
          return newCart;
        });
        return;
      }

      // Handle Product Detail Navigation
      const productCard = e.target.closest('[data-product-id]');
      if (productCard && !e.target.closest('[data-add-product]')) {
        const link = e.target.closest('a');
        if (link) e.preventDefault();
        
        const productId = productCard.getAttribute('data-product-id');
        setSelectedProductId(productId);
        
        // Find product detail page
        if (template && template.pages) {
          const detailPage = Object.values(template.pages).find(p => p.role === 'Product Detail');
          if (detailPage) {
            setCurrentPageId(detailPage.id);
            return;
          }
        }
      }

      // Handle Internal Navigation
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          e.preventDefault();
          let targetPath = href.replace(/^\.\//, '').split('#')[0];
          
          if (template && template.pages[targetPath]) {
            setCurrentPageId(targetPath);
          } else {
            console.log("Navigating to unmatched route:", href);
          }
        }
      }
    };

    const handleChange = (e) => {
      if (e.target.matches('[data-cart-qty-id]')) {
        const id = e.target.getAttribute('data-cart-qty-id');
        const val = parseInt(e.target.value, 10);
        if (val > 0) {
          const product = products.find(p => p.id === id);
          if (product && val > product.stock) {
            message.warning('Not enough stock!');
            e.target.value = product.stock;
            return;
          }
          setCart(prev => {
            const newCart = prev.map(item => item.id === id ? { ...item, quantity: val } : item);
            import('../utils/storage').then(m => m.saveCart(workspaceId, websiteId, newCart));
            return newCart;
          });
        }
      }
    };

    const handleSubmit = async (e) => {
      if (e.target.matches('[data-checkout-form]')) {
        e.preventDefault();
        if (cart.length === 0) {
          message.warning('Cart is empty');
          return;
        }

        // Extremely basic extraction of form data for MVP
        const formData = new FormData(e.target);
        const customerDetails = {
          name: formData.get('name') || formData.get('first_name') || 'Demo User',
          email: formData.get('email') || formData.get('billing_email') || 'demo@example.com',
          address: formData.get('address') || formData.get('billing_address_1') || '123 Test St'
        };
        const paymentMethod = formData.get('payment_method') || 'Card';

        const result = await processCheckout(workspaceId, websiteId, customerDetails, cart, paymentMethod);
        
        if (result.success) {
          message.success(`Order ${result.orderId} placed successfully!`);
          setCart([]);
          
          // Try navigating to a success page or home
          const successPage = Object.values(template.pages).find(p => p.role === 'Success' || p.fileName.includes('success'));
          if (successPage) {
            setCurrentPageId(successPage.id);
          } else {
            setCurrentPageId(Object.keys(template.pages)[0]); // Go home
          }
          
          // Reload products
          const storeProducts = await getProducts(workspaceId, websiteId);
          setProducts(storeProducts.filter(p => p.status === 'Active'));
        } else {
          message.error(result.message);
        }
      }
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('change', handleChange);
    container.addEventListener('submit', handleSubmit);
    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('change', handleChange);
      container.removeEventListener('submit', handleSubmit);
    };
  }, [renderedHtml, template, products, cart, workspaceId, websiteId]);

  const page = template?.pages?.[currentPageId];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1e293b', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Store Preview</Text>
          <Text style={{ color: '#94a3b8' }}>{page?.name} ({currentPageId})</Text>
        </Space>
        <Space>
          <Badge count={cart.length} showZero>
            <Button size="small" type="primary" onClick={() => setIsCheckoutDrawerOpen(true)}>
              Quick Cart Drawer
            </Button>
          </Badge>
        </Space>
      </div>

      <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        {!template ? (
          <div style={{ padding: 40, textAlign: 'center' }}>No template active.</div>
        ) : (
          <div ref={containerRef} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        )}
      </div>

      {/* Fallback Quick Cart Drawer */}
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

export default EcommerceStorePreview;
