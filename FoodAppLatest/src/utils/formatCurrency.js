import { APP_CONFIG } from '../constants/config';

export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;

  // ✅ Always round to nearest integer
  const rounded = Math.round(num);

  return `${APP_CONFIG.CURRENCY_SYMBOL}${rounded}`;
};

export const formatPrice = (price) => {
  return formatCurrency(price);
};