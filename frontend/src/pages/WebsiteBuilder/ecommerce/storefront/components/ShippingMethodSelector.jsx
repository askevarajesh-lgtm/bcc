import React from 'react';
import { formatCurrency } from '../../utils/currency';

const ShippingMethodSelector = ({ settings, selectedMethod, onSelect, workspaceId, websiteId }) => {
  if (!settings?.shippingEnabled) return null;

  const methods = settings?.shippingMethods || [
    { id: 'standard', name: 'Standard Delivery', price: settings.shippingFee || 50, enabled: true }
  ];

  const enabledMethods = methods.filter(m => m.enabled);

  if (enabledMethods.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1.1rem' }}>Shipping Method</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {enabledMethods.map(method => (
          <label key={method.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="radio" 
                name="shippingMethod" 
                value={method.id} 
                checked={selectedMethod === method.id}
                onChange={() => onSelect(method.id)}
              />
              <span>{method.name}</span>
            </div>
            <span style={{ fontWeight: 500 }}>{formatCurrency(method.price, workspaceId, websiteId)}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ShippingMethodSelector;
