import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function middleEllipsis(str: string, len: number) {
  if (!str) {
    return '';
  }

  // We return the first 4 characters after the 0x prefix and the last 4 characters
  return `0x${str.substring(2, len + 2)}...${str.substring(str.length - len, str.length)}`;
}

export function formatValueOnInputChange(value: string, decimals: number) {
  let processedValue = value;

  // 1. Remove any non-digit characters except a decimal point
  // Allow empty string or just a decimal point temporarily
  if (processedValue !== '' && processedValue !== '.') {
    processedValue = processedValue.replace(/[^0-9.]/g, '');
  }

  // 2. Ensure only one decimal point exists
  const decimalPointIndex = processedValue.indexOf('.');
  if (decimalPointIndex !== -1) {
    // Keep only the first decimal point
    processedValue =
      processedValue.substring(0, decimalPointIndex + 1) +
      processedValue.substring(decimalPointIndex + 1).replace(/\./g, '');
  }

  // 3. Check decimal places limit
  if (decimalPointIndex !== -1) {
    const decimalPart = processedValue.substring(decimalPointIndex + 1);
    if (decimalPart.length > decimals) {
      // Trim excess decimals
      processedValue = processedValue.substring(0, decimalPointIndex + 1 + decimals);
    }
  }

  // 4. Prevent leading multiple zeros unless it's '0.'
  if (processedValue.length > 1 && processedValue.startsWith('0') && !processedValue.startsWith('0.')) {
    // Allow typing '0', then '.', then numbers (e.g., '0.5')
    // If the user types '0' then '5', make it '5'
    processedValue = processedValue.substring(1);
  }
  // Prevent inputs like '.5' from becoming just '.' after filtering, allow starting with '.'
  // The regex above might turn '.5' into '.' if not careful. Let's rethink step 1 slightly.

  // --- Revised Step 1 & Processing ---
  let tempValue = value;
  // Allow only digits and one decimal point
  tempValue = tempValue.replace(/[^0-9.]/g, (match, offset) => {
    // Allow the first decimal point, remove others and non-digits
    return match === '.' && tempValue.indexOf('.') === offset ? '.' : '';
  });

  // Re-check decimal places after filtering
  const newDecimalPointIndex = tempValue.indexOf('.');
  if (newDecimalPointIndex !== -1) {
    const decimalPart = tempValue.substring(newDecimalPointIndex + 1);
    if (decimalPart.length > decimals) {
      tempValue = tempValue.substring(0, newDecimalPointIndex + 1 + decimals);
    }
  }

  // Handle leading zeros (e.g., '05' -> '5', but keep '0.5')
  if (tempValue.length > 1 && tempValue.startsWith('0') && !tempValue.startsWith('0.')) {
    tempValue = tempValue.substring(1);
  }

  processedValue = tempValue;

  return processedValue;
}
