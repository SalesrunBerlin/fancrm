
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
    // First try to parse the date string
    let date: Date | null = null;
    let isValidDate = false;
    
    if (typeof dateString === 'string') {
      // Try different parsing methods
      
      // Method 1: parseISO for ISO strings
      date = parseISO(dateString);
      isValidDate = isValid(date);
      
      // Method 2: Direct Date constructor if parseISO fails
      if (!isValidDate) {
        date = new Date(dateString);
        isValidDate = isValid(date);
      }
      
      // Method 3: Try parsing numeric strings as timestamps
      if (!isValidDate && /^\d+$/.test(dateString)) {
        date = new Date(parseInt(dateString, 10));
        isValidDate = isValid(date);
      }
    }
    
    // If we have a valid date, format it
    if (isValidDate && date) {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
    
    // If all parsing attempts failed, log and return original
    console.warn(`Could not parse date string: ${dateString}`);
    return typeof dateString === 'string' ? dateString : '-';
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return typeof dateString === 'string' ? dateString : '-';
  }
}

export function parseMultiFormatDate(dateString: string): string | null {
  if (!dateString) return null;
  
  // Trim the input and check if it's empty
  const trimmed = dateString.trim();
  if (!trimmed) return null;
  
  // Try parsing different date formats
  let date: Date | null = null;
  let isValidDate = false;
  
  try {
    // Try direct Date parsing (for ISO format and some other standard formats)
    date = parseISO(trimmed);
    isValidDate = isValid(date);
    
    if (isValidDate) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }
    
    // Try with new Date() if parseISO failed
    date = new Date(trimmed);
    isValidDate = isValid(date);
    
    if (isValidDate) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }
    
    // Try DD.MM.YYYY (European format)
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('.');
      date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      isValidDate = isValid(date);
      
      if (isValidDate) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    }
    
    // Try DD/MM/YYYY (European format with slashes)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      isValidDate = isValid(date);
      
      if (isValidDate) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    }
    
    // Try MM/DD/YYYY (US format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      date = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
      isValidDate = isValid(date);
      
      if (isValidDate) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    }
    
    // If we couldn't parse the date after all attempts
    console.warn(`Failed to parse date: ${trimmed}`);
    return null;
  } catch (error) {
    console.error(`Error parsing date: ${trimmed}`, error);
    return null;
  }
}

// Helper for safely accessing HTML Element properties
export function getSafeElement<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  const element = document.querySelector<T>(selector);
  return element;
}
