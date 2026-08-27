// analyzer.js - Heuristic template analyzer for e-commerce elements
export const analyzePageSemantics = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const diagnostics = [];
  
  const result = {
    product: {
      container: '',
      image: '',
      title: '',
      price: '',
      salePrice: '',
      oldPrice: '',
      addBtn: '',
      productLink: '',
      description: '',
      category: '',
      rating: ''
    },
    cart: {
      container: '',
      item: '',
      image: '',
      name: '',
      price: '',
      quantityInput: '',
      incrementBtn: '',
      decrementBtn: '',
      lineTotal: '',
      removeBtn: '',
      subtotal: '',
      shipping: '',
      grandTotal: ''
    },
    checkout: {
      form: '',
      firstName: '',
      lastName: '',
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      submitBtn: ''
    },
    confidence: { product: 0, cart: 0, checkout: 0 },
    diagnostics
  };

  const getSelector = (el, stopAt = doc.body) => {
    if (!el || el === doc || el === doc.body || el === doc.documentElement) return '';
    if (el.id) return `#${el.id}`;
    if (el.dataset) {
      const idKeys = Object.keys(el.dataset).filter(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('ref'));
      if (idKeys.length > 0) return `[data-${idKeys[0].replace(/[A-Z]/g, m => "-" + m.toLowerCase())}="${el.dataset[idKeys[0]]}"]`;
    }
    
    // Build path up to a stable parent
    let path = [];
    let current = el;
    while (current && current !== stopAt && current !== doc.body) {
      if (current.id) {
        path.unshift(`#${current.id}`);
        break; // IDs are unique, can stop here
      } else if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ')
          .map(c => c.trim())
          .filter(c => c && !c.includes(':') && !c.match(/^[0-9]/) && !['col', 'row', 'container', 'active', 'show', 'd-flex'].includes(c));
        
        if (classes.length > 0) {
          // Prefer semantic classes
          const semantic = classes.find(c => c.includes('product') || c.includes('cart') || c.includes('item') || c.includes('title') || c.includes('price') || c.includes('img') || c.includes('btn'));
          if (semantic) {
            path.unshift(`.${semantic}`);
          } else {
             path.unshift(`.${classes[0]}`);
          }
        } else {
          path.unshift(current.tagName.toLowerCase());
        }
      } else {
        path.unshift(current.tagName.toLowerCase());
      }
      current = current.parentElement;
    }
    
    if (path.length === 0) return el.tagName.toLowerCase();
    
    // Simplify if too long
    if (path.length > 3) {
       path = [path[0], path[path.length - 2], path[path.length - 1]].filter(Boolean);
    }
    
    const selector = path.join(' ');
    return selector;
  };

  const addDiag = (field, selector, method, confidence) => {
    if(selector) {
      diagnostics.push({ field, selector, method, confidence });
    }
  };

  // --- PRODUCT DETECTOR ---
  const detectProducts = () => {
    const elements = Array.from(doc.querySelectorAll('div, li, article, section'));
    const structureMap = new Map();
    
    elements.forEach(el => {
      if (el.children.length < 2 || el.children.length > 30) return;
      const tagPath = Array.from(el.children).map(c => c.tagName).join('>');
      const classPath = Array.from(el.children).map(c => (c.className || '').toString().split(' ')[0]).join('>');
      const signature = `${el.tagName}:${tagPath}:${classPath}`;
      if (!structureMap.has(signature)) structureMap.set(signature, []);
      structureMap.get(signature).push(el);
    });

    let bestGroup = [];
    let bestScore = 0;
    
    for (const [sig, els] of structureMap.entries()) {
      if (els.length < 2) continue;
      let score = els.length * 0.1;
      const sample = els[0];
      const text = sample.textContent.toLowerCase();
      const html = sample.innerHTML.toLowerCase();
      const cls = (sample.className || '').toString().toLowerCase();
      
      if (cls.includes('product') || cls.includes('item') || cls.includes('card')) score += 2;
      if (sample.querySelector('img') || html.includes('background-image')) score += 1;
      if (text.match(/[\$\£\€\₹]/) || text.match(/\d+(\.\d{2})?\s*(usd|eur|gbp|inr)/i)) score += 1.5;
      if (sample.querySelector('h1, h2, h3, h4, h5, h6')) score += 1;
      if (html.includes('cart') || html.includes('bag') || html.includes('buy')) score += 1.5;
      
      if (score > bestScore) {
        bestScore = score;
        bestGroup = els;
      }
    }

    if (bestGroup.length > 0 && bestScore >= 3) {
      const card = bestGroup[0];
      result.product.container = getSelector(card);
      addDiag('product.container', result.product.container, 'repeated-structure', Math.min(bestScore / 8, 0.98));
      result.confidence.product = Math.min(bestScore / 8, 0.98);

      const img = card.querySelector('img, [class*="img"], [class*="image"], [class*="thumb"]');
      if (img) result.product.image = getSelector(img, card);
      
      const titles = Array.from(card.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .name, .product-title'));
      if (titles.length > 0) result.product.title = getSelector(titles[0], card);
      
      const priceEls = Array.from(card.querySelectorAll('.price, .amount, .cost, [class*="price"]'));
      if (priceEls.length > 0) {
        if(priceEls.length > 1) {
            result.product.oldPrice = getSelector(priceEls[1], card);
            result.product.salePrice = getSelector(priceEls[0], card);
            result.product.price = getSelector(priceEls[0], card);
        } else {
            result.product.price = getSelector(priceEls[0], card);
        }
      } else {
        const allText = Array.from(card.querySelectorAll('span, div, p, strong, b'));
        for(let el of allText) {
            if(el.children.length === 0 && (el.textContent.includes('$') || el.textContent.includes('£') || el.textContent.includes('€') || el.textContent.includes('₹'))) {
                result.product.price = getSelector(el, card);
                break;
            }
        }
      }
      
      const addBtns = Array.from(card.querySelectorAll('button, a, [role="button"]')).filter(el => {
          const txt = el.textContent.toLowerCase();
          const cls = (el.className||'').toString().toLowerCase();
          const href = (el.getAttribute('href')||'').toLowerCase();
          const inHtml = el.innerHTML.toLowerCase();
          return txt.includes('cart') || txt.includes('buy') || txt.includes('add') || 
                 cls.includes('cart') || href.includes('cart') || inHtml.includes('cart') || inHtml.includes('bag') || inHtml.includes('basket');
      });
      if (addBtns.length > 0) {
        result.product.addBtn = getSelector(addBtns[0], card);
      }
    }
  };

  // --- CART DETECTOR ---
  const detectCart = () => {
    let bestCartScore = 0;
    const tables = Array.from(doc.querySelectorAll('table'));
    for (const table of tables) {
        const text = table.textContent.toLowerCase();
        let score = 0;
        if (text.includes('product') || text.includes('item')) score++;
        if (text.includes('price')) score++;
        if (text.includes('quantity') || text.includes('qty')) score++;
        if (text.includes('total')) score++;
        if (text.includes('remove') || text.includes('delete') || text.includes('action')) score++;
        
        if (score > bestCartScore && score >= 2) {
            bestCartScore = score;
            result.cart.container = getSelector(table);
            const itemRow = Array.from(table.querySelectorAll('tbody tr')).find(tr => !tr.querySelector('th') && tr.textContent.trim().length > 0);
            if(itemRow) {
                result.cart.item = getSelector(itemRow, table);
                
                // Extract inner fields
                const qtyInput = itemRow.querySelector('input[type="number"], input[class*="qty"], input[name*="qty"]');
                if(qtyInput) result.cart.quantityInput = getSelector(qtyInput, itemRow);
                
                const removeBtns = Array.from(itemRow.querySelectorAll('button, a')).filter(el => {
                    const txt = el.textContent.toLowerCase();
                    const cls = (el.className || '').toString().toLowerCase();
                    return txt.includes('×') || txt.includes('remove') || txt.includes('delete') || cls.includes('remove') || cls.includes('delete');
                });
                if(removeBtns.length > 0) result.cart.removeBtn = getSelector(removeBtns[0], itemRow);
                
                const totals = Array.from(itemRow.querySelectorAll('td, span, p')).filter(el => {
                    const txt = el.textContent.trim();
                    return txt.match(/^[\$\£\€\₹]?\s*\d+(\.\d{2})?\s*[\$\£\€\₹]?$/) && !el.querySelector('input');
                });
                if(totals.length > 1) { // Assuming first is price, last is total
                    result.cart.price = getSelector(totals[0], itemRow);
                    result.cart.lineTotal = getSelector(totals[totals.length-1], itemRow);
                }
            }
            result.confidence.cart = Math.min(score / 5, 0.95);
        }
    }
    
    if (bestCartScore < 2) {
        const containers = Array.from(doc.querySelectorAll('.cart, .cart-container, .shopping-cart, #cart'));
        if(containers.length > 0) {
            const container = containers[0];
            result.cart.container = getSelector(container);
            const items = Array.from(container.querySelectorAll('.cart-item, .item, [class*="item"]'));
            if (items.length > 0) result.cart.item = getSelector(items[0], container);
            result.confidence.cart = 0.8;
        }
    }
  };

  // --- CHECKOUT DETECTOR ---
  const detectCheckout = () => {
    let forms = Array.from(doc.querySelectorAll('form'));
    let bestForm = null;
    let bestScore = 0;
    
    if (forms.length === 0) forms = Array.from(doc.querySelectorAll('.checkout-form, .billing-details, #checkout'));
    
    for (const form of forms) {
        const text = form.textContent.toLowerCase();
        let score = 0;
        const inputs = form.querySelectorAll('input, select, textarea');
        score += inputs.length * 0.1;
        if (text.includes('billing')) score += 1;
        if (text.includes('shipping')) score += 1;
        if (text.includes('name') && text.includes('email') && text.includes('address')) score += 2;
        if (form.className && typeof form.className === 'string' && form.className.toLowerCase().includes('checkout')) score += 2;
        
        if (score > bestScore && inputs.length >= 3) {
            bestScore = score;
            bestForm = form;
        }
    }
    
    if (bestForm) {
        result.checkout.form = getSelector(bestForm);
        result.confidence.checkout = Math.min(bestScore / 6, 0.95);
        
        const inputs = Array.from(bestForm.querySelectorAll('input, select, textarea'));
        inputs.forEach(input => {
           const name = (input.name || '').toLowerCase();
           const id = (input.id || '').toLowerCase();
           const placeholder = (input.placeholder || '').toLowerCase();
           const type = (input.type || '').toLowerCase();
           
           let labelText = '';
           if(id) {
               const label = doc.querySelector(`label[for="${id}"]`);
               if(label) labelText = label.textContent.toLowerCase();
           }
           if(!labelText && input.parentElement && input.parentElement.tagName === 'LABEL') {
               labelText = input.parentElement.textContent.toLowerCase();
           }
           
           const combined = `${name} ${id} ${placeholder} ${labelText}`.trim();
           const selector = getSelector(input, bestForm);
           
           if(combined.includes('first') && combined.includes('name')) result.checkout.firstName = selector;
           else if(combined.includes('last') && combined.includes('name')) result.checkout.lastName = selector;
           else if((combined.includes('full') && combined.includes('name')) || name === 'name') result.checkout.fullName = selector;
           else if(combined.includes('email') || type === 'email') result.checkout.email = selector;
           else if(combined.includes('phone') || combined.includes('mobile') || type === 'tel') result.checkout.phone = selector;
           else if(combined.includes('address') || combined.includes('street')) result.checkout.address = selector;
           else if(combined.includes('city') || combined.includes('town')) result.checkout.city = selector;
           else if(combined.includes('state') || combined.includes('province')) result.checkout.state = selector;
           else if(combined.includes('country') || combined.includes('nation')) result.checkout.country = selector;
           else if(combined.includes('zip') || combined.includes('postal')) result.checkout.postalCode = selector;
        });
        
        const submitBtns = Array.from(bestForm.querySelectorAll('button, input[type="submit"], a')).filter(el => {
            const txt = (el.value || el.textContent || '').toLowerCase();
            return txt.includes('place order') || txt.includes('checkout') || txt.includes('confirm') || txt.includes('submit') || el.type === 'submit';
        });
        if(submitBtns.length > 0) result.checkout.submitBtn = getSelector(submitBtns[0], bestForm);
    }
  };

  detectProducts();
  detectCart();
  detectCheckout();

  return result;
};

// Backward compatible export for existing EcommerceStoreBuilder
export const analyzePageElements = (html) => {
    const semantics = analyzePageSemantics(html);
    return {
        ...semantics,
        header: '',
        footer: '',
        productGrid: '',
        productCard: semantics.product.container,
        productImage: semantics.product.image,
        productName: semantics.product.title,
        productPrice: semantics.product.price,
        salePrice: semantics.product.salePrice,
        productDescription: semantics.product.description,
        productLink: semantics.product.productLink,
        addBtn: semantics.product.addBtn,
        cartContainer: semantics.cart.container,
        cartItem: semantics.cart.item,
        cartTotal: '', 
        checkoutForm: semantics.checkout.form,
        checkoutSummary: ''
    };
};
