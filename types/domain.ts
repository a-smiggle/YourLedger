export type HouseholdMember = {
  id: string;
  name: string;
  annualGrossIncome: number;
  annualBonusIncome: number;
  annualRentalIncome: number;
  hasHecsHelpDebt: boolean;
};

export type ExpenseBreakdown = {
  housing: number;
  transport: number;
  groceries: number;
  utilities: number;
  discretionary: number;
  other: number;
};

export type Asset = {
  id: string;
  label: string;
  value: number;
  category: "cash" | "property" | "super" | "vehicle" | "other";
};

export type Liability = {
  id: string;
  label: string;
  balance: number;
  monthlyRepayment: number;
  category: "home-loan" | "credit-card" | "personal-loan" | "car-loan" | "other";
};

export type HouseholdProfile = {
  members: HouseholdMember[];
  dependants: number;
  monthlyExpenses: ExpenseBreakdown;
  assets: Asset[];
  liabilities: Liability[];
  targetInterestRate: number;
  assessmentBuffer: number;
  loanTermYears: number;
};

export type BorrowingPowerResult = {
  shadedAnnualIncome: number;
  monthlySurplus: number;
  totalAssets: number;
  totalLiabilities: number;
  estimatedBorrowingPower: number;
  assessedRepaymentRate: number;
};

export type ScenarioSummary = {
  label: string;
  borrowingPower: number;
  monthlyRepayment: number;
};