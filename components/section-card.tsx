export function SectionCard({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-panel bg-surface p-7 shadow-ambient">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-primary">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}