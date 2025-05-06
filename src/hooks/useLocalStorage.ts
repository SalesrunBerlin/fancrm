
import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Function to safely get data from localStorage
  const readValue = useCallback((): T => {
    // Prevent build error "window is undefined" but keep working
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      
      if (item) {
        try {
          const parsedValue = JSON.parse(item) as T;
          console.log(`[useLocalStorage] Read from localStorage[${key}]:`, parsedValue);
          return parsedValue;
        } catch (parseError) {
          console.error(`[useLocalStorage] Error parsing localStorage key "${key}":`, parseError);
          // If parsing fails, remove the corrupted value
          window.localStorage.removeItem(key);
          return initialValue;
        }
      } else {
        console.log(`[useLocalStorage] Key "${key}" not found in localStorage, using initialValue:`, initialValue);
        return initialValue;
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Listen to storage events to keep multiple components in sync
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        try {
          if (event.newValue) {
            const newValue = JSON.parse(event.newValue) as T;
            console.log(`[useLocalStorage] Storage event detected for key "${key}", updating state:`, newValue);
            setStoredValue(newValue);
          } else {
            // If the item was removed
            console.log(`[useLocalStorage] Storage key "${key}" was removed, resetting to initial value`);
            setStoredValue(initialValue);
          }
        } catch (error) {
          console.error(`[useLocalStorage] Error parsing storage event value:`, error);
        }
      }
    };

    // Initial read for freshest data
    const currentValue = readValue();
    if (JSON.stringify(currentValue) !== JSON.stringify(storedValue)) {
      setStoredValue(currentValue);
    }

    // Subscribe to storage events
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, readValue, storedValue, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== "undefined") {
        try {
          const serialized = JSON.stringify(valueToStore);
          console.log(`[useLocalStorage] Writing to localStorage[${key}]:`, valueToStore);
          window.localStorage.setItem(key, serialized);
          
          // Create a custom event to notify other components using the same key
          const event = new StorageEvent('storage', { 
            key: key,
            newValue: serialized
          });
          window.dispatchEvent(event);
        } catch (serializeError) {
          console.error(`[useLocalStorage] Error serializing value for key "${key}":`, serializeError);
        }
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
