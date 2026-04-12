import { describe, expect, it } from "vitest";

import {
  APP_STATE_EXPORT_VERSION,
  CURRENT_BANK_DATA_SCHEMA_VERSION,
  CURRENT_USER_DATA_SCHEMA_VERSION,
  cloneDefaultBankData,
  cloneDefaultUserData,
  createAppStateExport,
  parseAppStateExport,
  parseStoredBankData,
  parseStoredUserData,
} from "@/modules/app-data-management";

describe("app data management", () => {
  it("migrates stored user data onto the current schema and default preferences", () => {
    const defaults = cloneDefaultUserData();
    const parsed = parseStoredUserData({
      meta: {
        schemaVersion: 1,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-02T00:00:00.000Z",
        source: "manual",
      },
      profile: {
        members: [],
        monthlyExpenses: { housing: 1_500 },
        assets: [],
        liabilities: [],
        dependants: 1,
        targetInterestRate: 6.25,
        assessmentBuffer: 3.1,
        loanTermYears: 25,
      },
    });

    expect(parsed.meta.schemaVersion).toBe(CURRENT_USER_DATA_SCHEMA_VERSION);
    expect(parsed.meta.source).toBe("manual");
    expect(parsed.scenarios).toEqual([]);
    expect(parsed.comparisonResults).toEqual([]);
    expect(parsed.preferences.preferredRoute).toBe(defaults.preferences.preferredRoute);
    expect(parsed.preferences.selectedScenarioId).toBe(defaults.preferences.selectedScenarioId);
  });

  it("migrates stored bank data onto the current schema and default refresh state", () => {
    const defaults = cloneDefaultBankData();
    const parsed = parseStoredBankData({
      meta: {
        schemaVersion: 1,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-02T00:00:00.000Z",
        source: "manual",
      },
      banks: [],
    });

    expect(parsed.meta.schemaVersion).toBe(CURRENT_BANK_DATA_SCHEMA_VERSION);
    expect(parsed.overrides.creditPolicies).toEqual([]);
    expect(parsed.overrides.products).toEqual([]);
    expect(parsed.refresh.status).toBe(defaults.refresh.status);
    expect(parsed.refresh.lastRefreshedAt).toBe(defaults.refresh.lastRefreshedAt);
  });

  it("round-trips exported app state", () => {
    const userData = cloneDefaultUserData();
    const bankData = cloneDefaultBankData();
    const jsonText = createAppStateExport(userData, bankData);
    const parsed = parseAppStateExport(jsonText);

    expect(parsed.exportVersion).toBe(APP_STATE_EXPORT_VERSION);
    expect(parsed.userData.preferences.selectedScenarioId).toBe(userData.preferences.selectedScenarioId);
    expect(parsed.bankData.banks).toHaveLength(bankData.banks.length);
  });

  it("rejects invalid or future export payloads", () => {
    expect(() => parseAppStateExport("not json")).toThrow("Import file is not valid JSON.");

    expect(() =>
      parseAppStateExport(
        JSON.stringify({
          exportVersion: APP_STATE_EXPORT_VERSION + 1,
          exportedAt: "2026-04-12T00:00:00.000Z",
          userData: cloneDefaultUserData(),
          bankData: cloneDefaultBankData(),
        }),
      ),
    ).toThrow(`Import file uses export version ${APP_STATE_EXPORT_VERSION + 1}`);
  });
});