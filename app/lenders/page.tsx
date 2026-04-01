"use client";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { resolveBankInstitutions } from "@/engine/scenario-summaries";

export default function LendersPage() {
  const { bankData } = useAppData();
  const banks = resolveBankInstitutions(bankData);
  const lastRefreshedLabel = bankData.refresh.lastRefreshedAt
    ? new Date(bankData.refresh.lastRefreshedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not refreshed yet";

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Lenders"
          title="A base directory for lender notes, filters, and future comparison criteria."
          description="The route exists because it is part of the stitch IA, but the app base keeps it as neutral comparison tooling rather than promotional copy."
        />

        <SectionCard
          title="Sample lender directory"
          subtitle={`Loaded from BankData with overrides applied. Last refreshed ${lastRefreshedLabel}.`}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {banks.map((lender) => (
              <article key={lender.id} className="rounded-2xl bg-surface-low p-5 text-sm text-muted">
                <h3 className="text-lg font-bold text-primary">{lender.name}</h3>
                <p className="mt-3">Credit profile: {lender.profileSummary ?? "Policy details pending."}</p>
                <p className="mt-2">
                  Typical turnaround:{" "}
                  {lender.turnaroundTimeBusinessDays
                    ? `${lender.turnaroundTimeBusinessDays.minBusinessDays}-${lender.turnaroundTimeBusinessDays.maxBusinessDays} business days`
                    : "Not provided"}
                </p>
                <p className="mt-2">Products loaded: {lender.products.length}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}