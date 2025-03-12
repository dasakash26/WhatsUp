import { useEffect, useRef } from "react";

/**
 * A hook that calls a callback after a specified delay since the last dependency change.
 *
 * @param callback Function to call after the delay
 * @param delay Delay time in milliseconds
 * @param dependencies Array of dependencies that will reset the timer when changed
 */
export function useDebounce(
  callback: () => void,
  delay: number,
  dependencies: any[]
): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(callback, delay);

    // Clean up on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [...dependencies, callback, delay]);
}
