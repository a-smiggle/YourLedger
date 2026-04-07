"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/income-expenses", label: "Income & Expenses" },
  { href: "/assets-liabilities", label: "Assets & Liabilities" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/lenders", label: "Lenders" },
  { href: "/results", label: "Results" },
];

type NavigationProps = {
  onNavigate?: () => void;
};

export function Navigation({ onNavigate }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          onClick={onNavigate}
          aria-current={pathname === route.href ? "page" : undefined}
          className={[
            "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
            pathname === route.href
              ? "bg-primary text-white shadow-ambient"
              : "text-ink hover:bg-white",
          ].join(" ")}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}