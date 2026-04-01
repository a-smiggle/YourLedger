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

function fallbackReadingDate(updatedAt?: string) {
  return (updatedAt ?? demoUserData.meta.updatedAt).slice(0, 10);
}

function normalizeUserData(userData: UserData): UserData {
  const assetReadingDate = fallbackReadingDate(userData.meta.updatedAt);

  return {
    ...userData,
    profile: {
      ...demoUserData.profile,
      ...userData.profile,
      monthlyExpenses: {
        ...demoUserData.profile.monthlyExpenses,
        ...userData.profile.monthlyExpenses,
      },
      assets: userData.profile.assets.map((asset, index) => ({
        ...demoUserData.profile.assets[index],
        ...asset,
        readingDate: asset.readingDate ?? assetReadingDate,
        expectedMonthlyContribution: asset.expectedMonthlyContribution ?? demoUserData.profile.assets[index]?.expectedMonthlyContribution,
        annualGrowthRate: asset.annualGrowthRate ?? demoUserData.profile.assets[index]?.annualGrowthRate,
      })),
    },
  };
}

export function AppDataProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [storedUserData, setUserData, isUserDataLoaded] = useLocalStorage<UserData>(USER_DATA_STORAGE_KEY, demoUserData);
  const [bankData, setBankData, isBankDataLoaded] = useLocalStorage<BankData>(BANK_DATA_STORAGE_KEY, demoBankData);
  const userData = normalizeUserData(storedUserData);

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