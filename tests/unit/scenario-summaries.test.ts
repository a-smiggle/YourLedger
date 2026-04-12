import { describe, expect, it } from "vitest";

import { buildProductComparisonSummary, buildScenarioSummaries, resolveBankInstitutions } from "@/engine/scenario-summaries";
import { cloneDefaultBankData, cloneDefaultUserData } from "@/modules/app-data-management";

describe("scenario summaries", () => {
  it("falls back to seeded comparison rows when there are no scenarios", () => {
    const userData = cloneDefaultUserData();
    userData.scenarios = [];

    expect(buildScenarioSummaries(userData, cloneDefaultBankData())).toEqual(userData.comparisonResults);
  });

  it("builds a scenario summary with consistent deal metrics", () => {
    const summaries = buildScenarioSummaries(cloneDefaultUserData(), cloneDefaultBankData());
    const currentLender = summaries.find((summary) => summary.id === "current-lender");

    expect(currentLender).toBeDefined();
    expect(currentLender?.requiredLoanAmount).toBe(
      (currentLender?.purchaseLoanAmount ?? 0) +
      (currentLender?.equityReleaseAmount ?? 0) +
      (currentLender?.refinanceExistingLoanAmount ?? 0),
    );
    expect(currentLender?.effectiveOffsetBalance).toBeLessThanOrEqual(currentLender?.plannedOffsetBalance ?? 0);
    expect(currentLender?.effectiveOffsetBalance).toBeLessThanOrEqual(currentLender?.purchaseLoanAmount ?? 0);
    expect(currentLender?.borrowingGap).toBe((currentLender?.borrowingPower ?? 0) - (currentLender?.requiredLoanAmount ?? 0));
    expect(currentLender?.withinCapacity).toBe(
      (currentLender?.borrowingGap ?? -1) >= 0 && Boolean(currentLender?.isProductEligible),
    );
  });

  it("applies credit-policy and product overrides when resolving banks", () => {
    const bankData = cloneDefaultBankData();
    bankData.overrides.creditPolicies.push({
      bankId: "major-bank-a",
      updatedAt: "2026-04-12T00:00:00.000Z",
      set: { assessmentBuffer: 3.75 },
    });
    bankData.overrides.products.push({
      bankId: "major-bank-a",
      productId: "major-bank-a-variable",
      updatedAt: "2026-04-12T00:00:00.000Z",
      set: { interestRate: 5.05, isHidden: true },
    });

    const resolvedBank = resolveBankInstitutions(bankData).find((bank) => bank.id === "major-bank-a");
    const resolvedProduct = resolvedBank?.products.find((product) => product.id === "major-bank-a-variable");

    expect(resolvedBank?.creditPolicy.assessmentBuffer).toBe(3.75);
    expect(resolvedProduct?.interestRate).toBe(5.05);
    expect(resolvedProduct?.isHidden).toBe(true);
  });

  it("uses product overrides in comparison summaries and rejects hidden products", () => {
    const userData = cloneDefaultUserData();
    const scenario = {
      ...userData.scenarios[0],
      targetInterestRate: undefined,
      assessmentBuffer: undefined,
    };
    const baselineBankData = cloneDefaultBankData();
    const adjustedBankData = cloneDefaultBankData();
    adjustedBankData.overrides.products.push({
      bankId: "major-bank-a",
      productId: "major-bank-a-variable",
      updatedAt: "2026-04-12T00:00:00.000Z",
      set: { interestRate: 6.65 },
    });

    const baseline = buildProductComparisonSummary(
      userData,
      baselineBankData,
      scenario,
      "major-bank-a",
      "major-bank-a-variable",
      "purchase",
    );
    const adjusted = buildProductComparisonSummary(
      userData,
      adjustedBankData,
      scenario,
      "major-bank-a",
      "major-bank-a-variable",
      "purchase",
    );

    adjustedBankData.overrides.products.push({
      bankId: "major-bank-a",
      productId: "major-bank-a-variable",
      updatedAt: "2026-04-12T00:01:00.000Z",
      set: { isHidden: true },
    });

    expect(adjusted?.monthlyRepayment).toBeGreaterThan(baseline?.monthlyRepayment ?? 0);
    expect(
      buildProductComparisonSummary(
        userData,
        adjustedBankData,
        scenario,
        "major-bank-a",
        "major-bank-a-variable",
        "purchase",
      ),
    ).toBeNull();
  });
});