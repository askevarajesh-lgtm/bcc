import React from 'react';
import { useStorefront } from '../StorefrontContext';
import ProductCard from './ProductCard';

const ProductGrid = ({ mapping, html }) => {
  const { products } = useStorefront();

  // Parse the grid container's HTML to extract the card template
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let cardTemplateHtml = '<div></div>'; // fallback
  if (mapping?.productCard) {
    const cardEl = doc.querySelector(mapping.productCard);
    if (cardEl) {
      cardTemplateHtml = cardEl.outerHTML;
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product} 
          templateHtml={cardTemplateHtml} 
          mapping={mapping} 
        />
      ))}
    </div>
  );
};

export default ProductGrid;
