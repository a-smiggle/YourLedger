"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { MetricCard } from "@/components/metric-card";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { AssetProjectionChart } from "@/charts/asset-projection-chart";
import { ScenarioComparisonChart } from "@/charts/scenario-comparison-chart";
import { ScenarioFacilityChart } from "@/charts/scenario-facility-chart";
import { ScenarioOutcomeChart } from "@/charts/scenario-outcome-chart";
import { ScenarioSensitivityChart } from "@/charts/scenario-sensitivity-chart";
import { buildAssetProjectionSummary } from "@/engine/asset-projections";
import { calculateBorrowingPower } from "@/engine/borrowing-power";
import { buildScenarioProjectionSummaries, buildScenarioSensitivitySummaries } from "@/engine/scenario-projections";
import { buildScenarioSummaries, resolveBankInstitutions } from "@/engine/scenario-summaries";
import type { ScenarioProjectionPoint } from "@/types/domain";

const RESULTS_HORIZON_MONTHS = 360;
const RESULTS_HORIZON_YEARS = RESULTS_HORIZON_MONTHS / 12;
const RESULTS_YEARS_LABEL = `${RESULTS_HORIZON_YEARS}-year`;
const scenarioChartColors = ["#012169", "#2a7f62", "#c27b2f", "#8c3a1f", "#2563eb", "#8b5cf6", "#0f766e", "#be185d"];

type DetailTab = "payoff" | "facilities" | "sensitivity";
type ComparisonSort = "viability" | "repayment" | "wealth" | "debtReduction" | "interestSaved";

const comparisonSortOptions: { id: ComparisonSort; label: string }[] = [
  { id: "viability", label: "Viable first" },
  { id: "repayment", label: "Lowest repayment" },
  { id: "wealth", label: "Highest wealth" },
  { id: "debtReduction", label: "Fastest debt reduction" },
  { id: "interestSaved", label: "Most interest saved" },
];

const detailTabs: { id: DetailTab; label: string }[] = [
  { id: "payoff", label: "Payoff path" },
  { id: "facilities", label: "Facilities" },
  { id: "sensitivity", label: "Sensitivity" },
];

function formatOptionalCurrency(value?: number) {
  return value !== undefined ? `$${value.toLocaleString()}` : "Not set";
}

function formatGap(value?: number) {
  if (value === undefined) {
    return "Set a target";
  }

  const absoluteValue = Math.abs(value).toLocaleString();
  return value >= 0 ? `+$${absoluteValue}` : `-$${absoluteValue}`;
}

function formatOptionalPercentage(value?: number) {
  return value !== undefined ? `${value.toFixed(1)}%` : "Not applicable";
}

function formatFit(summary: ReturnType<typeof buildScenarioSummaries>[number] | undefined) {
  if (!summary) {
    return "No scenario";
  }

  if (summary.isProductEligible === undefined) {
    return "No product rule check";
  }

  return summary.isProductEligible ? "Eligible" : "Not eligible";
}

function formatFeatureList(features?: {
  offset: boolean;
  redraw: boolean;
  extraRepayments: boolean;
  portability: boolean;
}) {
  if (!features) {
    return "No product selected";
  }

  return [
    features.offset ? "Offset" : null,
    features.redraw ? "Redraw" : null,
    features.extraRepayments ? "Extra repayments" : null,
    features.portability ? "Portability" : null,
  ]
    .filter(Boolean)
    .join(", ") || "No feature highlights listed";
}

function buildComparisonTimelineData(
  rows: Array<{ scenarioId: string; timeline?: ScenarioProjectionPoint[] }>,
  valueSelector: (point: ScenarioProjectionPoint) => number,
) {
  const firstTimeline = rows.find((row) => row.timeline)?.timeline;

  if (!firstTimeline) {
    return [];
  }

  return firstTimeline.map((point, index) => {
    const comparisonPoint: Record<string, string | number | null> = {
      monthLabel: point.monthLabel,
    };

    rows.forEach((row) => {
      comparisonPoint[row.scenarioId] = row.timeline?.[index] ? valueSelector(row.timeline[index]) : null;
    });

    return comparisonPoint;
  });
}

