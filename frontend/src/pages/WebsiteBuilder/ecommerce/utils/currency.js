import { getSettingsSync } from './storage';

export const formatCurrency = (amount, workspaceId = 'default', websiteId = 'default', storeId = '') => {
  const settings = storeId
    ? getSettingsSync(workspaceId, websiteId, storeId)
    : null;
  const symbol = settings?.currencySymbol || '₹';
  const currencyCode = settings?.currency || 'INR';

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount).replace(currencyCode, symbol).trim();
  } catch {
    return `${symbol}${Number(amount || 0).toFixed(0)}`;
  }
};
