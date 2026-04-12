import { lendingAssumptions } from "@/config/lending-assumptions";
import type { BorrowingPowerResult, HouseholdProfile, RepaymentCalculationSummary } from "@/types/domain";

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function monthlyRepaymentFactor(ratePercent: number, loanTermYears: number) {
  const monthlyRate = ratePercent / 100 / 12;
  const periods = loanTermYears * 12;

  if (monthlyRate === 0) {
    return periods;
  }

  return (1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate;
}

export function calculateMonthlyRepayment(loanAmount: number, ratePercent: number, loanTermYears: number) {
  const factor = monthlyRepaymentFactor(ratePercent, loanTermYears);

  if (factor === 0) {
    return 0;
  }

  return loanAmount / factor;
}

function simulateLoanRepayments(
  loanAmount: number,
  ratePercent: number,
  loanTermYears: number,
  offsetBalance = 0,
  extraMonthlyRepayment = 0,
) {
  const clampedLoanAmount = Math.max(loanAmount, 0);
  const clampedRatePercent = Math.max(ratePercent, 0);
  const clampedOffsetBalance = Math.max(offsetBalance, 0);
  const clampedExtraMonthlyRepayment = Math.max(extraMonthlyRepayment, 0);
  const scheduledMonthlyRepayment = calculateMonthlyRepayment(clampedLoanAmount, clampedRatePercent, loanTermYears);
  const monthlyRate = clampedRatePercent / 100 / 12;
  const maxMonths = Math.max(loanTermYears * 12 * 3, 1);

  if (clampedLoanAmount === 0) {
    return {
      scheduledMonthlyRepayment: 0,
      totalMonthlyRepayment: 0,
      totalInterestPaid: 0,
      totalRepayments: 0,
      payoffMonths: 0,
    };
  }

  let balance = clampedLoanAmount;
  let totalInterestPaid = 0;
  let totalRepayments = 0;
  let payoffMonths = 0;

  while (balance > 0.01 && payoffMonths < maxMonths) {
    const interest = Math.max(balance - clampedOffsetBalance, 0) * monthlyRate;
    const desiredRepayment = Math.max(scheduledMonthlyRepayment + clampedExtraMonthlyRepayment, 0);
    const actualRepayment = Math.min(desiredRepayment, balance + interest);
    const principalReduction = Math.max(actualRepayment - interest, 0);

    if (principalReduction <= 0 && balance > 0) {
      payoffMonths = maxMonths;
      break;
    }

    totalInterestPaid += interest;
    totalRepayments += actualRepayment;
    balance = Math.max(balance - principalReduction, 0);
    payoffMonths += 1;
  }

  return {
    scheduledMonthlyRepayment,
    totalMonthlyRepayment: scheduledMonthlyRepayment + clampedExtraMonthlyRepayment,
    totalInterestPaid,
    totalRepayments,
    payoffMonths,
  };
}

export function calculateRepaymentSummary(
  loanAmount: number,
  ratePercent: number,
  loanTermYears: number,
  offsetBalance = 0,
  extraMonthlyRepayment = 0,
): RepaymentCalculationSummary {
  const baseline = simulateLoanRepayments(loanAmount, ratePercent, loanTermYears, 0, extraMonthlyRepayment);
  const withOffset = simulateLoanRepayments(loanAmount, ratePercent, loanTermYears, offsetBalance, extraMonthlyRepayment);

  return {
    scheduledMonthlyRepayment: Math.round(withOffset.scheduledMonthlyRepayment),
    totalMonthlyRepayment: Math.round(withOffset.totalMonthlyRepayment),
    fortnightlyRepayment: Math.round(withOffset.totalMonthlyRepayment * 12 / 26),
    weeklyRepayment: Math.round(withOffset.totalMonthlyRepayment * 12 / 52),
    totalInterestPaid: Math.round(withOffset.totalInterestPaid),
    totalRepayments: Math.round(withOffset.totalRepayments),
    payoffMonths: withOffset.payoffMonths,
    interestSavedFromOffset: Math.max(Math.round(baseline.totalInterestPaid - withOffset.totalInterestPaid), 0),
  };
}

export function calculateBorrowingPower(profile: HouseholdProfile): BorrowingPowerResult {
  const memberIncomeBreakdown = profile.members.map((member) => {
    const shadedBonus = member.annualBonusIncome * lendingAssumptions.bonusShading;
    const shadedRent = member.annualRentalIncome * lendingAssumptions.rentalShading;
    const educationLoading = member.hasHecsHelpDebt ? lendingAssumptions.hecsHelpMonthlyLoading * 12 : 0;
    const assessedAnnualIncome = member.annualGrossIncome + shadedBonus + shadedRent - educationLoading;

    return {
      memberId: member.id,
      name: member.name,
      annualGrossIncome: Math.round(member.annualGrossIncome),
      annualBonusIncome: Math.round(member.annualBonusIncome),
      annualBonusIncomeUsed: Math.round(shadedBonus),
      annualRentalIncome: Math.round(member.annualRentalIncome),
      annualRentalIncomeUsed: Math.round(shadedRent),
      annualHecsHelpLoading: Math.round(educationLoading),
      assessedAnnualIncome: Math.round(assessedAnnualIncome),
    };
  });

  const income = memberIncomeBreakdown.reduce((total, member) => total + member.assessedAnnualIncome, 0);

  const monthlyIncome = income / 12;
  const monthlyIncomeAfterServiceabilityShare = monthlyIncome * lendingAssumptions.serviceabilityShare;
  const declaredExpenses = Object.values(profile.monthlyExpenses).reduce((total, amount) => total + amount, 0);
  const floorExpenses =
    lendingAssumptions.baseLivingExpenseFloor +
    profile.dependants * lendingAssumptions.dependantLoadingPerMonth;
  const liabilities = profile.liabilities.reduce((total, liability) => total + liability.monthlyRepayment, 0);
  const livingExpensesUsed = Math.max(declaredExpenses, floorExpenses);
  const assessedExpenses = livingExpensesUsed + liabilities;
  const monthlySurplus = Math.max(monthlyIncomeAfterServiceabilityShare - assessedExpenses, 0);
  const assessedRate = profile.targetInterestRate + profile.assessmentBuffer;
  const factor = monthlyRepaymentFactor(assessedRate, profile.loanTermYears);
  const estimatedBorrowingPower = Math.round(monthlySurplus * factor);
  const totalAssets = profile.assets.reduce((total, asset) => total + asset.value, 0);
  const totalLiabilities = profile.liabilities.reduce((total, liability) => total + liability.balance, 0);
  const bonusIncomeReduction = memberIncomeBreakdown.reduce(
    (total, member) => total + (member.annualBonusIncome - member.annualBonusIncomeUsed),
    0,
  );
  const rentalIncomeReduction = memberIncomeBreakdown.reduce(
    (total, member) => total + (member.annualRentalIncome - member.annualRentalIncomeUsed),
    0,
  );
  const totalHecsHelpLoading = memberIncomeBreakdown.reduce((total, member) => total + member.annualHecsHelpLoading, 0);
  const interpretationNotes = [
    declaredExpenses < floorExpenses
      ? {
          title: "Expense floor is binding",
          body: `Declared living costs of ${formatCurrency(declaredExpenses)} per month sit below the serviceability floor of ${formatCurrency(floorExpenses)}, so the higher floor is used.`,
        }
      : {
          title: "Declared living costs are binding",
          body: `Declared living costs of ${formatCurrency(declaredExpenses)} per month exceed the floor of ${formatCurrency(floorExpenses)}, so the declared figure is carried into serviceability.`,
        },
    liabilities > 0
      ? {
          title: "Existing liabilities reduce capacity",
          body: `${formatCurrency(liabilities)} per month of current liability repayments is added on top of living expenses during serviceability.`,
        }
      : {
          title: "No monthly liabilities entered",
          body: "No ongoing liability repayments are being added to the current serviceability assessment.",
        },
    bonusIncomeReduction > 0
      ? {
          title: "Bonus income is shaded",
          body: `${formatCurrency(bonusIncomeReduction)} of annual bonus income is excluded after applying the ${(1 - lendingAssumptions.bonusShading) * 100}% shading rule.`,
        }
      : {
          title: "No bonus shading impact",
          body: "No assessable income was lost to bonus-income shading in the current household profile.",
        },
    rentalIncomeReduction > 0
      ? {
          title: "Rental income is shaded",
          body: `${formatCurrency(rentalIncomeReduction)} of annual rental income is excluded after applying the ${(1 - lendingAssumptions.rentalShading) * 100}% shading rule.`,
        }
      : {
          title: "No rental shading impact",
          body: "No assessable income was lost to rental-income shading in the current household profile.",
        },
    totalHecsHelpLoading > 0
      ? {
          title: "HELP debt loading applied",
          body: `${formatCurrency(totalHecsHelpLoading / 12)} per month is deducted from assessable income for members with HECS/HELP debt.`,
        }
      : {
          title: "No HELP loading applied",
          body: "No HECS/HELP loading is reducing assessable income in the current household profile.",
        },
    monthlySurplus > 0
      ? {
          title: "Positive monthly serviceability surplus",
          body: `After shading income, applying the ${Math.round(lendingAssumptions.serviceabilityShare * 100)}% serviceability share, and deducting assessed expenses, the profile retains ${formatCurrency(monthlySurplus)} per month.`,
        }
      : {
          title: "No remaining monthly surplus",
          body: "Assessed expenses currently absorb all serviceability income, leaving no monthly surplus for further borrowing capacity.",
        },
  ];

  return {
    shadedAnnualIncome: Math.round(income),
    monthlySurplus: Math.round(monthlySurplus),
    totalAssets,
    totalLiabilities,
    estimatedBorrowingPower,
    assessedRepaymentRate: assessedRate,
    serviceabilityBreakdown: {
      monthlyAssessableIncome: Math.round(monthlyIncome),
      monthlyIncomeAfterServiceabilityShare: Math.round(monthlyIncomeAfterServiceabilityShare),
      monthlyDeclaredExpenses: Math.round(declaredExpenses),
      monthlyExpenseFloor: Math.round(floorExpenses),
      usesExpenseFloor: declaredExpenses < floorExpenses,
      monthlyLivingExpensesUsed: Math.round(livingExpensesUsed),
      monthlyLiabilityRepayments: Math.round(liabilities),
      monthlyAssessedExpenses: Math.round(assessedExpenses),
      members: memberIncomeBreakdown,
    },
    interpretationNotes,
  };
}