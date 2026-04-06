"use client";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { MetricCard } from "@/components/metric-card";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { AssetProjectionChart } from "@/charts/asset-projection-chart";
import { buildAssetProjectionSummary } from "@/engine/asset-projections";
import { calculateBorrowingPower } from "@/engine/borrowing-power";

export default function ResultsPage() {
  const { userData } = useAppData();
  const result = calculateBorrowingPower(userData.profile);
  const assetProjectionSummary = buildAssetProjectionSummary(userData.profile);
  const projectedAssetTotal = assetProjectionSummary.assetProjections.reduce(
    (total, projection) => total + projection.projected12MonthValue,
    0,
  );
  const netPosition = result.totalAssets - result.totalLiabilities;

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Results"
          title="Review borrowing outcomes, monthly cashflow, and projected asset balances in one results workspace."
          description="These results are produced from the persisted household profile by the calculation and projection engines, using current ATO tax bands plus member-level super contribution settings."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Borrowing power" value={`$${result.estimatedBorrowingPower.toLocaleString()}`} detail="Indicative maximum borrowing estimate." />
          <MetricCard label="Assessed rate" value={`${result.assessedRepaymentRate.toFixed(2)}%`} detail="Target rate plus serviceability buffer." />
          <MetricCard label="Monthly surplus" value={`$${result.monthlySurplus.toLocaleString()}`} detail="Serviceability surplus after assessed living costs and liabilities." />
          <MetricCard label="Net position" value={`$${netPosition.toLocaleString()}`} detail="Current assets less outstanding liabilities." />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Assets" value={`$${result.totalAssets.toLocaleString()}`} detail="Total asset position across the current household profile." />
          <MetricCard label="Liabilities" value={`$${result.totalLiabilities.toLocaleString()}`} detail="Outstanding balances before refinance modelling." />
          <MetricCard label="After-tax income" value={`$${assetProjectionSummary.afterTaxMonthlyIncome.toLocaleString()}/m`} detail="Estimated using ATO resident tax rates plus 2% Medicare levy." />
          <MetricCard label="Projected assets" value={`$${projectedAssetTotal.toLocaleString()}`} detail="Projected total asset balance 12 months after the current baseline." />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SectionCard title="Projected asset balances" subtitle="Cash and super projections use each asset reading date, expected monthly inputs, and annual growth assumptions.">
            <AssetProjectionChart points={assetProjectionSummary.timeline} />
          </SectionCard>

          <SectionCard title="Projection assumptions" subtitle="Defaults are prefilled from current Australian tax and super settings.">
            <div className="space-y-3 text-sm text-muted">
              <p>
                <span className="font-semibold text-ink">Super contribution baseline:</span>{" "}
                {(assetProjectionSummary.assumptions.superGuaranteeRate * 100).toFixed(0)}% default, overridden by each member&apos;s Super % where provided.
              </p>
              <p>
                <span className="font-semibold text-ink">Income tax basis:</span> ATO resident tax rates for 2025-26.
              </p>
              <p>
                <span className="font-semibold text-ink">Medicare levy:</span>{" "}
                {(assetProjectionSummary.assumptions.medicareLevyRate * 100).toFixed(0)}%.
              </p>
              <p>
                <span className="font-semibold text-ink">Default savings allocation:</span> 100% of remaining monthly after-tax cashflow after declared expenses and liabilities.
              </p>
              <p>
                <span className="font-semibold text-ink">Estimated monthly after-tax income:</span>{" "}
                ${assetProjectionSummary.afterTaxMonthlyIncome.toLocaleString()}.
              </p>
              <p>
                <span className="font-semibold text-ink">Declared monthly expenses:</span>{" "}
                ${assetProjectionSummary.monthlyDeclaredExpenses.toLocaleString()}.
              </p>
              <p>
                <span className="font-semibold text-ink">Monthly liabilities:</span>{" "}
                ${assetProjectionSummary.monthlyLiabilities.toLocaleString()}.
              </p>
              <p>
                <span className="font-semibold text-ink">Remaining monthly cashflow:</span>{" "}
                ${assetProjectionSummary.monthlySurplusAfterExpenses.toLocaleString()}.
              </p>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Projected asset inputs" subtitle="Review the default contribution logic and 12-month projections for each recorded asset.">
          <div className="space-y-3 lg:hidden">
            {assetProjectionSummary.assetProjections.map((projection) => (
              <article key={projection.assetId} className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
                <p className="font-semibold text-ink">{projection.label}</p>
                <div className="mt-3 space-y-1">
                  <p>Reading date: {projection.readingDate}</p>
                  <p>Current balance: ${projection.currentValue.toLocaleString()}</p>
                  <p>Monthly input: ${Math.round(projection.projectedMonthlyContribution).toLocaleString()}</p>
                  <p>Growth rate: {projection.annualGrowthRate.toFixed(1)}%</p>
                  <p>Projected 12-month balance: ${projection.projected12MonthValue.toLocaleString()}</p>
                  <p>{projection.suggestedContributionLabel}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm text-muted">
              <thead>
                <tr>
                  <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Asset</th>
                  <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Category</th>
                  <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Reading date</th>
                  <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Current</th>
                  <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Monthly input</th>
                  <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Growth</th>
                  <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">12m projected</th>
                </tr>
              </thead>
              <tbody>
                {assetProjectionSummary.assetProjections.map((projection) => (
                  <tr key={projection.assetId} className="rounded-[1.5rem] bg-surface-low">
                    <td className="rounded-l-[1.5rem] px-4 py-4 font-semibold text-ink">
                      <div>
                        <p>{projection.label}</p>
                        <p className="mt-1 text-xs font-normal text-muted">{projection.suggestedContributionLabel}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">{projection.category}</td>
                    <td className="px-4 py-4">{projection.readingDate}</td>
                    <td className="px-4 py-4">${projection.currentValue.toLocaleString()}</td>
                    <td className="px-4 py-4">${Math.round(projection.projectedMonthlyContribution).toLocaleString()}</td>
                    <td className="px-4 py-4">{projection.annualGrowthRate.toFixed(1)}%</td>
                    <td className="rounded-r-[1.5rem] px-4 py-4">${projection.projected12MonthValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Interpretation notes" subtitle="Current assumptions and important caveats for the results shown above.">
          <ul className="space-y-3 text-sm text-muted">
            <li>Outputs are indicative only and do not constitute financial advice.</li>
            <li>Borrowing power uses conservative expense treatment, shaded bonus and rental income, and HELP debt loadings.</li>
            <li>After-tax cashflow uses current ATO resident tax bands plus the 2% Medicare levy and does not model offsets, deductions, or family tax adjustments.</li>
            <li>Projected asset balances currently apply user-entered monthly inputs and annual growth assumptions over a 12-month forward view.</li>
            <li>Super defaults are prefilled from the current 12% super guarantee rate and can be overridden per asset.</li>
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}