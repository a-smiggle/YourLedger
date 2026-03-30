"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SESSION_NAVIGATION_KEY = "your-ledger:preferred-route";

type ReturnToLandingButtonProps = {
  className?: string;
  onNavigate?: () => void;
  label?: string;
};

export function LandingSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    const preferredRoute = window.sessionStorage.getItem(SESSION_NAVIGATION_KEY);

    if (preferredRoute === "/dashboard") {
      router.replace("/dashboard");
    }
  }, [router]);

  return null;
}

export function DashboardSessionPreference() {
  useEffect(() => {
    window.sessionStorage.setItem(SESSION_NAVIGATION_KEY, "/dashboard");
  }, []);

  return null;
}

export function ReturnToLandingButton({ className, onNavigate, label = "Back to landing page" }: ReturnToLandingButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    window.sessionStorage.setItem(SESSION_NAVIGATION_KEY, "/");
    onNavigate?.();
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "inline-flex items-center justify-center text-sm font-semibold transition-colors",
        className ?? "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}