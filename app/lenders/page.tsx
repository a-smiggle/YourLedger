"use client";

import { useState, type CSSProperties, type FocusEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { FeedbackBanner } from "@/components/feedback-banner";
import { GeneralInformationNotice } from "@/components/general-information-notice";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { buildProductComparisonSummary, buildScenarioSummaries, resolveBankInstitutions } from "@/engine/scenario-summaries";
import type { BankData, ScenarioSummary, UserData, UserScenario } from "@/types/domain";

type ResolvedBankInstitution = ReturnType<typeof resolveBankInstitutions>[number];
type ResolvedBankProduct = ResolvedBankInstitution["products"][number];
type LoanPurposeFilter = "all" | ResolvedBankProduct["loanPurpose"];
type FeatureFilter = "all" | keyof ResolvedBankProduct["features"];
type LenderDirectoryRow = {
  lender: ResolvedBankInstitution;
  product: ResolvedBankProduct;
};
type HoverPopupPosition = {
  x: number;
  y: number;
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function syncSelectedScenarioId(scenarios: UserScenario[], preferredId?: string | null) {
  if (preferredId && scenarios.some((scenario) => scenario.id === preferredId)) {
    return preferredId;
  }

  return scenarios[0]?.id ?? null;
}

function updateScenarioStore(userData: UserData, scenarios: UserScenario[], preferredSelectedId?: string | null): UserData {
  return {
    ...userData,
    scenarios,
    preferences: {
      ...userData.preferences,
      selectedScenarioId: syncSelectedScenarioId(scenarios, preferredSelectedId ?? userData.preferences.selectedScenarioId),
    },
    meta: {
      ...userData.meta,
      updatedAt: new Date().toISOString(),
      source: "manual",
    },
  };
}

function getVisibleProducts(bank: ResolvedBankInstitution) {
  return bank.products.filter((product) => !product.isHidden);
}

function getAvailableBanks(bankData: BankData) {
  return resolveBankInstitutions(bankData)
    .map((bank) => ({ ...bank, products: getVisibleProducts(bank) }))
    .filter((bank) => bank.products.length > 0);
}

function buildScenarioLabel(bank: ResolvedBankInstitution, product: ResolvedBankProduct, existingScenarios: UserScenario[]) {
  const baseLabel = `${bank.shortName ?? bank.name} ${product.name}`;

  if (!existingScenarios.some((scenario) => scenario.label === baseLabel)) {
    return baseLabel;
  }

  let copyIndex = 2;
  let nextLabel = `${baseLabel} ${copyIndex}`;

  while (existingScenarios.some((scenario) => scenario.label === nextLabel)) {
    copyIndex += 1;
    nextLabel = `${baseLabel} ${copyIndex}`;
  }

  return nextLabel;
}

function fieldClassName(hasError = false) {
  return [
    "mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink outline-none transition-colors",
    hasError ? "border-warning ring-1 ring-warning/30" : "border-outline focus:border-primary",
  ].join(" ");
}

function formatPolicyTurnaround(lender: ResolvedBankInstitution) {
  if (!lender.turnaroundTimeBusinessDays) {
    return "Turnaround not provided";
  }

  return `${lender.turnaroundTimeBusinessDays.minBusinessDays}-${lender.turnaroundTimeBusinessDays.maxBusinessDays} business days`;
}

function formatFeatureList(product: ResolvedBankProduct) {
  return [
    product.features.offset ? "Offset" : null,
    product.features.redraw ? "Redraw" : null,
    product.features.extraRepayments ? "Extra repayments" : null,
    product.features.portability ? "Portability" : null,
  ]
    .filter(Boolean)
    .join(", ") || "No feature highlights listed";
}

function formatProductPurpose(product: ResolvedBankProduct) {
  return `${product.loanPurpose.replace(/-/g, " ")} · ${product.repaymentType.replace(/-/g, " ")}`;
}

function formatOptionalCurrency(value?: number) {
  return value !== undefined ? `$${value.toLocaleString()}` : "Not set";
}

function formatGapCurrency(value?: number) {
  if (value === undefined) {
    return "Set a deal first";
  }

  const absoluteValue = Math.abs(value).toLocaleString();
  return value >= 0 ? `+$${absoluteValue}` : `-$${absoluteValue}`;
}

function formatEligibilityState(summary?: ScenarioSummary) {
  if (!summary) {
    return "Unavailable";
  }

  if (summary.isProductEligible === undefined) {
    return "No rule check";
  }

  return summary.isProductEligible ? "Eligible" : "Not eligible";
}

function buildLenderDirectoryRows(banks: ResolvedBankInstitution[]): LenderDirectoryRow[] {
  return banks.flatMap((lender) => lender.products.map((product) => ({ lender, product })));
}

function getScenarioSummaryMap(summaries: ScenarioSummary[]) {
  return new Map(summaries.flatMap((summary) => (summary.id ? [[summary.id, summary] as const] : [])));
}

function getDesktopPopupStyle(position: HoverPopupPosition | null): CSSProperties | undefined {
  if (!position || typeof window === "undefined") {
    return undefined;
  }

  const popupWidth = 384;
  const popupHeight = 440;
  const offset = 18;
  const gutter = 16;
  const left =
    position.x + popupWidth + offset > window.innerWidth - gutter
      ? Math.max(gutter, position.x - popupWidth - offset)
      : position.x + offset;
  const top =
    position.y + popupHeight + offset > window.innerHeight - gutter
      ? Math.max(gutter, position.y - popupHeight - offset)
      : position.y + offset;

  return {
    left,
    top,
  };
}

function ProductDetailPanel({
  row,
  onClose,
}: Readonly<{
  row: LenderDirectoryRow;
  onClose?: () => void;
}>) {
  const { lender, product } = row;

  return (
    <div className="rounded-panel bg-surface p-5 shadow-ambient">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Product details</p>
          <h3 id={onClose ? "mobile-product-detail-title" : undefined} className="mt-2 text-lg font-bold text-primary">{product.name}</h3>
          <p className="mt-1 text-sm text-muted">{lender.name}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-outline bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-4 text-sm text-muted">
        <div>
          <p className="font-semibold text-ink">Purpose</p>
          <p className="mt-1 leading-6">{formatProductPurpose(product)}</p>
        </div>

        <div>
          <p className="font-semibold text-ink">Policy snapshot</p>
          <div className="mt-2 space-y-1 leading-6">
            <p>{lender.profileSummary ?? "No narrative policy summary is stored for this lender yet. Use the turnaround, assessment buffer, and product settings below as the current comparison inputs."}</p>
            <p>{formatPolicyTurnaround(lender)}</p>
            <p>Assessment buffer {lender.creditPolicy.assessmentBuffer.toFixed(2)}%</p>
          </div>
        </div>

        <div>
          <p className="font-semibold text-ink">Product settings</p>
          <div className="mt-2 space-y-1 leading-6">
            <p>Rate {product.interestRate.toFixed(2)}%</p>
            <p>Comparison rate {product.comparisonRate ? `${product.comparisonRate.toFixed(2)}%` : "Not listed"}</p>
            <p>Max LVR {product.maxLvr ? `${product.maxLvr}%` : "Not listed"}</p>
            <p>Max term {product.maxTermYears} years</p>
          </div>
        </div>

        <div>
          <p className="font-semibold text-ink">Features</p>
          <p className="mt-1 leading-6">{formatFeatureList(product)}</p>
        </div>

        {product.notes && product.notes.length > 0 ? (
          <div>
            <p className="font-semibold text-ink">Notes</p>
            <p className="mt-1 leading-6">{product.notes.join(" ")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LendersPage() {
  const router = useRouter();
  const { userData, bankData, setUserData } = useAppData();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [pendingRemoveScenarioId, setPendingRemoveScenarioId] = useState<string | null>(null);
  const [lenderFilter, setLenderFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState<LoanPurposeFilter>("all");
  const [featureFilter, setFeatureFilter] = useState<FeatureFilter>("all");
  const [comparisonFacility, setComparisonFacility] = useState<"purchase" | "equity">("purchase");
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [hoverPopupPosition, setHoverPopupPosition] = useState<HoverPopupPosition | null>(null);
  const [openedProductId, setOpenedProductId] = useState<string | null>(null);
  const banks = getAvailableBanks(bankData);
  const scenarioSummaries = buildScenarioSummaries(userData, bankData);
  const scenarioSummaryMap = getScenarioSummaryMap(scenarioSummaries);
  const lenderDirectoryRows = buildLenderDirectoryRows(banks);
  const filteredRows = lenderDirectoryRows.filter(({ lender, product }) => {
    if (lenderFilter !== "all" && lender.id !== lenderFilter) {
      return false;
    }

    if (purposeFilter !== "all" && product.loanPurpose !== purposeFilter) {
      return false;
    }

    if (featureFilter !== "all" && !product.features[featureFilter]) {
      return false;
    }

    return true;
  });
  const activeDesktopRow = hoveredProductId
    ? filteredRows.find(({ product }) => product.id === hoveredProductId) ?? null
    : null;
  const openedRow = openedProductId
    ? lenderDirectoryRows.find(({ product }) => product.id === openedProductId) ?? null
    : null;
  const hasFiltersApplied = lenderFilter !== "all" || purposeFilter !== "all" || featureFilter !== "all";
  const desktopPopupStyle = getDesktopPopupStyle(hoverPopupPosition);
  const lastRefreshedLabel = bankData.refresh.lastRefreshedAt
    ? new Date(bankData.refresh.lastRefreshedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not refreshed yet";
  const selectedScenarioId = syncSelectedScenarioId(userData.scenarios, userData.preferences.selectedScenarioId);
  const selectedScenario = userData.scenarios.find((scenario) => scenario.id === selectedScenarioId);
  const selectedScenarioSummary = selectedScenario ? scenarioSummaryMap.get(selectedScenario.id) : undefined;
  const activeComparisonFacility = selectedScenario?.propertyTreatment === "sell-and-use-cash" ? "purchase" : comparisonFacility;
  const filteredComparisons = selectedScenario
    ? filteredRows.map((row) => ({
        ...row,
        comparison: buildProductComparisonSummary(
          userData,
          bankData,
          selectedScenario,
          row.lender.id,
          row.product.id,
          activeComparisonFacility,
        ),
      }))
    : [];

  const updateScenario = (scenarioId: string, updater: (scenario: UserScenario) => UserScenario) => {
    setUserData((currentUserData) => {
      const nextScenarios = currentUserData.scenarios.map((scenario) =>
        scenario.id === scenarioId ? updater(scenario) : scenario,
      );

      return updateScenarioStore(currentUserData, nextScenarios);
    });
  };

  const handleSelectScenario = (scenarioId: string) => {
    setUserData((currentUserData) => ({
      ...currentUserData,
      preferences: {
        ...currentUserData.preferences,
        selectedScenarioId: syncSelectedScenarioId(currentUserData.scenarios, scenarioId),
      },
      meta: {
        ...currentUserData.meta,
        updatedAt: new Date().toISOString(),
        source: "manual",
      },
    }));

    setPendingRemoveScenarioId(null);
    setFeedback({ tone: "info", message: "Selected scenario updated. Product comparisons now use this deal brief." });
  };

  const handleRemoveScenario = (scenarioId: string) => {
    if (pendingRemoveScenarioId !== scenarioId) {
      setPendingRemoveScenarioId(scenarioId);
      setFeedback({ tone: "info", message: "Press remove again to delete this selected product from the comparison set." });
      return;
    }

    let removedLabel: string | null = null;

    setUserData((currentUserData) => {
      const scenarioIndex = currentUserData.scenarios.findIndex((scenario) => scenario.id === scenarioId);

      if (scenarioIndex < 0) {
        return currentUserData;
      }

      removedLabel = currentUserData.scenarios[scenarioIndex]?.label ?? null;

      const nextScenarios = currentUserData.scenarios.filter((scenario) => scenario.id !== scenarioId);
      const fallbackSelectedId =
        nextScenarios[scenarioIndex]?.id ?? nextScenarios[scenarioIndex - 1]?.id ?? nextScenarios[0]?.id ?? null;
      const preferredSelectedId =
        currentUserData.preferences.selectedScenarioId === scenarioId
          ? fallbackSelectedId
          : currentUserData.preferences.selectedScenarioId;

      return updateScenarioStore(currentUserData, nextScenarios, preferredSelectedId);
    });

    setPendingRemoveScenarioId(null);
    setFeedback({ tone: "success", message: `${removedLabel ?? "Scenario"} removed from selected products.` });
  };

  const handleCreateScenarioFromProduct = (bank: ResolvedBankInstitution, product: ResolvedBankProduct) => {
    setUserData((currentUserData) => {
      const nextScenario: UserScenario = {
        id: createId("scenario"),
        label: buildScenarioLabel(bank, product, currentUserData.scenarios),
        description: `Comparison using ${bank.name} ${product.name}.`,
        bankId: bank.id,
        productId: product.id,
        targetInterestRate: product.interestRate,
        assessmentBuffer: bank.creditPolicy.assessmentBuffer,
        loanTermYears: Math.min(currentUserData.profile.loanTermYears, product.maxTermYears),
      };

      return updateScenarioStore(currentUserData, [...currentUserData.scenarios, nextScenario], nextScenario.id);
    });

    setPendingRemoveScenarioId(null);
    setFeedback({ tone: "success", message: `${bank.name} ${product.name} added as a new selected product scenario.` });
  };

  const handleAssignProductToSelectedScenario = (bank: ResolvedBankInstitution, product: ResolvedBankProduct) => {
    if (!selectedScenario) {
      handleCreateScenarioFromProduct(bank, product);
      return;
    }

    updateScenario(selectedScenario.id, (scenario) => ({
      ...scenario,
      bankId: activeComparisonFacility === "purchase" ? bank.id : scenario.bankId,
      productId: activeComparisonFacility === "purchase" ? product.id : scenario.productId,
      equityBankId: activeComparisonFacility === "equity" ? bank.id : scenario.equityBankId,
      equityProductId: activeComparisonFacility === "equity" ? product.id : scenario.equityProductId,
      targetInterestRate:
        activeComparisonFacility === "purchase" ? product.interestRate : scenario.targetInterestRate,
      assessmentBuffer:
        activeComparisonFacility === "purchase" ? bank.creditPolicy.assessmentBuffer : scenario.assessmentBuffer,
      loanTermYears: Math.min(scenario.loanTermYears ?? userData.profile.loanTermYears, product.maxTermYears),
      description: scenario.description || `Comparison using ${bank.name} ${product.name}.`,
    }));

    setPendingRemoveScenarioId(null);
    setFeedback({ tone: "success", message: `${selectedScenario.label} now uses ${bank.name} ${product.name} for the ${activeComparisonFacility} facility.` });
  };

  const handleOpenScenario = (scenarioId: string) => {
    setUserData((currentUserData) => ({
      ...currentUserData,
      preferences: {
        ...currentUserData.preferences,
        selectedScenarioId: syncSelectedScenarioId(currentUserData.scenarios, scenarioId),
      },
      meta: {
        ...currentUserData.meta,
        updatedAt: new Date().toISOString(),
        source: "manual",
      },
    }));

    router.push("/scenarios");
  };

  const handleRowMouseEnter = (productId: string, event: MouseEvent<HTMLTableRowElement>) => {
    setHoveredProductId(productId);
    setHoverPopupPosition({ x: event.clientX, y: event.clientY });
  };

  const handleRowMouseMove = (event: MouseEvent<HTMLTableRowElement>) => {
    setHoverPopupPosition({ x: event.clientX, y: event.clientY });
  };

  const handleRowFocus = (productId: string, event: FocusEvent<HTMLTableRowElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();

    setHoveredProductId(productId);
    setHoverPopupPosition({ x: bounds.right, y: bounds.top + 24 });
  };

  const clearHoveredProduct = (productId?: string) => {
    setHoveredProductId((current) => (productId && current !== productId ? current : null));
    setHoverPopupPosition((current) => (productId && hoveredProductId !== productId ? current : null));
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Lenders"
          title="Shortlist lenders against the active deal brief and compare which products actually fit the loan you need."
          description="Use the scenario deal setup first, then compare products here by total debt, borrowing headroom, repayment, and offset support before saving a lender to that scenario."
        />

        <GeneralInformationNotice
          storageKey="lenders-overview"
          body="Lender and product comparisons summarise the current stored policy and product data for planning purposes. Always confirm rates, policy, fees, and eligibility with the lender or broker channel before acting on a shortlist."
        />

        {feedback ? <FeedbackBanner tone={feedback.tone} message={feedback.message} /> : null}

        <SectionCard
          title="Selected products"
          subtitle="Each selected product becomes a scenario. Capture how you plan to use it here before moving on to the target property step."
        >
          {userData.scenarios.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {userData.scenarios.map((scenario) => {
                const purchaseBank = banks.find((candidate) => candidate.id === scenario.bankId);
                const purchaseProduct = purchaseBank?.products.find((candidate) => candidate.id === scenario.productId);
                const equityBank = banks.find((candidate) => candidate.id === scenario.equityBankId);
                const equityProduct = equityBank?.products.find((candidate) => candidate.id === scenario.equityProductId);
                const isSelected = scenario.id === selectedScenarioId;

                return (
                  <article
                    key={scenario.id}
                    className={[
                      "rounded-[1.5rem] border p-5",
                      isSelected ? "border-primary bg-blue-50/70" : "border-outline bg-surface-low",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{scenario.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          Purchase: {purchaseBank?.name ?? "No lender selected"} · {purchaseProduct?.name ?? "No product selected"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          {scenario.propertyTreatment === "sell-and-use-cash"
                            ? "Existing property: Sold and used as cash"
                            : `Equity: ${equityBank?.name ?? "No lender selected"} · ${equityProduct?.name ?? "No product selected"}`}
                        </p>
                      </div>
                      {isSelected ? (
                        <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                          Selected
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4">
                      <label className="block text-sm font-medium text-ink">
                        <span>Scenario label</span>
                        <input
                          value={scenario.label}
                          onChange={(event) =>
                            updateScenario(scenario.id, (currentScenario) => ({
                              ...currentScenario,
                              label: event.target.value,
                            }))
                          }
                          className={fieldClassName(!scenario.label.trim())}
                          placeholder="Purchase comparison"
                        />
                      </label>

                      <label className="block text-sm font-medium text-ink">
                        <span>How this product will be used</span>
                        <textarea
                          value={scenario.productUsage ?? ""}
                          onChange={(event) =>
                            updateScenario(scenario.id, (currentScenario) => ({
                              ...currentScenario,
                              productUsage: event.target.value || undefined,
                            }))
                          }
                          className={`${fieldClassName()} min-h-24 resize-y`}
                          placeholder="Owner occupier purchase, refinance, offset strategy, debt consolidation, or another use case."
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-outline bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted"
                        onClick={() => handleSelectScenario(scenario.id)}
                      >
                        {isSelected ? "Editing" : "Select"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-outline bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted"
                        onClick={() => handleOpenScenario(scenario.id)}
                      >
                        Set target in scenarios
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-outline bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted"
                        onClick={() => handleRemoveScenario(scenario.id)}
                        aria-pressed={pendingRemoveScenarioId === scenario.id}
                      >
                        {pendingRemoveScenarioId === scenario.id ? "Confirm remove" : "Remove"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
              <p className="font-semibold text-ink">No products selected yet</p>
              <p className="mt-2 leading-6">
                Review the lender directory below and add each product you want to compare. You can capture the intended use for each one here.
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Loaded lender directory"
          subtitle={selectedScenarioSummary
            ? `Comparing products against ${selectedScenario.label}. Last refreshed ${lastRefreshedLabel}.`
            : `Loaded from BankData with overrides applied. Last refreshed ${lastRefreshedLabel}.`}
        >
          <div className="space-y-5">
            {selectedScenarioSummary ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[1.5rem] border border-outline bg-surface-low px-4 py-4 text-sm text-muted">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Active target</p>
                  <p className="mt-2 font-semibold text-ink">{formatOptionalCurrency(selectedScenarioSummary.targetPropertyValue)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-outline bg-surface-low px-4 py-4 text-sm text-muted">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Purchase loan</p>
                  <p className="mt-2 font-semibold text-ink">{formatOptionalCurrency(selectedScenarioSummary.purchaseLoanAmount)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-outline bg-surface-low px-4 py-4 text-sm text-muted">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Total debt</p>
                  <p className="mt-2 font-semibold text-ink">{formatOptionalCurrency(selectedScenarioSummary.requiredLoanAmount)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-outline bg-surface-low px-4 py-4 text-sm text-muted">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Current equity</p>
                  <p className="mt-2 font-semibold text-ink">{formatOptionalCurrency(selectedScenarioSummary.currentEquity)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-outline bg-surface-low px-4 py-4 text-sm text-muted">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Offset planned</p>
                  <p className="mt-2 font-semibold text-ink">{formatOptionalCurrency(selectedScenarioSummary.plannedOffsetBalance)}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">Set up the deal first</p>
                <p className="mt-2 leading-6">
                  Go to Scenarios and define the property target, cash contribution, equity release, refinanced debt, and offset plan before comparing lenders here.
                </p>
              </div>
            )}

            {selectedScenario ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={[
                    "rounded-[1.5rem] border px-4 py-4 text-left text-sm transition-colors",
                    activeComparisonFacility === "purchase" ? "border-primary bg-blue-50/70" : "border-outline bg-white",
                  ].join(" ")}
                  onClick={() => setComparisonFacility("purchase")}
                >
                  <p className="font-semibold text-ink">Compare purchase facility</p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Tests products against the target property loan and purchase LVR.
                  </p>
                </button>
                <button
                  type="button"
                  className={[
                    "rounded-[1.5rem] border px-4 py-4 text-left text-sm transition-colors",
                    activeComparisonFacility === "equity" ? "border-primary bg-blue-50/70" : "border-outline bg-white",
                    selectedScenario.propertyTreatment === "sell-and-use-cash" ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                  onClick={() => {
                    if (selectedScenario.propertyTreatment !== "sell-and-use-cash") {
                      setComparisonFacility("equity");
                    }
                  }}
                  disabled={selectedScenario.propertyTreatment === "sell-and-use-cash"}
                >
                  <p className="font-semibold text-ink">Compare equity facility</p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Tests products against retained-property debt, including refinance and equity release.
                  </p>
                </button>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-4">
              <label className="block text-sm font-medium text-ink">
                <span>Lender</span>
                <select value={lenderFilter} onChange={(event) => setLenderFilter(event.target.value)} className={fieldClassName()}>
                  <option value="all">All lenders</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                <span>Purpose</span>
                <select
                  value={purposeFilter}
                  onChange={(event) => setPurposeFilter(event.target.value as LoanPurposeFilter)}
                  className={fieldClassName()}
                >
                  <option value="all">All purposes</option>
                  <option value="owner-occupier">Owner occupier</option>
                  <option value="investment">Investment</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                <span>Feature</span>
                <select
                  value={featureFilter}
                  onChange={(event) => setFeatureFilter(event.target.value as FeatureFilter)}
                  className={fieldClassName()}
                >
                  <option value="all">All features</option>
                  <option value="offset">Offset</option>
                  <option value="redraw">Redraw</option>
                  <option value="extraRepayments">Extra repayments</option>
                  <option value="portability">Portability</option>
                </select>
              </label>

              <div className="flex items-end gap-3">
                <div className="flex-1 rounded-[1.5rem] border border-outline bg-surface-low px-4 py-3 text-sm text-muted">
                  {filteredRows.length} products shown for the {activeComparisonFacility} facility
                </div>
                {hasFiltersApplied ? (
                  <button
                    type="button"
                    className="rounded-full border border-outline bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted"
                    onClick={() => {
                      setLenderFilter("all");
                      setPurposeFilter("all");
                      setFeatureFilter("all");
                      setHoveredProductId(null);
                      setHoverPopupPosition(null);
                    }}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            <p className="text-xs leading-5 text-muted">
              Hover a row on desktop to inspect more detail. On mobile, use Details to open the product sheet.
            </p>

            {selectedScenario && filteredComparisons.length > 0 ? (
              <div className="relative">
                <div
                  className="overflow-x-auto"
                  onMouseLeave={() => {
                    setHoveredProductId(null);
                    setHoverPopupPosition(null);
                  }}
                >
                  <table className="min-w-[860px] border-separate border-spacing-y-3 text-left text-sm text-muted">
                    <thead>
                      <tr>
                        <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Lender</th>
                        <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Product</th>
                        <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Total debt</th>
                        <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Fit</th>
                        <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Max borrowing</th>
                        <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Gap</th>
                        <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Repayment</th>
                        <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComparisons.map(({ lender, product, comparison }) => {
                        const isActive = hoveredProductId === product.id;

                        return (
                          <tr
                            key={product.id}
                            tabIndex={0}
                            onMouseEnter={(event) => handleRowMouseEnter(product.id, event)}
                            onMouseMove={handleRowMouseMove}
                            onFocus={(event) => handleRowFocus(product.id, event)}
                            onBlur={() => clearHoveredProduct(product.id)}
                            className="align-top outline-none"
                          >
                            <td className={["rounded-l-[1.5rem] px-4 py-4", isActive ? "bg-blue-50" : "bg-surface-low"].join(" ")}>
                              <div className="min-w-[11rem] space-y-1">
                                <p className="font-semibold text-ink">{lender.name}</p>
                                <p className="text-xs leading-5 text-muted">{formatPolicyTurnaround(lender)}</p>
                              </div>
                            </td>
                            <td className={["px-4 py-4", isActive ? "bg-blue-50" : "bg-surface-low"].join(" ")}>
                              <div className="min-w-[16rem] space-y-1">
                                <p className="font-semibold text-ink">{product.name}</p>
                                <p className="text-xs leading-5 text-muted">{formatProductPurpose(product)}</p>
                              </div>
                            </td>
                            <td className={["px-4 py-4", isActive ? "bg-blue-50" : "bg-surface-low"].join(" ")}>
                              {formatOptionalCurrency(comparison?.requiredLoanAmount)}
                            </td>
                            <td className={["px-4 py-4", isActive ? "bg-blue-50" : "bg-surface-low"].join(" ")}>
                              <div className="min-w-[11rem] space-y-1">
                                <p className={comparison?.isProductEligible === false ? "font-semibold text-warning" : "font-semibold text-ink"}>
                                  {formatEligibilityState(comparison)}
                                </p>
                                {comparison?.eligibilityIssues?.[0] ? (
                                  <p className="text-xs leading-5 text-muted">{comparison.eligibilityIssues[0]}</p>
                                ) : null}
                              </div>
                            </td>
                            <td className={["px-4 py-4 font-semibold text-ink", isActive ? "bg-blue-50" : "bg-surface-low"].join(" ")}>
                              {comparison ? formatOptionalCurrency(comparison.borrowingPower) : "Unavailable"}
                            </td>
                            <td className={["px-4 py-4", isActive ? "bg-blue-50" : "bg-surface-low"].join(" ")}>
                              {formatGapCurrency(comparison?.borrowingGap)}
                            </td>
                            <td className={["px-4 py-4", isActive ? "bg-blue-50" : "bg-surface-low"].join(" ")}>
                              {comparison ? formatOptionalCurrency(comparison.monthlyRepayment) : "Unavailable"}
                            </td>
                            <td className={["rounded-r-[1.5rem] px-4 py-4", isActive ? "bg-blue-50" : "bg-surface-low"].join(" ")}>
                              <div className="flex min-w-[12rem] flex-col gap-2">
                                <button
                                  type="button"
                                  className="rounded-full border border-outline bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted xl:hidden"
                                  onClick={() => setOpenedProductId(product.id)}
                                >
                                  Details
                                </button>
                                <button
                                  type="button"
                                  className={[
                                    "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white",
                                    comparison?.isProductEligible === false ? "bg-slate-300" : "bg-primary",
                                  ].join(" ")}
                                  onClick={() => handleCreateScenarioFromProduct(lender, product)}
                                  disabled={comparison?.isProductEligible === false}
                                  title={comparison?.eligibilityIssues?.[0]}
                                >
                                  Use in new scenario
                                </button>
                                <button
                                  type="button"
                                  className={[
                                    "rounded-full border border-outline bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted",
                                    comparison?.isProductEligible === false ? "cursor-not-allowed opacity-60" : "",
                                  ].join(" ")}
                                  onClick={() => handleAssignProductToSelectedScenario(lender, product)}
                                  disabled={comparison?.isProductEligible === false}
                                  title={comparison?.eligibilityIssues?.[0]}
                                >
                                  {selectedScenario
                                    ? `Use for selected ${activeComparisonFacility} facility`
                                    : "Use for new selection"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {activeDesktopRow ? (
                  <div
                    className="pointer-events-none fixed z-40 hidden w-[24rem] xl:block"
                    style={desktopPopupStyle}
                  >
                    <ProductDetailPanel row={activeDesktopRow} />
                  </div>
                ) : null}
              </div>
            ) : selectedScenario ? (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">No products match those filters</p>
                <p className="mt-2 leading-6">Adjust or reset the filters to bring products back into view.</p>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">No active deal brief</p>
                <p className="mt-2 leading-6">Create a scenario first, then this table will compare products against the total debt and planned offset position.</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {openedRow ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close product details"
            className="absolute inset-0 bg-primary/35"
            onClick={() => setOpenedProductId(null)}
          />
          <div className="relative flex min-h-full items-center justify-center p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="mobile-product-detail-title" className="relative w-full max-w-lg">
              <ProductDetailPanel row={openedRow} onClose={() => setOpenedProductId(null)} />
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}