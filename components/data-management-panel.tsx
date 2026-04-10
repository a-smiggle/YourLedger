"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

import { useAppData } from "@/components/app-data-provider";

type FeedbackState = {
  tone: "success" | "error" | "info";
  message: string;
};

type ConfirmAction = "reset" | "clear" | null;

function feedbackClassName(tone: FeedbackState["tone"]) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "error") {
    return "border-warning/30 bg-warning/10 text-warning";
  }

  return "border-outline bg-surface-low text-muted";
}

export function DataManagementPanel() {
  const { exportAppState, importAppState, resetAppData, clearLocalData, storageRecoveryNotices } = useAppData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const handleExport = () => {
    const jsonText = exportAppState();
    const fileName = `your-ledger-export-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([jsonText], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
    setFeedback({ tone: "success", message: "Full app state exported to a JSON file." });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      const jsonText = await selectedFile.text();
      importAppState(jsonText);
      setFeedback({ tone: "success", message: "App state imported successfully." });
      setConfirmAction(null);
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Import failed. Check that the file is a valid Your Ledger export.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const handleReset = () => {
    if (confirmAction !== "reset") {
      setConfirmAction("reset");
      setFeedback({ tone: "info", message: "Press reset again to restore the seeded demo data." });
      return;
    }

    resetAppData();
    setConfirmAction(null);
    setFeedback({ tone: "success", message: "Local state reset to the seeded demo data." });
  };

  const handleClear = () => {
    if (confirmAction !== "clear") {
      setConfirmAction("clear");
      setFeedback({ tone: "info", message: "Press clear again to remove the current browser copy and reload defaults." });
      return;
    }

    clearLocalData();
    setConfirmAction(null);
    setFeedback({ tone: "success", message: "Browser-stored app data cleared and defaults restored." });
  };

  return (
    <div className="space-y-4">
      {storageRecoveryNotices.map((notice) => (
        <div key={notice.key} className="rounded-[1.25rem] border border-warning/30 bg-warning/10 px-4 py-4 text-sm text-warning">
          <p className="font-semibold">{notice.title}</p>
          <p className="mt-2 leading-6">{notice.message}</p>
        </div>
      ))}

      {feedback ? (
        <div className={`rounded-[1.25rem] border px-4 py-4 text-sm leading-6 ${feedbackClassName(feedback.tone)}`}>
          {feedback.message}
        </div>
      ) : null}

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          onClick={handleExport}
        >
          Export JSON
        </button>

        <button
          type="button"
          className="rounded-2xl border border-outline bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-surface-low"
          onClick={handleImportClick}
        >
          Import JSON
        </button>

        <button
          type="button"
          className="rounded-2xl border border-outline bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-surface-low"
          onClick={handleReset}
        >
          {confirmAction === "reset" ? "Confirm reset" : "Reset to demo data"}
        </button>

        <button
          type="button"
          className="rounded-2xl border border-warning/30 bg-white px-4 py-3 text-sm font-semibold text-warning transition hover:bg-warning/10"
          onClick={handleClear}
        >
          {confirmAction === "clear" ? "Confirm clear" : "Clear local data"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
          <p className="font-semibold text-ink">Export and import</p>
          <p className="mt-2 leading-6">Export saves the full app state, including household data, scenarios, bank overrides, and preferences, into a single JSON file that can be restored later.</p>
        </div>

        <div className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
          <p className="font-semibold text-ink">Recovery and schema handling</p>
          <p className="mt-2 leading-6">Saved browser data is validated on load. Corrupt or partial payloads fall back to safe defaults, and newer unsupported schema versions are blocked instead of being applied silently.</p>
        </div>
      </div>
    </div>
  );
}