import { getStorageData } from './storage';

export const formatCurrency = (amount, workspaceId, websiteId) => {
  const settings = getStorageData(workspaceId, websiteId, 'settings', { currency: 'INR', currencySymbol: '₹' });
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: settings.currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};
