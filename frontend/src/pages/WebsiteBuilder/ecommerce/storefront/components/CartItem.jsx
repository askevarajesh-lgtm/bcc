import React from 'react';
import { useStorefront } from '../StorefrontContext';
import { formatCurrency } from '../../utils/currency';

const CartItem = ({ item, templateHtml }) => {
  const { updateQty, removeFromCart, workspaceId, websiteId } = useStorefront();

  const parser = new DOMParser();
  const doc = parser.parseFromString(templateHtml, 'text/html');
  const trEl = doc.body.firstElementChild;
  if (!trEl) return null;

  // We'll replace the contents but keep the tag structure (like <tr>)
  const Tag = trEl.tagName.toLowerCase();
  const className = trEl.className;

  return (
    <Tag className={className} style={{ borderBottom: '1px solid #eee' }}>
      <td style={{ padding: 12 }}>
        <img src={item.image} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover' }} />
      </td>
      <td style={{ padding: 12 }}>{item.name}</td>
      <td style={{ padding: 12 }}>{formatCurrency(item.price, workspaceId, websiteId)}</td>
      <td style={{ padding: 12 }}>
        <input 
          type="number" 
          value={item.quantity} 
          min="1" 
          max={item.stock}
          onChange={(e) => updateQty(item.id, parseInt(e.target.value, 10))}
          style={{ width: 60, padding: 4 }}
        />
      </td>
      <td style={{ padding: 12 }}>{formatCurrency(item.price * item.quantity, workspaceId, websiteId)}</td>
      <td style={{ padding: 12 }}>
        <button 
          onClick={() => removeFromCart(item.id)}
          style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
        >
          X
        </button>
      </td>
    </Tag>
  );
};

export default CartItem;
