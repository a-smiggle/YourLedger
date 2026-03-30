import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { BorrowingPowerChart } from "@/charts/borrowing-power-chart";
import { scenarioSummaries } from "@/modules/demo-data";

export default function ScenariosPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Scenarios"
          title="Compare lenders, rates, and offset strategies without mixing scenario math into components."
          description="This route is the base for bank-vs-bank and offset-vs-no-offset comparisons described in the README."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SectionCard title="Borrowing power comparison" subtitle="Seeded scenarios from demo data.">
            <BorrowingPowerChart scenarios={scenarioSummaries} />
          </SectionCard>

          <SectionCard title="Scenario list" subtitle="Static data until form state and rule packs are wired in.">
            <div className="space-y-3">
              {scenarioSummaries.map((scenario) => (
                <div key={scenario.label} className="rounded-2xl bg-surface-low px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">{scenario.label}</p>
                  <p className="mt-2">Borrowing power ${scenario.borrowingPower.toLocaleString()}</p>
                  <p>Repayment ${scenario.monthlyRepayment.toLocaleString()} per month</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}