export default function ResultsPage() {
  const { userData, setUserData, bankData } = useAppData();
  const [comparisonSort, setComparisonSort] = useState<ComparisonSort>("viability");
  const [showViableOnly, setShowViableOnly] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("payoff");

  const borrowingResult = calculateBorrowingPower(userData.profile);
  const scenarioSummaries = buildScenarioSummaries(userData, bankData);
  const scenarioProjectionSummaries = buildScenarioProjectionSummaries(userData, bankData, RESULTS_HORIZON_MONTHS);
  const scenarioSensitivitySummaries = buildScenarioSensitivitySummaries(userData, bankData, RESULTS_HORIZON_MONTHS);
  const assetProjectionSummary = buildAssetProjectionSummary(userData.profile, RESULTS_HORIZON_MONTHS);
  const resolvedBanks = resolveBankInstitutions(bankData);
  const scenarioSummaryMap = new Map(scenarioSummaries.flatMap((summary) => (summary.id ? [[summary.id, summary] as const] : [])));
  const scenarioProjectionMap = new Map(
    scenarioProjectionSummaries.flatMap((summary) => (summary.scenarioId ? [[summary.scenarioId, summary] as const] : [])),
  );
  const scenarioSensitivityMap = new Map(
    scenarioSensitivitySummaries.flatMap((summary) => (summary.scenarioId ? [[summary.scenarioId, summary] as const] : [])),
  );

  const comparisonRows = userData.scenarios.map((scenario) => {
    const summary = scenarioSummaryMap.get(scenario.id);
    const projection = scenarioProjectionMap.get(scenario.id);
    const sensitivity = scenarioSensitivityMap.get(scenario.id);
    const selectedPurchaseBank = scenario.bankId ? resolvedBanks.find((bank) => bank.id === scenario.bankId) : undefined;
    const selectedPurchaseProduct = scenario.productId
      ? selectedPurchaseBank?.products.find((product) => product.id === scenario.productId)
      : undefined;
    const selectedEquityBank = scenario.equityBankId ? resolvedBanks.find((bank) => bank.id === scenario.equityBankId) : undefined;
    const selectedEquityProduct = scenario.equityProductId
      ? selectedEquityBank?.products.find((product) => product.id === scenario.equityProductId)
      : undefined;

    return {
      scenario,
      summary,
      projection,
      sensitivity,
      selectedPurchaseBank,
      selectedPurchaseProduct,
      selectedEquityBank,
      selectedEquityProduct,
      isViable: Boolean(summary?.withinCapacity),
    };
  });

  const sortedComparisonRows = [...comparisonRows].sort((first, second) => {
    if (comparisonSort === "viability") {
      if (first.isViable !== second.isViable) {
        return first.isViable ? -1 : 1;
      }

      return (second.projection?.projectedWealth ?? 0) - (first.projection?.projectedWealth ?? 0);
    }

    if (comparisonSort === "repayment") {
      return (first.projection?.monthlyScenarioRepayment ?? Number.POSITIVE_INFINITY) - (second.projection?.monthlyScenarioRepayment ?? Number.POSITIVE_INFINITY);
    }

    if (comparisonSort === "wealth") {
      return (second.projection?.projectedWealth ?? 0) - (first.projection?.projectedWealth ?? 0);
    }

    if (comparisonSort === "debtReduction") {
      return (second.projection?.projectedDebtReduction ?? 0) - (first.projection?.projectedDebtReduction ?? 0);
    }

    return (second.projection?.projectedInterestSaved ?? 0) - (first.projection?.projectedInterestSaved ?? 0);
  });

  const visibleComparisonRows = sortedComparisonRows.filter((row) => (showViableOnly ? row.isViable : true));
  const activeScenarioId = userData.preferences.selectedScenarioId ?? comparisonRows[0]?.scenario.id ?? null;
  const selectedComparisonRow = comparisonRows.find((row) => row.scenario.id === activeScenarioId) ?? comparisonRows[0];
  const selectedScenario = selectedComparisonRow?.scenario;
  const selectedScenarioSummary = selectedComparisonRow?.summary;
  const selectedScenarioProjection = selectedComparisonRow?.projection;
  const selectedScenarioSensitivity = selectedComparisonRow?.sensitivity;
  const selectedPurchaseBank = selectedComparisonRow?.selectedPurchaseBank;
  const selectedPurchaseProduct = selectedComparisonRow?.selectedPurchaseProduct;
  const selectedEquityBank = selectedComparisonRow?.selectedEquityBank;
  const selectedEquityProduct = selectedComparisonRow?.selectedEquityProduct;
  const projectedAssetTotal = assetProjectionSummary.timeline[assetProjectionSummary.timeline.length - 1]?.totalProjectedAssets ?? 0;
  const viableScenarioCount = comparisonRows.filter((row) => row.isViable).length;
  const bestRankedScenario = visibleComparisonRows[0]?.scenario.label ?? "No scenarios";
  const comparisonSeries = visibleComparisonRows.map((row, index) => ({
    key: row.scenario.id,
    label: row.scenario.label,
    color: scenarioChartColors[index % scenarioChartColors.length],
  }));
  const comparisonTimelineRows = visibleComparisonRows.map((row) => ({
    scenarioId: row.scenario.id,
    timeline: row.projection?.timeline,
  }));
  const debtComparisonData = buildComparisonTimelineData(comparisonTimelineRows, (point) => point.totalDebtBalance);
  const wealthComparisonData = buildComparisonTimelineData(comparisonTimelineRows, (point) => point.totalWealth);
  const offsetComparisonData = buildComparisonTimelineData(comparisonTimelineRows, (point) => point.offsetBalance);
  const interestSavedComparisonData = buildComparisonTimelineData(comparisonTimelineRows, (point) => point.cumulativeInterestSaved);

  const handleSelectScenario = (scenarioId: string) => {
    setUserData((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        selectedScenarioId: scenarioId,
      },
    }));
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Results"
          title="Compare every saved scenario over the next 30 years before drilling into one deal in detail."
          description="Results now open on an all-scenario view first. Every timeline chart uses monthly points across the next 30 years, while the selected scenario detail remains available further down the page."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Saved scenarios"
            value={comparisonRows.length.toString()}
            detail="Every saved scenario is recalculated from the same household profile before comparison."
          />
          <MetricCard
            label="Viable scenarios"
            value={viableScenarioCount.toString()}
            detail="Viability currently reflects capacity plus the selected product and LVR checks."
          />
          <MetricCard
            label="Projection horizon"
            value={`${RESULTS_HORIZON_YEARS} years`}
            detail="Charts use monthly points, with sparse month labels shown on the axis for readability."
          />
          <MetricCard
            label="Selected scenario"
            value={selectedScenario?.label ?? "No scenario"}
            detail="Use any comparison card below to swap the drill-down detail without leaving Results."
          />
          <MetricCard
            label="Current top rank"
            value={bestRankedScenario}
            detail="This follows the active comparison sort and viable-only filter."
          />
        </div>

        <SectionCard
          title="Comparison controls"
          subtitle="Rank the scenarios by the outcome that matters most, and optionally hide anything that is not currently viable."
        >
          <div className="flex flex-wrap gap-3">
            {comparisonSortOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={[
                  "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors",
                  comparisonSort === option.id
                    ? "border-primary bg-primary text-white"
                    : "border-outline bg-white text-muted",
                ].join(" ")}
                onClick={() => setComparisonSort(option.id)}
              >
                {option.label}
              </button>
            ))}

            <button
              type="button"
              className={[
                "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors",
                showViableOnly
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-outline bg-white text-muted",
              ].join(" ")}
              onClick={() => setShowViableOnly((current) => !current)}
            >
              {showViableOnly ? "Showing viable only" : "Show viable only"}
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Scenario scorecards"
          subtitle={`Scan every scenario at once, then select one card to open its detailed ${RESULTS_YEARS_LABEL} payoff view below.`}
        >
          {visibleComparisonRows.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleComparisonRows.map((row, index) => {
                const isSelected = row.scenario.id === selectedScenario?.id;

                return (
                  <button
                    key={row.scenario.id}
                    type="button"
                    className={[
                      "rounded-[1.75rem] border p-5 text-left transition",
                      isSelected
                        ? "border-primary bg-primary text-white shadow-ambient"
                        : "border-outline bg-surface-low text-ink hover:border-primary/35 hover:bg-white",
                    ].join(" ")}
                    onClick={() => handleSelectScenario(row.scenario.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={[
                          "text-xs font-bold uppercase tracking-[0.18em]",
                          isSelected ? "text-blue-100" : "text-muted",
                        ].join(" ")}>{`Rank ${index + 1}`}</p>
                        <h2 className="mt-2 text-xl font-bold tracking-tight">{row.scenario.label}</h2>
                        <p className={[
                          "mt-2 text-sm leading-6",
                          isSelected ? "text-blue-50" : "text-muted",
                        ].join(" ")}>
                          {row.selectedPurchaseBank?.name ?? "No lender selected"}
                          {row.selectedPurchaseProduct ? ` · ${row.selectedPurchaseProduct.name}` : ""}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={[
                          "rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em]",
                          row.isViable
                            ? isSelected
                              ? "bg-white/15 text-white"
                              : "bg-primary-soft text-primary"
                            : isSelected
                              ? "bg-white/15 text-white"
                              : "bg-surface text-muted",
                        ].join(" ")}>
                          {row.isViable ? "Viable" : "Needs review"}
                        </span>
                        {isSelected ? (
                          <span className="rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className={isSelected ? "text-blue-100" : "text-muted"}>Monthly repayment</p>
                        <p className="mt-1 text-lg font-semibold">{formatOptionalCurrency(row.projection?.monthlyScenarioRepayment)}</p>
                      </div>
                      <div>
                        <p className={isSelected ? "text-blue-100" : "text-muted"}>Monthly surplus</p>
                        <p className="mt-1 text-lg font-semibold">{formatOptionalCurrency(row.projection?.monthlySurplusAfterScenarioRepayments)}</p>
                      </div>
                      <div>
                        <p className={isSelected ? "text-blue-100" : "text-muted"}>{RESULTS_YEARS_LABEL} wealth</p>
                        <p className="mt-1 text-lg font-semibold">{formatOptionalCurrency(row.projection?.projectedWealth)}</p>
                      </div>
                      <div>
                        <p className={isSelected ? "text-blue-100" : "text-muted"}>{RESULTS_YEARS_LABEL} debt reduction</p>
                        <p className="mt-1 text-lg font-semibold">{formatOptionalCurrency(row.projection?.projectedDebtReduction)}</p>
                      </div>
                      <div>
                        <p className={isSelected ? "text-blue-100" : "text-muted"}>{RESULTS_YEARS_LABEL} interest saved</p>
                        <p className="mt-1 text-lg font-semibold">{formatOptionalCurrency(row.projection?.projectedInterestSaved)}</p>
                      </div>
                      <div>
                        <p className={isSelected ? "text-blue-100" : "text-muted"}>Capacity gap</p>
                        <p className="mt-1 text-lg font-semibold">{formatGap(row.summary?.borrowingGap)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
              <p className="font-semibold text-ink">No scenarios match the current filter</p>
              <p className="mt-2 leading-6">Turn off the viable-only filter or create another scenario to keep the comparison view populated.</p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Comparison overview"
          subtitle={`All chart lines below are monthly projections across the next ${RESULTS_HORIZON_YEARS} years for the currently visible scenario set.`}
        >
          <div className="space-y-3 text-sm text-muted">
            <p>Each visible scenario is recalculated from the same household profile, then projected over the same {RESULTS_YEARS_LABEL} horizon using its own deal structure, products, rates, offset support, and property treatment.</p>
            <p>The charts below are designed for the cross-scenario questions first: which structure pays debt down fastest, which holds the most wealth, and which makes better use of offset and interest savings over time.</p>
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Total debt" subtitle={`Compare how quickly each scenario reduces total debt over ${RESULTS_YEARS_LABEL}.`}>
            {comparisonSeries.length > 0 ? (
              <ScenarioComparisonChart data={debtComparisonData} series={comparisonSeries} />
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">No comparison chart available</p>
                <p className="mt-2 leading-6">Add a scenario or widen the filter so the chart can compare debt paths across the visible set.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Total wealth" subtitle={`Compare projected liquid wealth plus property equity across ${RESULTS_YEARS_LABEL}.`}>
            {comparisonSeries.length > 0 ? (
              <ScenarioComparisonChart data={wealthComparisonData} series={comparisonSeries} />
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">No comparison chart available</p>
                <p className="mt-2 leading-6">Add a scenario or widen the filter so the chart can compare wealth outcomes across the visible set.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Offset balance" subtitle={`Compare offset accumulation over ${RESULTS_YEARS_LABEL} where the purchase facility supports offset.`}>
            {comparisonSeries.length > 0 ? (
              <ScenarioComparisonChart data={offsetComparisonData} series={comparisonSeries} />
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">No comparison chart available</p>
                <p className="mt-2 leading-6">Add a scenario or widen the filter so the chart can compare offset accumulation across the visible set.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Interest saved" subtitle={`Compare cumulative interest savings over ${RESULTS_YEARS_LABEL}.`}>
            {comparisonSeries.length > 0 ? (
              <ScenarioComparisonChart data={interestSavedComparisonData} series={comparisonSeries} />
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">No comparison chart available</p>
                <p className="mt-2 leading-6">Add a scenario or widen the filter so the chart can compare interest savings across the visible set.</p>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Scenario comparison table"
          subtitle={`Use the table for exact ${RESULTS_YEARS_LABEL} numbers after scanning the cards and comparison charts above.`}
        >
          {visibleComparisonRows.length > 0 ? (
            <>
              <div className="space-y-3 lg:hidden">
                {visibleComparisonRows.map((row) => (
                  <article key={row.scenario.id} className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{row.scenario.label}</p>
                      <span className="rounded-full bg-surface px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">
                        {row.isViable ? "Viable" : "Review"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <p>Total debt: {formatOptionalCurrency(row.summary?.requiredLoanAmount)}</p>
                      <p>Monthly repayment: {formatOptionalCurrency(row.projection?.monthlyScenarioRepayment)}</p>
                      <p>Monthly surplus: {formatOptionalCurrency(row.projection?.monthlySurplusAfterScenarioRepayments)}</p>
                      <p>{RESULTS_YEARS_LABEL} debt reduction: {formatOptionalCurrency(row.projection?.projectedDebtReduction)}</p>
                      <p>{RESULTS_YEARS_LABEL} interest saved: {formatOptionalCurrency(row.projection?.projectedInterestSaved)}</p>
                      <p>{RESULTS_YEARS_LABEL} wealth: {formatOptionalCurrency(row.projection?.projectedWealth)}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm text-muted">
                  <thead>
                    <tr>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Scenario</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Status</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Total debt</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Monthly repayment</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Monthly surplus</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">{RESULTS_YEARS_LABEL} debt reduction</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">{RESULTS_YEARS_LABEL} interest saved</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">{RESULTS_YEARS_LABEL} wealth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleComparisonRows.map((row) => (
                      <tr key={row.scenario.id} className="rounded-[1.5rem] bg-surface-low">
                        <td className="rounded-l-[1.5rem] px-4 py-4 font-semibold text-ink">{row.scenario.label}</td>
                        <td className="px-4 py-4">{row.isViable ? "Viable" : "Needs review"}</td>
                        <td className="px-4 py-4">{formatOptionalCurrency(row.summary?.requiredLoanAmount)}</td>
                        <td className="px-4 py-4">{formatOptionalCurrency(row.projection?.monthlyScenarioRepayment)}</td>
                        <td className="px-4 py-4">{formatOptionalCurrency(row.projection?.monthlySurplusAfterScenarioRepayments)}</td>
                        <td className="px-4 py-4">{formatOptionalCurrency(row.projection?.projectedDebtReduction)}</td>
                        <td className="px-4 py-4">{formatOptionalCurrency(row.projection?.projectedInterestSaved)}</td>
                        <td className="rounded-r-[1.5rem] px-4 py-4">{formatOptionalCurrency(row.projection?.projectedWealth)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
              <p className="font-semibold text-ink">No scenario comparisons yet</p>
              <p className="mt-2 leading-6">Create a scenario first so the app can compare full {RESULTS_YEARS_LABEL} payoff paths across different deal structures.</p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Selected scenario detail"
          subtitle={selectedScenario ? `${selectedScenario.label} is shown below as the drill-down scenario.` : "Choose a scenario card above to open detailed outputs here."}
        >
          {selectedScenario ? (
            <>
              <div className="mb-6 flex flex-wrap gap-3" role="tablist" aria-label="Selected scenario detail sections">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeDetailTab === tab.id}
                    className={[
                      "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors",
                      activeDetailTab === tab.id
                        ? "border-primary bg-primary text-white"
                        : "border-outline bg-white text-muted",
                    ].join(" ")}
                    onClick={() => setActiveDetailTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeDetailTab === "payoff" ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Total debt"
                      value={formatOptionalCurrency(selectedScenarioSummary?.requiredLoanAmount)}
                      detail="Purchase debt plus any equity release and refinanced home loan debt carried in the structure."
                    />
                    <MetricCard
                      label="Purchase loan"
                      value={formatOptionalCurrency(selectedScenarioSummary?.purchaseLoanAmount)}
                      detail="Debt attached to the target property after cash contribution and any equity release are applied."
                    />
                    <MetricCard
                      label="Borrowing power"
                      value={`$${(selectedScenarioSummary?.borrowingPower ?? borrowingResult.estimatedBorrowingPower).toLocaleString()}`}
                      detail="Indicative maximum borrowing estimate for the selected scenario."
                    />
                    <MetricCard
                      label="Capacity gap"
                      value={formatGap(selectedScenarioSummary?.borrowingGap)}
                      detail="Positive means the selected scenario remains inside indicative borrowing capacity before policy-fit checks."
                    />
                    <MetricCard
                      label="Product fit"
                      value={formatFit(selectedScenarioSummary)}
                      detail="Uses product loan amount and LVR rules against the purchase property and any retained existing property security."
                    />
                    <MetricCard
                      label="Purchase LVR"
                      value={formatOptionalPercentage(selectedScenarioSummary?.purchaseLvr)}
                      detail="Debt secured against the target property as a share of the target property value."
                    />
                    <MetricCard
                      label="Existing property LVR"
                      value={formatOptionalPercentage(selectedScenarioSummary?.existingPropertyLvr)}
                      detail="Debt remaining on the existing property, including equity release, as a share of the current property value."
                    />
                    <MetricCard
                      label="Usable offset"
                      value={formatOptionalCurrency(selectedScenarioSummary?.effectiveOffsetBalance)}
                      detail="Portion of the planned offset balance that can reduce the effective interest-bearing loan amount."
                    />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <SectionCard
                      title="Scenario payoff path"
                      subtitle={`Monthly debt, offset, wealth, and interest-saving path for the next ${RESULTS_HORIZON_YEARS} years.`}
                    >
                      {selectedScenarioProjection ? (
                        <ScenarioOutcomeChart points={selectedScenarioProjection.timeline} />
                      ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                          <p className="font-semibold text-ink">No scenario projection available</p>
                          <p className="mt-2 leading-6">Select a scenario first so the app can map repayments, offset savings, and wealth over time.</p>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard
                      title="Projection summary"
                      subtitle="The payoff model assumes monthly repayments stay constant and surplus cash is sent to offset when the purchase facility supports it."
                    >
                      <div className="space-y-3 text-sm text-muted">
                        <p><span className="font-semibold text-ink">Monthly after-tax income:</span> {formatOptionalCurrency(selectedScenarioProjection?.monthlyAfterTaxIncome)}.</p>
                        <p><span className="font-semibold text-ink">Declared monthly expenses:</span> {formatOptionalCurrency(selectedScenarioProjection?.monthlyDeclaredExpenses)}.</p>
                        <p><span className="font-semibold text-ink">Other monthly liabilities:</span> {formatOptionalCurrency(selectedScenarioProjection?.monthlyOtherLiabilities)}.</p>
                        <p><span className="font-semibold text-ink">Scenario facility repayments:</span> {formatOptionalCurrency(selectedScenarioProjection?.monthlyScenarioRepayment)}.</p>
                        <p><span className="font-semibold text-ink">Opening wealth:</span> {formatOptionalCurrency(selectedScenarioProjection?.openingTotalWealth)}.</p>
                        <p><span className="font-semibold text-ink">{RESULTS_YEARS_LABEL} ending debt:</span> {formatOptionalCurrency(selectedScenarioProjection?.projectedDebtBalance)}.</p>
                        <p><span className="font-semibold text-ink">{RESULTS_YEARS_LABEL} ending offset:</span> {formatOptionalCurrency(selectedScenarioProjection?.projectedOffsetBalance)}.</p>
                        <p><span className="font-semibold text-ink">{RESULTS_YEARS_LABEL} interest paid:</span> {formatOptionalCurrency(selectedScenarioProjection?.projectedInterestPaid)}.</p>
                        <p><span className="font-semibold text-ink">{RESULTS_YEARS_LABEL} projected wealth:</span> {formatOptionalCurrency(selectedScenarioProjection?.projectedWealth)}.</p>
                      </div>
                    </SectionCard>
                  </div>
                </div>
              ) : null}

              {activeDetailTab === "facilities" ? (
                <div className="space-y-6">
                  <SectionCard
                    title="Facility trajectories"
                    subtitle={`Tracks purchase debt, retained-property debt, and equity build-up by facility over ${RESULTS_YEARS_LABEL}.`}
                  >
                    {selectedScenarioProjection ? (
                      <ScenarioFacilityChart points={selectedScenarioProjection.timeline} />
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                        <p className="font-semibold text-ink">No facility trajectory available</p>
                        <p className="mt-2 leading-6">Select a scenario first so purchase and retained-property debt can be tracked separately over time.</p>
                      </div>
                    )}
                  </SectionCard>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <SectionCard title="Purchase facility" subtitle="Primary property loan product selected for this scenario.">
                      <div className="space-y-2 text-sm text-muted">
                        <p className="text-lg font-semibold text-ink">{selectedPurchaseProduct?.name ?? "No product selected"}</p>
                        <p>{selectedPurchaseBank?.name ?? "No lender selected"}</p>
                        <p><span className="font-semibold text-ink">Rate:</span> {selectedPurchaseProduct ? `${selectedPurchaseProduct.interestRate.toFixed(2)}%` : "Not set"}</p>
                        <p><span className="font-semibold text-ink">Comparison rate:</span> {selectedPurchaseProduct?.comparisonRate ? `${selectedPurchaseProduct.comparisonRate.toFixed(2)}%` : "Not listed"}</p>
                        <p><span className="font-semibold text-ink">Max LVR:</span> {selectedPurchaseProduct?.maxLvr ? `${selectedPurchaseProduct.maxLvr}%` : "Not listed"}</p>
                        <p><span className="font-semibold text-ink">Max term:</span> {selectedPurchaseProduct ? `${selectedPurchaseProduct.maxTermYears} years` : "Not set"}</p>
                        <p><span className="font-semibold text-ink">Features:</span> {formatFeatureList(selectedPurchaseProduct?.features)}</p>
                      </div>
                    </SectionCard>

                    <SectionCard title="Equity facility" subtitle="Retained-property product selected for this scenario, where applicable.">
                      {selectedScenario.propertyTreatment === "sell-and-use-cash" ? (
                        <div className="space-y-2 text-sm text-muted">
                          <p className="text-lg font-semibold text-ink">Not required</p>
                          <p>The selected scenario sells the current property and uses net proceeds as cash, so no retained-property facility is needed.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm text-muted">
                          <p className="text-lg font-semibold text-ink">{selectedEquityProduct?.name ?? "No product selected"}</p>
                          <p>{selectedEquityBank?.name ?? "No lender selected"}</p>
                          <p><span className="font-semibold text-ink">Rate:</span> {selectedEquityProduct ? `${selectedEquityProduct.interestRate.toFixed(2)}%` : "Not set"}</p>
                          <p><span className="font-semibold text-ink">Comparison rate:</span> {selectedEquityProduct?.comparisonRate ? `${selectedEquityProduct.comparisonRate.toFixed(2)}%` : "Not listed"}</p>
                          <p><span className="font-semibold text-ink">Max LVR:</span> {selectedEquityProduct?.maxLvr ? `${selectedEquityProduct.maxLvr}%` : "Not listed"}</p>
                          <p><span className="font-semibold text-ink">Max term:</span> {selectedEquityProduct ? `${selectedEquityProduct.maxTermYears} years` : "Not set"}</p>
                          <p><span className="font-semibold text-ink">Features:</span> {formatFeatureList(selectedEquityProduct?.features)}</p>
                        </div>
                      )}
                    </SectionCard>
                  </div>
                </div>
              ) : null}

              {activeDetailTab === "sensitivity" ? (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <SectionCard
                      title="Interest rate sensitivity"
                      subtitle={`Tests the selected scenario over ${RESULTS_YEARS_LABEL} with parallel rate shifts across both facilities.`}
                    >
                      {selectedScenarioSensitivity ? (
                        <ScenarioSensitivityChart points={selectedScenarioSensitivity.points} />
                      ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                          <p className="font-semibold text-ink">No sensitivity view available</p>
                          <p className="mt-2 leading-6">Select a scenario first so repayment, interest, and wealth can be tested at different rates.</p>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard
                      title="Sensitivity summary"
                      subtitle="All shocks move the purchase and equity facility rates together relative to the scenario base rate."
                    >
                      {selectedScenarioSensitivity ? (
                        <div className="space-y-3 text-sm text-muted">
                          {selectedScenarioSensitivity.points.map((point) => (
                            <div key={point.scenarioRateLabel} className="rounded-[1.25rem] bg-surface-low px-4 py-3">
                              <p className="font-semibold text-ink">{point.scenarioRateLabel}</p>
                              <p className="mt-1">Monthly repayment {formatOptionalCurrency(point.monthlyScenarioRepayment)}</p>
                              <p>Interest paid {formatOptionalCurrency(point.projectedInterestPaid)}</p>
                              <p>Interest saved {formatOptionalCurrency(point.projectedInterestSaved)}</p>
                              <p>Projected wealth {formatOptionalCurrency(point.projectedWealth)}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </SectionCard>
                  </div>

                  <SectionCard
                    title="Sensitivity table"
                    subtitle={`Review how the selected scenario changes across rate shocks over ${RESULTS_YEARS_LABEL}.`}
                  >
                    {selectedScenarioSensitivity ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm text-muted">
                          <thead>
                            <tr>
                              <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Rate shift</th>
                              <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Monthly repayment</th>
                              <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Interest paid</th>
                              <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Interest saved</th>
                              <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Ending debt</th>
                              <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Ending wealth</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedScenarioSensitivity.points.map((point) => (
                              <tr key={point.scenarioRateLabel} className="rounded-[1.5rem] bg-surface-low">
                                <td className="rounded-l-[1.5rem] px-4 py-4 font-semibold text-ink">{point.scenarioRateLabel}</td>
                                <td className="px-4 py-4">{formatOptionalCurrency(point.monthlyScenarioRepayment)}</td>
                                <td className="px-4 py-4">{formatOptionalCurrency(point.projectedInterestPaid)}</td>
                                <td className="px-4 py-4">{formatOptionalCurrency(point.projectedInterestSaved)}</td>
                                <td className="px-4 py-4">{formatOptionalCurrency(point.projectedDebtBalance)}</td>
                                <td className="rounded-r-[1.5rem] px-4 py-4">{formatOptionalCurrency(point.projectedWealth)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                        <p className="font-semibold text-ink">No sensitivity table available</p>
                        <p className="mt-2 leading-6">Select a scenario first so rate-shock outcomes can be reviewed in detail.</p>
                      </div>
                    )}
                  </SectionCard>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
              <p className="font-semibold text-ink">No selected scenario</p>
              <p className="mt-2 leading-6">Create or select a scenario first so the drill-down section can show payoff, facility, and sensitivity detail.</p>
            </div>
          )}
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SectionCard title="Projected asset balances" subtitle={`Profile-level asset projections now use the same ${RESULTS_YEARS_LABEL} monthly horizon as the scenario charts.`}>
            <AssetProjectionChart points={assetProjectionSummary.timeline} />
          </SectionCard>

          <SectionCard title="Profile projection summary" subtitle="These asset projections remain separate from the scenario-specific debt model above.">
            <div className="space-y-3 text-sm text-muted">
              <p><span className="font-semibold text-ink">{RESULTS_YEARS_LABEL} projected assets:</span> ${projectedAssetTotal.toLocaleString()}.</p>
              <p><span className="font-semibold text-ink">Estimated monthly after-tax income:</span> ${assetProjectionSummary.afterTaxMonthlyIncome.toLocaleString()}.</p>
              <p><span className="font-semibold text-ink">Declared monthly expenses:</span> ${assetProjectionSummary.monthlyDeclaredExpenses.toLocaleString()}.</p>
              <p><span className="font-semibold text-ink">Monthly liabilities:</span> ${assetProjectionSummary.monthlyLiabilities.toLocaleString()}.</p>
              <p><span className="font-semibold text-ink">Remaining monthly cashflow:</span> ${assetProjectionSummary.monthlySurplusAfterExpenses.toLocaleString()}.</p>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Projected asset inputs" subtitle={`Review the default contribution logic and ${RESULTS_YEARS_LABEL} projections for each recorded asset.`}>
          <div className="space-y-3 lg:hidden">
            {assetProjectionSummary.assetProjections.map((projection) => (
              <article key={projection.assetId} className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
                <p className="font-semibold text-ink">{projection.label}</p>
                <div className="mt-3 space-y-1">
                  <p>Reading date: {projection.readingDate}</p>
                  <p>Current balance: ${projection.currentValue.toLocaleString()}</p>
                  <p>Monthly input: ${Math.round(projection.projectedMonthlyContribution).toLocaleString()}</p>
                  <p>Growth rate: {projection.annualGrowthRate.toFixed(1)}%</p>
                  <p>Projected {RESULTS_YEARS_LABEL} balance: ${projection.projectedHorizonValue.toLocaleString()}</p>
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
                  <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">{RESULTS_HORIZON_YEARS}y projected</th>
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
                    <td className="rounded-r-[1.5rem] px-4 py-4">${projection.projectedHorizonValue.toLocaleString()}</td>
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
            <li>Total debt includes the purchase loan, any equity release, and any existing home loan balance marked for refinance in the scenario.</li>
            <li>Product fit currently checks product minimum and maximum loan sizes plus max LVR against both the purchase property and any retained existing property security.</li>
            <li>Scenario payoff charts now project monthly points across the next {RESULTS_HORIZON_YEARS} years and render sparse month labels for readability.</li>
            <li>Interest-rate sensitivity applies the same rate shock to both the purchase facility and the equity facility, while keeping income, expenses, and growth assumptions unchanged.</li>
            <li>Offset treatment is indicative only and currently reduces the effective repayment balance rather than modelling full amortisation behaviour over time.</li>
            <li>After-tax cashflow uses current ATO resident tax bands plus the 2% Medicare levy and does not model deductions or family tax adjustments.</li>
            <li>Profile asset projections also use a {RESULTS_YEARS_LABEL} horizon, but they remain separate from the scenario-specific debt structure and product-fit calculations.</li>
            <li>Super defaults are prefilled from the current 12% super guarantee rate and can be overridden per asset.</li>
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
