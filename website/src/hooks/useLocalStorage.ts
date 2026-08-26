import { useEffect, useState } from 'react';

/** Persisted state. Shared pattern for theme, audience lens, and currency. */
export function useLocalStorage<T extends string>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T) ?? initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode — state still works in-memory */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
