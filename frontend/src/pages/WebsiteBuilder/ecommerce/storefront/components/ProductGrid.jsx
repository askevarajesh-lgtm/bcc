import React, { useMemo } from 'react';
import { useStorefront } from '../StorefrontContext';
import ProductCard from './ProductCard';

const ProductGrid = ({ mapping, html }) => {
  const { products } = useStorefront();

  // Parse the template HTML once to extract the card template
  const cardTemplateHtml = useMemo(() => {
    let templateStr = '<div></div>'; // fallback
    if (mapping?.productCard) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const cardEl = doc.querySelector(mapping.productCard);
      if (cardEl) {
        let rootCard = cardEl;
        let levels = 0;
        // Traverse up to find the true grid column wrapper (stops when parent has multiple columns/children)
        while (
          rootCard.parentElement && 
          rootCard.parentElement.tagName !== 'BODY' &&
          rootCard.parentElement.tagName !== 'HTML' &&
          rootCard.parentElement.children.length === 1 && 
          levels < 4
        ) {
          rootCard = rootCard.parentElement;
          levels++;
        }
        templateStr = rootCard.outerHTML;
      }
    }
    return templateStr;
  }, [html, mapping]);

  // We return a Fragment here. 
  // StorefrontPage creates a Portal that injects these children directly into the 
  // template's grid container. This preserves the template's original grid layout CSS.
  return (
    <>
      {products.map(product => (
        <ProductCard 
          key={product.id || product._id} 
          product={product} 
          templateHtml={cardTemplateHtml} 
          mapping={mapping} 
        />
      ))}
    </>
  );
};

export default ProductGrid;
