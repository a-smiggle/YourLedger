export function SectionCard({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-panel bg-surface p-5 shadow-ambient sm:p-7">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-lg font-bold tracking-tight text-primary sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}