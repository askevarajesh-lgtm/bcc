import { getSettings } from './storage';

export const formatCurrency = (amount, workspaceId = 'default', websiteId = 'default') => {
  const settings = getSettings(workspaceId, websiteId);
  const symbol = settings?.currencySymbol || '₹';
  const currencyCode = settings?.currency || 'INR';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace(currencyCode, symbol).trim();
};
