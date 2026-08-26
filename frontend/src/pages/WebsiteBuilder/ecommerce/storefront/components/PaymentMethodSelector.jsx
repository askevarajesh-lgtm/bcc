import React from 'react';

const PaymentMethodSelector = ({ settings, selectedMethod, onSelect }) => {
  const methods = settings?.paymentMethods || [
    { id: 'COD', name: 'Cash on Delivery', enabled: true }
  ];

  const enabledMethods = methods.filter(m => m.enabled);

  if (enabledMethods.length === 0) {
    return <div>No payment methods available.</div>;
  }

  return (
    <div style={{ marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1.1rem' }}>Payment Method</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {enabledMethods.map(method => (
          <label key={method.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="paymentMethod" 
              value={method.id} 
              checked={selectedMethod === method.id}
              onChange={() => onSelect(method.id)}
            />
            <span>{method.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
