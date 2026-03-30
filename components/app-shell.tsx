"use client";

import { useEffect, useState } from "react";

import { DashboardInfoActions } from "@/components/dashboard-info-actions";
import { Navigation } from "@/components/navigation";
import { ReturnToLandingButton } from "@/components/session-navigation";
import { SponsoredPanel } from "@/components/sponsored-panel";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const syncMenuForViewport = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(true);
        return;
      }

      setIsMenuOpen(false);
    };

    syncMenuForViewport();
    window.addEventListener("resize", syncMenuForViewport);

    return () => {
      window.removeEventListener("resize", syncMenuForViewport);
    };
  }, []);

  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen lg:flex">
        <button
          type="button"
          aria-label={isMenuOpen ? "Hide menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          className="fixed left-6 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-outline bg-surface text-ink shadow-ambient transition-colors hover:bg-surface-low lg:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span className="hamburger-icon" aria-hidden="true">
            <span className={isMenuOpen ? "translate-y-[7px] rotate-45" : ""} />
            <span className={isMenuOpen ? "opacity-0" : ""} />
            <span className={isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""} />
          </span>
        </button>

        {isMenuOpen ? (
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-30 bg-primary/20 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        ) : null}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-outline bg-surface-low px-6 py-8 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0",
            isMenuOpen ? "translate-x-0" : "-translate-x-full lg:hidden",
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            <div className="mb-10 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Your Ledger</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-primary">See where you stand.</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Local-first borrowing power, cashflow, and home loan planning.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-outline bg-surface px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted lg:hidden"
                onClick={() => setIsMenuOpen(false)}
              >
                Hide
              </button>
            </div>
            <div className="overflow-y-auto">
              <Navigation onNavigate={handleNavigation} />
            </div>
            <div className="mt-auto pt-6">
              <div className="pb-2">
                <DashboardInfoActions />
              </div>
              <ReturnToLandingButton
                className="w-full justify-start rounded-2xl px-4 py-3 text-ink hover:bg-white"
                onNavigate={() => setIsMenuOpen(false)}
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <main className="px-6 py-20 lg:px-10 lg:py-8">
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
              <div className="min-w-0">{children}</div>
              <section aria-label="Sponsored content" className="xl:sticky xl:top-8">
                <SponsoredPanel />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}