"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { defaultLocale, localizeHref } from "@/lib/i18n";
import { requireAdmin, requireUser } from "@/lib/data";

export async function updateProfileAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireUser(locale as typeof defaultLocale);

  if (viewer.demoMode || !viewer.profile || !hasSupabaseEnv()) {
    return;
  }

  const supabase = await createClient();

  await supabase!
    .from("profiles")
    .update({
      display_name: String(formData.get("displayName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      category: String(formData.get("category") ?? ""),
      bio: String(formData.get("bio") ?? ""),
    })
    .eq("id", viewer.profile.id);

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/me"));
}

export async function updatePlayerStatusAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? defaultLocale);
  const viewer = await requireAdmin(locale as typeof defaultLocale);

  if (viewer.demoMode || !hasSupabaseEnv()) {
    return;
  }

  const profileId = String(formData.get("profileId"));
  const approvalStatus = String(formData.get("approvalStatus"));

  const supabase = await createClient();

  await supabase!
    .from("profiles")
    .update({
      approval_status: approvalStatus,
    })
    .eq("id", profileId);

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/players"));
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/me"));
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
  const usernames = String(formData.get("usernames") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

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

  if (currentBracketId && usernames.length) {
    const { data: players } = await supabase!
      .from("profiles")
      .select("id, username")
      .in("username", usernames);

    const playerMap = new Map((players ?? []).map((player) => [String(player.username), String(player.id)]));
    const entries = usernames
      .map((username, index) => {
        const playerId = playerMap.get(username);

        if (!playerId) {
          return null;
        }

        return {
          bracket_id: currentBracketId,
          player_id: playerId,
          position: index + 1,
          seed: index + 1,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          bracket_id: string;
          player_id: string;
          position: number;
          seed: number;
        } => entry !== null,
      );

    if (entries.length) {
      await supabase!.from("bracket_entries").insert(entries);
    }
  }

  revalidatePath(localizeHref(locale as typeof defaultLocale, "/admin/brackets"));
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
  revalidatePath(localizeHref(locale as typeof defaultLocale, "/brackets"));
}
