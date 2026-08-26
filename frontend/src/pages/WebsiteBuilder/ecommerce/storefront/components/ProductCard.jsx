import React from 'react';
import { useStorefront } from '../StorefrontContext';
import { formatCurrency } from '../../utils/currency';

const ProductCard = ({ product, templateHtml, mapping }) => {
  const { addToCart, navigateTo, workspaceId, websiteId } = useStorefront();

  // Create a temporary container to manipulate the template HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(templateHtml, 'text/html');
  let cardEl = doc.body.firstElementChild; // The wrapper itself

  if (!cardEl) return null;

  // Extract classes from the template mapping
  const extractClass = (selector) => {
    if (!selector) return '';
    const match = selector.match(/\.([\w-]+)/);
    return match ? match[1] : '';
  };

  const imageClass = extractClass(mapping?.productImage);
  const titleClass = extractClass(mapping?.productName);
  const priceClass = extractClass(mapping?.productPrice);
  const btnClass = extractClass(mapping?.addBtn);
  const cardClass = cardEl.className || extractClass(mapping?.productCard);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div 
      className={cardClass} 
      onClick={() => navigateTo(null, product.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Fallback structure combining template classes with React data */}
      {product.image && (
        <div style={{ width: '100%', height: 200, overflow: 'hidden', marginBottom: 12 }}>
          <img 
            src={product.image} 
            alt={product.name} 
            className={imageClass} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
      <div style={{ padding: '0 8px 12px' }}>
        <h3 className={titleClass || 'product-title'} style={{ fontSize: '1.1rem', margin: '0 0 8px' }}>
          {product.name}
        </h3>
        <div className={priceClass || 'product-price'} style={{ fontWeight: 'bold', marginBottom: 12 }}>
          {formatCurrency(product.price, workspaceId, websiteId)}
        </div>
        <button 
          className={btnClass || 'add-to-cart-btn'} 
          onClick={handleAdd}
          disabled={product.stock === 0}
          style={{
            width: '100%',
            padding: '8px 16px',
            background: product.stock === 0 ? '#ccc' : 'var(--accent-primary, #1890ff)',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
