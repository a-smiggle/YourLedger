import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";

const lenders = [
  { name: "Major Bank A", style: "Owner occupier focus", turnaround: "2-4 business days" },
  { name: "Major Bank B", style: "Strong refinance appetite", turnaround: "3-5 business days" },
  { name: "Non-bank Lender", style: "Flexible policy edge cases", turnaround: "1-3 business days" },
];

export default function LendersPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Lenders"
          title="A base directory for lender notes, filters, and future comparison criteria."
          description="The route exists because it is part of the stitch IA, but the app base keeps it as neutral comparison tooling rather than promotional copy."
        />

        <SectionCard title="Sample lender directory" subtitle="Placeholder lender profiles for future policy data.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lenders.map((lender) => (
              <article key={lender.name} className="rounded-2xl bg-surface-low p-5 text-sm text-muted">
                <h3 className="text-lg font-bold text-primary">{lender.name}</h3>
                <p className="mt-3">Credit profile: {lender.style}</p>
                <p className="mt-2">Typical turnaround: {lender.turnaround}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}