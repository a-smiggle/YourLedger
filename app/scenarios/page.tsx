"use client";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";
import { BorrowingPowerChart } from "@/charts/borrowing-power-chart";
import { buildScenarioSummaries, resolveBankInstitutions } from "@/engine/scenario-summaries";
import type { UserData, UserScenario } from "@/types/domain";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createStarterScenario(userData: UserData, bankData: Parameters<typeof resolveBankInstitutions>[0]): UserScenario {
  const banks = resolveBankInstitutions(bankData);
  const bank = banks.find((candidate) => candidate.products.some((product) => !product.isHidden));
  const product = bank?.products.find((candidate) => !candidate.isHidden);

  return {
    id: createId("scenario"),
    label: product ? `${bank?.shortName ?? bank?.name} starter` : "Starter scenario",
    description: product
      ? `Starter comparison using ${bank?.name} ${product.name}.`
      : "Starter comparison using the current household profile settings.",
    bankId: bank?.id,
    productId: product?.id,
    targetInterestRate: product?.interestRate ?? userData.profile.targetInterestRate,
    assessmentBuffer: bank?.creditPolicy.assessmentBuffer ?? userData.profile.assessmentBuffer,
    loanTermYears: userData.profile.loanTermYears,
  };
}

export default function ScenariosPage() {
  const { userData, bankData, setUserData } = useAppData();
  const scenarioSummaries = buildScenarioSummaries(userData, bankData);
  const hasScenarios = userData.scenarios.length > 0;

  const handleCreateStarterScenario = () => {
    setUserData((currentUserData) => {
      const starterScenario = createStarterScenario(currentUserData, bankData);

      return {
        ...currentUserData,
        scenarios: [starterScenario],
        preferences: {
          ...currentUserData.preferences,
          selectedScenarioId: starterScenario.id,
        },
        meta: {
          ...currentUserData.meta,
          updatedAt: new Date().toISOString(),
          source: "manual",
        },
      };
    });
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Scenarios"
          title="Compare lenders, rates, and offset strategies without mixing scenario math into components."
          description="This route is the base for bank-vs-bank and offset-vs-no-offset comparisons described in the README."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SectionCard title="Borrowing power comparison" subtitle="Scenario outcomes built from the persisted user and bank stores.">
            <BorrowingPowerChart scenarios={scenarioSummaries} />
          </SectionCard>

          <SectionCard title="Scenario list" subtitle="Scenario definitions currently stored in UserData.">
            {hasScenarios ? (
              <div className="space-y-3">
                {scenarioSummaries.map((scenario) => (
                  <div key={scenario.label} className="rounded-2xl bg-surface-low px-4 py-4 text-sm text-muted">
                    <p className="font-semibold text-ink">{scenario.label}</p>
                    <p className="mt-2">Borrowing power ${scenario.borrowingPower.toLocaleString()}</p>
                    <p>Repayment ${scenario.monthlyRepayment.toLocaleString()} per month</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-outline bg-surface-low px-5 py-6 text-sm text-muted">
                <p className="font-semibold text-ink">No saved scenarios yet</p>
                <p className="mt-2 leading-6">
                  Scenario management is the next build step. Until then, this route falls back to the comparison results already stored in your profile.
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
      </div>
    </AppShell>
  );
}