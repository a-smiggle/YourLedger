import { calculateBorrowingPower, calculateMonthlyRepayment } from "@/engine/borrowing-power";
import type { Asset, BankData, BankInstitution, BankProduct, Liability, ScenarioSummary, UserData, UserScenario } from "@/types/domain";

type ResolvedBankProduct = BankProduct & {
  isHidden?: boolean;
};

type ResolvedBankInstitution = Omit<BankInstitution, "products"> & {
  products: ResolvedBankProduct[];
};

type ScenarioCalculationContext = {
  purchaseBank?: ResolvedBankInstitution;
  purchaseProduct?: ResolvedBankProduct;
  equityBank?: ResolvedBankInstitution;
  equityProduct?: ResolvedBankProduct;
};

function calculateLvr(loanAmount: number, securityValue: number) {
  if (loanAmount <= 0 || securityValue <= 0) {
    return undefined;
  }

  return (loanAmount / securityValue) * 100;
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function sumAssetsByCategory(assets: Asset[], category: Asset["category"]) {
  return assets.reduce((total, asset) => (asset.category === category ? total + asset.value : total), 0);
}

function sumLiabilitiesByCategory(liabilities: Liability[], category: Liability["category"]) {
  return liabilities.reduce((total, liability) => (liability.category === category ? total + liability.balance : total), 0);
}

function clampCurrency(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(Math.round(value), 0);
}

function getScenarioDealMetrics(
  userData: UserData,
  scenario: UserScenario,
  purchaseProduct?: ResolvedBankProduct,
) {
  const maximumExistingPropertyLvr = 0.8;
  const propertyTreatment = scenario.propertyTreatment ?? "equity-release";
  const hasOffsetAccount = scenario.hasOffsetAccount ?? false;
  const availableCash = sumAssetsByCategory(userData.profile.assets, "cash");
  const currentPropertyValue = sumAssetsByCategory(userData.profile.assets, "property");
  const currentHomeLoanBalance = sumLiabilitiesByCategory(userData.profile.liabilities, "home-loan");
  const currentEquity = Math.max(currentPropertyValue - currentHomeLoanBalance, 0);
  const availableEquity = Math.max(Math.round(currentPropertyValue * maximumExistingPropertyLvr) - currentHomeLoanBalance, 0);
  const targetPropertyValue = clampCurrency(scenario.targetPropertyValue) ?? 0;
  const offsetBalance = hasOffsetAccount ? clampCurrency(scenario.offsetBalance) ?? 0 : 0;
  const defaultCashContribution = Math.max(availableCash - offsetBalance, 0);
  const enteredCashContribution = clampCurrency(scenario.cashContribution) ?? defaultCashContribution;
  const propertySaleProceeds = propertyTreatment === "sell-and-use-cash" ? currentEquity : 0;
  const cashContribution = enteredCashContribution + propertySaleProceeds;
  const requestedEquityRelease = propertyTreatment === "equity-release"
    ? clampCurrency(scenario.equityReleaseAmount) ?? clampCurrency(scenario.equityContribution) ?? 0
    : 0;
  const equityReleaseAmount = Math.min(requestedEquityRelease, availableEquity);
  const refinanceExistingLoanAmount = propertyTreatment === "equity-release"
    ? clampCurrency(scenario.refinanceExistingLoanAmount) ?? currentHomeLoanBalance
    : 0;
  const purchaseLoanAmount = Math.max(targetPropertyValue - cashContribution - equityReleaseAmount, 0);
  const requiredLoanAmount = purchaseLoanAmount + equityReleaseAmount + refinanceExistingLoanAmount;
  const existingPropertyDebt = propertyTreatment === "equity-release" ? refinanceExistingLoanAmount + equityReleaseAmount : 0;
  const purchaseLvr = calculateLvr(purchaseLoanAmount, targetPropertyValue);
  const existingPropertyLvr = calculateLvr(existingPropertyDebt, currentPropertyValue);
  const combinedSecurityValue = targetPropertyValue + (propertyTreatment === "equity-release" ? currentPropertyValue : 0);
  const combinedLvr = calculateLvr(requiredLoanAmount, combinedSecurityValue);
  const effectiveOffsetBalance = purchaseProduct?.features.offset ? Math.min(offsetBalance, purchaseLoanAmount) : 0;
  const purchaseRepaymentLoanAmount = Math.max(purchaseLoanAmount - effectiveOffsetBalance, 0);
  const equityRepaymentLoanAmount = existingPropertyDebt;
  const repaymentLoanAmount = purchaseRepaymentLoanAmount + equityRepaymentLoanAmount;

  return {
    propertyTreatment,
    hasOffsetAccount,
    targetPropertyValue,
    existingPropertyValue: currentPropertyValue,
    availableCash,
    enteredCashContribution,
    propertySaleProceeds,
    availableEquity,
    currentEquity,
    currentHomeLoanBalance,
    cashContribution,
    equityReleaseAmount,
    refinanceExistingLoanAmount,
    existingPropertyDebt,
    purchaseLoanAmount,
    purchaseLvr,
    existingPropertyLvr,
    combinedLvr,
    plannedOffsetBalance: offsetBalance,
    effectiveOffsetBalance,
    requiredLoanAmount,
    purchaseRepaymentLoanAmount,
    equityRepaymentLoanAmount,
    repaymentLoanAmount,
  };
}

function getEligibilityAssessment(
  purchaseProduct: ResolvedBankProduct | undefined,
  equityProduct: ResolvedBankProduct | undefined,
  dealMetrics: ReturnType<typeof getScenarioDealMetrics>,
) {
  const eligibilityIssues: string[] = [];

  if (dealMetrics.purchaseLoanAmount > 0) {
    if (!purchaseProduct) {
      eligibilityIssues.push("Select a purchase product for the target property loan.");
    } else {
      if (purchaseProduct.minLoanAmount && dealMetrics.purchaseLoanAmount < purchaseProduct.minLoanAmount) {
        eligibilityIssues.push(
          `Purchase loan $${dealMetrics.purchaseLoanAmount.toLocaleString()} is below the purchase product minimum of $${purchaseProduct.minLoanAmount.toLocaleString()}.`,
        );
      }

      if (purchaseProduct.maxLoanAmount && dealMetrics.purchaseLoanAmount > purchaseProduct.maxLoanAmount) {
        eligibilityIssues.push(
          `Purchase loan $${dealMetrics.purchaseLoanAmount.toLocaleString()} exceeds the purchase product maximum of $${purchaseProduct.maxLoanAmount.toLocaleString()}.`,
        );
      }

      if (
        purchaseProduct.maxLvr &&
        dealMetrics.purchaseLvr !== undefined &&
        dealMetrics.purchaseLvr > purchaseProduct.maxLvr
      ) {
        eligibilityIssues.push(
          `Purchase LVR ${formatPercentage(dealMetrics.purchaseLvr)} exceeds purchase product max LVR ${formatPercentage(purchaseProduct.maxLvr)}.`,
        );
      }
    }
  }

  if (dealMetrics.propertyTreatment === "equity-release" && dealMetrics.existingPropertyDebt > 0) {
    if (!equityProduct) {
      eligibilityIssues.push("Select an equity release product for the retained property debt.");
    } else {
      if (equityProduct.minLoanAmount && dealMetrics.existingPropertyDebt < equityProduct.minLoanAmount) {
        eligibilityIssues.push(
          `Existing property debt $${dealMetrics.existingPropertyDebt.toLocaleString()} is below the equity product minimum of $${equityProduct.minLoanAmount.toLocaleString()}.`,
        );
      }

      if (equityProduct.maxLoanAmount && dealMetrics.existingPropertyDebt > equityProduct.maxLoanAmount) {
        eligibilityIssues.push(
          `Existing property debt $${dealMetrics.existingPropertyDebt.toLocaleString()} exceeds the equity product maximum of $${equityProduct.maxLoanAmount.toLocaleString()}.`,
        );
      }

      if (
        equityProduct.maxLvr &&
        dealMetrics.existingPropertyLvr !== undefined &&
        dealMetrics.existingPropertyLvr > equityProduct.maxLvr
      ) {
        eligibilityIssues.push(
          `Existing property LVR ${formatPercentage(dealMetrics.existingPropertyLvr)} exceeds equity product max LVR ${formatPercentage(equityProduct.maxLvr)}.`,
        );
      }
    }
  }

  return {
    maxSupportedLvr: Math.min(
      purchaseProduct?.maxLvr ?? Number.POSITIVE_INFINITY,
      equityProduct?.maxLvr ?? Number.POSITIVE_INFINITY,
    ),
    isProductEligible: eligibilityIssues.length === 0,
    eligibilityIssues,
  };
}

function calculateScenarioSummary(
  userData: UserData,
  scenario: UserScenario,
  context: ScenarioCalculationContext,
): ScenarioSummary {
  const purchaseRate = context.purchaseProduct?.interestRate ?? userData.profile.targetInterestRate;
  const equityRate = context.equityProduct?.interestRate ?? purchaseRate;
  const defaultAssessmentBuffer = Math.max(
    context.purchaseBank?.creditPolicy.assessmentBuffer ?? userData.profile.assessmentBuffer,
    context.equityBank?.creditPolicy.assessmentBuffer ?? userData.profile.assessmentBuffer,
  );
  const purchaseMaxTerm = context.purchaseProduct?.maxTermYears ?? userData.profile.loanTermYears;
  const equityMaxTerm = context.equityProduct?.maxTermYears ?? userData.profile.loanTermYears;
  const scenarioProfile = {
    ...userData.profile,
    targetInterestRate: scenario.targetInterestRate ?? Math.max(purchaseRate, equityRate),
    assessmentBuffer: scenario.assessmentBuffer ?? defaultAssessmentBuffer,
    loanTermYears: Math.min(scenario.loanTermYears ?? userData.profile.loanTermYears, purchaseMaxTerm, equityMaxTerm),
  };
  const borrowingResult = calculateBorrowingPower(scenarioProfile);
  const dealMetrics = getScenarioDealMetrics(userData, scenario, context.purchaseProduct);
  const eligibility = getEligibilityAssessment(context.purchaseProduct, context.equityProduct, dealMetrics);
  const repaymentBaseAmount = dealMetrics.requiredLoanAmount > 0 ? dealMetrics.repaymentLoanAmount : borrowingResult.estimatedBorrowingPower;
  const purchaseMonthlyRepayment = dealMetrics.purchaseRepaymentLoanAmount > 0
    ? calculateMonthlyRepayment(
        dealMetrics.purchaseRepaymentLoanAmount,
        scenario.targetInterestRate ?? purchaseRate,
        Math.min(scenarioProfile.loanTermYears, purchaseMaxTerm),
      )
    : 0;
  const equityMonthlyRepayment = dealMetrics.equityRepaymentLoanAmount > 0
    ? calculateMonthlyRepayment(
        dealMetrics.equityRepaymentLoanAmount,
        scenario.targetInterestRate ?? equityRate,
        Math.min(scenarioProfile.loanTermYears, equityMaxTerm),
      )
    : 0;
  const monthlyRepayment = Math.round(purchaseMonthlyRepayment + equityMonthlyRepayment);
  const borrowingGap = dealMetrics.requiredLoanAmount > 0 ? borrowingResult.estimatedBorrowingPower - dealMetrics.requiredLoanAmount : undefined;

  return {
    id: scenario.id,
    label: scenario.label,
    borrowingPower: borrowingResult.estimatedBorrowingPower,
    monthlyRepayment,
    propertyTreatment: dealMetrics.propertyTreatment,
    targetPropertyValue: dealMetrics.targetPropertyValue || undefined,
    existingPropertyValue: dealMetrics.existingPropertyValue,
    requiredLoanAmount: dealMetrics.requiredLoanAmount || undefined,
    purchaseLoanAmount: dealMetrics.purchaseLoanAmount,
    enteredCashContribution: dealMetrics.enteredCashContribution,
    cashContribution: dealMetrics.cashContribution,
    propertySaleProceeds: dealMetrics.propertySaleProceeds,
    availableEquity: dealMetrics.availableEquity,
    equityReleaseAmount: dealMetrics.equityReleaseAmount,
    refinanceExistingLoanAmount: dealMetrics.refinanceExistingLoanAmount,
    currentEquity: dealMetrics.currentEquity,
    currentHomeLoanBalance: dealMetrics.currentHomeLoanBalance,
    availableCash: dealMetrics.availableCash,
    purchaseLvr: dealMetrics.purchaseLvr,
    existingPropertyLvr: dealMetrics.existingPropertyLvr,
    combinedLvr: dealMetrics.combinedLvr,
    maxSupportedLvr: eligibility.maxSupportedLvr,
    plannedOffsetBalance: dealMetrics.plannedOffsetBalance,
    effectiveOffsetBalance: dealMetrics.effectiveOffsetBalance,
    borrowingGap,
    repaymentLoanAmount: repaymentBaseAmount,
    isProductEligible: eligibility.isProductEligible,
    eligibilityIssues: eligibility.eligibilityIssues,
    withinCapacity:
      borrowingGap !== undefined
        ? borrowingGap >= 0 && (eligibility.isProductEligible ?? true)
        : eligibility.isProductEligible,
  };
}

function getResolvedContext(bankData: BankData, scenario: UserScenario): ScenarioCalculationContext {
  const banks = resolveBankInstitutions(bankData);
  const purchaseBank = scenario.bankId ? banks.find((candidate) => candidate.id === scenario.bankId) : undefined;
  const purchaseProduct = scenario.productId ? purchaseBank?.products.find((candidate) => candidate.id === scenario.productId) : undefined;
  const equityBank = scenario.equityBankId ? banks.find((candidate) => candidate.id === scenario.equityBankId) : undefined;
  const equityProduct = scenario.equityProductId ? equityBank?.products.find((candidate) => candidate.id === scenario.equityProductId) : undefined;

  return { purchaseBank, purchaseProduct, equityBank, equityProduct };
}

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
  const fallbackSummaries = userData.comparisonResults;

  if (userData.scenarios.length === 0) {
    return fallbackSummaries;
  }

  const derivedSummaries = userData.scenarios.flatMap<ScenarioSummary>((scenario) => {
    const context = getResolvedContext(bankData, scenario);

    return [calculateScenarioSummary(userData, scenario, context)];
  });

  return derivedSummaries.length > 0 ? derivedSummaries : fallbackSummaries;
}

