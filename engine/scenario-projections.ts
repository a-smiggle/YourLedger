import { calculateMonthlyRepayment } from "@/engine/borrowing-power";
import { buildScenarioSummaries, resolveBankInstitutions } from "@/engine/scenario-summaries";
import type {
  Asset,
  HouseholdMember,
  ScenarioProjectionPoint,
  ScenarioProjectionSummary,
  ScenarioSensitivitySummary,
  UserData,
  UserScenario,
  BankData,
} from "@/types/domain";

const DEFAULT_CASH_GROWTH_RATE = 4.5;
const DEFAULT_PROPERTY_GROWTH_RATE = 3;
const DEFAULT_SUPER_GROWTH_RATE = 7;
const DEFAULT_OTHER_GROWTH_RATE = 3;
const MEDICARE_LEVY_RATE = 0.02;

function calculateResidentIncomeTax(taxableIncome: number) {
  if (taxableIncome <= 18_200) {
    return 0;
  }

  if (taxableIncome <= 45_000) {
    return (taxableIncome - 18_200) * 0.16;
  }

  if (taxableIncome <= 135_000) {
    return 4_288 + (taxableIncome - 45_000) * 0.3;
  }

  if (taxableIncome <= 190_000) {
    return 31_288 + (taxableIncome - 135_000) * 0.37;
  }

  return 51_638 + (taxableIncome - 190_000) * 0.45;
}

function calculateMemberAnnualTaxableIncome(member: HouseholdMember) {
  return member.annualGrossIncome + member.annualBonusIncome + member.annualRentalIncome;
}

function calculateAfterTaxMonthlyIncome(userData: UserData) {
  const annualAfterTaxIncome = userData.profile.members.reduce((total, member) => {
    const taxableIncome = calculateMemberAnnualTaxableIncome(member);
    const incomeTax = calculateResidentIncomeTax(taxableIncome);
    const medicareLevy = taxableIncome * MEDICARE_LEVY_RATE;

    return total + taxableIncome - incomeTax - medicareLevy;
  }, 0);

  return annualAfterTaxIncome / 12;
}

function calculateMonthlyDeclaredExpenses(userData: UserData) {
  return Object.values(userData.profile.monthlyExpenses).reduce((total, amount) => total + amount, 0);
}

function calculateMonthlyOtherLiabilities(userData: UserData) {
  return userData.profile.liabilities.reduce(
    (total, liability) => (liability.category === "home-loan" ? total : total + liability.monthlyRepayment),
    0,
  );
}

function sumAssetValueByCategory(assets: Asset[], category: Asset["category"]) {
  return assets.reduce((total, asset) => (asset.category === category ? total + asset.value : total), 0);
}

function sumAssetValueByCategories(assets: Asset[], categories: Asset["category"][]) {
  return assets.reduce((total, asset) => (categories.includes(asset.category) ? total + asset.value : total), 0);
}

function weightedGrowthRate(assets: Asset[], categories: Asset["category"][], fallbackRate: number) {
  const scopedAssets = assets.filter((asset) => categories.includes(asset.category));

  if (scopedAssets.length === 0) {
    return fallbackRate;
  }

  const totalValue = scopedAssets.reduce((total, asset) => total + asset.value, 0);

  if (totalValue === 0) {
    return fallbackRate;
  }

  return scopedAssets.reduce(
    (total, asset) => total + (asset.value / totalValue) * (asset.annualGrowthRate ?? fallbackRate),
    0,
  );
}

function calculateMonthlySuperContribution(userData: UserData) {
  return userData.profile.assets
    .filter((asset) => asset.category === "super")
    .reduce((total, asset) => {
      const linkedMember = asset.linkedMemberId
        ? userData.profile.members.find((member) => member.id === asset.linkedMemberId)
        : undefined;

      if (!linkedMember) {
        return total + (asset.expectedMonthlyContribution ?? 0);
      }

      const superContributionRate = linkedMember.superContributionRate ?? 12;
      const baseMonthlyContribution = linkedMember.annualGrossIncome * (superContributionRate / 100) / 12;
      const additionalMonthlyContribution = asset.additionalMonthlyContribution ?? 0;

      return total + baseMonthlyContribution + additionalMonthlyContribution;
    }, 0);
}

