"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { BRACKET_ROUND_SLOT_COUNTS, getActiveAdminBracket, requireAdmin, requireUser } from "@/lib/data";
import { defaultLocale, localizeHref } from "@/lib/i18n";

export async function updateTeamAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireUser(locale as typeof defaultLocale);

  if (viewer.demoMode || !viewer.team || !hasSupabaseEnv()) {
    return;
  }

  const supabase = await createClient();
  const playerOneName = String(formData.get("playerOneName") ?? "").trim();
  const playerTwoName = String(formData.get("playerTwoName") ?? "").trim();

  await supabase!
    .from("teams")
    .update({
      player_one_name: playerOneName.length >= 2 ? playerOneName : viewer.team.playerOneName,
      player_two_name: playerTwoName.length >= 2 ? playerTwoName : viewer.team.playerTwoName,
      phone: String(formData.get("phone") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim(),
    })
    .eq("id", viewer.team.id);

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/me"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, `/teams/${viewer.team.slug}`));
}

export async function updateTeamStatusAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireAdmin(locale as typeof defaultLocale);

  if (viewer.demoMode || !hasSupabaseEnv()) {
    return;
  }

  const teamId = String(formData.get("teamId"));
  const approvalStatus = String(formData.get("approvalStatus"));

  const supabase = await createClient();

  await supabase!
    .from("teams")
    .update({
      approval_status: approvalStatus,
    })
    .eq("id", teamId);

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/players"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/brackets"));
}

export async function saveBracketAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireAdmin(locale as typeof defaultLocale);

  if (viewer.demoMode || !hasSupabaseEnv()) {
    return;
  }

  const supabase = await createClient();
  const activeBracket = await getActiveAdminBracket();
  const bracketId = String(formData.get("bracketId") ?? activeBracket?.id ?? "");
  const tournamentId = String(formData.get("tournamentId"));
  const name = String(formData.get("name") ?? "").trim() || "Main Draw";
  const format = String(formData.get("format") ?? "").trim() || "Americano - 32 teams";
  const selectedTeamIds = formData.getAll("selectedTeamId").map(String).filter(Boolean);
  const uniqueTeamIds = [...new Set(selectedTeamIds)];

  let currentBracketId = bracketId;

  if (currentBracketId) {
    await supabase!
      .from("brackets")
      .update({ name, format })
      .eq("id", currentBracketId);

    await supabase!.from("bracket_entries").delete().eq("bracket_id", currentBracketId);
  } else {
    const { data } = await supabase!
      .from("brackets")
      .insert({
        tournament_id: tournamentId,
        name,
        format,
        bracket_size: BRACKET_ROUND_SLOT_COUNTS[0],
      })
      .select("id")
      .single();

    currentBracketId = String(data?.id ?? "");
  }

  if (currentBracketId && uniqueTeamIds.length) {
    const { data: teams } = await supabase!
      .from("teams")
      .select("id")
      .in("id", uniqueTeamIds)
      .eq("approval_status", "approved");

    const validTeamIds = new Set((teams ?? []).map((team) => String(team.id)));
    const entries = uniqueTeamIds
      .filter((teamId) => validTeamIds.has(teamId))
      .map((teamId, index) => ({
        bracket_id: currentBracketId,
        team_id: teamId,
        position: index,
        seed: index + 1,
      }));

    if (entries.length) {
      await supabase!.from("bracket_entries").insert(entries);
    }
  }

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/brackets"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin"));
}

export async function approveBracketAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireAdmin(locale as typeof defaultLocale);

  if (viewer.demoMode || !hasSupabaseEnv()) {
    return;
  }

  const bracketId = String(formData.get("bracketId"));
  const supabase = await createClient();

  const { data: entries } = await supabase!
    .from("bracket_entries")
    .select("id, team_id, position")
    .eq("bracket_id", bracketId)
    .order("position");

  const sortedEntries = (entries ?? []).sort((a, b) => Number(a.position) - Number(b.position));
  const uniqueTeamIds = new Set(sortedEntries.map((entry) => String(entry.team_id)));

  if (sortedEntries.length !== BRACKET_ROUND_SLOT_COUNTS[0] || uniqueTeamIds.size !== BRACKET_ROUND_SLOT_COUNTS[0]) {
    return;
  }

  await supabase!.from("bracket_progress").delete().eq("bracket_id", bracketId);

  await supabase!.from("bracket_progress").insert(
    sortedEntries.map((entry, index) => ({
      bracket_id: bracketId,
      round_index: 0,
      slot_index: index,
      team_id: String(entry.team_id),
    })),
  );

  await supabase!
    .from("brackets")
    .update({
      setup_locked: true,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", bracketId);

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/brackets"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/progress"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/brackets"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin"));
}

function descendantPath(startRoundIndex: number, startSlotIndex: number) {
  const descendants: Array<{ roundIndex: number; slotIndex: number }> = [];
  let slotIndex = startSlotIndex;

  for (let roundIndex = startRoundIndex + 1; roundIndex < BRACKET_ROUND_SLOT_COUNTS.length; roundIndex += 1) {
    slotIndex = Math.floor(slotIndex / 2);
    descendants.push({ roundIndex, slotIndex });
  }

  return descendants;
}

export async function advanceBracketWinnerAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireAdmin(locale as typeof defaultLocale);

  if (viewer.demoMode || !hasSupabaseEnv()) {
    return;
  }

  const bracketId = String(formData.get("bracketId"));
  const roundIndex = Number(formData.get("roundIndex"));
  const slotIndex = Number(formData.get("slotIndex"));

  if (!Number.isInteger(roundIndex) || !Number.isInteger(slotIndex) || roundIndex < 0 || roundIndex >= 5) {
    return;
  }

  const supabase = await createClient();
  const { data: bracket } = await supabase!
    .from("brackets")
    .select("id, setup_locked")
    .eq("id", bracketId)
    .maybeSingle();

  if (!bracket || !bracket.setup_locked) {
    return;
  }

  const { data: currentSlot } = await supabase!
    .from("bracket_progress")
    .select("id, team_id")
    .eq("bracket_id", bracketId)
    .eq("round_index", roundIndex)
    .eq("slot_index", slotIndex)
    .maybeSingle();

  if (!currentSlot?.team_id) {
    return;
  }

  const nextRoundIndex = roundIndex + 1;
  const nextSlotIndex = Math.floor(slotIndex / 2);

  for (const descendant of descendantPath(nextRoundIndex, nextSlotIndex)) {
    await supabase!
      .from("bracket_progress")
      .delete()
      .eq("bracket_id", bracketId)
      .eq("round_index", descendant.roundIndex)
      .eq("slot_index", descendant.slotIndex);
  }

  await supabase!.from("bracket_progress").upsert(
    {
      bracket_id: bracketId,
      round_index: nextRoundIndex,
      slot_index: nextSlotIndex,
      team_id: String(currentSlot.team_id),
    },
    {
      onConflict: "bracket_id,round_index,slot_index",
    },
  );

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/progress"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/brackets"));
}
