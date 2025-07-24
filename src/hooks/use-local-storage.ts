"use client";

import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Handle Set deserialization
        if (parsed.dataType === 'Set') {
          return new Set(parsed.value) as T;
        }
        return parsed;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        let serializedValue;
        // Handle Set serialization
        if (valueToStore instanceof Set) {
          serializedValue = JSON.stringify({
            dataType: 'Set',
            value: Array.from(valueToStore),
          });
        } else {
          serializedValue = JSON.stringify(valueToStore);
        }
        window.localStorage.setItem(key, serializedValue);
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
             if (parsed.dataType === 'Set') {
              setStoredValue(new Set(parsed.value) as T);
            } else {
              setStoredValue(parsed);
            }
          } else {
            setStoredValue(initialValue);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);


  return [storedValue, setValue];
}

export { useLocalStorage };
