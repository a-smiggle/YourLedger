export function SponsoredPanel() {
  return (
    <aside className="rounded-panel bg-surface-high p-6 shadow-ambient">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Sponsored</p>
      <h3 className="mt-3 text-lg font-bold text-primary">Partner placement</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        This space is reserved for clearly labelled partner content. Sponsored placements remain visually separate from planning information and do not interact with calculator data.
      </p>
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-muted">
        Partner message, disclosure wording, and external links will appear here.
      </div>
    </aside>
  );
}