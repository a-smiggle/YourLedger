import type { Metadata } from "next";

import { AppDataProvider } from "@/components/app-data-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Your Ledger",
  description: "Privacy-first home loan planning for Australian households.",
  icons: {
    icon: "/YourLedgerIcon.png",
    shortcut: "/YourLedgerIcon.png",
    apple: "/YourLedgerIcon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="skip-link fixed left-4 top-4 z-[200] -translate-y-20 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-ambient focus:translate-y-0"
        >
          Skip to main content
        </a>
        <AppDataProvider>{children}</AppDataProvider>
      </body>
    </html>
  );
}