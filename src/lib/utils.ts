
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isValid, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    // Try to parse the date string first with parseISO for ISO strings
    let date: Date;
    if (typeof dateString === 'string') {
      date = parseISO(dateString);
    } else {
      date = new Date(dateString);
    }
    
    // Check if the date is valid before formatting
    if (!isValid(date)) {
      console.warn(`Invalid date string: ${dateString}`);
      return dateString || '-';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return dateString || '-';
  }
}

export function parseMultiFormatDate(dateString: string): string | null {
  if (!dateString) return null;
  
  // Trim the input and check if it's empty
  const trimmed = dateString.trim();
  if (!trimmed) return null;
  
  // Try parsing different date formats
  let date: Date | null = null;
  
  try {
    // Try direct Date parsing (for ISO format and some other standard formats)
    date = parseISO(trimmed);
    if (isValid(date)) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }
    
    // Try with new Date() if parseISO failed
    date = new Date(trimmed);
    if (isValid(date)) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }
    
    // Try DD.MM.YYYY (European format)
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('.');
      date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      if (isValid(date)) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    }
    
    // Try DD/MM/YYYY (European format with slashes)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      if (isValid(date)) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    }
    
    // Try MM/DD/YYYY (US format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      date = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
      if (isValid(date)) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    }
  } catch (error) {
    console.error(`Error parsing date: ${trimmed}`, error);
  }
  
  // If we couldn't parse the date, return null
  return null;
}

// Helper for safely accessing HTML Element properties
export function getSafeElement<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  const element = document.querySelector<T>(selector);
  return element;
}
