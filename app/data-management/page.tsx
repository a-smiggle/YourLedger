"use client";

import { AppShell } from "@/components/app-shell";
import { DataManagementPanel } from "@/components/data-management-panel";
import { PageHero } from "@/components/page-hero";
import { SectionCard } from "@/components/section-card";

export default function DataManagementPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Data Management"
          title="Export, import, reset, and recover local app data from one dedicated workspace."
          description="Use this page to back up the full app state, restore a previous export, or recover from invalid browser data without digging through the dashboard."
        />

        <SectionCard
          title="Local data controls"
          subtitle="These actions affect the browser-stored copy of household data, scenarios, bank overrides, and session preferences."
        >
          <DataManagementPanel />
        </SectionCard>
      </div>
    </AppShell>
  );
}