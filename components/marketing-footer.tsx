import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-outline">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <p>Your Ledger is a privacy-first, client-side planning workspace for Australian households.</p>
        <div className="flex flex-wrap gap-5">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/about">About</Link>
        </div>
      </div>
    </footer>
  );
}