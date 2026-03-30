"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return;
    }

    try {
      setValue(JSON.parse(stored) as T);
    } catch {
      setValue(initialValue);
    }
  }, [initialValue, key]);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}