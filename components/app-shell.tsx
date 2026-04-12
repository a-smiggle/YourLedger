"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { AppLoadingState } from "@/components/app-loading-state";
import { DashboardInfoActions } from "@/components/dashboard-info-actions";
import { Navigation } from "@/components/navigation";
import { ReturnToLandingButton } from "@/components/session-navigation";
import { SponsoredPanel } from "@/components/sponsored-panel";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isHydrated } = useAppData();
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

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const shouldLockScroll = isMenuOpen && window.innerWidth < 1024;
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

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
          aria-controls="primary-navigation-panel"
          className="fixed left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-outline bg-surface text-ink shadow-ambient transition-colors hover:bg-surface-low sm:left-6 sm:top-5 lg:hidden"
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
          id="primary-navigation-panel"
          aria-label="Primary navigation"
          className={[
            "fixed inset-y-0 left-0 z-40 w-[min(18rem,calc(100vw-1rem))] border-r border-outline bg-surface-low px-5 pb-8 pt-4 transition-transform duration-200 sm:px-6 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0",
            isMenuOpen ? "translate-x-0" : "-translate-x-full lg:hidden",
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            <div className="mb-10 flex items-start justify-between gap-4">
              <Link href="/dashboard" className="min-w-0 flex-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Image
                      src="/YourLedgerIcon.png"
                      alt="Your Ledger icon"
                      width={64}
                      height={64}
                      className="h-14 w-14 rounded-2xl object-contain"
                      priority
                    />
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Your Ledger</p>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-primary">See where you stand.</h2>
                  <p className="text-sm leading-6 text-muted">Local-first borrowing power, cashflow, and home loan planning.</p>
                </div>
              </Link>
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
          <main id="main-content" className="px-4 py-20 sm:px-6 lg:px-10 lg:py-8">
            <div className="grid gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start xl:gap-10">
              <div className="min-w-0">
                {isHydrated ? children : <AppLoadingState description="Your saved household data is being restored before the dashboard workflow is rendered." />}
              </div>
              <section aria-label="Sponsored content" className="mt-2 xl:sticky xl:top-8 xl:mt-0">
                <SponsoredPanel />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}