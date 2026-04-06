export type HouseholdMember = {
  id: string;
  name: string;
  annualGrossIncome: number;
  superContributionRate: number;
  annualBonusIncome: number;
  annualRentalIncome: number;
  hasHecsHelpDebt: boolean;
};

export type ExpenseBreakdown = {
  housing: number;
  transport: number;
  groceries: number;
  phone: number;
  internet: number;
  utilities: number;
  insurance: number;
  healthcare: number;
  childcareEducation: number;
  subscriptions: number;
  discretionary: number;
  other: number;
};

export type Asset = {
  id: string;
  label: string;
  value: number;
  readingDate: string;
  expectedMonthlyContribution?: number;
  additionalMonthlyContribution?: number;
  annualGrowthRate?: number;
  linkedMemberId?: string;
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

export type ProjectionAssumptions = {
  superGuaranteeRate: number;
  medicareLevyRate: number;
  savingsAllocationRate: number;
};

export type AssetProjection = {
  assetId: string;
  label: string;
  category: Asset["category"];
  readingDate: string;
  currentValue: number;
  projectedMonthlyContribution: number;
  annualGrowthRate: number;
  projected12MonthValue: number;
  suggestedContributionLabel: string;
};

export type AssetProjectionPoint = {
  monthLabel: string;
  totalProjectedAssets: number;
  totalProjectedCash: number;
  totalProjectedSuper: number;
};

export type AssetProjectionSummary = {
  assumptions: ProjectionAssumptions;
  afterTaxMonthlyIncome: number;
  monthlyDeclaredExpenses: number;
  monthlyLiabilities: number;
  monthlySurplusAfterExpenses: number;
  assetProjections: AssetProjection[];
  timeline: AssetProjectionPoint[];
};

export type ScenarioSummary = {
  id?: string;
  label: string;
  borrowingPower: number;
  monthlyRepayment: number;
};

export type StoreSource = "seed" | "local" | "imported" | "manual";

export type StoreMetadata = {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  source: StoreSource;
};

export type UserScenario = {
  id: string;
  label: string;
  description?: string;
  bankId?: string;
  productId?: string;
  targetInterestRate?: number;
  assessmentBuffer?: number;
  loanTermYears?: number;
  notes?: string;
};

export type UserPreferences = {
  preferredRoute: string;
  selectedScenarioId: string | null;
};

export type UserData = {
  meta: StoreMetadata;
  profile: HouseholdProfile;
  scenarios: UserScenario[];
  comparisonResults: ScenarioSummary[];
  preferences: UserPreferences;
};

export type BankRefreshStatus = "idle" | "refreshing" | "ready" | "error";

export type TurnaroundTime = {
  minBusinessDays: number;
  maxBusinessDays: number;
};

export type BankCreditPolicy = {
  assessmentBuffer: number;
  minimumAssessmentRate: number;
  baseLivingExpenseFloor: number;
  dependantLoadingPerMonth: number;
  bonusShading: number;
  rentalShading: number;
  hecsHelpMonthlyLoading: number;
  serviceabilityShare: number;
};

export type BankProductFeatures = {
  offset: boolean;
  redraw: boolean;
  extraRepayments: boolean;
  portability: boolean;
};

export type BankProduct = {
  id: string;
  bankId: string;
  name: string;
  category: "variable" | "fixed" | "split" | "line-of-credit";
  loanPurpose: "owner-occupier" | "investment";
  repaymentType: "principal-and-interest" | "interest-only";
  interestRate: number;
  comparisonRate?: number | null;
  minLoanAmount?: number | null;
  maxLoanAmount?: number | null;
  maxLvr?: number | null;
  maxTermYears: number;
  features: BankProductFeatures;
  notes?: string[];
  updatedAt: string;
};

export type BankInstitution = {
  id: string;
  name: string;
  shortName?: string;
  profileSummary?: string;
  turnaroundTimeBusinessDays?: TurnaroundTime | null;
  creditPolicy: BankCreditPolicy;
  products: BankProduct[];
  updatedAt: string;
};

export type BankCreditPolicyOverride = {
  bankId: string;
  updatedAt: string;
  set: Partial<BankCreditPolicy>;
};

export type BankProductOverride = {
  bankId: string;
  productId: string;
  updatedAt: string;
  set: Partial<Pick<BankProduct, "interestRate" | "comparisonRate" | "minLoanAmount" | "maxLoanAmount" | "maxLvr" | "maxTermYears" | "notes">> & {
    isHidden?: boolean;
  };
};

export type BankData = {
  meta: StoreMetadata;
  banks: BankInstitution[];
  overrides: {
    creditPolicies: BankCreditPolicyOverride[];
    products: BankProductOverride[];
  };
  refresh: {
    lastRefreshedAt: string | null;
    status: BankRefreshStatus;
    errorMessage?: string;
  };
};

export type AppDataStores = {
  userData: UserData;
  bankData: BankData;
};