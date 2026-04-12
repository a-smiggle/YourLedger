export function SponsoredPanel() {
  return (
    <aside className="rounded-panel border border-dashed border-outline bg-surface-high p-6 shadow-ambient">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Sponsored</p>
      <h3 className="mt-3 text-lg font-bold text-primary">Clearly separated partner content</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Sponsored placements are labelled, visually separated from planning information, and kept outside the calculator workflow. Household inputs, selected scenarios, and calculated results are not passed into this panel.
      </p>
      <div className="mt-5 rounded-2xl border border-outline bg-white p-4 text-sm text-muted">
        <p className="font-semibold text-ink">Disclosure standard</p>
        <p className="mt-2 leading-6">
          Any future partner message shown here should remain informational, clearly disclosed, and independent from scenario rankings, lender comparisons, and recommendation logic.
        </p>
      </div>
    </aside>
  );
}