function applyMonthlyGrowth(balance: number, annualGrowthRate: number) {
  return balance * (1 + annualGrowthRate / 100 / 12);
}

function buildMonthLabel(monthOffset: number) {
  const currentDate = new Date();
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);

  return date.toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
  });
}

function clampToZero(value: number) {
  return Math.max(value, 0);
}

function clampRate(value: number) {
  return Math.max(value, 0);
}

export function buildScenarioProjectionSummaries(
  userData: UserData,
  bankData: BankData,
  horizonMonths = 12,
  rateAdjustmentPercent = 0,
): ScenarioProjectionSummary[] {
  const scenarioSummaries = buildScenarioSummaries(userData, bankData);
  const summaryMap = new Map(scenarioSummaries.flatMap((summary) => (summary.id ? [[summary.id, summary] as const] : [])));
  const resolvedBanks = resolveBankInstitutions(bankData);
  const monthlyAfterTaxIncome = calculateAfterTaxMonthlyIncome(userData);
  const monthlyDeclaredExpenses = calculateMonthlyDeclaredExpenses(userData);
  const monthlyOtherLiabilities = calculateMonthlyOtherLiabilities(userData);
  const availableCash = sumAssetValueByCategory(userData.profile.assets, "cash");
  const superBalanceStarting = sumAssetValueByCategory(userData.profile.assets, "super");
  const otherBalanceStarting = sumAssetValueByCategories(userData.profile.assets, ["vehicle", "other"]);
  const cashGrowthRate = weightedGrowthRate(userData.profile.assets, ["cash"], DEFAULT_CASH_GROWTH_RATE);
  const superGrowthRate = weightedGrowthRate(userData.profile.assets, ["super"], DEFAULT_SUPER_GROWTH_RATE);
  const otherGrowthRate = weightedGrowthRate(userData.profile.assets, ["vehicle", "other"], DEFAULT_OTHER_GROWTH_RATE);
  const propertyGrowthRate = weightedGrowthRate(userData.profile.assets, ["property"], DEFAULT_PROPERTY_GROWTH_RATE);
  const monthlySuperContribution = calculateMonthlySuperContribution(userData);

  return userData.scenarios.map<ScenarioProjectionSummary>((scenario) => {
    const summary = summaryMap.get(scenario.id);
    const purchaseBank = scenario.bankId ? resolvedBanks.find((bank) => bank.id === scenario.bankId) : undefined;
    const purchaseProduct = scenario.productId ? purchaseBank?.products.find((product) => product.id === scenario.productId) : undefined;
    const equityBank = scenario.equityBankId ? resolvedBanks.find((bank) => bank.id === scenario.equityBankId) : undefined;
    const equityProduct = scenario.equityProductId ? equityBank?.products.find((product) => product.id === scenario.equityProductId) : undefined;
    const propertyTreatment = scenario.propertyTreatment ?? "equity-release";
    const purchaseBaseRate = scenario.targetInterestRate ?? purchaseProduct?.interestRate ?? userData.profile.targetInterestRate;
    const purchaseRate = clampRate(purchaseBaseRate + rateAdjustmentPercent);
    const equityBaseRate = scenario.targetInterestRate ?? equityProduct?.interestRate ?? purchaseBaseRate;
    const equityRate = clampRate(equityBaseRate + rateAdjustmentPercent);
    const purchaseTermYears = Math.min(scenario.loanTermYears ?? userData.profile.loanTermYears, purchaseProduct?.maxTermYears ?? userData.profile.loanTermYears);
    const equityTermYears = Math.min(scenario.loanTermYears ?? userData.profile.loanTermYears, equityProduct?.maxTermYears ?? userData.profile.loanTermYears);
    const startingPurchaseBalance = summary?.purchaseLoanAmount ?? 0;
    const startingExistingDebtBalance = propertyTreatment === "equity-release"
      ? (summary?.equityReleaseAmount ?? 0) + (summary?.refinanceExistingLoanAmount ?? 0)
      : 0;
    const openingOffsetBalance = summary?.effectiveOffsetBalance ?? 0;
    const enteredCashContribution = summary?.enteredCashContribution ?? scenario.cashContribution ?? 0;
    const recordedCashUsed = Math.min(availableCash, enteredCashContribution);
    const openingCashBalance = clampToZero(availableCash - recordedCashUsed - openingOffsetBalance);
    const purchaseMonthlyRepayment = startingPurchaseBalance > 0
      ? calculateMonthlyRepayment(startingPurchaseBalance, purchaseRate, purchaseTermYears)
      : 0;
    const existingMonthlyRepayment = startingExistingDebtBalance > 0
      ? calculateMonthlyRepayment(startingExistingDebtBalance, equityRate, equityTermYears)
      : 0;
    const monthlyScenarioRepayment = purchaseMonthlyRepayment + existingMonthlyRepayment;
    const monthlySurplusAfterScenarioRepayments = Math.max(
      monthlyAfterTaxIncome - monthlyDeclaredExpenses - monthlyOtherLiabilities - monthlyScenarioRepayment,
      0,
    );
    const purchaseHasOffset = purchaseProduct?.features.offset ?? false;

    let purchaseDebtBalance = startingPurchaseBalance;
    let existingPropertyDebtBalance = startingExistingDebtBalance;
    let offsetBalance = openingOffsetBalance;
    let cashBalance = openingCashBalance;
    let superBalance = superBalanceStarting;
    let otherBalance = otherBalanceStarting;
    let targetPropertyValue = summary?.targetPropertyValue ?? 0;
    let retainedPropertyValue = propertyTreatment === "equity-release" ? summary?.existingPropertyValue ?? 0 : 0;
    let cumulativeInterestPaid = 0;
    let cumulativeInterestSaved = 0;

    const timeline: ScenarioProjectionPoint[] = [];

    for (let monthOffset = 0; monthOffset <= horizonMonths; monthOffset += 1) {
      const propertyEquity = clampToZero(targetPropertyValue - purchaseDebtBalance);
      const retainedPropertyEquity = propertyTreatment === "equity-release"
        ? clampToZero(retainedPropertyValue - existingPropertyDebtBalance)
        : 0;
      const liquidWealth = cashBalance + offsetBalance + superBalance + otherBalance;

      timeline.push({
        monthLabel: buildMonthLabel(monthOffset),
        totalDebtBalance: Math.round(purchaseDebtBalance + existingPropertyDebtBalance),
        purchaseDebtBalance: Math.round(purchaseDebtBalance),
        existingPropertyDebtBalance: Math.round(existingPropertyDebtBalance),
        offsetBalance: Math.round(offsetBalance),
        cumulativeInterestPaid: Math.round(cumulativeInterestPaid),
        cumulativeInterestSaved: Math.round(cumulativeInterestSaved),
        liquidWealth: Math.round(liquidWealth),
        propertyEquity: Math.round(propertyEquity),
        retainedPropertyEquity: Math.round(retainedPropertyEquity),
        totalWealth: Math.round(liquidWealth + propertyEquity + retainedPropertyEquity),
      });

      if (monthOffset === horizonMonths) {
        break;
      }

      const purchaseMonthlyRate = purchaseRate / 100 / 12;
      const equityMonthlyRate = equityRate / 100 / 12;
      const purchaseInterestWithoutOffset = purchaseDebtBalance * purchaseMonthlyRate;
      const purchaseInterestWithOffset = Math.max(purchaseDebtBalance - offsetBalance, 0) * purchaseMonthlyRate;
      const purchasePrincipalReduction = clampToZero(Math.min(purchaseMonthlyRepayment - purchaseInterestWithOffset, purchaseDebtBalance));
      const existingInterest = existingPropertyDebtBalance * equityMonthlyRate;
      const existingPrincipalReduction = clampToZero(Math.min(existingMonthlyRepayment - existingInterest, existingPropertyDebtBalance));

      cumulativeInterestPaid += purchaseInterestWithOffset + existingInterest;
      cumulativeInterestSaved += purchaseHasOffset ? purchaseInterestWithoutOffset - purchaseInterestWithOffset : 0;

      purchaseDebtBalance = clampToZero(purchaseDebtBalance - purchasePrincipalReduction);
      existingPropertyDebtBalance = clampToZero(existingPropertyDebtBalance - existingPrincipalReduction);

      if (purchaseHasOffset) {
        offsetBalance += monthlySurplusAfterScenarioRepayments;
      } else {
        cashBalance += monthlySurplusAfterScenarioRepayments;
      }

      cashBalance = applyMonthlyGrowth(cashBalance, cashGrowthRate);
      superBalance = applyMonthlyGrowth(superBalance, superGrowthRate) + monthlySuperContribution;
      otherBalance = applyMonthlyGrowth(otherBalance, otherGrowthRate);
      targetPropertyValue = applyMonthlyGrowth(targetPropertyValue, propertyGrowthRate);
      if (propertyTreatment === "equity-release") {
        retainedPropertyValue = applyMonthlyGrowth(retainedPropertyValue, propertyGrowthRate);
      }
    }

    const openingTotalWealth = timeline[0]?.totalWealth ?? 0;
    const endPoint = timeline[timeline.length - 1] ?? timeline[0];

    return {
      scenarioId: scenario.id,
      label: scenario.label,
      horizonMonths,
      monthlyAfterTaxIncome: Math.round(monthlyAfterTaxIncome),
      monthlyDeclaredExpenses: Math.round(monthlyDeclaredExpenses),
      monthlyOtherLiabilities: Math.round(monthlyOtherLiabilities),
      monthlyScenarioRepayment: Math.round(monthlyScenarioRepayment),
      monthlySurplusAfterScenarioRepayments: Math.round(monthlySurplusAfterScenarioRepayments),
      openingTotalWealth,
      projectedDebtBalance: endPoint?.totalDebtBalance ?? 0,
      projectedDebtReduction: Math.round((timeline[0]?.totalDebtBalance ?? 0) - (endPoint?.totalDebtBalance ?? 0)),
      projectedInterestPaid: endPoint?.cumulativeInterestPaid ?? 0,
      projectedInterestSaved: endPoint?.cumulativeInterestSaved ?? 0,
      projectedOffsetBalance: endPoint?.offsetBalance ?? 0,
      projectedWealth: endPoint?.totalWealth ?? 0,
      timeline,
    };
  });
}

