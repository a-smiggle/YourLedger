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
          description="Once the household balance sheet is current, continue to Lenders & Products to review all loaded lenders and choose the products you want to compare."
        />

        <AssetsLiabilitiesEditor />
      </div>
    </AppShell>
  );
}