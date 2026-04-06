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

function calculateBaseMonthlySuperContribution(annualGrossIncome: number, superContributionRate: number) {
  return Math.round(annualGrossIncome * (superContributionRate / 100) / 12);
}

function normalizeUserData(userData: UserData): UserData {
  const assetReadingDate = fallbackReadingDate(userData.meta.updatedAt);
  const members = userData.profile.members.map((member, index) => ({
    ...demoUserData.profile.members[index],
    ...member,
    superContributionRate:
      member.superContributionRate ?? demoUserData.profile.members[index]?.superContributionRate ?? 12,
  }));
  const superAssetMemberIds = members.map((member) => member.id);
  let seenUnlinkedSuperAssets = 0;

  const assets = userData.profile.assets.map((asset, index) => {
    const seededAsset = demoUserData.profile.assets[index];
    const linkedMemberId =
      asset.category === "super"
        ? asset.linkedMemberId ?? superAssetMemberIds[seenUnlinkedSuperAssets++]
        : asset.linkedMemberId;
    const linkedMember = linkedMemberId ? members.find((member) => member.id === linkedMemberId) : undefined;
    const baseSuperContribution = linkedMember
      ? calculateBaseMonthlySuperContribution(linkedMember.annualGrossIncome, linkedMember.superContributionRate)
      : 0;
    const legacyExpectedContribution = asset.expectedMonthlyContribution ?? seededAsset?.expectedMonthlyContribution ?? 0;

    return {
      ...seededAsset,
      ...asset,
      readingDate: asset.readingDate ?? assetReadingDate,
      linkedMemberId,
      expectedMonthlyContribution: legacyExpectedContribution,
      additionalMonthlyContribution:
        asset.additionalMonthlyContribution ??
        (asset.category === "super" ? Math.max(legacyExpectedContribution - baseSuperContribution, 0) : legacyExpectedContribution),
      annualGrowthRate: asset.annualGrowthRate ?? seededAsset?.annualGrowthRate,
    };
  });

  return {
    ...userData,
    profile: {
      ...demoUserData.profile,
      ...userData.profile,
      members,
      monthlyExpenses: {
        ...demoUserData.profile.monthlyExpenses,
        ...userData.profile.monthlyExpenses,
      },
      assets,
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