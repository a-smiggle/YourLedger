"use client";

import { AppShell } from "@/components/app-shell";
import { AssetsLiabilitiesEditor } from "@/components/household-data-entry";
import { PageHero } from "@/components/page-hero";

export default function AssetsLiabilitiesPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Assets & Liabilities"
          title="Model property, cash, super, and debt positions in a single household statement."
          description="Maintain the household balance sheet directly in the app so assets, liabilities, and repayments stay current everywhere else."
        />

        <AssetsLiabilitiesEditor />
      </div>
    </AppShell>
  );
}