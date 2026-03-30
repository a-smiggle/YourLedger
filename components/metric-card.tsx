type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="rounded-panel bg-surface p-6 shadow-ambient">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-primary">{value}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </article>
  );
}