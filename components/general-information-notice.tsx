"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";

type GeneralInformationNoticeProps = {
  storageKey: string;
  title?: string;
  body?: string;
  acknowledgeLabel?: string;
};

const defaultBody =
  "Outputs are indicative planning estimates only. They should be checked against current lender policy, formal credit assessment, and personal financial or credit advice before any decision is made.";

export function GeneralInformationNotice({
  storageKey,
  title = "General information only",
  body = defaultBody,
  acknowledgeLabel = "Acknowledge",
}: Readonly<GeneralInformationNoticeProps>) {
  const [isAcknowledged, setIsAcknowledged, isLoaded] = useLocalStorage<boolean>(
    `your-ledger:notice-acknowledged:${storageKey}`,
    false,
  );

  if (!isLoaded || isAcknowledged) {
    return null;
  }

  return (
    <section className="rounded-panel border border-outline bg-white p-5 shadow-ambient" role="note" aria-label={title}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Important</p>
          <h2 className="mt-2 text-lg font-bold tracking-tight text-primary">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
        </div>

        <button
          type="button"
          className="shrink-0 rounded-full border border-outline bg-surface-low px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-high"
          onClick={() => setIsAcknowledged(true)}
        >
          {acknowledgeLabel}
        </button>
      </div>
    </section>
  );
}