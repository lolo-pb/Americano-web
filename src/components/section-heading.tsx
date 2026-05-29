export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="eyebrow text-[0.78rem] text-accent sm:text-sm">{eyebrow}</p>
      <h2 className="font-heading text-3xl leading-none text-forest sm:text-5xl">
        {title}
      </h2>
      <p className="text-[0.95rem] leading-6 text-muted sm:text-lg sm:leading-7">{description}</p>
    </div>
  );
}
