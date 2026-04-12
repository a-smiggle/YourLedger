import { describe, expect, it } from "vitest";

import { calculateBorrowingPower, calculateMonthlyRepayment, calculateRepaymentSummary } from "@/engine/borrowing-power";
import type { HouseholdProfile } from "@/types/domain";

function repaymentFactor(ratePercent: number, loanTermYears: number) {
  const monthlyRate = ratePercent / 100 / 12;
  const periods = loanTermYears * 12;

  if (monthlyRate === 0) {
    return periods;
  }

  return (1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate;
}

describe("borrowing power engine", () => {
  it("calculates monthly repayment at zero interest", () => {
    expect(calculateMonthlyRepayment(120_000, 0, 30)).toBeCloseTo(333.3333, 4);
  });

  it("captures offset savings and extra repayments in the repayment summary", () => {
    const withoutOffset = calculateRepaymentSummary(750_000, 6.1, 30, 0, 250);
    const withOffset = calculateRepaymentSummary(750_000, 6.1, 30, 50_000, 250);

    expect(withOffset.scheduledMonthlyRepayment).toBe(withoutOffset.scheduledMonthlyRepayment);
    expect(withOffset.totalMonthlyRepayment).toBe(withOffset.scheduledMonthlyRepayment + 250);
    expect(withOffset.totalInterestPaid).toBeLessThan(withoutOffset.totalInterestPaid);
    expect(withOffset.payoffMonths).toBeLessThan(withoutOffset.payoffMonths);
    expect(withOffset.interestSavedFromOffset).toBe(withoutOffset.totalInterestPaid - withOffset.totalInterestPaid);
  });

  it("applies income shading, HELP loading, and the expense floor to borrowing power", () => {
    const profile: HouseholdProfile = {
      members: [
        {
          id: "member-1",
          name: "Casey",
          annualGrossIncome: 120_000,
          superContributionRate: 12,
          annualBonusIncome: 10_000,
          annualRentalIncome: 24_000,
          hasHecsHelpDebt: true,
        },
      ],
      dependants: 2,
      monthlyExpenses: {
        housing: 2_200,
        transport: 300,
        groceries: 420,
        phone: 70,
        internet: 65,
        utilities: 150,
        insurance: 120,
        healthcare: 100,
        childcareEducation: 0,
        subscriptions: 45,
        discretionary: 180,
        other: 100,
      },
      assets: [{ id: "asset-1", label: "Cash", value: 35_000, readingDate: "2026-04-12", category: "cash" }],
      liabilities: [{ id: "liability-1", label: "Car loan", balance: 12_000, monthlyRepayment: 400, category: "car-loan" }],
      targetInterestRate: 5.6,
      assessmentBuffer: 3.2,
      loanTermYears: 30,
    };

    const assessedAnnualIncome = 120_000 + (10_000 * 0.8) + (24_000 * 0.75) - (250 * 12);
    const monthlyAssessableIncome = assessedAnnualIncome / 12;
    const serviceabilityIncome = monthlyAssessableIncome * 0.92;
    const expenseFloor = 3_200 + (2 * 550);
    const declaredExpenses = 3_750;
    const assessedExpenses = expenseFloor + 400;
    const monthlySurplus = Math.max(serviceabilityIncome - assessedExpenses, 0);
    const assessedRate = 5.6 + 3.2;
    const expectedBorrowingPower = Math.round(monthlySurplus * repaymentFactor(assessedRate, 30));

    const result = calculateBorrowingPower(profile);

    expect(result.shadedAnnualIncome).toBe(Math.round(assessedAnnualIncome));
    expect(result.serviceabilityBreakdown.monthlyAssessableIncome).toBe(Math.round(monthlyAssessableIncome));
    expect(result.serviceabilityBreakdown.usesExpenseFloor).toBe(true);
    expect(result.serviceabilityBreakdown.monthlyLivingExpensesUsed).toBe(expenseFloor);
    expect(result.serviceabilityBreakdown.monthlyLiabilityRepayments).toBe(400);
    expect(result.monthlySurplus).toBe(Math.round(monthlySurplus));
    expect(result.estimatedBorrowingPower).toBe(expectedBorrowingPower);
    expect(result.interpretationNotes.map((note) => note.title)).toContain("Expense floor is binding");
    expect(result.interpretationNotes.map((note) => note.title)).toContain("HELP debt loading applied");
    expect(declaredExpenses).toBeLessThan(expenseFloor);
  });
});