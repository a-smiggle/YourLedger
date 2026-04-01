"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type SectionItem = {
  href: string;
  label: string;
  sectionId: string;
};

type MarketingHeaderProps = {
  sections?: SectionItem[];
};

export function MarketingHeader({ sections = [] }: MarketingHeaderProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState(sections[0]?.sectionId ?? "");

  useEffect(() => {
    if (!sections.length || pathname !== "/") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

        if (visibleEntries[0]?.target.id) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7],
      },
    );

    const elements = sections
      .map((section) => document.getElementById(section.sectionId))
      .filter((element): element is HTMLElement => element !== null);

    const lastSectionId = sections[sections.length - 1]?.sectionId;

    const syncSectionAtScrollExtremes = () => {
      const scrollTop = window.scrollY;
      const viewportBottom = scrollTop + window.innerHeight;
      const pageBottom = document.documentElement.scrollHeight;

      if (scrollTop < 40) {
        setActiveSection(sections[0]?.sectionId ?? "");
        return;
      }

      if (lastSectionId && pageBottom - viewportBottom < 40) {
        setActiveSection(lastSectionId);
      }
    };

    elements.forEach((element) => observer.observe(element));
    window.addEventListener("scroll", syncSectionAtScrollExtremes, { passive: true });
    syncSectionAtScrollExtremes();

    return () => {
      elements.forEach((element) => observer.unobserve(element));
      window.removeEventListener("scroll", syncSectionAtScrollExtremes);
      observer.disconnect();
    };
  }, [pathname, sections]);

  return (
    <header className="sticky top-0 z-50 border-b border-outline bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:px-10">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-4">
            <Image
              src="/YourLedgerIcon.png"
              alt="Your Ledger"
              width={124}
              height={72}
              className="h-24 w-24 rounded-2xl object-contain"
              priority
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Your Ledger</p>
              <p className="mt-2 text-lg font-semibold text-primary">See where you stand. Plan your next step.</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
              <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
          {sections.map((section) => {
            const isActive = pathname === "/" && activeSection === section.sectionId;

            return (
              <a
                key={section.sectionId}
                href={section.href}
                className={[
                  "rounded-full px-4 py-2 transition-colors",
                  isActive ? "bg-primary text-white" : "bg-surface text-muted hover:bg-surface-low hover:text-ink",
                ].join(" ")}
              >
                {section.label}
              </a>
            );
          })}
          <Link
            href="/about"
            className={[
              "rounded-full px-4 py-2 transition-colors",
              pathname === "/about" ? "bg-primary text-white" : "bg-surface text-muted hover:bg-surface-low hover:text-ink",
            ].join(" ")}
          >
            About
          </Link>
        </nav>
            <Link href="/dashboard" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              Dashboard
            </Link>
          </div>
        </div>

      </div>
    </header>
  );
}