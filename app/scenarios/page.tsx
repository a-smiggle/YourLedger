"use client";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { BorrowingPowerChart } from "@/charts/borrowing-power-chart";
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

function createStarterScenario(userData: UserData, bankData: Parameters<typeof resolveBankInstitutions>[0], order: number): UserScenario {
  const bank = getAvailableBanks(bankData)[0];
  const product = bank?.products[0];

  return {
    id: createId("scenario"),
    label: product ? `${bank?.shortName ?? bank?.name} scenario ${order}` : `Scenario ${order}`,
    description: product
      ? `Comparison using ${bank?.name} ${product.name}.`
      : "Comparison using the current household profile settings.",
    bankId: bank?.id,
    productId: product?.id,
    targetInterestRate: product?.interestRate ?? userData.profile.targetInterestRate,
    assessmentBuffer: bank?.creditPolicy.assessmentBuffer ?? userData.profile.assessmentBuffer,
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
      const starterScenario = createStarterScenario(currentUserData, bankData, currentUserData.scenarios.length + 1);
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

  const handleBankChange = (scenarioId: string, bankId: string) => {
    const nextBank = availableBanks.find((bank) => bank.id === bankId);
    const nextProduct = nextBank?.products[0];

    updateScenario(scenarioId, (scenario) => ({
      ...scenario,
      bankId: nextBank?.id,
      productId: nextProduct?.id,
      targetInterestRate: nextProduct?.interestRate ?? scenario.targetInterestRate,
      assessmentBuffer: nextBank?.creditPolicy.assessmentBuffer ?? scenario.assessmentBuffer,
      loanTermYears: Math.min(scenario.loanTermYears ?? userData.profile.loanTermYears, nextProduct?.maxTermYears ?? userData.profile.loanTermYears),
    }));
  };

  const handleProductChange = (scenarioId: string, bankId: string, productId: string) => {
    if (!bankId) {
      return;
    }

    const nextBank = availableBanks.find((bank) => bank.id === bankId);
    const nextProduct = nextBank?.products.find((product) => product.id === productId);

    updateScenario(scenarioId, (scenario) => ({
      ...scenario,
      bankId,
      productId,
      targetInterestRate: nextProduct?.interestRate ?? scenario.targetInterestRate,
      loanTermYears: Math.min(scenario.loanTermYears ?? userData.profile.loanTermYears, nextProduct?.maxTermYears ?? userData.profile.loanTermYears),
    }));
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Scenarios"
          title="Compare lenders, products, and override settings in one local-first scenario workspace."
          description="Use scenario CRUD, lender selection, and per-scenario overrides to compare borrowing outcomes without leaving the browser."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SectionCard title="Borrowing power comparison" subtitle="Scenario outcomes built from the persisted user and bank stores.">
            <BorrowingPowerChart scenarios={scenarioSummaries} />
          </SectionCard>

          <SectionCard title="Scenario list" subtitle="Create, select, duplicate, and delete lender comparisons backed by UserData.scenarios.">
            {hasScenarios ? (
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full rounded-full bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white"
                  onClick={handleCreateStarterScenario}
                >
                  Add scenario
                </button>

                {userData.scenarios.map((scenario) => {
                  const isSelected = scenario.id === selectedScenarioId;
                  const summary = scenarioSummaryMap.get(scenario.id);

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
                            {scenario.bankId && scenario.productId ? "Configured scenario" : "Profile default scenario"}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-1 text-muted">
                        <p>{summary ? `Borrowing power ${formatScenarioCurrency(summary.borrowingPower)}` : "Comparison output unavailable"}</p>
                        <p>{summary ? `Repayment ${formatScenarioCurrency(summary.monthlyRepayment)} per month` : "Check lender and product settings."}</p>
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
                <p className="font-semibold text-ink">No saved scenarios yet</p>
                <p className="mt-2 leading-6">
                  Create a starter scenario to begin comparing lenders, products, and override settings against the current household profile.
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
                  onClick={handleCreateStarterScenario}
                >
                  Create starter scenario
                </button>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title={selectedScenario ? `Editing ${selectedScenario.label}` : "Scenario settings"}
          subtitle="Choose a lender and product, then override rate, buffer, term, notes, and scenario copy as needed."
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
                  <span>Lender</span>
                  <select
                    value={selectedScenario.bankId ?? ""}
                    onChange={(event) => handleBankChange(selectedScenario.id, event.target.value)}
                    className={fieldClassName()}
                  >
                    {availableBanks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-ink">
                  <span>Product</span>
                  <select
                    value={selectedScenario.productId ?? ""}
                    onChange={(event) => handleProductChange(selectedScenario.id, selectedScenario.bankId ?? "", event.target.value)}
                    className={fieldClassName()}
                    disabled={!selectedBank}
                  >
                    {selectedBank?.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

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
                  <p className="font-semibold text-ink">Selected scenario output</p>
                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="text-ink">Borrowing power:</span>{" "}
                      {selectedSummary ? formatScenarioCurrency(selectedSummary.borrowingPower) : "Unavailable"}
                    </p>
                    <p>
                      <span className="text-ink">Monthly repayment:</span>{" "}
                      {selectedSummary ? `${formatScenarioCurrency(selectedSummary.monthlyRepayment)} per month` : "Unavailable"}
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
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-surface-low p-5 text-sm text-muted">
                  <p className="font-semibold text-ink">Resolved product details</p>
                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="text-ink">Lender:</span> {selectedBank?.name ?? "Using profile defaults"}
                    </p>
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
                    <p>
                      <span className="text-ink">Features:</span>{" "}
                      {selectedProduct
                        ? [
                            selectedProduct.features.offset ? "Offset" : null,
                            selectedProduct.features.redraw ? "Redraw" : null,
                            selectedProduct.features.extraRepayments ? "Extra repayments" : null,
                            selectedProduct.features.portability ? "Portability" : null,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : "No product features available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
              <p className="font-semibold text-ink">No scenario selected</p>
              <p className="mt-2 leading-6">Add a scenario to start editing lender selections and per-scenario overrides.</p>
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
              <p className="mt-2 leading-6">Scenario rows will appear here as soon as at least one scenario has been created.</p>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}