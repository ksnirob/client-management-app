import type { Currency } from '../components/common/CurrencySwitcher';

// Current exchange rate: 1 USD = 120 BDT (approximate)
export const USD_TO_BDT_RATE = 120;
export const BDT_TO_USD_RATE = 1 / USD_TO_BDT_RATE;

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'USD' && toCurrency === 'BDT') {
    return amount * USD_TO_BDT_RATE;
  }

  if (fromCurrency === 'BDT' && toCurrency === 'USD') {
    return amount * BDT_TO_USD_RATE;
  }

  return amount;
};

/**
 * Format currency amount with appropriate symbol and formatting
 */
export const formatCurrency = (
  amount: number,
  currency: Currency = 'USD'
): string => {
  // Handle NaN, null, undefined values
  const validAmount = isNaN(amount) || amount == null ? 0 : amount;

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(validAmount);
  }

  if (currency === 'BDT') {
    // Format BDT with ৳ symbol and Bengali number formatting
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(validAmount);
  }

  return validAmount.toString();
};

/**
 * Convert and format currency amount for display
 */
export const convertAndFormatCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): string => {
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
  return formatCurrency(convertedAmount, toCurrency);
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: Currency): string => {
  switch (currency) {
    case 'USD':
      return '$';
    case 'BDT':
      return '৳';
    default:
      return '';
  }
};

/**
 * Get currency name
 */
export const getCurrencyName = (currency: Currency): string => {
  switch (currency) {
    case 'USD':
      return 'US Dollar';
    case 'BDT':
      return 'Bangladeshi Taka';
    default:
      return '';
  }
}; 