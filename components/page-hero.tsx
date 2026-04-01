type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="rounded-[2rem] bg-primary px-8 py-10 text-white shadow-ambient sm:px-10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-blue-50 sm:text-base">{description}</p>
    </section>
  );
}