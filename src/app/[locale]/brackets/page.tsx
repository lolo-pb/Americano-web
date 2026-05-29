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
    <div className="page-shell py-8 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.brackets.eyebrow}
        title={`${tournament.name} ${dictionary.brackets.titleSuffix}`}
        description={dictionary.brackets.description}
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {brackets.length ? (
          brackets.map((bracket) => <BracketCard key={bracket.id} bracket={bracket} locale={locale} />)
        ) : (
          <div className="card rounded-[1.6rem] p-5 text-sm text-muted sm:rounded-[2rem] sm:p-8 sm:text-base">{dictionary.brackets.empty}</div>
        )}
      </div>
    </div>
  );
}