export function buildScenarioSensitivitySummaries(
  userData: UserData,
  bankData: BankData,
  horizonMonths = 12,
  rateAdjustments = [-1, -0.5, 0, 0.5, 1, 2],
): ScenarioSensitivitySummary[] {
  return userData.scenarios.map<ScenarioSensitivitySummary>((scenario) => {
    const points = rateAdjustments.map((rateAdjustmentPercent) => {
      const projection = buildScenarioProjectionSummaries(userData, bankData, horizonMonths, rateAdjustmentPercent).find(
        (summary) => summary.scenarioId === scenario.id,
      );
      const baseRate = clampRate(
        (scenario.targetInterestRate ?? userData.profile.targetInterestRate) + rateAdjustmentPercent,
      );

      return {
        rateAdjustmentPercent,
        scenarioRateLabel: `${rateAdjustmentPercent >= 0 ? "+" : ""}${rateAdjustmentPercent.toFixed(1)}% (${baseRate.toFixed(2)}%)`,
        monthlyScenarioRepayment: projection?.monthlyScenarioRepayment ?? 0,
        projectedDebtBalance: projection?.projectedDebtBalance ?? 0,
        projectedInterestPaid: projection?.projectedInterestPaid ?? 0,
        projectedInterestSaved: projection?.projectedInterestSaved ?? 0,
        projectedWealth: projection?.projectedWealth ?? 0,
      };
    });

    return {
      scenarioId: scenario.id,
      label: scenario.label,
      horizonMonths,
      points,
    };
  });
}