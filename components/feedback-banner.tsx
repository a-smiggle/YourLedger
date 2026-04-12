type FeedbackBannerProps = {
  tone: "success" | "error" | "info";
  message: string;
};

function feedbackClassName(tone: FeedbackBannerProps["tone"]) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "error") {
    return "border-warning/30 bg-warning/10 text-warning";
  }

  return "border-outline bg-surface-low text-muted";
}

export function FeedbackBanner({ tone, message }: Readonly<FeedbackBannerProps>) {
  return (
    <div
      className={`rounded-[1.25rem] border px-4 py-4 text-sm leading-6 ${feedbackClassName(tone)}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      {message}
    </div>
  );
}