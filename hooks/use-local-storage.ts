"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      setIsLoaded(true);
      return;
    }

    try {
      setValue(JSON.parse(stored) as T);
    } catch {
      setValue(initialValue);
    } finally {
      setIsLoaded(true);
    }
  }, [initialValue, key]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [isLoaded, key, value]);

  return [value, setValue as Dispatch<SetStateAction<T>>, isLoaded] as const;
}