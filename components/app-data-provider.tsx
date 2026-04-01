"use client";

import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { demoBankData, demoUserData } from "@/modules/demo-data";
import type { BankData, UserData } from "@/types/domain";

const USER_DATA_STORAGE_KEY = "your-ledger:user-data";
const BANK_DATA_STORAGE_KEY = "your-ledger:bank-data";

type AppDataContextValue = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  bankData: BankData;
  setBankData: Dispatch<SetStateAction<BankData>>;
  isHydrated: boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [userData, setUserData, isUserDataLoaded] = useLocalStorage<UserData>(USER_DATA_STORAGE_KEY, demoUserData);
  const [bankData, setBankData, isBankDataLoaded] = useLocalStorage<BankData>(BANK_DATA_STORAGE_KEY, demoBankData);

  return (
    <AppDataContext.Provider
      value={{
        userData,
        setUserData,
        bankData,
        setBankData,
        isHydrated: isUserDataLoaded && isBankDataLoaded,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }

  return context;
}