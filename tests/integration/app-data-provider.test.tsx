import { useState } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppDataProvider, useAppData } from "@/components/app-data-provider";
import {
  BANK_DATA_STORAGE_KEY,
  USER_DATA_STORAGE_KEY,
  cloneDefaultBankData,
  cloneDefaultUserData,
  createAppStateExport,
} from "@/modules/app-data-management";

type ExportedProbeState = {
  userData: {
    profile: {
      members: Array<{ name: string }>;
    };
  };
};

function ProviderProbe({ importPayload }: Readonly<{ importPayload: string }>) {
  const { userData, bankData, isHydrated, storageRecoveryNotices, exportAppState, importAppState, resetAppData, clearLocalData } = useAppData();
  const [exported, setExported] = useState("");
  const exportedState = exported ? (JSON.parse(exported) as ExportedProbeState) : null;

  return (
    <div>
      <div data-testid="hydrated">{String(isHydrated)}</div>
      <div data-testid="member-name">{userData.profile.members[0]?.name ?? "none"}</div>
      <div data-testid="user-source">{userData.meta.source}</div>
      <div data-testid="bank-source">{bankData.meta.source}</div>
      <div data-testid="notice-count">{storageRecoveryNotices.length}</div>
      <div data-testid="exported-member-name">{exportedState?.userData.profile.members[0]?.name ?? ""}</div>
      <button type="button" onClick={() => setExported(exportAppState())}>
        Export state
      </button>
      <button type="button" onClick={() => importAppState(importPayload)}>
        Import state
      </button>
      <button type="button" onClick={resetAppData}>
        Reset state
      </button>
      <button type="button" onClick={clearLocalData}>
        Clear state
      </button>
    </div>
  );
}

describe("AppDataProvider", () => {
  it("hydrates stored data and reports storage recovery notices", async () => {
    const storedUserData = cloneDefaultUserData();
    storedUserData.profile.members[0].name = "Taylor";
    storedUserData.meta.source = "manual";

    window.localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(storedUserData));
    window.localStorage.setItem(BANK_DATA_STORAGE_KEY, "{");

    render(
      <AppDataProvider>
        <ProviderProbe importPayload={createAppStateExport(cloneDefaultUserData(), cloneDefaultBankData())} />
      </AppDataProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("true"));

    expect(screen.getByTestId("member-name")).toHaveTextContent("Taylor");
    expect(screen.getByTestId("user-source")).toHaveTextContent("manual");
    expect(screen.getByTestId("bank-source")).toHaveTextContent("seed");
    expect(screen.getByTestId("notice-count")).toHaveTextContent("1");
  });

  it("exports, imports, resets, and clears provider state", async () => {
    const storedUserData = cloneDefaultUserData();
    const storedBankData = cloneDefaultBankData();
    storedUserData.profile.members[0].name = "Morgan";
    storedUserData.meta.source = "manual";
    storedBankData.meta.source = "manual";

    const importUserData = cloneDefaultUserData();
    const importBankData = cloneDefaultBankData();
    importUserData.profile.members[0].name = "Jordan Import";

    window.localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(storedUserData));
    window.localStorage.setItem(BANK_DATA_STORAGE_KEY, JSON.stringify(storedBankData));

    const user = userEvent.setup();

    render(
      <AppDataProvider>
        <ProviderProbe importPayload={createAppStateExport(importUserData, importBankData)} />
      </AppDataProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("true"));

    await user.click(screen.getByRole("button", { name: "Export state" }));
    expect(screen.getByTestId("exported-member-name")).toHaveTextContent("Morgan");

    await user.click(screen.getByRole("button", { name: "Import state" }));
    await waitFor(() => expect(screen.getByTestId("member-name")).toHaveTextContent("Jordan Import"));
    expect(screen.getByTestId("user-source")).toHaveTextContent("imported");
    expect(screen.getByTestId("bank-source")).toHaveTextContent("imported");

    await user.click(screen.getByRole("button", { name: "Reset state" }));
    await waitFor(() => expect(screen.getByTestId("member-name")).toHaveTextContent("Alex"));
    expect(screen.getByTestId("user-source")).toHaveTextContent("seed");

    await user.click(screen.getByRole("button", { name: "Clear state" }));
    await waitFor(() => expect(screen.getByTestId("member-name")).toHaveTextContent("Alex"));

    const persistedUserData = JSON.parse(window.localStorage.getItem(USER_DATA_STORAGE_KEY) ?? "null") as { meta: { source: string } };
    const persistedBankData = JSON.parse(window.localStorage.getItem(BANK_DATA_STORAGE_KEY) ?? "null") as { meta: { source: string } };

    expect(persistedUserData.meta.source).toBe("seed");
    expect(persistedBankData.meta.source).toBe("seed");
  });
});