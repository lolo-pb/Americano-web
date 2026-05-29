import { BracketProgressBoard } from "@/components/bracket-progress-board";
import { SectionHeading } from "@/components/section-heading";
import { getPublicBracketView, getTournament } from "@/lib/data";
import { getDictionary, type Locale } from "@/lib/i18n";

export default async function BracketsPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const [tournament, bracketView, dictionary] = await Promise.all([
    getTournament(),
    getPublicBracketView(),
    getDictionary(locale),
  ]);

  return (
    <div className="page-shell py-8 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.brackets.eyebrow}
        title={`${tournament.name} ${dictionary.brackets.titleSuffix}`}
        description={dictionary.brackets.description}
      />

      {bracketView ? (
        <div className="mt-8 card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
          <h2 className="text-xl font-extrabold text-forest sm:text-2xl">{bracketView.bracket.name}</h2>
          <p className="mt-1 text-sm text-muted">{bracketView.bracket.format}</p>
          <div className="mt-6">
            <BracketProgressBoard
              bracket={bracketView.bracket}
              columns={bracketView.columns}
              locale={locale}
              titles={dictionary.brackets.roundTitles}
              labels={{
                slot: dictionary.brackets.slotLabel,
                empty: dictionary.brackets.emptySlot,
                won: dictionary.brackets.wonAction,
                openLevel: dictionary.common.levels.open,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8 card rounded-[1.6rem] p-5 text-sm text-muted sm:rounded-[2rem] sm:p-8 sm:text-base">
          {dictionary.brackets.empty}
        </div>
      )}
    </div>
  );
}
