"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { GeneralInformationNotice } from "@/components/general-information-notice";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { DealFitChart } from "@/charts/deal-fit-chart";
import { buildScenarioSummaries, resolveBankInstitutions } from "@/engine/scenario-summaries";
import type { ScenarioSummary, UserData, UserScenario } from "@/types/domain";

type ResolvedBankInstitution = ReturnType<typeof resolveBankInstitutions>[number];
type ResolvedBankProduct = ResolvedBankInstitution["products"][number];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getVisibleProducts(bank: ResolvedBankInstitution) {
  return bank.products.filter((product) => !product.isHidden);
}

function getAvailableBanks(bankData: Parameters<typeof resolveBankInstitutions>[0]) {
  return resolveBankInstitutions(bankData)
    .map((bank) => ({ ...bank, products: getVisibleProducts(bank) }))
    .filter((bank) => bank.products.length > 0);
}

function createStarterScenario(userData: UserData, order: number): UserScenario {
  const availableCash = userData.profile.assets.reduce(
    (total, asset) => (asset.category === "cash" ? total + asset.value : total),
    0,
  );
  const currentHomeLoanBalance = userData.profile.liabilities.reduce(
    (total, liability) => (liability.category === "home-loan" ? total + liability.balance : total),
    0,
  );

  return {
    id: createId("scenario"),
    label: `Scenario ${order}`,
    description: "Deal setup for comparing lenders against a real purchase or refinance brief.",
    propertyTreatment: "equity-release",
    cashContribution: Math.round(availableCash),
    hasOffsetAccount: false,
    equityReleaseAmount: 0,
    refinanceExistingLoanAmount: Math.round(currentHomeLoanBalance),
    offsetBalance: 0,
    targetInterestRate: userData.profile.targetInterestRate,
    assessmentBuffer: userData.profile.assessmentBuffer,
    loanTermYears: userData.profile.loanTermYears,
  };
}

