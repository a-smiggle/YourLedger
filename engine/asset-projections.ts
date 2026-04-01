import type { Asset, AssetProjection, AssetProjectionPoint, AssetProjectionSummary, HouseholdMember, HouseholdProfile } from "@/types/domain";

const SUPER_GUARANTEE_RATE = 0.12;
const MEDICARE_LEVY_RATE = 0.02;
const DEFAULT_SAVINGS_ALLOCATION_RATE = 1;
const DEFAULT_GROWTH_BY_CATEGORY: Record<Asset["category"], number> = {
  cash: 4.5,
  property: 3,
  super: 7,
  vehicle: 0,
  other: 3,
};

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

function calculateAfterTaxAnnualIncome(profile: HouseholdProfile) {
  return profile.members.reduce((total, member) => {
    const taxableIncome = calculateMemberAnnualTaxableIncome(member);
    const incomeTax = calculateResidentIncomeTax(taxableIncome);
    const medicareLevy = taxableIncome * MEDICARE_LEVY_RATE;

    return total + taxableIncome - incomeTax - medicareLevy;
  }, 0);
}

function calculateMonthlyDeclaredExpenses(profile: HouseholdProfile) {
  return Object.values(profile.monthlyExpenses).reduce((total, value) => total + value, 0);
}

function calculateMonthlyLiabilities(profile: HouseholdProfile) {
  return profile.liabilities.reduce((total, liability) => total + liability.monthlyRepayment, 0);
}

function monthsBetween(startDate: string, endDate: Date) {
  const start = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    return 0;
  }

  const yearDiff = endDate.getFullYear() - start.getFullYear();
  const monthDiff = endDate.getMonth() - start.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;

  return Math.max(totalMonths, 0);
}

function projectAssetValue(asset: Asset, monthlyContribution: number, annualGrowthRate: number, months: number) {
  const monthlyGrowthRate = annualGrowthRate / 100 / 12;
  let projectedValue = asset.value;

  for (let month = 0; month < months; month += 1) {
    projectedValue = projectedValue * (1 + monthlyGrowthRate) + monthlyContribution;
  }

  return projectedValue;
}

function buildSuggestedContribution(asset: Asset, profile: HouseholdProfile, monthlySurplusAfterExpenses: number) {
  if (asset.category === "super") {
    const annualGrossIncome = profile.members.reduce((total, member) => total + member.annualGrossIncome, 0);
    return {
      amount: annualGrossIncome * SUPER_GUARANTEE_RATE / 12,
      label: `ATO super guarantee default: ${(SUPER_GUARANTEE_RATE * 100).toFixed(0)}% of annual gross wages`,
    };
  }

  if (asset.category === "cash") {
    const amount = Math.max(monthlySurplusAfterExpenses * DEFAULT_SAVINGS_ALLOCATION_RATE, 0);
    return {
      amount,
      label: "Default savings input: remaining monthly after-tax cashflow after declared expenses and liabilities",
    };
  }

  return {
    amount: 0,
    label: "No default contribution suggested for this asset category",
  };
}

export function buildAssetProjectionSummary(profile: HouseholdProfile): AssetProjectionSummary {
  const currentDate = new Date();
  const afterTaxAnnualIncome = calculateAfterTaxAnnualIncome(profile);
  const afterTaxMonthlyIncome = afterTaxAnnualIncome / 12;
  const monthlyDeclaredExpenses = calculateMonthlyDeclaredExpenses(profile);
  const monthlyLiabilities = calculateMonthlyLiabilities(profile);
  const monthlySurplusAfterExpenses = Math.max(afterTaxMonthlyIncome - monthlyDeclaredExpenses - monthlyLiabilities, 0);

  const assetProjections: AssetProjection[] = profile.assets.map((asset) => {
    const suggestedContribution = buildSuggestedContribution(asset, profile, monthlySurplusAfterExpenses);
    const projectedMonthlyContribution = asset.expectedMonthlyContribution ?? suggestedContribution.amount;
    const annualGrowthRate = asset.annualGrowthRate ?? DEFAULT_GROWTH_BY_CATEGORY[asset.category];
    const monthsToHorizon = monthsBetween(asset.readingDate, currentDate) + 12;

    return {
      assetId: asset.id,
      label: asset.label,
      category: asset.category,
      readingDate: asset.readingDate,
      currentValue: asset.value,
      projectedMonthlyContribution,
      annualGrowthRate,
      projected12MonthValue: Math.round(projectAssetValue(asset, projectedMonthlyContribution, annualGrowthRate, monthsToHorizon)),
      suggestedContributionLabel: suggestedContribution.label,
    };
  });

  const timeline: AssetProjectionPoint[] = Array.from({ length: 13 }, (_, monthOffset) => {
    const monthLabel = monthOffset === 0 ? "Now" : `+${monthOffset}m`;
    const timelineValues = assetProjections.map((projection) => {
      const asset = profile.assets.find((candidate) => candidate.id === projection.assetId);
      return asset
        ? {
            category: projection.category,
            value: projectAssetValue(asset, projection.projectedMonthlyContribution, projection.annualGrowthRate, monthOffset),
          }
        : { category: projection.category, value: 0 };
    });

    return {
      monthLabel,
      totalProjectedAssets: Math.round(timelineValues.reduce((total, item) => total + item.value, 0)),
      totalProjectedCash: Math.round(
        timelineValues.filter((item) => item.category === "cash").reduce((total, item) => total + item.value, 0),
      ),
      totalProjectedSuper: Math.round(
        timelineValues.filter((item) => item.category === "super").reduce((total, item) => total + item.value, 0),
      ),
    };
  });

  return {
    assumptions: {
      superGuaranteeRate: SUPER_GUARANTEE_RATE,
      medicareLevyRate: MEDICARE_LEVY_RATE,
      savingsAllocationRate: DEFAULT_SAVINGS_ALLOCATION_RATE,
    },
    afterTaxMonthlyIncome: Math.round(afterTaxMonthlyIncome),
    monthlyDeclaredExpenses: Math.round(monthlyDeclaredExpenses),
    monthlyLiabilities: Math.round(monthlyLiabilities),
    monthlySurplusAfterExpenses: Math.round(monthlySurplusAfterExpenses),
    assetProjections,
    timeline,
  };
}