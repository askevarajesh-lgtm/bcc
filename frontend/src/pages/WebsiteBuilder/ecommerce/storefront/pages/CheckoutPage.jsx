import React, { useState, useEffect } from 'react';
import StorefrontPage from './StorefrontPage';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import ShippingMethodSelector from '../components/ShippingMethodSelector';
import { useStorefront } from '../StorefrontContext';
import { processCheckout } from '../../utils/storage';
import { formatCurrency } from '../../utils/currency';
import { message } from 'antd';

const CheckoutPage = () => {
  const { template, currentPageId, cart, settings, workspaceId, websiteId, navigateTo, clearCart } = useStorefront();
  const page = template?.pages?.[currentPageId];
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [shippingMethodId, setShippingMethodId] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (settings) {
      const enabledPayments = settings.paymentMethods?.filter(m => m.enabled) || [];
      if (enabledPayments.length > 0 && !paymentMethod) {
        setPaymentMethod(enabledPayments[0].id);
      }

      if (settings.shippingEnabled) {
        const enabledShipping = settings.shippingMethods?.filter(m => m.enabled) || [];
        if (enabledShipping.length > 0) {
          const defaultShip = enabledShipping[0];
          if (!shippingMethodId) {
            setShippingMethodId(defaultShip.id);
            setShippingFee(defaultShip.price);
          } else {
             const selected = enabledShipping.find(m => m.id === shippingMethodId);
             if (selected) setShippingFee(selected.price);
          }
        } else {
          setShippingFee(settings.shippingFee || 0);
        }
      }
    }
  }, [settings, paymentMethod, shippingMethodId]);

  if (!page) return null;

  const modifiedPage = { ...page };
  const parser = new DOMParser();
  const doc = parser.parseFromString(page.html, 'text/html');
  
  if (page.mapping && page.mapping.checkoutForm) {
    const formEl = doc.querySelector(page.mapping.checkoutForm);
    if (formEl) {
      // Find where we can mount our React components
      // We will create a div inside the form for React to portal into
      const reactMount = doc.createElement('div');
      reactMount.id = 'storefront-react-checkout';
      formEl.appendChild(reactMount);
      
      // Prevent default form submission and hook up to our process
      formEl.id = 'storefront-checkout-form';
      formEl.removeAttribute('action');
      formEl.removeAttribute('method');
    }
  }

  modifiedPage.html = doc.documentElement.innerHTML;

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const finalTotal = cartTotal + Number(shippingFee);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      message.warning('Cart is empty');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const customerDetails = {
      name: formData.get('name') || formData.get('first_name') || 'Demo User',
      email: formData.get('email') || formData.get('billing_email') || 'demo@example.com',
      address: formData.get('address') || formData.get('billing_address_1') || '123 Test St'
    };

    const result = await processCheckout(workspaceId, websiteId, customerDetails, cart, paymentMethod, shippingMethodId);
    
    if (result.success) {
      message.success(`Order ${result.orderId} placed successfully!`);
      clearCart();
      setIsSubmitting(false);
      
      const successPage = Object.values(template.pages).find(p => p.role === 'Success' || p.fileName.includes('success'));
      if (successPage) {
        navigateTo(successPage.id);
      } else {
        navigateTo(Object.keys(template.pages)[0]); 
      }
    } else {
      message.error(result.message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const form = document.getElementById('storefront-checkout-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
    return () => {
      if (form) form.removeEventListener('submit', handleSubmit);
    };
  }, [cart, paymentMethod, shippingMethodId, workspaceId, websiteId, isSubmitting]);

  return (
    <StorefrontPage page={modifiedPage} assets={template.assets}>
      <CheckoutPortal 
        settings={settings}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        shippingMethodId={shippingMethodId}
        setShippingMethodId={setShippingMethodId}
        cartTotal={cartTotal}
        shippingFee={shippingFee}
        finalTotal={finalTotal}
        workspaceId={workspaceId}
        websiteId={websiteId}
      />
    </StorefrontPage>
  );
};

const CheckoutPortal = (props) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;
  const target = document.getElementById('storefront-react-checkout');
  if (!target) return null;

  return require('react-dom').createPortal(
    <div style={{ marginTop: 32 }}>
      <ShippingMethodSelector 
        settings={props.settings} 
        selectedMethod={props.shippingMethodId} 
        onSelect={props.setShippingMethodId} 
        workspaceId={props.workspaceId} 
        websiteId={props.websiteId} 
      />
      
      <PaymentMethodSelector 
        settings={props.settings} 
        selectedMethod={props.paymentMethod} 
        onSelect={props.setPaymentMethod} 
      />
      
      <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Subtotal</span>
          <span>{formatCurrency(props.cartTotal, props.workspaceId, props.websiteId)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
          <span>Shipping</span>
          <span>{formatCurrency(props.shippingFee, props.workspaceId, props.websiteId)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
          <span>Total</span>
          <span>{formatCurrency(props.finalTotal, props.workspaceId, props.websiteId)}</span>
        </div>
      </div>
    </div>,
    target
  );
};

export default CheckoutPage;