function buildDuplicateLabel(label: string, existingScenarios: UserScenario[]) {
  const baseLabel = `${label} copy`;
  let nextLabel = baseLabel;
  let copyIndex = 2;

  while (existingScenarios.some((scenario) => scenario.label === nextLabel)) {
    nextLabel = `${baseLabel} ${copyIndex}`;
    copyIndex += 1;
  }

  return nextLabel;
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

function parseOptionalNumberInput(value: string) {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalIntegerInput(value: string) {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.trunc(parsed);
}

function fieldClassName(hasError = false) {
  return [
    "mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink outline-none transition-colors",
    hasError ? "border-warning ring-1 ring-warning/30" : "border-outline focus:border-primary",
  ].join(" ");
}

function formatScenarioCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function formatOptionalCurrency(value?: number) {
  return value !== undefined ? formatScenarioCurrency(value) : "Not set yet";
}

function formatGapCurrency(value?: number) {
  if (value === undefined) {
    return "Set a target to compare capacity";
  }

  const absoluteValue = Math.abs(value).toLocaleString();
  return value >= 0 ? `+$${absoluteValue}` : `-$${absoluteValue}`;
}

function formatOptionalPercentage(value?: number) {
  return value !== undefined ? `${value.toFixed(1)}%` : "Not applicable";
}

function formatEligibility(summary?: ScenarioSummary) {
  if (!summary) {
    return "Unavailable";
  }

  if (summary.isProductEligible === undefined) {
    return "No product selected";
  }

  return summary.isProductEligible ? "Eligible" : "Not eligible";
}

function getScenarioSummaryMap(summaries: ScenarioSummary[]) {
  return new Map(summaries.flatMap((summary) => (summary.id ? [[summary.id, summary] as const] : [])));
}

function getEffectiveScenarioValues(
  userData: UserData,
  scenario: UserScenario,
  bank?: ResolvedBankInstitution,
  product?: ResolvedBankProduct,
) {
  return {
    targetInterestRate: scenario.targetInterestRate ?? product?.interestRate ?? userData.profile.targetInterestRate,
    assessmentBuffer: scenario.assessmentBuffer ?? bank?.creditPolicy.assessmentBuffer ?? userData.profile.assessmentBuffer,
    loanTermYears: scenario.loanTermYears ?? userData.profile.loanTermYears,
  };
}

export default function ScenariosPage() {
  const { userData, bankData, setUserData } = useAppData();
  const availableBanks = getAvailableBanks(bankData);
  const scenarioSummaries = buildScenarioSummaries(userData, bankData);
  const scenarioSummaryMap = getScenarioSummaryMap(scenarioSummaries);
  const hasScenarios = userData.scenarios.length > 0;
  const selectedScenarioId = syncSelectedScenarioId(userData.scenarios, userData.preferences.selectedScenarioId);
  const selectedScenario = userData.scenarios.find((scenario) => scenario.id === selectedScenarioId);
  const selectedBank = selectedScenario ? availableBanks.find((bank) => bank.id === selectedScenario.bankId) : undefined;
  const selectedProduct = selectedScenario ? selectedBank?.products.find((product) => product.id === selectedScenario.productId) : undefined;
  const selectedEquityBank = selectedScenario ? availableBanks.find((bank) => bank.id === selectedScenario.equityBankId) : undefined;
  const selectedEquityProduct = selectedScenario
    ? selectedEquityBank?.products.find((product) => product.id === selectedScenario.equityProductId)
    : undefined;
  const selectedSummary = selectedScenario ? scenarioSummaryMap.get(selectedScenario.id) : undefined;
  const selectedEffectiveValues = selectedScenario
    ? getEffectiveScenarioValues(userData, selectedScenario, selectedBank, selectedProduct)
    : undefined;

  const updateScenario = (scenarioId: string, updater: (scenario: UserScenario) => UserScenario) => {
    setUserData((currentUserData) => {
      const nextScenarios = currentUserData.scenarios.map((scenario) =>
        scenario.id === scenarioId ? updater(scenario) : scenario,
      );

      return updateScenarioStore(currentUserData, nextScenarios);
    });
  };

  const handleCreateStarterScenario = () => {
    setUserData((currentUserData) => {
      const starterScenario = createStarterScenario(currentUserData, currentUserData.scenarios.length + 1);
      return updateScenarioStore(currentUserData, [...currentUserData.scenarios, starterScenario], starterScenario.id);
    });
  };

  const handleDuplicateScenario = (scenarioId: string) => {
    setUserData((currentUserData) => {
      const sourceScenario = currentUserData.scenarios.find((scenario) => scenario.id === scenarioId);

      if (!sourceScenario) {
        return currentUserData;
      }

      const sourceIndex = currentUserData.scenarios.findIndex((scenario) => scenario.id === scenarioId);
      const duplicateScenario = {
        ...sourceScenario,
        id: createId("scenario"),
        label: buildDuplicateLabel(sourceScenario.label, currentUserData.scenarios),
      };
      const nextScenarios = [...currentUserData.scenarios];
      nextScenarios.splice(sourceIndex + 1, 0, duplicateScenario);

      return updateScenarioStore(currentUserData, nextScenarios, duplicateScenario.id);
    });
  };

  const handleDeleteScenario = (scenarioId: string) => {
    setUserData((currentUserData) => {
      const scenarioIndex = currentUserData.scenarios.findIndex((scenario) => scenario.id === scenarioId);

      if (scenarioIndex < 0) {
        return currentUserData;
      }

      const nextScenarios = currentUserData.scenarios.filter((scenario) => scenario.id !== scenarioId);
      const fallbackSelectedId =
        nextScenarios[scenarioIndex]?.id ?? nextScenarios[scenarioIndex - 1]?.id ?? nextScenarios[0]?.id ?? null;
      const preferredSelectedId =
        currentUserData.preferences.selectedScenarioId === scenarioId
          ? fallbackSelectedId
          : currentUserData.preferences.selectedScenarioId;

      return updateScenarioStore(currentUserData, nextScenarios, preferredSelectedId);
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
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Scenarios"
          title="Define the deal first: property target, funding mix, and offset plan before you shortlist lenders."
          description="Use this step to set the property target, decide whether the current property is kept or sold, then shape cash, equity release, refinance debt, and offset position. The lenders step then compares products against that debt structure."
        />

        <GeneralInformationNotice
          storageKey="scenarios-overview"
          body="Scenario comparisons show how the current deal structure interacts with household capacity and stored lender settings. They are planning outputs only and should be rechecked once product selection, valuation, and policy interpretation are confirmed."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SectionCard
            title="Deal fit comparison"
            subtitle="Compare the total debt each scenario carries against the borrowing power it currently produces."
          >
            <DealFitChart scenarios={scenarioSummaries} />
          </SectionCard>

          <SectionCard
            title="Scenario list"
            subtitle="Create and manage deal setups before sending them to the lenders directory for product comparison."
          >
            {hasScenarios ? (
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full rounded-full bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white"
                  onClick={handleCreateStarterScenario}
                >
                  Add deal scenario
                </button>

                {userData.scenarios.map((scenario) => {
                  const isSelected = scenario.id === selectedScenarioId;
                  const summary = scenarioSummaryMap.get(scenario.id);
                  const purchaseBank = availableBanks.find((candidate) => candidate.id === scenario.bankId);
                  const purchaseProduct = purchaseBank?.products.find((candidate) => candidate.id === scenario.productId);
                  const equityBank = availableBanks.find((candidate) => candidate.id === scenario.equityBankId);
                  const equityProduct = equityBank?.products.find((candidate) => candidate.id === scenario.equityProductId);

                  return (
                    <article
                      key={scenario.id}
                      className={[
                        "rounded-[1.5rem] border px-4 py-4 text-sm transition-colors",
                        isSelected ? "border-primary bg-blue-50/70" : "border-outline bg-surface-low",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{scenario.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                            Purchase: {purchaseBank?.shortName ?? purchaseBank?.name ?? "No lender"} · {purchaseProduct?.name ?? "No product selected"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                            {scenario.propertyTreatment === "sell-and-use-cash"
                              ? "Existing property sold for cash"
                              : `Equity: ${equityBank?.shortName ?? equityBank?.name ?? "No lender"} · ${equityProduct?.name ?? "No product selected"}`}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-1 text-muted">
                        <p>Target property {formatOptionalCurrency(summary?.targetPropertyValue)}</p>
                        <p>Total debt {formatOptionalCurrency(summary?.requiredLoanAmount)}</p>
                        <p>Capacity gap {formatGapCurrency(summary?.borrowingGap)}</p>
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
                          onClick={() => handleDuplicateScenario(scenario.id)}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-outline bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted"
                          onClick={() => handleDeleteScenario(scenario.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">No deal scenarios yet</p>
                <p className="mt-2 leading-6">
                  Start with a deal setup so the app knows what property value, deposit, equity release, refinanced debt, and offset position it should compare lenders against.
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
                  onClick={handleCreateStarterScenario}
                >
                  Create first scenario
                </button>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title={selectedScenario ? `Deal setup for ${selectedScenario.label}` : "Deal setup"}
          subtitle="Set the target property, funding mix, existing debt treatment, and offset position here before comparing lenders."
        >
          {selectedScenario ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-ink">
                  <span>Scenario label</span>
                  <input
                    value={selectedScenario.label}
                    onChange={(event) =>
                      updateScenario(selectedScenario.id, (scenario) => ({
                        ...scenario,
                        label: event.target.value,
                      }))
                    }
                    className={fieldClassName(!selectedScenario.label.trim())}
                    placeholder="Refinance comparison"
                  />
                </label>

                <label className="block text-sm font-medium text-ink">
                  <span>Target property value</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={selectedScenario.targetPropertyValue ?? ""}
                    onChange={(event) =>
                      updateScenario(selectedScenario.id, (scenario) => ({
                        ...scenario,
                        targetPropertyValue: parseOptionalNumberInput(event.target.value),
                      }))
                    }
                    className={fieldClassName(
                      selectedScenario.targetPropertyValue !== undefined && selectedScenario.targetPropertyValue < 0,
                    )}
                    placeholder="1250000"
                  />
                  <p className="mt-2 text-xs text-muted">Set the purchase or refinance target this scenario needs to fund.</p>
                </label>

                <label className="block text-sm font-medium text-ink md:col-span-2">
                  <span>Current property treatment</span>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      className={[
                        "rounded-[1.5rem] border px-4 py-4 text-left text-sm transition-colors",
                        (selectedScenario.propertyTreatment ?? "equity-release") === "equity-release"
                          ? "border-primary bg-blue-50/70"
                          : "border-outline bg-white",
                      ].join(" ")}
                      onClick={() =>
                        updateScenario(selectedScenario.id, (scenario) => ({
                          ...scenario,
                          propertyTreatment: "equity-release",
                          refinanceExistingLoanAmount:
                            scenario.refinanceExistingLoanAmount ?? Math.round(selectedSummary?.currentHomeLoanBalance ?? 0),
                        }))
                      }
                    >
                      <p className="font-semibold text-ink">Keep property and use equity</p>
                      <p className="mt-2 text-xs leading-5 text-muted">
                        Borrow against the current property up to 80% LVR and optionally refinance the existing home loan into the new structure.
                      </p>
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-[1.5rem] border px-4 py-4 text-left text-sm transition-colors",
                        selectedScenario.propertyTreatment === "sell-and-use-cash"
                          ? "border-primary bg-blue-50/70"
                          : "border-outline bg-white",
                      ].join(" ")}
                      onClick={() =>
                        updateScenario(selectedScenario.id, (scenario) => ({
                          ...scenario,
                          propertyTreatment: "sell-and-use-cash",
                          equityReleaseAmount: 0,
                          refinanceExistingLoanAmount: 0,
                        }))
                      }
                    >
                      <p className="font-semibold text-ink">Sell property and use cash</p>
                      <p className="mt-2 text-xs leading-5 text-muted">
                        Treat the current property as sold, clear the existing home loan, and add the net sale proceeds to the cash contribution automatically.
                      </p>
                    </button>
                  </div>
                </label>

                <label className="block text-sm font-medium text-ink">
                    <span>{selectedScenario.propertyTreatment === "sell-and-use-cash" ? "Extra cash contribution" : "Cash contribution"}</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={selectedScenario.cashContribution ?? ""}
                      onChange={(event) =>
                        updateScenario(selectedScenario.id, (scenario) => ({
                          ...scenario,
                          cashContribution: parseOptionalNumberInput(event.target.value),
                        }))
                      }
                      className={fieldClassName(selectedScenario.cashContribution !== undefined && selectedScenario.cashContribution < 0)}
                      placeholder={String(Math.round(selectedSummary?.availableCash ?? 0))}
                    />
                    <p className="mt-2 text-xs text-muted">
                      {selectedScenario.propertyTreatment === "sell-and-use-cash"
                        ? `Recorded cash assets ${formatScenarioCurrency(selectedSummary?.availableCash ?? 0)} plus property sale proceeds are used. This field is for any additional cash you want to contribute.`
                        : `Recorded cash assets ${formatScenarioCurrency(selectedSummary?.availableCash ?? 0)}. This does not cap the scenario amount.`}
                    </p>
                  </label>

                  {selectedScenario.propertyTreatment === "sell-and-use-cash" ? (
                    <div className="rounded-[1.5rem] border border-outline bg-surface-low px-4 py-4 text-sm text-muted">
                      <p className="font-semibold text-ink">Property sale treatment</p>
                      <p className="mt-2 leading-6">
                        Net sale proceeds {formatOptionalCurrency(selectedSummary?.propertySaleProceeds)} are added to cash contribution automatically. Existing home loan refinance and equity release are both set to $0 in this mode.
                      </p>
                    </div>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-ink">
                        <span>Equity release amount</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={selectedScenario.equityReleaseAmount ?? ""}
                          onChange={(event) =>
                            updateScenario(selectedScenario.id, (scenario) => ({
                              ...scenario,
                              equityReleaseAmount: parseOptionalNumberInput(event.target.value),
                            }))
                          }
                          className={fieldClassName(
                            selectedScenario.equityReleaseAmount !== undefined && selectedScenario.equityReleaseAmount < 0,
                          )}
                          placeholder={String(Math.round(selectedSummary?.availableEquity ?? 0))}
                        />
                        <p className="mt-2 text-xs text-muted">
                          Borrowed against the existing property up to 80% LVR of total property value {formatScenarioCurrency(selectedSummary?.existingPropertyValue ?? 0)}. Available equity {formatScenarioCurrency(selectedSummary?.availableEquity ?? 0)}.
                        </p>
                      </label>

                      <label className="block text-sm font-medium text-ink">
                        <span>Existing loan to refinance</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={selectedScenario.refinanceExistingLoanAmount ?? ""}
                          onChange={(event) =>
                            updateScenario(selectedScenario.id, (scenario) => ({
                              ...scenario,
                              refinanceExistingLoanAmount: parseOptionalNumberInput(event.target.value),
                            }))
                          }
                          className={fieldClassName(
                            selectedScenario.refinanceExistingLoanAmount !== undefined &&
                              selectedScenario.refinanceExistingLoanAmount < 0,
                          )}
                          placeholder={String(Math.round(selectedSummary?.currentHomeLoanBalance ?? 0))}
                        />
                        <p className="mt-2 text-xs text-muted">
                          Current home loan balance {formatScenarioCurrency(selectedSummary?.currentHomeLoanBalance ?? 0)}. Set to 0 if it will be cleared outside this structure.
                        </p>
                      </label>
                    </>
                  )}

                <div className="rounded-[1.5rem] border border-outline bg-surface-low px-4 py-4 md:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">Offset account</p>
                      <p className="mt-2 text-xs leading-5 text-muted">
                        Enable this only if the scenario plans to keep cash parked in offset rather than contributing it directly to the deal.
                      </p>
                    </div>

                    <button
                      type="button"
                      className={[
                        "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors",
                        selectedScenario.hasOffsetAccount
                          ? "border-primary bg-primary text-white"
                          : "border-outline bg-white text-muted",
                      ].join(" ")}
                      onClick={() =>
                        updateScenario(selectedScenario.id, (scenario) => ({
                          ...scenario,
                          hasOffsetAccount: !(scenario.hasOffsetAccount ?? false),
                        }))
                      }
                    >
                      {selectedScenario.hasOffsetAccount ? "Offset enabled" : "Enable offset"}
                    </button>
                  </div>

                  {selectedScenario.hasOffsetAccount ? (
                    <label className="mt-4 block text-sm font-medium text-ink">
                      <span>Planned offset balance</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={selectedScenario.offsetBalance ?? ""}
                        onChange={(event) =>
                          updateScenario(selectedScenario.id, (scenario) => ({
                            ...scenario,
                            offsetBalance: parseOptionalNumberInput(event.target.value),
                          }))
                        }
                        className={fieldClassName(selectedScenario.offsetBalance !== undefined && selectedScenario.offsetBalance < 0)}
                        placeholder="0"
                      />
                      <p className="mt-2 text-xs text-muted">
                        Keep part of your cash in offset instead of putting it all into the deal.
                      </p>
                    </label>
                  ) : (
                    <p className="mt-4 text-xs leading-5 text-muted">
                      Offset is currently excluded from this scenario, so all available cash is treated as regular cash contribution unless you set it elsewhere.
                    </p>
                  )}
                </div>

                <label className="block text-sm font-medium text-ink">
                  <span>Notes</span>
                  <textarea
                    value={selectedScenario.notes ?? ""}
                    onChange={(event) =>
                      updateScenario(selectedScenario.id, (scenario) => ({
                        ...scenario,
                        notes: event.target.value || undefined,
                      }))
                    }
                    className={`${fieldClassName()} min-h-28 resize-y`}
                    placeholder="Capture structure, timing, or policy observations."
                  />
                </label>

                <label className="block text-sm font-medium text-ink md:col-span-2">
                  <span>Description</span>
                  <textarea
                    value={selectedScenario.description ?? ""}
                    onChange={(event) =>
                      updateScenario(selectedScenario.id, (scenario) => ({
                        ...scenario,
                        description: event.target.value || undefined,
                      }))
                    }
                    className={`${fieldClassName()} min-h-24 resize-y`}
                    placeholder="Explain what this comparison is trying to test."
                  />
                </label>

                <label className="block text-sm font-medium text-ink">
                  <span>Interest rate override</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedScenario.targetInterestRate ?? ""}
                    onChange={(event) =>
                      updateScenario(selectedScenario.id, (scenario) => ({
                        ...scenario,
                        targetInterestRate: parseOptionalNumberInput(event.target.value),
                      }))
                    }
                    className={fieldClassName(
                      selectedScenario.targetInterestRate !== undefined && selectedScenario.targetInterestRate < 0,
                    )}
                    placeholder={selectedProduct ? selectedProduct.interestRate.toFixed(2) : userData.profile.targetInterestRate.toFixed(2)}
                  />
                  <p className="mt-2 text-xs text-muted">Leave blank to use the selected product rate or the profile default.</p>
                </label>

                <label className="block text-sm font-medium text-ink">
                  <span>Assessment buffer override</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedScenario.assessmentBuffer ?? ""}
                    onChange={(event) =>
                      updateScenario(selectedScenario.id, (scenario) => ({
                        ...scenario,
                        assessmentBuffer: parseOptionalNumberInput(event.target.value),
                      }))
                    }
                    className={fieldClassName(
                      selectedScenario.assessmentBuffer !== undefined && selectedScenario.assessmentBuffer < 0,
                    )}
                    placeholder={selectedBank ? selectedBank.creditPolicy.assessmentBuffer.toFixed(2) : userData.profile.assessmentBuffer.toFixed(2)}
                  />
                  <p className="mt-2 text-xs text-muted">Leave blank to use the selected lender buffer or the profile default.</p>
                </label>

                <label className="block text-sm font-medium text-ink">
                  <span>Loan term override</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={selectedScenario.loanTermYears ?? ""}
                    onChange={(event) =>
                      updateScenario(selectedScenario.id, (scenario) => ({
                        ...scenario,
                        loanTermYears: parseOptionalIntegerInput(event.target.value),
                      }))
                    }
                    className={fieldClassName(selectedScenario.loanTermYears !== undefined && selectedScenario.loanTermYears <= 0)}
                    placeholder={String(userData.profile.loanTermYears)}
                  />
                  <p className="mt-2 text-xs text-muted">
                    {selectedProduct
                      ? `Selected product supports up to ${selectedProduct.maxTermYears} years.`
                      : "Leave blank to use the household profile term."}
                  </p>
                </label>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
                  <p className="font-semibold text-ink">Funding snapshot</p>
                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="text-ink">Target property:</span> {formatOptionalCurrency(selectedSummary?.targetPropertyValue)}
                    </p>
                    <p>
                      <span className="text-ink">Cash contribution:</span> {formatOptionalCurrency(selectedSummary?.cashContribution)}
                    </p>
                    <p>
                      <span className="text-ink">Entered cash:</span> {formatOptionalCurrency(selectedSummary?.enteredCashContribution)}
                    </p>
                    <p>
                      <span className="text-ink">Property sale proceeds:</span> {formatOptionalCurrency(selectedSummary?.propertySaleProceeds)}
                    </p>
                    <p>
                      <span className="text-ink">Available equity:</span> {formatOptionalCurrency(selectedSummary?.availableEquity)}
                    </p>
                    <p>
                      <span className="text-ink">Equity release:</span> {formatOptionalCurrency(selectedSummary?.equityReleaseAmount)}
                    </p>
                    <p>
                      <span className="text-ink">Existing debt refinanced:</span> {formatOptionalCurrency(selectedSummary?.refinanceExistingLoanAmount)}
                    </p>
                    <p>
                      <span className="text-ink">Purchase loan:</span> {formatOptionalCurrency(selectedSummary?.purchaseLoanAmount)}
                    </p>
                    <p>
                      <span className="text-ink">Planned offset:</span> {formatOptionalCurrency(selectedSummary?.plannedOffsetBalance)}
                    </p>
                    <p>
                      <span className="text-ink">Total debt:</span> {formatOptionalCurrency(selectedSummary?.requiredLoanAmount)}
                    </p>
                  </div>
                  <Link
                    href="/lenders"
                    className="mt-4 inline-flex rounded-full border border-outline bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted"
                  >
                    Compare lenders for this deal
                  </Link>
                </div>

                <div className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
                  <p className="font-semibold text-ink">Selected scenario output</p>
                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="text-ink">Property treatment:</span>{" "}
                      {selectedSummary?.propertyTreatment === "sell-and-use-cash" ? "Sell and use cash" : "Keep and use equity"}
                    </p>
                    <p>
                      <span className="text-ink">Total debt:</span>{" "}
                      {formatOptionalCurrency(selectedSummary?.requiredLoanAmount)}
                    </p>
                    <p>
                      <span className="text-ink">Purchase loan:</span> {formatOptionalCurrency(selectedSummary?.purchaseLoanAmount)}
                    </p>
                    <p>
                      <span className="text-ink">Product fit:</span> {formatEligibility(selectedSummary)}
                    </p>
                    <p>
                      <span className="text-ink">Purchase LVR:</span> {formatOptionalPercentage(selectedSummary?.purchaseLvr)}
                    </p>
                    <p>
                      <span className="text-ink">Existing property LVR:</span> {formatOptionalPercentage(selectedSummary?.existingPropertyLvr)}
                    </p>
                    <p>
                      <span className="text-ink">Borrowing power:</span>{" "}
                      {selectedSummary ? formatScenarioCurrency(selectedSummary.borrowingPower) : "Unavailable"}
                    </p>
                    <p>
                      <span className="text-ink">Capacity gap:</span> {formatGapCurrency(selectedSummary?.borrowingGap)}
                    </p>
                    <p>
                      <span className="text-ink">Monthly repayment:</span>{" "}
                      {selectedSummary ? `${formatScenarioCurrency(selectedSummary.monthlyRepayment)} per month` : "Unavailable"}
                    </p>
                    <p>
                      <span className="text-ink">Effective offset:</span> {formatOptionalCurrency(selectedSummary?.effectiveOffsetBalance)}
                    </p>
                    <p>
                      <span className="text-ink">Effective rate:</span> {selectedEffectiveValues?.targetInterestRate.toFixed(2)}%
                    </p>
                    <p>
                      <span className="text-ink">Effective assessment buffer:</span> {selectedEffectiveValues?.assessmentBuffer.toFixed(2)}%
                    </p>
                    <p>
                      <span className="text-ink">Effective loan term:</span> {selectedEffectiveValues?.loanTermYears} years
                    </p>
                    {selectedSummary?.eligibilityIssues?.length ? (
                      <div className="rounded-2xl border border-warning/30 bg-white px-3 py-3 text-xs leading-5 text-warning">
                        {selectedSummary.eligibilityIssues.map((issue) => (
                          <p key={issue}>{issue}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
                  <p className="font-semibold text-ink">Resolved facility details</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="font-semibold text-ink">Purchase facility</p>
                      <div className="mt-2 space-y-2">
                        <p>
                          <span className="text-ink">Product:</span> {selectedProduct?.name ?? "No product selected"}
                        </p>
                        <p>
                          <span className="text-ink">Comparison rate:</span>{" "}
                          {selectedProduct?.comparisonRate ? `${selectedProduct.comparisonRate.toFixed(2)}%` : "Not listed"}
                        </p>
                        <p>
                          <span className="text-ink">Max LVR:</span> {selectedProduct?.maxLvr ? `${selectedProduct.maxLvr}%` : "Not listed"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-ink">Equity facility</p>
                      {selectedScenario?.propertyTreatment === "sell-and-use-cash" ? (
                        <p className="mt-2">Not required when the existing property is sold for cash.</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <p>
                            <span className="text-ink">Product:</span> {selectedEquityProduct?.name ?? "No product selected"}
                          </p>
                          <p>
                            <span className="text-ink">Comparison rate:</span>{" "}
                            {selectedEquityProduct?.comparisonRate ? `${selectedEquityProduct.comparisonRate.toFixed(2)}%` : "Not listed"}
                          </p>
                          <p>
                            <span className="text-ink">Max LVR:</span> {selectedEquityProduct?.maxLvr ? `${selectedEquityProduct.maxLvr}%` : "Not listed"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
              <p className="font-semibold text-ink">No scenario selected</p>
              <p className="mt-2 leading-6">Create a deal scenario first so the app can compare lenders against something concrete.</p>
              <button
                type="button"
                className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
                onClick={handleCreateStarterScenario}
              >
                Create scenario
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Scenario comparison table"
          subtitle="Tabular outputs mirror the chart so scenario trade-offs can be reviewed line by line."
        >
          {hasScenarios ? (
            <>
              <div className="space-y-3 lg:hidden">
                {userData.scenarios.map((scenario) => {
                  const bank = availableBanks.find((candidate) => candidate.id === scenario.bankId);
                  const product = bank?.products.find((candidate) => candidate.id === scenario.productId);
                  const summary = scenarioSummaryMap.get(scenario.id);
                  const effectiveValues = getEffectiveScenarioValues(userData, scenario, bank, product);

                  return (
                    <article key={scenario.id} className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
                      <p className="font-semibold text-ink">{scenario.label}</p>
                      <div className="mt-3 space-y-1">
                        <p>Lender: {bank?.shortName ?? bank?.name ?? "Profile default"}</p>
                        <p>Product: {product?.name ?? "No product selected"}</p>
                        <p>Target property: {formatOptionalCurrency(scenario.targetPropertyValue)}</p>
                        <p>Purchase loan: {formatOptionalCurrency(summary?.purchaseLoanAmount)}</p>
                        <p>Total debt: {formatOptionalCurrency(summary?.requiredLoanAmount)}</p>
                        <p>Product fit: {formatEligibility(summary)}</p>
                        <p>Purchase LVR: {formatOptionalPercentage(summary?.purchaseLvr)}</p>
                        <p>Existing property LVR: {formatOptionalPercentage(summary?.existingPropertyLvr)}</p>
                        <p>Gap: {formatGapCurrency(summary?.borrowingGap)}</p>
                        <p>Offset: {formatOptionalCurrency(summary?.effectiveOffsetBalance)}</p>
                        <p>Rate: {effectiveValues.targetInterestRate.toFixed(2)}%</p>
                        <p>Buffer: {effectiveValues.assessmentBuffer.toFixed(2)}%</p>
                        <p>Term: {effectiveValues.loanTermYears} years</p>
                        <p>Borrowing power: {summary ? formatScenarioCurrency(summary.borrowingPower) : "Unavailable"}</p>
                        <p>Repayment: {summary ? `${formatScenarioCurrency(summary.monthlyRepayment)} per month` : "Unavailable"}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm text-muted">
                  <thead>
                    <tr>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Scenario</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Lender</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Product</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Target property</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Total debt</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Fit</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Gap</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Offset</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Rate</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Buffer</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Term</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Borrowing</th>
                      <th className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">Repayment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.scenarios.map((scenario) => {
                      const bank = availableBanks.find((candidate) => candidate.id === scenario.bankId);
                      const product = bank?.products.find((candidate) => candidate.id === scenario.productId);
                      const summary = scenarioSummaryMap.get(scenario.id);
                      const effectiveValues = getEffectiveScenarioValues(userData, scenario, bank, product);

                      return (
                        <tr key={scenario.id} className="rounded-[1.5rem] bg-surface-low">
                          <td className="rounded-l-[1.5rem] px-4 py-4 font-semibold text-ink">{scenario.label}</td>
                          <td className="px-4 py-4">{bank?.shortName ?? bank?.name ?? "Profile default"}</td>
                          <td className="px-4 py-4">{product?.name ?? "No product selected"}</td>
                          <td className="px-4 py-4">{formatOptionalCurrency(scenario.targetPropertyValue)}</td>
                          <td className="px-4 py-4">{formatOptionalCurrency(summary?.requiredLoanAmount)}</td>
                          <td className="px-4 py-4">{formatEligibility(summary)}</td>
                          <td className="px-4 py-4">{formatGapCurrency(summary?.borrowingGap)}</td>
                          <td className="px-4 py-4">{formatOptionalCurrency(summary?.effectiveOffsetBalance)}</td>
                          <td className="px-4 py-4">{effectiveValues.targetInterestRate.toFixed(2)}%</td>
                          <td className="px-4 py-4">{effectiveValues.assessmentBuffer.toFixed(2)}%</td>
                          <td className="px-4 py-4">{effectiveValues.loanTermYears} years</td>
                          <td className="px-4 py-4">{summary ? formatScenarioCurrency(summary.borrowingPower) : "Unavailable"}</td>
                          <td className="rounded-r-[1.5rem] px-4 py-4">
                            {summary ? `${formatScenarioCurrency(summary.monthlyRepayment)} / month` : "Unavailable"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
              <p className="font-semibold text-ink">No comparison rows yet</p>
              <p className="mt-2 leading-6">Scenario rows will appear here as soon as products have been selected in Lenders & Products.</p>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}