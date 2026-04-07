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
          description="Start here. Once income, bonus, rental income, HELP settings, and living costs are current, move to Assets & Liabilities to complete the household position."
        />

        <IncomeExpensesEditor />
      </div>
    </AppShell>
  );
}