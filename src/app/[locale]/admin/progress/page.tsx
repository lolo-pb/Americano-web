import Link from "next/link";
import { BracketProgressBoard } from "@/components/bracket-progress-board";
import { SectionHeading } from "@/components/section-heading";
import { getActiveAdminBracket, getBracketProgress, requireAdmin } from "@/lib/data";
import { getDictionary, localizeHref, type Locale } from "@/lib/i18n";

export default async function AdminProgressPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  await requireAdmin(locale);

  const [bracket, dictionary] = await Promise.all([getActiveAdminBracket(), getDictionary(locale)]);

  if (!bracket || !bracket.setupLocked) {
    return (
      <div className="page-shell-wide py-8 sm:py-14">
        <SectionHeading
          eyebrow={dictionary.admin.progress.eyebrow}
          title={dictionary.admin.progress.title}
          description={dictionary.admin.progress.description}
        />

        <div className="mt-8 card rounded-[1.6rem] p-5 text-sm text-muted sm:rounded-[2rem] sm:p-8 sm:text-base">
          <p>{dictionary.admin.progress.lockedOnly}</p>
          <Link
            href={localizeHref(locale, "/admin/brackets")}
            className="mt-5 inline-flex rounded-full border border-line px-5 py-3 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
          >
            {dictionary.admin.progress.backToSetup}
          </Link>
        </div>
      </div>
    );
  }

  const columns = await getBracketProgress(bracket.id);

  return (
    <div className="page-shell-wide py-8 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.admin.progress.eyebrow}
        title={dictionary.admin.progress.title}
        description={dictionary.admin.progress.description}
      />

      <div className="mt-8 card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-forest sm:text-2xl">{bracket.name}</h2>
            <p className="mt-1 text-sm text-muted">{bracket.format}</p>
          </div>
          <Link
            href={localizeHref(locale, "/admin/brackets")}
            className="inline-flex rounded-full border border-line px-5 py-3 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
          >
            {dictionary.admin.progress.backToSetup}
          </Link>
        </div>

        <div className="mt-6">
          <BracketProgressBoard
            bracket={bracket}
            columns={columns}
            locale={locale}
            titles={dictionary.admin.progress.roundTitles}
            adminView
            labels={{
              slot: dictionary.admin.progress.slotLabel,
              empty: dictionary.admin.progress.emptySlot,
              won: dictionary.admin.progress.wonAction,
              openLevel: dictionary.common.levels.open,
            }}
          />
        </div>
      </div>
    </div>
  );
}
