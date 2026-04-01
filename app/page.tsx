"use client";

import Link from "next/link";

import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { useAppData } from "@/components/app-data-provider";
import { marketingSectionLinks } from "@/components/marketing-nav";
import { MetricCard } from "@/components/metric-card";
import { SectionCard } from "@/components/section-card";
import { LandingSessionRedirect } from "@/components/session-navigation";
import { SponsoredPanel } from "@/components/sponsored-panel";
import { BorrowingPowerChart } from "@/charts/borrowing-power-chart";
import { calculateBorrowingPower } from "@/engine/borrowing-power";
import { buildScenarioSummaries } from "@/engine/scenario-summaries";

const planningHighlights = [
  {
    title: "Build a complete household profile",
    description: "Bring together multiple applicants, income types, living costs, assets, and liabilities in one structured view.",
  },
  {
    title: "Assess borrowing capacity clearly",
    description: "Review indicative borrowing power using conservative expense treatment, lending buffers, and visible assumptions.",
  },
  {
    title: "Compare options with confidence",
    description: "Test scenarios across rates, repayments, and lender settings so trade-offs are easier to explain and evaluate.",
  },
];

const productSteps = [
  "Enter household income, expenses, assets, and liabilities in one place.",
  "Review indicative borrowing capacity calculated locally using conservative assumptions.",
  "Compare scenarios, understand the trade-offs, and export planning data when needed.",
];

export default function LandingPage() {
  const { userData, bankData } = useAppData();
  const result = calculateBorrowingPower(userData.profile);
  const scenarioSummaries = buildScenarioSummaries(userData, bankData);
  const netPosition = result.totalAssets - result.totalLiabilities;

  return (
    <div className="min-h-screen bg-background text-ink">
      <LandingSessionRedirect />
      <MarketingHeader sections={marketingSectionLinks} />

      <main>
        <section id="overview" className="mx-auto grid max-w-7xl scroll-mt-40 gap-10 px-6 py-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)] lg:px-10 lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex rounded-full bg-primary-soft px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Privacy-first home loan planning
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
                  Understand your borrowing position with clear, conservative home loan planning.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                  Your Ledger is a privacy-first planning tool for Australian households. It helps you organise household finances, review indicative borrowing power, and compare scenarios before taking the next step with a lender or adviser.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard" className="rounded-full bg-primary px-6 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-white">
                Start planning
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full border border-outline bg-surface px-6 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-ink"
              >
                Review assumptions
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-panel bg-surface px-5 py-4 shadow-ambient">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Private by design</p>
                <p className="mt-2 text-sm leading-6 text-muted">Calculations run in the browser and household planning data stays on the device by default.</p>
              </div>
              <div className="rounded-panel bg-surface px-5 py-4 shadow-ambient">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Clear assumptions</p>
                <p className="mt-2 text-sm leading-6 text-muted">Income shading, expense floors, and lending buffers are visible so results can be understood properly.</p>
              </div>
              <div className="rounded-panel bg-surface px-5 py-4 shadow-ambient">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Scenario ready</p>
                <p className="mt-2 text-sm leading-6 text-muted">Compare borrowing outcomes, repayment positions, and planning options from one shared profile.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-primary px-8 py-8 text-white shadow-ambient sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">Example household snapshot</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              See how key numbers can be brought together in one clear planning view.
            </h2>
            <div className="mt-8 space-y-5">
              <div className="rounded-3xl bg-white/8 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Estimated borrowing power</p>
                <p className="mt-3 text-4xl font-extrabold tracking-tight">${result.estimatedBorrowingPower.toLocaleString()}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/8 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Shaded income</p>
                  <p className="mt-3 text-2xl font-bold">${result.shadedAnnualIncome.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl bg-white/8 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Monthly surplus</p>
                  <p className="mt-3 text-2xl font-bold">${result.monthlySurplus.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-blue-50">
                Indicative example only. Actual results depend on your financial position and lending criteria.
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl scroll-mt-40 px-6 py-6 lg:px-10 lg:py-10">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">What the app covers</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              Built around the actual questions households ask before applying.
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {planningHighlights.map((highlight) => (
              <SectionCard key={highlight.title} title={highlight.title}>
                <p className="text-sm leading-7 text-muted">{highlight.description}</p>
              </SectionCard>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-6 lg:px-10 lg:py-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Estimated borrowing"
              value={`$${result.estimatedBorrowingPower.toLocaleString()}`}
              detail={`Indicative borrowing capacity assessed at ${result.assessedRepaymentRate.toFixed(2)}%.`}
            />
            <MetricCard
              label="Net asset position"
              value={`$${netPosition.toLocaleString()}`}
              detail="Assets less liabilities across the current household position."
            />
            <MetricCard
              label="Household members"
              value={userData.profile.members.length.toString()}
              detail="Supports planning for multiple applicants within one household view."
            />
            <MetricCard
              label="Dependants"
              value={userData.profile.dependants.toString()}
              detail="Household structure can be reflected in the expense assessment approach."
            />
          </div>
        </section>

        <section id="scenarios" className="mx-auto max-w-7xl scroll-mt-40 px-6 py-6 lg:px-10 lg:py-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <SectionCard
              title="Scenario comparison"
              subtitle="Compare potential outcomes side by side so changes in rates, structure, or lender settings are easier to assess."
            >
              <BorrowingPowerChart scenarios={scenarioSummaries} />
            </SectionCard>
            <SponsoredPanel />
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-40 px-6 py-6 lg:px-10 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <SectionCard title="How this works" subtitle="The calculator is designed to keep the process understandable from the outset.">
              <ol className="space-y-4 text-sm leading-7 text-muted">
                {productSteps.map((step, index) => (
                  <li key={step} className="flex gap-4 rounded-2xl bg-surface-low px-4 py-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </SectionCard>

            <SectionCard title="Transparency" subtitle="Important context is made clear before any planning decisions are taken.">
              <div className="space-y-4 text-sm leading-7 text-muted">
                <p>
                  This calculator provides general information only and does not constitute financial advice.
                </p>
                <p>
                  Assumptions, buffers, and serviceability settings are intended to remain configurable and visible.
                </p>
                <div className="rounded-2xl bg-surface-low px-4 py-4 text-ink">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Next step</p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    Open the dashboard to begin entering household information and reviewing indicative borrowing outcomes.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
