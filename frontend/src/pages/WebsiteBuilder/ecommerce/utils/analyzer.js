// analyzer.js - Heuristic template analyzer for e-commerce elements

export const analyzePageElements = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const mappings = {
    header: '',
    footer: '',
    productGrid: '',
    productCard: '',
    productImage: '',
    productName: '',
    productPrice: '',
    salePrice: '',
    productDescription: '',
    productLink: '',
    addBtn: '',
    cartContainer: '',
    cartItem: '',
    cartTotal: '',
    checkoutForm: '',
    checkoutSummary: ''
  };

  // Safe selector generator that avoids overly broad class matches
  const getSelector = (el) => {
    if (!el) return '';
    if (el.id) return `#${el.id}`;
    if (el.dataset) {
      const dataAttr = Object.keys(el.dataset).find(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('ref'));
      if (dataAttr) return `[data-${dataAttr.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}="${el.dataset[dataAttr]}"]`;
    }
    if (el.className) {
      const classes = el.className.split(' ').filter(c => c && !c.includes(':') && !c.match(/^[0-9]/));
      if (classes.length > 0) {
        // Find a specific-sounding class if possible
        const specificClass = classes.find(c => c.includes('product') || c.includes('cart') || c.includes('checkout') || c.includes('item') || c.includes('price') || c.includes('title'));
        if (specificClass) return `.${specificClass}`;
        return `.${classes.join('.')}`;
      }
    }
    return el.tagName.toLowerCase();
  };

  // 1. Header & Footer
  const headerEl = doc.querySelector('header, .site-header, .header, #header, [data-gjs-type="header"]');
  if (headerEl) mappings.header = getSelector(headerEl);

  const footerEl = doc.querySelector('footer, .site-footer, .footer, #footer, [data-gjs-type="footer"]');
  if (footerEl) mappings.footer = getSelector(footerEl);

  // 2. Product Grid & Cards
  const gridEl = doc.querySelector('.products, .product-grid, .product-list, #products, [class*="product-grid"]');
  if (gridEl) mappings.productGrid = getSelector(gridEl);

  // Find a card either inside grid or just in the document
  const cardEl = (gridEl || doc).querySelector('.product, .product-card, .product-item, .item, [class*="product-card"]');
  if (cardEl) {
    mappings.productCard = getSelector(cardEl);
    
    const imgEl = cardEl.querySelector('img, .product-image, [class*="product-image"]');
    if (imgEl) mappings.productImage = getSelector(imgEl);

    const titleEl = cardEl.querySelector('h1, h2, h3, h4, h5, .title, .product-title, .name');
    if (titleEl) mappings.productName = getSelector(titleEl);

    const priceEls = cardEl.querySelectorAll('.price, .product-price, .amount, [class*="price"]');
    if (priceEls.length > 0) {
      mappings.productPrice = getSelector(priceEls[0]);
      if (priceEls.length > 1) mappings.salePrice = getSelector(priceEls[1]);
    }

    const descEl = cardEl.querySelector('.description, .excerpt, p');
    if (descEl) mappings.productDescription = getSelector(descEl);

    const linkEl = cardEl.querySelector('a, .product-link');
    if (linkEl) mappings.productLink = getSelector(linkEl);

    const btnEl = cardEl.querySelector('button, .btn, .add-to-cart, [class*="add-to-cart"], a[href*="cart"]');
    if (btnEl) mappings.addBtn = getSelector(btnEl);
  }

  // 3. Cart 
  const cartContainer = doc.querySelector('.cart, .cart-container, #cart, .shopping-cart, table.cart');
  if (cartContainer) {
    mappings.cartContainer = getSelector(cartContainer);
    const cartItem = cartContainer.querySelector('.cart-item, tr.item, .item');
    if (cartItem) mappings.cartItem = getSelector(cartItem);
    const cartTotal = doc.querySelector('.cart-total, .total, .order-total');
    if (cartTotal) mappings.cartTotal = getSelector(cartTotal);
  }

  // 4. Checkout
  const checkoutForm = doc.querySelector('form.checkout, #checkout-form, .checkout-details');
  if (checkoutForm) mappings.checkoutForm = getSelector(checkoutForm);
  const checkoutSummary = doc.querySelector('.checkout-summary, .order-review, #order_review');
  if (checkoutSummary) mappings.checkoutSummary = getSelector(checkoutSummary);

  return mappings;
};
