import { BracketCard } from "@/components/bracket-card";
import { SectionHeading } from "@/components/section-heading";
import { getPublishedBrackets, getTournament } from "@/lib/data";
import { getDictionary, type Locale } from "@/lib/i18n";

export default async function BracketsPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const [tournament, brackets, dictionary] = await Promise.all([
    getTournament(),
    getPublishedBrackets(),
    getDictionary(locale),
  ]);

  return (
    <div className="page-shell py-10 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.brackets.eyebrow}
        title={`${tournament.name} ${dictionary.brackets.titleSuffix}`}
        description={dictionary.brackets.description}
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {brackets.length ? (
          brackets.map((bracket) => <BracketCard key={bracket.id} bracket={bracket} locale={locale} />)
        ) : (
          <div className="card rounded-[2rem] p-8 text-muted">{dictionary.brackets.empty}</div>
        )}
      </div>
    </div>
  );
}
