import type { HouseholdProfile, ScenarioSummary } from "@/types/domain";

export const demoProfile: HouseholdProfile = {
  members: [
    {
      id: "member-1",
      name: "Alex",
      annualGrossIncome: 132000,
      annualBonusIncome: 12000,
      annualRentalIncome: 18000,
      hasHecsHelpDebt: false,
    },
    {
      id: "member-2",
      name: "Jordan",
      annualGrossIncome: 88000,
      annualBonusIncome: 4000,
      annualRentalIncome: 0,
      hasHecsHelpDebt: true,
    },
  ],
  dependants: 1,
  monthlyExpenses: {
    housing: 3100,
    transport: 680,
    groceries: 1200,
    utilities: 420,
    discretionary: 960,
    other: 340,
  },
  assets: [
    { id: "asset-1", label: "Offset cash", value: 84000, category: "cash" },
    { id: "asset-2", label: "Owner occupied property", value: 745000, category: "property" },
    { id: "asset-3", label: "Superannuation", value: 166000, category: "super" },
  ],
  liabilities: [
    { id: "liability-1", label: "Home loan", balance: 392000, monthlyRepayment: 2540, category: "home-loan" },
    { id: "liability-2", label: "Car loan", balance: 18400, monthlyRepayment: 460, category: "car-loan" },
    { id: "liability-3", label: "Credit card limit", balance: 8000, monthlyRepayment: 240, category: "credit-card" },
  ],
  targetInterestRate: 5.89,
  assessmentBuffer: 3,
  loanTermYears: 30,
};

export const scenarioSummaries: ScenarioSummary[] = [
  {
    label: "Current lender",
    borrowingPower: 1145000,
    monthlyRepayment: 6620,
  },
  {
    label: "Refinance option",
    borrowingPower: 1210000,
    monthlyRepayment: 6350,
  },
  {
    label: "Offset strategy",
    borrowingPower: 1188000,
    monthlyRepayment: 6480,
  },
];