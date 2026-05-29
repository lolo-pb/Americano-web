import { BracketCard } from "@/components/bracket-card";
import { SectionHeading } from "@/components/section-heading";
import { getPublishedBrackets, getTournament } from "@/lib/data";

export default async function BracketsPage() {
  const [tournament, brackets] = await Promise.all([getTournament(), getPublishedBrackets()]);

  return (
    <div className="page-shell py-10 sm:py-14">
      <SectionHeading
        eyebrow="Published brackets"
        title={`${tournament.name} draws`}
        description="As soon as the admin publishes the latest draw, it appears here for every player and visitor."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {brackets.length ? (
          brackets.map((bracket) => <BracketCard key={bracket.id} bracket={bracket} />)
        ) : (
          <div className="card rounded-[2rem] p-8 text-muted">
            No brackets are published yet.
          </div>
        )}
      </div>
    </div>
  );
}
