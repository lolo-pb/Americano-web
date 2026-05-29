import Link from "next/link";
import { BracketCard } from "@/components/bracket-card";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getPublishedBrackets, getTournament, getViewerContext } from "@/lib/data";

export default async function HomePage() {
  const [tournament, brackets, viewer] = await Promise.all([
    getTournament(),
    getPublishedBrackets(),
    getViewerContext(),
  ]);

  return (
    <div className="pb-16">
      <section className="page-shell grid gap-10 py-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="eyebrow text-accent">Mobile-first tennis tournament</p>
            <h1 className="font-heading text-6xl leading-none text-forest sm:text-7xl">
              Americano tennis, organized with zero chaos.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted">
              Registration, approval, payment follow-up, player profiles, and published brackets in one clean flow for players and staff.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={viewer.profile ? "/me" : "/sign-up"}
              className="rounded-full bg-accent px-6 py-3 text-center font-semibold text-white hover:bg-accent-strong"
            >
              {viewer.profile ? "Open my profile" : "Sign up now"}
            </Link>
            <Link
              href="/brackets"
              className="rounded-full border border-line px-6 py-3 text-center font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
            >
              View brackets
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card rounded-[1.75rem] p-5">
              <p className="eyebrow text-sm text-accent">Location</p>
              <p className="mt-2 text-lg font-bold text-ink">{tournament.location}</p>
            </div>
            <div className="card rounded-[1.75rem] p-5">
              <p className="eyebrow text-sm text-accent">Start date</p>
              <p className="mt-2 text-lg font-bold text-ink">{tournament.startDate}</p>
            </div>
            <div className="card rounded-[1.75rem] p-5">
              <p className="eyebrow text-sm text-accent">Status</p>
              <div className="mt-2">
                <StatusBadge
                  label={tournament.signupOpen ? "Signups open" : "Closed"}
                  tone={tournament.signupOpen ? "approved" : "rejected"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card court-lines overflow-hidden rounded-[2.25rem] p-6 sm:p-8">
          <div className="rounded-[1.5rem] border border-white/60 bg-white/65 p-6 backdrop-blur">
            <p className="eyebrow text-sm text-accent">Tournament pitch</p>
            <h2 className="mt-3 text-3xl font-extrabold text-forest">{tournament.name}</h2>
            <p className="mt-4 leading-7 text-muted">{tournament.description}</p>
            <div className="mt-6 grid gap-3">
              {[
                "Create an account and reserve your place.",
                "Email your payment proof to the tournament inbox.",
                "Get approved by the admin and wait for bracket publication.",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-forest px-4 py-3 text-sm font-medium text-white">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-8 sm:py-14">
        <SectionHeading
          eyebrow="What players get"
          title="A clean path from signup to first serve."
          description="The public and player-facing experience is designed for phones first, so registration status and published draws are always easy to check."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Fast signup",
              body: "Account creation captures the essentials, then immediately tells the player where to send payment proof.",
            },
            {
              title: "Clear approval state",
              body: "Every player sees whether payment is pending, confirmed, or approved, without chasing admins over chat.",
            },
            {
              title: "Published brackets",
              body: "Once the admin finalizes the draw, the live bracket page becomes the source of truth for everyone.",
            },
          ].map((item) => (
            <article key={item.title} className="card rounded-[1.8rem] p-6">
              <h3 className="text-xl font-extrabold text-forest">{item.title}</h3>
              <p className="mt-3 leading-7 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell py-8 sm:py-14">
        <SectionHeading
          eyebrow="Published draws"
          title="Brackets players can actually read on mobile."
          description="Start with a simple, highly legible bracket list now. We can always evolve this into a richer tree view later."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {brackets.length ? (
            brackets.map((bracket) => <BracketCard key={bracket.id} bracket={bracket} />)
          ) : (
            <div className="card rounded-[2rem] p-8 text-muted">
              No published brackets yet. The admin will publish them once payments and assignments are finalized.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
