import { useEffect, useState } from 'react';

/** Returns `value`, delayed by `delayMs` — avoids re-filtering on every keystroke. */
export function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
