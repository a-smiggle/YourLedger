import { calculateBorrowingPower, calculateMonthlyRepayment } from "@/engine/borrowing-power";
import type { BankData, BankInstitution, BankProduct, ScenarioSummary, UserData } from "@/types/domain";

type ResolvedBankProduct = BankProduct & {
  isHidden?: boolean;
};

type ResolvedBankInstitution = Omit<BankInstitution, "products"> & {
  products: ResolvedBankProduct[];
};

function mergeBankProduct(baseProduct: BankProduct, bankData: BankData): ResolvedBankProduct {
  return bankData.overrides.products
    .filter((override) => override.bankId === baseProduct.bankId && override.productId === baseProduct.id)
    .reduce<ResolvedBankProduct>(
      (product, override) => ({
        ...product,
        ...override.set,
        updatedAt: override.updatedAt,
      }),
      { ...baseProduct },
    );
}

export function resolveBankInstitutions(bankData: BankData): ResolvedBankInstitution[] {
  return bankData.banks.map((bank) => {
    const creditPolicy = bankData.overrides.creditPolicies
      .filter((override) => override.bankId === bank.id)
      .reduce((policy, override) => ({ ...policy, ...override.set }), bank.creditPolicy);

    return {
      ...bank,
      creditPolicy,
      products: bank.products.map((product) => mergeBankProduct(product, bankData)),
    };
  });
}

export function buildScenarioSummaries(userData: UserData, bankData: BankData): ScenarioSummary[] {
  const banks = resolveBankInstitutions(bankData);
  const fallbackSummaries = userData.comparisonResults;

  if (userData.scenarios.length === 0) {
    return fallbackSummaries;
  }

  const derivedSummaries = userData.scenarios.flatMap<ScenarioSummary>((scenario) => {
    const bank = scenario.bankId ? banks.find((candidate) => candidate.id === scenario.bankId) : undefined;
    const product = scenario.productId ? bank?.products.find((candidate) => candidate.id === scenario.productId) : undefined;

    if (product?.isHidden) {
      return [];
    }

    const scenarioProfile = {
      ...userData.profile,
      targetInterestRate: scenario.targetInterestRate ?? product?.interestRate ?? userData.profile.targetInterestRate,
      assessmentBuffer: scenario.assessmentBuffer ?? bank?.creditPolicy.assessmentBuffer ?? userData.profile.assessmentBuffer,
      loanTermYears: scenario.loanTermYears ?? userData.profile.loanTermYears,
    };

    const borrowingResult = calculateBorrowingPower(scenarioProfile);
    const monthlyRepayment = Math.round(
      calculateMonthlyRepayment(
        borrowingResult.estimatedBorrowingPower,
        scenarioProfile.targetInterestRate,
        scenarioProfile.loanTermYears,
      ),
    );

    return [
      {
        label: scenario.label,
        borrowingPower: borrowingResult.estimatedBorrowingPower,
        monthlyRepayment,
      },
    ];
  });

  return derivedSummaries.length > 0 ? derivedSummaries : fallbackSummaries;
}