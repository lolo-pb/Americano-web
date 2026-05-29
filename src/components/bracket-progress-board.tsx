import { advanceBracketWinnerAction } from "@/app/actions";
import type { Bracket, BracketProgressColumn } from "@/lib/types";

function visualRowsForRound(roundIndex: number, slotCount: number) {
  const stride = 2 ** roundIndex;
  const rowCount = 32;

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    if (rowIndex % stride !== 0) {
      return { kind: "spacer" as const, rowIndex };
    }

    const slotIndex = Math.floor(rowIndex / stride);

    if (slotIndex >= slotCount) {
      return { kind: "spacer" as const, rowIndex };
    }

    return { kind: "slot" as const, rowIndex, slotIndex };
  });
}

export function BracketProgressBoard({
  bracket,
  columns,
  locale,
  titles,
  adminView = false,
  labels,
}: {
  bracket: Bracket;
  columns: BracketProgressColumn[];
  locale: string;
  titles: string[];
  adminView?: boolean;
  labels: {
    slot: string;
    empty: string;
    won: string;
    openLevel: string;
  };
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1200px] grid-cols-6 gap-4">
        {columns.map((column) => {
          const visualRows = visualRowsForRound(column.roundIndex, column.slotCount);

          return (
            <section key={column.roundIndex} className="rounded-[1.6rem] border border-line bg-white/70 p-4">
              <div className="border-b border-line pb-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  {titles[column.roundIndex] ?? `R${column.roundIndex + 1}`}
                </p>
                <p className="mt-1 text-sm text-muted">{column.slotCount} slots</p>
              </div>

              <div className="mt-4 grid gap-2">
                {visualRows.map((row) => {
                  if (row.kind === "spacer") {
                    return <div key={`spacer-${column.roundIndex}-${row.rowIndex}`} className="h-[3.85rem]" />;
                  }

                  const slot = column.slots[row.slotIndex];

                  return slot.team ? (
                    <article
                      key={slot.id}
                      className="rounded-[1.2rem] border border-line bg-surface px-3 py-3"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                        {labels.slot} {slot.slotIndex}
                      </p>
                      <p className="mt-1 font-bold text-ink">{slot.team.teamName}</p>
                      <p className="text-sm text-muted">{slot.team.playerOneName} + {slot.team.playerTwoName}</p>
                      <p className="text-sm text-muted">{slot.team.category ?? labels.openLevel}</p>

                      {adminView && column.roundIndex < columns.length - 1 && (
                        <form action={advanceBracketWinnerAction} className="mt-3">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="bracketId" value={bracket.id} />
                          <input type="hidden" name="roundIndex" value={column.roundIndex} />
                          <input type="hidden" name="slotIndex" value={slot.slotIndex} />
                          <button
                            type="submit"
                            className="rounded-full bg-forest px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-forest/90"
                          >
                            {labels.won}
                          </button>
                        </form>
                      )}
                    </article>
                  ) : (
                    <div
                      key={slot.id}
                      className="rounded-[1.2rem] border border-dashed border-line bg-surface/35 px-3 py-3 text-sm text-muted"
                    >
                      {labels.empty}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
