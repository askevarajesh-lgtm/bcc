// analyzer.js - Heuristic template analyzer for e-commerce elements

export const analyzeTemplate = (html) => {
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
    addBtn: ''
  };

  // Basic Header & Footer detection
  const headerEl = doc.querySelector('header, .site-header, .header, #header, [data-gjs-type="header"]');
  if (headerEl) mappings.header = getSelector(headerEl);

  const footerEl = doc.querySelector('footer, .site-footer, .footer, #footer, [data-gjs-type="footer"]');
  if (footerEl) mappings.footer = getSelector(footerEl);

  // Product Grid detection
  const gridEl = doc.querySelector('.products, .product-grid, .product-list, #products, [class*="product-grid"]');
  if (gridEl) mappings.productGrid = getSelector(gridEl);

  // Product Card detection
  const cardEl = doc.querySelector('.product, .product-card, .product-item, .item, [class*="product-card"]');
  if (cardEl) {
    mappings.productCard = getSelector(cardEl);
    
    // Within the card, find specific elements
    const imgEl = cardEl.querySelector('img, .product-image, [class*="product-image"]');
    if (imgEl) mappings.productImage = getSelector(imgEl);

    const titleEl = cardEl.querySelector('h1, h2, h3, h4, h5, .title, .product-title, .name');
    if (titleEl) mappings.productName = getSelector(titleEl);

    const priceEl = cardEl.querySelector('.price, .product-price, .amount');
    if (priceEl) mappings.productPrice = getSelector(priceEl);

    const btnEl = cardEl.querySelector('button, .btn, .add-to-cart, [class*="add-to-cart"]');
    if (btnEl) mappings.addBtn = getSelector(btnEl);
  }

  return mappings;
};

// Helper to generate a somewhat unique CSS selector for an element
const getSelector = (el) => {
  if (!el) return '';
  if (el.id) return `#${el.id}`;
  if (el.className) {
    const classes = el.className.split(' ').filter(c => c && !c.includes(':')).join('.');
    if (classes) return `.${classes}`;
  }
  return el.tagName.toLowerCase();
};
