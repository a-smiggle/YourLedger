"use client";

import { AppShell } from "@/components/app-shell";
import { useAppData } from "@/components/app-data-provider";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";

export default function AssetsLiabilitiesPage() {
  const { userData } = useAppData();

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Assets & Liabilities"
          title="Model property, cash, super, and debt positions in a single household statement."
          description="The base route is ready for asset entry forms, loan balances, and equity calculations without tying those calculations to UI components."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Assets" subtitle="Current sample asset register.">
            <div className="space-y-3">
              {userData.profile.assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3 text-sm">
                  <span className="text-ink">{asset.label}</span>
                  <span className="text-muted">${asset.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Liabilities" subtitle="Current sample debt register.">
            <div className="space-y-3">
              {userData.profile.liabilities.map((liability) => (
                <div key={liability.id} className="rounded-2xl bg-surface-low px-4 py-3 text-sm text-muted">
                  <div className="flex items-center justify-between">
                    <span className="text-ink">{liability.label}</span>
                    <span>${liability.balance.toLocaleString()}</span>
                  </div>
                  <p className="mt-1">Monthly repayment ${liability.monthlyRepayment.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}