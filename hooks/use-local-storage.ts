"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

import type { StorageRecoveryNotice } from "@/modules/app-data-management";

type UseLocalStorageOptions<T> = {
  deserialize?: (value: unknown) => T;
  serialize?: (value: T) => string;
  getRecoveryNotice?: (key: string, error: unknown) => StorageRecoveryNotice;
};

export function useLocalStorage<T>(key: string, initialValue: T, options?: UseLocalStorageOptions<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState<StorageRecoveryNotice | null>(null);
  const deserialize = options?.deserialize;
  const serialize = options?.serialize;
  const getRecoveryNotice = options?.getRecoveryNotice;

  useEffect(() => {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      setRecoveryNotice(null);
      setIsLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      setValue(deserialize ? deserialize(parsed) : (parsed as T));
      setRecoveryNotice(null);
    } catch (error) {
      setValue(initialValue);
      setRecoveryNotice(getRecoveryNotice ? getRecoveryNotice(key, error) : null);
      window.localStorage.removeItem(key);
    } finally {
      setIsLoaded(true);
    }
  }, [deserialize, getRecoveryNotice, initialValue, key]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(key, serialize ? serialize(value) : JSON.stringify(value));
  }, [isLoaded, key, serialize, value]);

  return [value, setValue as Dispatch<SetStateAction<T>>, isLoaded, recoveryNotice] as const;
}