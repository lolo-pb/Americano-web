"use client";

import { type DragEvent, useMemo, useState } from "react";
import { saveBracketAction } from "@/app/actions";
import { useI18n } from "@/components/i18n-provider";
import type { Bracket, PublicTeam } from "@/lib/types";

type DragPayload = {
  teamId: string;
  source: "available" | "selected";
};

function parseDragPayload(event: DragEvent): DragPayload | null {
  const payload = event.dataTransfer.getData("text/plain");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as DragPayload;
  } catch {
    return null;
  }
}

export function BracketSetupEditor({
  tournamentId,
  bracket,
  teams,
  locale,
}: {
  tournamentId: string;
  bracket: Bracket | null;
  teams: PublicTeam[];
  locale: string;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(bracket?.name ?? "Main Draw");
  const [format, setFormat] = useState(bracket?.format ?? "Americano - 32 teams");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(bracket?.entries.map((entry) => entry.teamId) ?? []);
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const locked = Boolean(bracket?.setupLocked);

  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const selectedTeams = selectedTeamIds.map((teamId) => teamMap.get(teamId)).filter(Boolean) as PublicTeam[];
  const availableTeams = teams.filter((team) => !selectedTeamIds.includes(team.id));

  function onDragStart(teamId: string, source: "available" | "selected") {
    return (event: DragEvent) => {
      setDraggedTeamId(teamId);
      event.dataTransfer.setData("text/plain", JSON.stringify({ teamId, source }));
      event.dataTransfer.effectAllowed = "move";
    };
  }

  function addTeamAt(teamId: string, index?: number) {
    setSelectedTeamIds((current) => {
      const without = current.filter((id) => id !== teamId);
      const nextIndex = index === undefined ? without.length : Math.max(0, Math.min(index, without.length));
      const next = [...without];
      next.splice(nextIndex, 0, teamId);
      return next;
    });
  }

  function removeTeam(teamId: string) {
    setSelectedTeamIds((current) => current.filter((id) => id !== teamId));
  }

  function handleSelectedDrop(index?: number) {
    return (event: DragEvent) => {
      event.preventDefault();
      const payload = parseDragPayload(event);
      setDraggedTeamId(null);

      if (!payload || locked) {
        return;
      }

      addTeamAt(payload.teamId, index);
    };
  }

  function handleAvailableDrop(event: DragEvent) {
    event.preventDefault();
    const payload = parseDragPayload(event);
    setDraggedTeamId(null);

    if (!payload || locked || payload.source !== "selected") {
      return;
    }

    removeTeam(payload.teamId);
  }

  return (
    <form action={saveBracketAction} className="grid gap-6">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="locale" value={locale} />
      {bracket && <input type="hidden" name="bracketId" value={bracket.id} />}
      {selectedTeamIds.map((teamId) => (
        <input key={teamId} type="hidden" name="selectedTeamId" value={teamId} />
      ))}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">{t("admin.brackets.fields.name")}</span>
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            readOnly={locked}
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest read-only:bg-surface"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">{t("admin.brackets.fields.format")}</span>
          <input
            name="format"
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            readOnly={locked}
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest read-only:bg-surface"
          />
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section
          className="rounded-[1.6rem] border border-line bg-white/70 p-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleAvailableDrop}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-forest">{t("admin.brackets.availableTitle")}</h3>
              <p className="mt-1 text-sm text-muted">{t("admin.brackets.availableDescription")}</p>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-muted">
              {availableTeams.length}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {availableTeams.length ? (
              availableTeams.map((team) => (
                <div
                  key={team.id}
                  draggable={!locked}
                  onDragStart={onDragStart(team.id, "available")}
                  className="rounded-[1.3rem] border border-line bg-surface px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{team.teamName}</p>
                      <p className="text-sm text-muted">{team.playerOneName} + {team.playerTwoName}</p>
                      <p className="text-sm text-muted">
                        {team.slug} · {team.category ?? t("common.levels.open")}
                      </p>
                    </div>
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => addTeamAt(team.id)}
                        className="rounded-full border border-line px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-forest hover:border-forest hover:bg-forest hover:text-white"
                      >
                        {t("admin.brackets.addAction")}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                {t("admin.brackets.noAvailableTeams")}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-line bg-white/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-forest">{t("admin.brackets.selectedTitle")}</h3>
              <p className="mt-1 text-sm text-muted">{t("admin.brackets.selectedDescription")}</p>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-muted">
              {selectedTeams.length}/32
            </span>
          </div>

          <div
            className="mt-5 rounded-[1.4rem] border border-dashed border-line bg-surface/45 p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleSelectedDrop()}
          >
            <div className="grid gap-3">
              {selectedTeams.length ? (
                selectedTeams.map((team, index) => (
                  <div key={team.id} className="grid gap-3">
                    {!locked && (
                      <div
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleSelectedDrop(index)}
                        className={`h-3 rounded-full transition ${
                          draggedTeamId ? "bg-forest/10" : "bg-transparent"
                        }`}
                      />
                    )}
                    <div
                      draggable={!locked}
                      onDragStart={onDragStart(team.id, "selected")}
                      className="rounded-[1.3rem] border border-line bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                            {t("admin.brackets.startingSlot")} {index}
                          </p>
                          <p className="mt-1 font-bold text-ink">{team.teamName}</p>
                          <p className="text-sm text-muted">{team.playerOneName} + {team.playerTwoName}</p>
                        </div>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => removeTeam(team.id)}
                            className="rounded-full border border-line px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-forest hover:border-forest hover:bg-forest hover:text-white"
                          >
                            {t("admin.brackets.removeAction")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                  {t("admin.brackets.emptySelection")}
                </p>
              )}
              {!locked && selectedTeams.length > 0 && (
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleSelectedDrop(selectedTeams.length)}
                  className={`h-3 rounded-full transition ${draggedTeamId ? "bg-forest/10" : "bg-transparent"}`}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {!locked && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{t("admin.brackets.pairingHelp")}</p>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-strong"
          >
            {t("admin.brackets.save")}
          </button>
        </div>
      )}
    </form>
  );
}
