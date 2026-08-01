import { useState, useEffect } from "react";

/**
 * Custom hook for debouncing values
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {*} - The debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debounced search with query params
 * @param {string} initialSearch - Initial search value
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {[string, string, (value: string) => void]} - [search, debouncedSearch, setSearch]
 */
export const useDebouncedSearch = (initialSearch = "", delay = 500) => {
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, delay);

  return [search, debouncedSearch, setSearch];
};
