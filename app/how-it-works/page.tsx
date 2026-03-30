import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";

export default function HowItWorksPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="How This Works"
          title="Explain the calculator clearly enough that users can understand assumptions before they trust outputs."
          description="This route is included because the README makes it a product requirement, not an optional marketing page."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Calculation approach">
            <ul className="space-y-3 text-sm text-muted">
              <li>Income sources are shaded conservatively before serviceability is assessed.</li>
              <li>Living expenses use the higher of entered expenses and a configurable floor.</li>
              <li>Assessment rates include an interest-rate buffer above the target note rate.</li>
              <li>Outputs are indicative planning estimates only.</li>
            </ul>
          </SectionCard>

          <SectionCard title="Privacy and disclaimer">
            <div className="space-y-4 text-sm text-muted">
              <p>All calculations run locally in your browser. No profile data is sent to an external service by this scaffold.</p>
              <p>This calculator provides general information only and does not constitute financial advice.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}