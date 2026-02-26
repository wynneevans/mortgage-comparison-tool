/**
 * Formatting utilities for currency and numbers
 */

export const formatCurrency = (amount: number): string => {
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCurrencyCompact = (amount: number): string => {
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};
