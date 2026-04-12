import Link from "next/link";

import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { marketingSectionLinks } from "@/components/marketing-nav";
import { MetricCard } from "@/components/metric-card";
import { SectionCard } from "@/components/section-card";

const principles = [
  "Keep household planning data on the device by default.",
  "Make assumptions visible so indicative results are easier to understand and review.",
  "Present borrowing and repayment outcomes in a format that is clear, professional, and easy to compare.",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <MarketingHeader sections={marketingSectionLinks} />

      <main id="main-content">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:px-10 lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex rounded-full bg-primary-soft px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
              About Your Ledger
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-6xl">
                A conservative, client-side planning tool for Australian households.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                Your Ledger is designed to help households understand borrowing capacity, cashflow, and loan options with clearer assumptions and more readable outputs. It is built for indicative planning, not for collecting or submitting an application.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard" className="rounded-full bg-primary px-6 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-white">
                Open dashboard
              </Link>
              <Link href="/" className="rounded-full border border-outline bg-surface px-6 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-ink">
                Back to landing page
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-primary px-6 py-8 text-white shadow-ambient sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">Our approach</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Built to support careful planning before a formal lending conversation.
            </h2>
            <p className="mt-6 text-sm leading-7 text-blue-50">
              The experience is intentionally framed as a practical planning workspace, not a promise of approval or a substitute for lender credit policy.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Privacy approach"
              value="Private"
              detail="Household planning data is intended to stay in the browser unless a user chooses to export it."
            />
            <MetricCard
              label="Calculation approach"
              value="Transparent"
              detail="Buffers, shading, and floors are surfaced so indicative outcomes are easier to interpret."
            />
            <MetricCard
              label="Architecture"
              value="Structured"
              detail="The product is designed so planning tools remain clear, maintainable, and easy to extend over time."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-6 lg:px-10 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Product position">
              <div className="space-y-4 text-sm leading-7 text-muted">
                <p>Your Ledger is intended to give households a clearer view of borrowing power, cashflow, and loan options before they move into formal advice or application stages.</p>
                <p>The focus is on readable outputs, conservative assumptions, and a planning experience that feels professional without becoming opaque or overcomplicated.</p>
              </div>
            </SectionCard>

            <SectionCard title="Core principles">
              <ul className="space-y-3 text-sm leading-7 text-muted">
                {principles.map((principle) => (
                  <li key={principle} className="rounded-2xl bg-surface-low px-4 py-4">
                    {principle}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}