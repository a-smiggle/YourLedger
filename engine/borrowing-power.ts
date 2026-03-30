import { lendingAssumptions } from "@/config/lending-assumptions";
import type { BorrowingPowerResult, HouseholdProfile } from "@/types/domain";

function monthlyRepaymentFactor(ratePercent: number, loanTermYears: number) {
  const monthlyRate = ratePercent / 100 / 12;
  const periods = loanTermYears * 12;

  if (monthlyRate === 0) {
    return periods;
  }

  return (1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate;
}

export function calculateBorrowingPower(profile: HouseholdProfile): BorrowingPowerResult {
  const income = profile.members.reduce((total, member) => {
    const shadedBonus = member.annualBonusIncome * lendingAssumptions.bonusShading;
    const shadedRent = member.annualRentalIncome * lendingAssumptions.rentalShading;
    const educationLoading = member.hasHecsHelpDebt ? lendingAssumptions.hecsHelpMonthlyLoading * 12 : 0;

    return total + member.annualGrossIncome + shadedBonus + shadedRent - educationLoading;
  }, 0);

  const monthlyIncome = income / 12;
  const declaredExpenses = Object.values(profile.monthlyExpenses).reduce((total, amount) => total + amount, 0);
  const floorExpenses =
    lendingAssumptions.baseLivingExpenseFloor +
    profile.dependants * lendingAssumptions.dependantLoadingPerMonth;
  const liabilities = profile.liabilities.reduce((total, liability) => total + liability.monthlyRepayment, 0);
  const assessedExpenses = Math.max(declaredExpenses, floorExpenses) + liabilities;
  const monthlySurplus = Math.max(monthlyIncome * lendingAssumptions.serviceabilityShare - assessedExpenses, 0);
  const assessedRate = profile.targetInterestRate + profile.assessmentBuffer;
  const factor = monthlyRepaymentFactor(assessedRate, profile.loanTermYears);
  const estimatedBorrowingPower = Math.round(monthlySurplus * factor);
  const totalAssets = profile.assets.reduce((total, asset) => total + asset.value, 0);
  const totalLiabilities = profile.liabilities.reduce((total, liability) => total + liability.balance, 0);

  return {
    shadedAnnualIncome: Math.round(income),
    monthlySurplus: Math.round(monthlySurplus),
    totalAssets,
    totalLiabilities,
    estimatedBorrowingPower,
    assessedRepaymentRate: assessedRate,
  };
}