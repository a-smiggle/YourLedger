"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ActiveDialog = "about" | null;

const aboutPrinciples = [
  "Keep household planning data on the device by default.",
  "Make assumptions visible so indicative results are easier to understand and review.",
  "Present borrowing and repayment outcomes in a format that is clear, professional, and easy to compare.",
];

export function DashboardInfoActions() {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!activeDialog) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveDialog(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDialog]);

  return (
    <>
      <div className="space-y-2">
        <Link
          href="/data-management"
          className="block w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold text-ink transition hover:bg-white"
        >
          Data Management
        </Link>
        <Link
          href="/how-it-works"
          className="block w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold text-ink transition hover:bg-white"
        >
          How This Works
        </Link>
        <button
          type="button"
          className="w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold text-ink transition hover:bg-white"
          onClick={() => setActiveDialog("about")}
        >
          About
        </button>
      </div>

      {activeDialog && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/35 p-4" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0"
                onClick={() => setActiveDialog(null)}
              />

              <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-surface p-7 shadow-ambient sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">About Your Ledger</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary">
                      A conservative, client-side planning tool for Australian households.
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-outline bg-surface-low px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-high"
                    onClick={() => setActiveDialog(null)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-8 space-y-6">
                  <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
                    Your Ledger is designed to help households understand borrowing capacity, cashflow, and loan options with clearer assumptions and more readable outputs. It is built for indicative planning, not for collecting or submitting an application.
                  </p>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-panel bg-surface-low p-6">
                      <h3 className="text-lg font-bold text-primary">Product position</h3>
                      <div className="mt-4 space-y-4 text-sm leading-7 text-muted">
                        <p>Your Ledger is intended to give households a clearer view of borrowing power, cashflow, and loan options before they move into formal advice or application stages.</p>
                        <p>The focus is on readable outputs, conservative assumptions, and a planning experience that feels professional without becoming opaque or overcomplicated.</p>
                      </div>
                    </section>

                    <section className="rounded-panel bg-surface-low p-6">
                      <h3 className="text-lg font-bold text-primary">Core principles</h3>
                      <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
                        {aboutPrinciples.map((principle) => (
                          <li key={principle} className="rounded-2xl bg-surface px-4 py-4">
                            {principle}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}