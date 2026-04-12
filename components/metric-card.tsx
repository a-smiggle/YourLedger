type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="rounded-panel bg-surface p-5 shadow-ambient sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-primary sm:mt-4 sm:text-3xl">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </article>
  );
}