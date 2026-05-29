import { advanceBracketWinnerAction } from "@/app/actions";
import type { Bracket, BracketProgressColumn } from "@/lib/types";

const BASE_SLOT_COUNT = 32;

function getSlotCenter(roundIndex: number, slotIndex: number, rowPitch: number, slotHeight: number) {
  const roundStride = 2 ** roundIndex;
  const offset = (roundStride - 1) / 2;
  return slotHeight / 2 + (offset + slotIndex * roundStride) * rowPitch;
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
  const slotHeight = adminView ? 118 : 100;
  const rowPitch = adminView ? 126 : 108;
  const boardHeight = (BASE_SLOT_COUNT - 1) * rowPitch + slotHeight;

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1200px] grid-cols-6 gap-4">
        {columns.map((column) => (
          <section key={column.roundIndex} className="rounded-[1.6rem] border border-line bg-white/70 p-4">
            <div className="border-b border-line pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {titles[column.roundIndex] ?? `R${column.roundIndex + 1}`}
              </p>
              <p className="mt-1 text-sm text-muted">{column.slotCount} slots</p>
            </div>

            <div className="relative mt-4" style={{ height: `${boardHeight}px` }}>
              {column.slots.map((slot) => {
                const centerY = getSlotCenter(column.roundIndex, slot.slotIndex, rowPitch, slotHeight);
                const top = centerY - slotHeight / 2;

                return slot.team ? (
                  <article
                    key={slot.id}
                    className="absolute left-0 right-0 flex flex-col justify-between rounded-[1.2rem] border border-line bg-surface px-3 py-3"
                    style={{ top: `${top}px`, height: `${slotHeight}px` }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                          {labels.slot} {slot.slotIndex}
                        </p>
                        {adminView && (
                          <form action={advanceBracketWinnerAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="bracketId" value={bracket.id} />
                            <input type="hidden" name="roundIndex" value={column.roundIndex} />
                            <input type="hidden" name="slotIndex" value={slot.slotIndex} />
                            <button
                              type="submit"
                              disabled={column.roundIndex >= columns.length - 1}
                              className="rounded-full bg-forest px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white hover:bg-forest/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-white/80 disabled:hover:bg-muted"
                            >
                              {labels.won}
                            </button>
                          </form>
                        )}
                      </div>
                      <p className="mt-1 truncate font-bold text-ink">{slot.team.teamName}</p>
                      <p className="truncate text-sm text-muted">
                        {slot.team.playerOneName} + {slot.team.playerTwoName}
                      </p>
                      <p className="truncate text-sm text-muted">{slot.team.category ?? labels.openLevel}</p>
                    </div>
                  </article>
                ) : (
                  <div
                    key={slot.id}
                    className="absolute left-0 right-0 flex items-center justify-center rounded-[1.2rem] border border-dashed border-line bg-surface/35 px-3 py-3 text-center text-sm text-muted"
                    style={{ top: `${top}px`, height: `${slotHeight}px` }}
                  >
                    {labels.empty}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