export function buildProductComparisonSummary(
  userData: UserData,
  bankData: BankData,
  scenario: UserScenario,
  bankId: string,
  productId: string,
  facility: "purchase" | "equity" = "purchase",
) {
  const bank = resolveBankInstitutions(bankData).find((candidate) => candidate.id === bankId);
  const product = bank?.products.find((candidate) => candidate.id === productId);

  if (!bank || !product || product.isHidden) {
    return null;
  }

  return calculateScenarioSummary(
    userData,
    {
      ...scenario,
      bankId: facility === "purchase" ? bankId : scenario.bankId,
      productId: facility === "purchase" ? productId : scenario.productId,
      equityBankId: facility === "equity" ? bankId : scenario.equityBankId,
      equityProductId: facility === "equity" ? productId : scenario.equityProductId,
      targetInterestRate:
        facility === "purchase"
          ? scenario.targetInterestRate ?? product.interestRate
          : scenario.targetInterestRate,
      assessmentBuffer:
        facility === "purchase"
          ? scenario.assessmentBuffer ?? bank.creditPolicy.assessmentBuffer
          : scenario.assessmentBuffer,
      loanTermYears: Math.min(scenario.loanTermYears ?? userData.profile.loanTermYears, product.maxTermYears),
    },
    getResolvedContext(
      bankData,
      {
        ...scenario,
        bankId: facility === "purchase" ? bankId : scenario.bankId,
        productId: facility === "purchase" ? productId : scenario.productId,
        equityBankId: facility === "equity" ? bankId : scenario.equityBankId,
        equityProductId: facility === "equity" ? productId : scenario.equityProductId,
      },
    ),
  );
}