import { useState, useEffect } from "react";

/**
 * Hook to debounce a value with a specified delay.
 * Useful for search inputs to avoid making API calls on every keystroke.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 500);
 *
 * // Use debouncedSearch in your effect/API call
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     // Perform search
 *   }
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel the timer if the value changes or the component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to debounce a function call with a specified delay.
 * Useful for API calls that should only happen after the user stops typing.
 *
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced function
 *
 * @example
 * const debouncedSearch = useDebounceFn(async (query) => {
 *   const results = await searchAPI(query);
 *   setResults(results);
 * }, 500);
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  return ((...args: Parameters<T>) => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    const newTimeoutId = window.setTimeout(() => {
      fn(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;
}

/**
 * Hook to throttle a value with a specified delay scroll.
 * Useful for events or other high-frequency updates.
 *
 * @param value - The value to throttle
 * @param delay - The delay in milliseconds (default: 200ms)
 * @returns The throttled value
 *
 * @example
 * const [scrollY, setScrollY] = useState(window.scrollY);
 * const throttledScrollY = useThrottle(scrollY, 100);
 */
export function useThrottle<T>(value: T, delay: number = 200): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastUpdated;

    if (elapsed >= delay) {
      // Enough time has passed, update immediately
      setThrottledValue(value);
      setLastUpdated(now);
    } else {
      // Not enough time has passed, schedule an update
      const timer = setTimeout(() => {
        setThrottledValue(value);
        setLastUpdated(Date.now());
      }, delay - elapsed);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [value, delay, lastUpdated]);

  return throttledValue;
}
