import type { Asset } from "@/types/domain";

export const taxAssumptions = {
  medicareLevyRate: 0.02,
  residentTaxBrackets: [
    { threshold: 0, upperBound: 18_200, baseTax: 0, marginalRate: 0 },
    { threshold: 18_200, upperBound: 45_000, baseTax: 0, marginalRate: 0.16 },
    { threshold: 45_000, upperBound: 135_000, baseTax: 4_288, marginalRate: 0.3 },
    { threshold: 135_000, upperBound: 190_000, baseTax: 31_288, marginalRate: 0.37 },
    { threshold: 190_000, upperBound: Number.POSITIVE_INFINITY, baseTax: 51_638, marginalRate: 0.45 },
  ],
} as const;

export const assetProjectionAssumptions = {
  superGuaranteeRate: 0.12,
  savingsAllocationRate: 1,
  defaultGrowthByCategory: {
    cash: 4.5,
    property: 3,
    super: 7,
    vehicle: 0,
    other: 3,
  } satisfies Record<Asset["category"], number>,
} as const;

export const scenarioProjectionAssumptions = {
  sensitivityRateAdjustments: [-1, -0.5, 0, 0.5, 1, 2],
} as const;