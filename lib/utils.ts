import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const middleEllipsis = (str: string, len: number) => {
  if (!str) {
    return '';
  }

  // We return the first 4 characters after the 0x prefix and the last 4 characters
  return `0x${str.substring(2, len + 2)}...${str.substring(str.length - len, str.length)}`;
};
