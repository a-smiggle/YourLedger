import { lendingAssumptions } from "@/config/lending-assumptions";
import type { BankData, HouseholdProfile, ScenarioSummary, UserData, UserScenario } from "@/types/domain";

const seededAt = "2026-03-30T00:00:00.000Z";

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

const demoScenarios: UserScenario[] = [
  {
    id: "current-lender",
    label: "Current lender",
    description: "Baseline scenario using the current owner occupier product.",
    bankId: "major-bank-a",
    productId: "major-bank-a-variable",
    targetInterestRate: 5.89,
    assessmentBuffer: 3,
    loanTermYears: 30,
  },
  {
    id: "refinance-option",
    label: "Refinance option",
    description: "Alternative lender with a lower headline rate for refinance modelling.",
    bankId: "major-bank-b",
    productId: "major-bank-b-refi",
    targetInterestRate: 5.59,
    assessmentBuffer: 3,
    loanTermYears: 30,
  },
  {
    id: "offset-strategy",
    label: "Offset strategy",
    description: "Offset-enabled scenario for comparing cash retention against repayment savings.",
    bankId: "non-bank-lender",
    productId: "non-bank-lender-flex",
    targetInterestRate: 5.74,
    assessmentBuffer: 3,
    loanTermYears: 30,
    notes: "Assumes offset usage remains strong enough to justify the product setup.",
  },
];

export const demoUserData: UserData = {
  meta: {
    schemaVersion: 1,
    createdAt: seededAt,
    updatedAt: seededAt,
    source: "seed",
  },
  profile: demoProfile,
  scenarios: demoScenarios,
  comparisonResults: scenarioSummaries,
  preferences: {
    preferredRoute: "/dashboard",
    selectedScenarioId: demoScenarios[0]?.id ?? null,
  },
};

export const demoBankData: BankData = {
  meta: {
    schemaVersion: 1,
    createdAt: seededAt,
    updatedAt: seededAt,
    source: "seed",
  },
  banks: [
    {
      id: "major-bank-a",
      name: "Major Bank A",
      shortName: "MBA",
      profileSummary: "Owner occupier focus",
      turnaroundTimeBusinessDays: {
        minBusinessDays: 2,
        maxBusinessDays: 4,
      },
      creditPolicy: {
        assessmentBuffer: 3,
        minimumAssessmentRate: 8.75,
        baseLivingExpenseFloor: lendingAssumptions.baseLivingExpenseFloor,
        dependantLoadingPerMonth: lendingAssumptions.dependantLoadingPerMonth,
        bonusShading: lendingAssumptions.bonusShading,
        rentalShading: lendingAssumptions.rentalShading,
        hecsHelpMonthlyLoading: lendingAssumptions.hecsHelpMonthlyLoading,
        serviceabilityShare: lendingAssumptions.serviceabilityShare,
      },
      products: [
        {
          id: "major-bank-a-variable",
          bankId: "major-bank-a",
          name: "Owner Occupier Variable",
          category: "variable",
          loanPurpose: "owner-occupier",
          repaymentType: "principal-and-interest",
          interestRate: 5.89,
          comparisonRate: 5.97,
          minLoanAmount: 150000,
          maxLoanAmount: 2500000,
          maxLvr: 90,
          maxTermYears: 30,
          features: {
            offset: true,
            redraw: true,
            extraRepayments: true,
            portability: true,
          },
          notes: ["Suitable baseline product for existing owner occupier scenarios."],
          updatedAt: seededAt,
        },
      ],
      updatedAt: seededAt,
    },
    {
      id: "major-bank-b",
      name: "Major Bank B",
      shortName: "MBB",
      profileSummary: "Strong refinance appetite",
      turnaroundTimeBusinessDays: {
        minBusinessDays: 3,
        maxBusinessDays: 5,
      },
      creditPolicy: {
        assessmentBuffer: 3,
        minimumAssessmentRate: 8.5,
        baseLivingExpenseFloor: lendingAssumptions.baseLivingExpenseFloor,
        dependantLoadingPerMonth: lendingAssumptions.dependantLoadingPerMonth,
        bonusShading: 0.85,
        rentalShading: lendingAssumptions.rentalShading,
        hecsHelpMonthlyLoading: lendingAssumptions.hecsHelpMonthlyLoading,
        serviceabilityShare: lendingAssumptions.serviceabilityShare,
      },
      products: [
        {
          id: "major-bank-b-refi",
          bankId: "major-bank-b",
          name: "Refinance Variable",
          category: "variable",
          loanPurpose: "owner-occupier",
          repaymentType: "principal-and-interest",
          interestRate: 5.59,
          comparisonRate: 5.68,
          minLoanAmount: 200000,
          maxLoanAmount: 3000000,
          maxLvr: 85,
          maxTermYears: 30,
          features: {
            offset: true,
            redraw: true,
            extraRepayments: true,
            portability: true,
          },
          notes: ["Suitable for refinance scenario comparisons."],
          updatedAt: seededAt,
        },
      ],
      updatedAt: seededAt,
    },
    {
      id: "non-bank-lender",
      name: "Non-bank Lender",
      shortName: "NBL",
      profileSummary: "Flexible policy edge cases",
      turnaroundTimeBusinessDays: {
        minBusinessDays: 1,
        maxBusinessDays: 3,
      },
      creditPolicy: {
        assessmentBuffer: 3,
        minimumAssessmentRate: 8.9,
        baseLivingExpenseFloor: lendingAssumptions.baseLivingExpenseFloor,
        dependantLoadingPerMonth: lendingAssumptions.dependantLoadingPerMonth,
        bonusShading: lendingAssumptions.bonusShading,
        rentalShading: 0.8,
        hecsHelpMonthlyLoading: lendingAssumptions.hecsHelpMonthlyLoading,
        serviceabilityShare: 0.94,
      },
      products: [
        {
          id: "non-bank-lender-flex",
          bankId: "non-bank-lender",
          name: "Flexible Offset Loan",
          category: "variable",
          loanPurpose: "owner-occupier",
          repaymentType: "principal-and-interest",
          interestRate: 5.74,
          comparisonRate: 5.88,
          minLoanAmount: 100000,
          maxLoanAmount: 2000000,
          maxLvr: 85,
          maxTermYears: 30,
          features: {
            offset: true,
            redraw: true,
            extraRepayments: true,
            portability: false,
          },
          notes: ["Designed for scenarios where policy flexibility matters more than brand preference."],
          updatedAt: seededAt,
        },
      ],
      updatedAt: seededAt,
    },
  ],
  overrides: {
    creditPolicies: [],
    products: [],
  },
  refresh: {
    lastRefreshedAt: seededAt,
    status: "ready",
  },
};