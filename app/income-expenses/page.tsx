"use client";

import { AppShell } from "@/components/app-shell";
import { IncomeExpensesEditor } from "@/components/household-data-entry";
import { PageHero } from "@/components/page-hero";

export default function IncomeExpensesPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Income & Expenses"
          title="Capture household cashflow inputs before serviceability assumptions are applied."
          description="This route mirrors the stitch information architecture but keeps the language grounded in calculator inputs instead of synthetic performance claims."
        />

        <IncomeExpensesEditor />
      </div>
    </AppShell>
  );
}