"use client";

import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  BANK_DATA_STORAGE_KEY,
  USER_DATA_STORAGE_KEY,
  cloneDefaultBankData,
  cloneDefaultUserData,
  createAppStateExport,
  getStorageRecoveryNotice,
  parseAppStateExport,
  parseStoredBankData,
  parseStoredUserData,
  stampImportedBankData,
  stampImportedUserData,
  type StorageRecoveryNotice,
} from "@/modules/app-data-management";
import { demoBankData, demoUserData } from "@/modules/demo-data";
import type { BankData, UserData } from "@/types/domain";

type AppDataContextValue = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  bankData: BankData;
  setBankData: Dispatch<SetStateAction<BankData>>;
  isHydrated: boolean;
  storageRecoveryNotices: StorageRecoveryNotice[];
  exportAppState: () => string;
  importAppState: (jsonText: string) => void;
  resetAppData: () => void;
  clearLocalData: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function fallbackReadingDate(updatedAt?: string) {
  return (updatedAt ?? demoUserData.meta.updatedAt).slice(0, 10);
}

function calculateBaseMonthlySuperContribution(annualGrossIncome: number, superContributionRate: number) {
  return Math.round(annualGrossIncome * (superContributionRate / 100) / 12);
}

function sumCurrentHomeLoanBalance(userData: UserData) {
  return userData.profile.liabilities.reduce(
    (total, liability) => (liability.category === "home-loan" ? total + liability.balance : total),
    0,
  );
}

function normalizeUserData(userData: UserData): UserData {
  const assetReadingDate = fallbackReadingDate(userData.meta.updatedAt);
  const currentHomeLoanBalance = sumCurrentHomeLoanBalance(userData);
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
    meta: {
      ...userData.meta,
      schemaVersion: Math.max(userData.meta.schemaVersion ?? 1, 5),
    },
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
    scenarios: userData.scenarios.map((scenario) => ({
      ...scenario,
      propertyTreatment: scenario.propertyTreatment ?? "equity-release",
      hasOffsetAccount: scenario.hasOffsetAccount ?? Boolean((scenario.offsetBalance ?? 0) > 0),
      equityReleaseAmount: scenario.equityReleaseAmount ?? scenario.equityContribution,
      refinanceExistingLoanAmount: scenario.refinanceExistingLoanAmount ?? currentHomeLoanBalance,
      equityBankId:
        scenario.equityBankId ??
        ((scenario.propertyTreatment ?? "equity-release") === "equity-release" ? scenario.bankId : undefined),
      equityProductId:
        scenario.equityProductId ??
        ((scenario.propertyTreatment ?? "equity-release") === "equity-release" ? scenario.productId : undefined),
    })),
  };
}

export function AppDataProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [storedUserData, setUserData, isUserDataLoaded, userStorageRecovery] = useLocalStorage<UserData>(
    USER_DATA_STORAGE_KEY,
    demoUserData,
    {
      deserialize: parseStoredUserData,
      getRecoveryNotice: getStorageRecoveryNotice,
    },
  );
  const [bankData, setBankData, isBankDataLoaded, bankStorageRecovery] = useLocalStorage<BankData>(
    BANK_DATA_STORAGE_KEY,
    demoBankData,
    {
      deserialize: parseStoredBankData,
      getRecoveryNotice: getStorageRecoveryNotice,
    },
  );
  const userData = normalizeUserData(storedUserData);
  const storageRecoveryNotices = [userStorageRecovery, bankStorageRecovery].filter(Boolean) as StorageRecoveryNotice[];

  const exportAppState = () => createAppStateExport(userData, bankData);

  const importAppState = (jsonText: string) => {
    const importedBundle = parseAppStateExport(jsonText);
    setUserData(stampImportedUserData(importedBundle.userData));
    setBankData(stampImportedBankData(importedBundle.bankData));
  };

  const resetAppData = () => {
    setUserData(cloneDefaultUserData());
    setBankData(cloneDefaultBankData());
  };

  const clearLocalData = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(USER_DATA_STORAGE_KEY);
      window.localStorage.removeItem(BANK_DATA_STORAGE_KEY);
    }

    resetAppData();
  };

  return (
    <AppDataContext.Provider
      value={{
        userData,
        setUserData,
        bankData,
        setBankData,
        isHydrated: isUserDataLoaded && isBankDataLoaded,
        storageRecoveryNotices,
        exportAppState,
        importAppState,
        resetAppData,
        clearLocalData,
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