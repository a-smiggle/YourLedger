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
        <AppDataProvider>{children}</AppDataProvider>
      </body>
    </html>
  );
}