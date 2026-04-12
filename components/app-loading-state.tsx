type AppLoadingStateProps = {
  title?: string;
  description?: string;
};

export function AppLoadingState({
  title = "Loading saved workspace",
  description = "Your Ledger is restoring the latest browser-stored profile, scenarios, and lender settings before this page is shown.",
}: Readonly<AppLoadingStateProps>) {
  return (
    <section className="rounded-panel bg-surface p-7 shadow-ambient" role="status" aria-live="polite" aria-busy="true">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Loading</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-primary">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</p>

      <div className="mt-6 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded-full bg-surface-high" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-surface-low" />
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-surface-low" />
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-surface-low" />
        </div>
        <div className="h-72 animate-pulse rounded-[1.5rem] bg-surface-low" />
      </div>
    </section>
  );
}