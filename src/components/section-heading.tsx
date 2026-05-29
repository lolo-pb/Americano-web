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
      <p className="eyebrow text-sm text-accent">{eyebrow}</p>
      <h2 className="font-heading text-4xl leading-none text-forest sm:text-5xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-muted sm:text-lg">{description}</p>
    </div>
  );
}
