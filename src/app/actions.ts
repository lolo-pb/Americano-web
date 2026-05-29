"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { defaultLocale, localizeHref } from "@/lib/i18n";
import { requireAdmin, requireUser } from "@/lib/data";

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
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/brackets"));
}

export async function saveBracketAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireAdmin(locale as typeof defaultLocale);

  if (viewer.demoMode || !hasSupabaseEnv()) {
    return;
  }

  const supabase = await createClient();
  const bracketId = String(formData.get("bracketId") ?? "");
  const tournamentId = String(formData.get("tournamentId"));
  const name = String(formData.get("name"));
  const format = String(formData.get("format"));
  const selectedTeamIds = formData.getAll("teamId").map(String);
  const positionValues = formData.getAll("position").map((value) => Number(value));

  const selectedEntries = selectedTeamIds
    .map((teamId, index) => ({
      teamId,
      position: positionValues[index],
    }))
    .filter((entry) => entry.teamId && Number.isInteger(entry.position) && entry.position > 0)
    .sort((a, b) => a.position - b.position);

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
      })
      .select("id")
      .single();

    currentBracketId = String(data?.id ?? "");
  }

  if (currentBracketId && selectedEntries.length) {
    const uniqueTeamIds = [...new Set(selectedEntries.map((entry) => entry.teamId))];
    const { data: teams } = await supabase!
      .from("teams")
      .select("id")
      .in("id", uniqueTeamIds)
      .eq("approval_status", "approved");

    const validTeamIds = new Set((teams ?? []).map((team) => String(team.id)));
    const usedPositions = new Set<number>();
    const usedTeamIds = new Set<string>();

    const entries = selectedEntries
      .filter((entry) => {
        if (
          !validTeamIds.has(entry.teamId) ||
          usedPositions.has(entry.position) ||
          usedTeamIds.has(entry.teamId)
        ) {
          return false;
        }

        usedPositions.add(entry.position);
        usedTeamIds.add(entry.teamId);
        return true;
      })
      .map((entry, index) => ({
        bracket_id: currentBracketId,
        team_id: entry.teamId,
        position: entry.position,
        seed: index + 1,
      }));

    if (entries.length) {
      await supabase!.from("bracket_entries").insert(entries);
    }
  }

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/brackets"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/brackets"));
}

export async function toggleBracketPublishAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireAdmin(locale as typeof defaultLocale);

  if (viewer.demoMode || !hasSupabaseEnv()) {
    return;
  }

  const bracketId = String(formData.get("bracketId"));
  const nextStatus = String(formData.get("nextStatus"));

  const supabase = await createClient();

  await supabase!
    .from("brackets")
    .update({
      status: nextStatus,
      published_at: nextStatus === "published" ? new Date().toISOString() : null,
    })
    .eq("id", bracketId);

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/brackets"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/brackets"));
}
