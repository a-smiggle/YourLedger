"use client";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";

export default function IncomeExpensesPage() {
  const { userData } = useAppData();

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Income & Expenses"
          title="Capture household cashflow inputs before serviceability assumptions are applied."
          description="This route mirrors the stitch information architecture but keeps the language grounded in calculator inputs instead of synthetic performance claims."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Income sources" subtitle="Household income captured from the persisted app profile.">
            <div className="space-y-4">
              {userData.profile.members.map((member) => (
                <div key={member.id} className="rounded-2xl bg-surface-low p-4 text-sm text-muted">
                  <p className="font-semibold text-ink">{member.name}</p>
                  <p className="mt-2">Salary ${member.annualGrossIncome.toLocaleString()}</p>
                  <p>Bonus ${member.annualBonusIncome.toLocaleString()}</p>
                  <p>Rental ${member.annualRentalIncome.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Monthly expenses" subtitle="Current living costs from the persisted household profile.">
            <div className="space-y-3">
              {Object.entries(userData.profile.monthlyExpenses).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3 text-sm">
                  <span className="capitalize text-ink">{label}</span>
                  <span className="text-muted">${value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}