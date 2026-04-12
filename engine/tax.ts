import { taxAssumptions } from "@/config/calculation-assumptions";

export function calculateResidentIncomeTax(taxableIncome: number) {
  for (const bracket of taxAssumptions.residentTaxBrackets) {
    if (taxableIncome <= bracket.upperBound) {
      return bracket.baseTax + Math.max(taxableIncome - bracket.threshold, 0) * bracket.marginalRate;
    }
  }

  return 0;
}