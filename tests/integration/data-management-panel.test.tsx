import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppDataProvider, useAppData } from "@/components/app-data-provider";
import { DataManagementPanel } from "@/components/data-management-panel";
import {
  BANK_DATA_STORAGE_KEY,
  USER_DATA_STORAGE_KEY,
  cloneDefaultBankData,
  cloneDefaultUserData,
  createAppStateExport,
} from "@/modules/app-data-management";

function StateProbe() {
  const { userData, isHydrated } = useAppData();

  return (
    <div>
      <div data-testid="hydrated">{String(isHydrated)}</div>
      <div data-testid="member-name">{userData.profile.members[0]?.name ?? "none"}</div>
      <div data-testid="user-source">{userData.meta.source}</div>
    </div>
  );
}

describe("DataManagementPanel", () => {
  it("supports export, import, reset, and clear flows from the UI", async () => {
    const storedUserData = cloneDefaultUserData();
    const storedBankData = cloneDefaultBankData();
    const importedUserData = cloneDefaultUserData();
    const importedBankData = cloneDefaultBankData();
    storedUserData.profile.members[0].name = "Morgan";
    storedUserData.meta.source = "manual";
    importedUserData.profile.members[0].name = "Avery";

    window.localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(storedUserData));
    window.localStorage.setItem(BANK_DATA_STORAGE_KEY, JSON.stringify(storedBankData));

    const createObjectUrl = vi.fn(() => "blob:download-url");
    const revokeObjectUrl = vi.fn();
    const anchorClick = vi.fn();

    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectUrl,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(anchorClick);

    const user = userEvent.setup();

    render(
      <AppDataProvider>
        <DataManagementPanel />
        <StateProbe />
      </AppDataProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("true"));
    expect(screen.getByTestId("member-name")).toHaveTextContent("Morgan");

    await user.click(screen.getByRole("button", { name: /Export JSON/i }));
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Full app state exported to a JSON file.")).toBeInTheDocument();

    const importFile = new File([createAppStateExport(importedUserData, importedBankData)], "state.json", {
      type: "application/json",
    });
    await user.upload(screen.getByLabelText(/Import app state from JSON file/i), importFile);

    await waitFor(() => expect(screen.getByTestId("member-name")).toHaveTextContent("Avery"));
    expect(screen.getByTestId("user-source")).toHaveTextContent("imported");
    expect(screen.getByText("App state imported successfully.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reset to demo data/i }));
    expect(screen.getByRole("button", { name: /Confirm reset/i })).toBeInTheDocument();
    expect(screen.getByText("Press reset again to restore the seeded demo data.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirm reset/i }));
    await waitFor(() => expect(screen.getByTestId("member-name")).toHaveTextContent("Alex"));
    expect(screen.getByText("Local state reset to the seeded demo data.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Clear local data/i }));
    expect(screen.getByRole("button", { name: /Confirm clear/i })).toBeInTheDocument();
    expect(screen.getByText("Press clear again to remove the current browser copy and reload defaults.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirm clear/i }));
    await waitFor(() => expect(screen.getByTestId("member-name")).toHaveTextContent("Alex"));
    expect(screen.getByText("Browser-stored app data cleared and defaults restored.")).toBeInTheDocument();
  });
});