import { assetProjectionAssumptions, taxAssumptions } from "@/config/calculation-assumptions";
import { calculateResidentIncomeTax } from "@/engine/tax";
import type { Asset, AssetProjection, AssetProjectionPoint, AssetProjectionSummary, HouseholdMember, HouseholdProfile } from "@/types/domain";

const SUPER_GUARANTEE_RATE = assetProjectionAssumptions.superGuaranteeRate;
const MEDICARE_LEVY_RATE = taxAssumptions.medicareLevyRate;
const DEFAULT_SAVINGS_ALLOCATION_RATE = assetProjectionAssumptions.savingsAllocationRate;
const DEFAULT_GROWTH_BY_CATEGORY: Record<Asset["category"], number> = {
  ...assetProjectionAssumptions.defaultGrowthByCategory,
};

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

function projectAssetValue(asset: Asset, monthlyContribution: number, annualGrowthRate: number, months: number) {
  const monthlyGrowthRate = annualGrowthRate / 100 / 12;
  let projectedValue = asset.value;

  for (let month = 0; month < months; month += 1) {
    projectedValue = projectedValue * (1 + monthlyGrowthRate) + monthlyContribution;
  }

  return projectedValue;
}

function buildMonthLabel(monthOffset: number) {
  const currentDate = new Date();
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);

  return date.toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
  });
}

function buildSuggestedContribution(asset: Asset, profile: HouseholdProfile, monthlySurplusAfterExpenses: number) {
  if (asset.category === "super") {
    const linkedMember = asset.linkedMemberId
      ? profile.members.find((member) => member.id === asset.linkedMemberId)
      : undefined;

    if (!linkedMember) {
      return {
        amount: 0,
        label: "No linked member for this super asset",
      };
    }

    const superContributionRate = linkedMember.superContributionRate ?? SUPER_GUARANTEE_RATE * 100;
    const baseMonthlyContribution = linkedMember.annualGrossIncome * (superContributionRate / 100) / 12;
    const additionalMonthlyContribution = asset.additionalMonthlyContribution ?? 0;

    return {
      amount: baseMonthlyContribution + additionalMonthlyContribution,
      label: `Super input: ${superContributionRate.toFixed(1)}% base from linked member + additional monthly contribution`,
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

export function buildAssetProjectionSummary(profile: HouseholdProfile, horizonMonths = 12): AssetProjectionSummary {
  const afterTaxAnnualIncome = calculateAfterTaxAnnualIncome(profile);
  const afterTaxMonthlyIncome = afterTaxAnnualIncome / 12;
  const monthlyDeclaredExpenses = calculateMonthlyDeclaredExpenses(profile);
  const monthlyLiabilities = calculateMonthlyLiabilities(profile);
  const monthlySurplusAfterExpenses = Math.max(afterTaxMonthlyIncome - monthlyDeclaredExpenses - monthlyLiabilities, 0);

  const assetProjections: AssetProjection[] = profile.assets.map((asset) => {
    const suggestedContribution = buildSuggestedContribution(asset, profile, monthlySurplusAfterExpenses);
    const projectedMonthlyContribution =
      asset.category === "super"
        ? suggestedContribution.amount
        : asset.expectedMonthlyContribution ?? suggestedContribution.amount;
    const annualGrowthRate = asset.annualGrowthRate ?? DEFAULT_GROWTH_BY_CATEGORY[asset.category];

    return {
      assetId: asset.id,
      label: asset.label,
      category: asset.category,
      readingDate: asset.readingDate,
      currentValue: asset.value,
      projectedMonthlyContribution,
      annualGrowthRate,
      projectedHorizonValue: Math.round(projectAssetValue(asset, projectedMonthlyContribution, annualGrowthRate, horizonMonths)),
      suggestedContributionLabel: suggestedContribution.label,
    };
  });

  const timeline: AssetProjectionPoint[] = Array.from({ length: horizonMonths + 1 }, (_, monthOffset) => {
    const monthLabel = buildMonthLabel(monthOffset);
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
    horizonMonths,
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