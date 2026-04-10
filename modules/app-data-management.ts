import { demoBankData, demoUserData } from "@/modules/demo-data";
import type { BankData, StoreMetadata, UserData } from "@/types/domain";

export const USER_DATA_STORAGE_KEY = "your-ledger:user-data";
export const BANK_DATA_STORAGE_KEY = "your-ledger:bank-data";
export const APP_STATE_EXPORT_VERSION = 1;
export const CURRENT_USER_DATA_SCHEMA_VERSION = demoUserData.meta.schemaVersion;
export const CURRENT_BANK_DATA_SCHEMA_VERSION = demoBankData.meta.schemaVersion;

type StoreSourceLike = StoreMetadata["source"];

export type AppStateExportBundle = {
  exportVersion: number;
  exportedAt: string;
  userData: UserData;
  bankData: BankData;
};

export type StorageRecoveryNotice = {
  key: string;
  title: string;
  message: string;
};

type ValidationErrorCode = "invalid-json" | "invalid-shape" | "future-schema" | "invalid-export";

class AppDataValidationError extends Error {
  code: ValidationErrorCode;

  constructor(code: ValidationErrorCode, message: string) {
    super(message);
    this.name = "AppDataValidationError";
    this.code = code;
  }
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableString(value: unknown, fallback: string | null) {
  return typeof value === "string" || value === null ? value : fallback;
}

function asStoreSource(value: unknown, fallback: StoreSourceLike): StoreSourceLike {
  return value === "seed" || value === "local" || value === "imported" || value === "manual"
    ? value
    : fallback;
}

function migrateMetadata(meta: unknown, currentSchemaVersion: number, fallbackMeta: StoreMetadata): StoreMetadata {
  const metaRecord = isRecord(meta) ? meta : {};
  const schemaVersion = asNumber(metaRecord.schemaVersion, 1);

  if (schemaVersion > currentSchemaVersion) {
    throw new AppDataValidationError(
      "future-schema",
      `Stored data uses schema version ${schemaVersion}, but this app supports up to schema version ${currentSchemaVersion}.`,
    );
  }

  return {
    schemaVersion: currentSchemaVersion,
    createdAt: asString(metaRecord.createdAt, fallbackMeta.createdAt),
    updatedAt: asString(metaRecord.updatedAt, fallbackMeta.updatedAt),
    source: asStoreSource(metaRecord.source, fallbackMeta.source),
  };
}

export function cloneDefaultUserData() {
  return cloneValue(demoUserData);
}

export function cloneDefaultBankData() {
  return cloneValue(demoBankData);
}

export function parseStoredUserData(value: unknown): UserData {
  if (!isRecord(value) || !isRecord(value.profile)) {
    throw new AppDataValidationError("invalid-shape", "Stored user data is missing the household profile object.");
  }

  const profile = value.profile;
  const preferences = isRecord(value.preferences) ? value.preferences : {};

  return {
    ...(value as UserData),
    meta: migrateMetadata(value.meta, CURRENT_USER_DATA_SCHEMA_VERSION, demoUserData.meta),
    profile: {
      ...(profile as UserData["profile"]),
      members: Array.isArray(profile.members) ? profile.members : [],
      monthlyExpenses: isRecord(profile.monthlyExpenses) ? (profile.monthlyExpenses as UserData["profile"]["monthlyExpenses"]) : {},
      assets: Array.isArray(profile.assets) ? profile.assets : [],
      liabilities: Array.isArray(profile.liabilities) ? profile.liabilities : [],
      dependants: asNumber(profile.dependants, demoUserData.profile.dependants),
      targetInterestRate: asNumber(profile.targetInterestRate, demoUserData.profile.targetInterestRate),
      assessmentBuffer: asNumber(profile.assessmentBuffer, demoUserData.profile.assessmentBuffer),
      loanTermYears: asNumber(profile.loanTermYears, demoUserData.profile.loanTermYears),
    },
    scenarios: Array.isArray(value.scenarios) ? value.scenarios : [],
    comparisonResults: Array.isArray(value.comparisonResults) ? value.comparisonResults : [],
    preferences: {
      preferredRoute: asString(preferences.preferredRoute, demoUserData.preferences.preferredRoute),
      selectedScenarioId: asNullableString(preferences.selectedScenarioId, demoUserData.preferences.selectedScenarioId),
    },
  };
}

export function parseStoredBankData(value: unknown): BankData {
  if (!isRecord(value) || !Array.isArray(value.banks)) {
    throw new AppDataValidationError("invalid-shape", "Stored bank data is missing the banks collection.");
  }

  const overrides = isRecord(value.overrides) ? value.overrides : {};
  const refresh = isRecord(value.refresh) ? value.refresh : {};

  return {
    ...(value as BankData),
    meta: migrateMetadata(value.meta, CURRENT_BANK_DATA_SCHEMA_VERSION, demoBankData.meta),
    banks: value.banks as BankData["banks"],
    overrides: {
      creditPolicies: Array.isArray(overrides.creditPolicies) ? overrides.creditPolicies : [],
      products: Array.isArray(overrides.products) ? overrides.products : [],
    },
    refresh: {
      lastRefreshedAt: asNullableString(refresh.lastRefreshedAt, demoBankData.refresh.lastRefreshedAt),
      status:
        refresh.status === "idle" || refresh.status === "refreshing" || refresh.status === "ready" || refresh.status === "error"
          ? refresh.status
          : demoBankData.refresh.status,
      errorMessage: typeof refresh.errorMessage === "string" ? refresh.errorMessage : undefined,
    },
  };
}

export function stampImportedUserData(userData: UserData): UserData {
  const now = new Date().toISOString();

  return {
    ...userData,
    meta: {
      ...userData.meta,
      schemaVersion: CURRENT_USER_DATA_SCHEMA_VERSION,
      updatedAt: now,
      source: "imported",
    },
  };
}

export function stampImportedBankData(bankData: BankData): BankData {
  const now = new Date().toISOString();

  return {
    ...bankData,
    meta: {
      ...bankData.meta,
      schemaVersion: CURRENT_BANK_DATA_SCHEMA_VERSION,
      updatedAt: now,
      source: "imported",
    },
  };
}

export function createAppStateExport(userData: UserData, bankData: BankData) {
  return JSON.stringify(
    {
      exportVersion: APP_STATE_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      userData,
      bankData,
    } satisfies AppStateExportBundle,
    null,
    2,
  );
}

export function parseAppStateExport(jsonText: string): AppStateExportBundle {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new AppDataValidationError("invalid-json", "Import file is not valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new AppDataValidationError("invalid-export", "Import file is missing the app-state export object.");
  }

  const exportVersion = asNumber(parsed.exportVersion, 1);

  if (exportVersion > APP_STATE_EXPORT_VERSION) {
    throw new AppDataValidationError(
      "future-schema",
      `Import file uses export version ${exportVersion}, but this app supports export version ${APP_STATE_EXPORT_VERSION}.`,
    );
  }

  return {
    exportVersion,
    exportedAt: asString(parsed.exportedAt, new Date().toISOString()),
    userData: parseStoredUserData(parsed.userData),
    bankData: parseStoredBankData(parsed.bankData),
  };
}

export function getStorageRecoveryNotice(key: string, error: unknown): StorageRecoveryNotice {
  if (error instanceof AppDataValidationError) {
    if (error.code === "future-schema") {
      return {
        key,
        title: "Newer saved data was skipped",
        message: error.message,
      };
    }

    return {
      key,
      title: "Saved data was recovered",
      message: error.message,
    };
  }

  if (error instanceof SyntaxError) {
    return {
      key,
      title: "Saved data was recovered",
      message: "Stored browser data could not be parsed and has been replaced with safe defaults.",
    };
  }

  return {
    key,
    title: "Saved data was recovered",
    message: "Stored browser data was incomplete or invalid and has been replaced with safe defaults.",
  };
}