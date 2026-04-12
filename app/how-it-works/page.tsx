import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";

export default function HowItWorksPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="How This Works"
          title="See how household inputs, lender settings, and scenario structure combine into one indicative planning view."
          description="Your Ledger keeps the calculation path visible. Income shading, expense treatment, buffers, repayment modelling, and storage behaviour are all designed to be understandable before you compare a scenario or shortlist a lender."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Core calculation flow">
            <ul className="space-y-3 text-sm text-muted">
              <li>Household income is combined across members, then bonus income, rental income, and HECS or HELP impacts are adjusted before serviceability is assessed.</li>
              <li>Living expenses are assessed using the higher of entered household costs and the configured expense floor, so low declarations do not overstate borrowing capacity.</li>
              <li>Existing debts, proposed lending, and assessment-rate buffers are applied together so the output reflects a serviceability view rather than a simple repayment calculator.</li>
              <li>Scenario summaries then compare borrowing headroom, total debt, equity use, product fit, and long-range repayment outcomes from the same household base data.</li>
            </ul>
          </SectionCard>

          <SectionCard title="Buffers and assumptions">
            <div className="space-y-4 text-sm text-muted">
              <p>Assessment rates include lender buffers above the target note rate so borrowing capacity is measured under a more conservative repayment assumption.</p>
              <p>Income shading, tax estimates, contribution rates, asset growth assumptions, and scenario sensitivity moves are driven from shared configuration so the logic stays consistent across charts and summary cards.</p>
              <p>Product settings such as offset support, maximum term, and maximum LVR are used when the app compares lenders or projects a scenario forward.</p>
            </div>
          </SectionCard>

          <SectionCard title="Scenario and projection logic">
            <div className="space-y-4 text-sm text-muted">
              <p>Scenarios describe the deal itself: property target, cash contribution, equity release, refinance amount, offset balance, target rate, and loan term.</p>
              <p>Results use those settings to project repayments, offset effects, debt reduction, interest saved, wealth position, and LVR trajectories across a 30-year monthly horizon.</p>
              <p>Sensitivity views apply configured rate changes so you can see how a scenario behaves when the borrowing environment shifts.</p>
            </div>
          </SectionCard>

          <SectionCard title="Privacy and data storage">
            <div className="space-y-4 text-sm text-muted">
              <p>Calculations run locally in the browser and household planning data is stored on the device by default using local storage.</p>
              <p>The Data Management page lets you export the full app state to JSON, import a previous export, reset to seeded defaults, clear local data, and recover safely from invalid stored payloads.</p>
              <p>Sponsored areas remain visually separate from the calculator and do not receive household inputs, selected scenario data, or calculated outputs.</p>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Important limits" subtitle="Use the app to prepare and compare scenarios, then confirm the next step with current lender policy and professional advice where needed.">
          <div className="space-y-4 text-sm text-muted">
            <p>The calculator provides general information only. It does not issue credit approval, replace formal servicing calculations, or account for every lender policy nuance, fee, valuation outcome, or exception path.</p>
            <p>Outputs are strongest when the household profile, liabilities, and scenario settings are kept current. If the facts change, refresh the profile and review the results again before relying on the comparison.</p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}