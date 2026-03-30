import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { calculateBorrowingPower } from "@/engine/borrowing-power";
import { demoProfile } from "@/modules/demo-data";

export default function ResultsPage() {
  const result = calculateBorrowingPower(demoProfile);

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Results"
          title="Present borrowing power outcomes in a way that is conservative, legible, and testable."
          description="The seeded result here is produced by the pure TypeScript serviceability function, not by hard-coded UI values."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Borrowing power" value={`$${result.estimatedBorrowingPower.toLocaleString()}`} detail="Indicative maximum borrowing estimate." />
          <MetricCard label="Assessed rate" value={`${result.assessedRepaymentRate.toFixed(2)}%`} detail="Target rate plus serviceability buffer." />
          <MetricCard label="Assets" value={`$${result.totalAssets.toLocaleString()}`} detail="Total asset position across seeded data." />
          <MetricCard label="Liabilities" value={`$${result.totalLiabilities.toLocaleString()}`} detail="Outstanding balances before refinance modelling." />
        </div>

        <SectionCard title="Interpretation notes" subtitle="Placeholder result commentary, ready for rule-driven explanations.">
          <ul className="space-y-3 text-sm text-muted">
            <li>Outputs are indicative only and do not constitute financial advice.</li>
            <li>Living expenses are assessed using the higher of declared costs and a conservative floor.</li>
            <li>Bonus and rental income are shaded before serviceability is calculated.</li>
            <li>Future rule packs can move into the config folder without changing component APIs.</li>
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}