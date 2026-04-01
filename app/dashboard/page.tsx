"use client";

import { useAppData } from "@/components/app-data-provider";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { SectionCard } from "@/components/section-card";
import { DashboardSessionPreference } from "@/components/session-navigation";
import { BorrowingPowerChart } from "@/charts/borrowing-power-chart";
import { calculateBorrowingPower } from "@/engine/borrowing-power";
import { buildScenarioSummaries } from "@/engine/scenario-summaries";

export default function DashboardPage() {
  const { userData, bankData } = useAppData();
  const result = calculateBorrowingPower(userData.profile);
  const scenarioSummaries = buildScenarioSummaries(userData, bankData);

  return (
    <AppShell>
      <DashboardSessionPreference />
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-primary px-8 py-10 text-white shadow-ambient sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">Dashboard</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Borrowing power, cashflow, and loan planning in one local-first workspace.
          </h1>
          <p className="mt-4 text-sm leading-7 text-blue-50 sm:text-base">
            Review indicative household borrowing outcomes, compare scenarios, and keep planning information within the browser.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Estimated borrowing"
            value={`$${result.estimatedBorrowingPower.toLocaleString()}`}
            detail={`Assessed at ${result.assessedRepaymentRate.toFixed(2)}% with current buffers.`}
          />
          <MetricCard
            label="Shaded annual income"
            value={`$${result.shadedAnnualIncome.toLocaleString()}`}
            detail="Includes bonus and rental shading plus HELP loading."
          />
          <MetricCard
            label="Monthly surplus"
            value={`$${result.monthlySurplus.toLocaleString()}`}
            detail="Available serviceability surplus after expense floors and liabilities."
          />
          <MetricCard
            label="Net asset position"
            value={`$${(result.totalAssets - result.totalLiabilities).toLocaleString()}`}
            detail="Assets less outstanding liabilities across the current profile."
          />
        </div>

        <div className="grid gap-6">
          <SectionCard
            title="Scenario comparison"
            subtitle="Recharts is wired in so the base app can support live comparisons once form state is connected."
          >
            <BorrowingPowerChart scenarios={scenarioSummaries} />
          </SectionCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Income foundation" subtitle="Multiple household members and shaded income sources.">
            <ul className="space-y-3 text-sm text-muted">
              {userData.profile.members.map((member) => (
                <li key={member.id} className="rounded-2xl bg-surface-low px-4 py-3">
                  <span className="block font-semibold text-ink">{member.name}</span>
                  <span className="block mt-1">Gross income ${member.annualGrossIncome.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Expense posture" subtitle="Declared living expenses versus conservative floors.">
            <div className="space-y-3 text-sm text-muted">
              {Object.entries(userData.profile.monthlyExpenses).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3">
                  <span className="capitalize text-ink">{label}</span>
                  <span>${value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="App structure" subtitle="Scaffolded route map from the stitch examples.">
            <ul className="space-y-3 text-sm text-muted">
              <li>Dashboard shell and primary metrics</li>
              <li>Income, assets, results, scenarios, lenders, about, and how-it-works routes</li>
              <li>Pure TypeScript lending engine separated from React</li>
              <li>Local storage hook ready for persisted state wiring</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}