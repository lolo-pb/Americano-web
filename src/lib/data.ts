import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { localizeHref, type Locale } from "@/lib/i18n";
import { demoBrackets, demoProfiles, demoTournament } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Bracket, BracketEntry, Profile, PublicProfile, Tournament, ViewerContext } from "@/lib/types";

function toPublicProfile(profile: Profile): PublicProfile {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    category: profile.category,
    approvalStatus: profile.approvalStatus,
    bio: profile.bio,
  };
}

function mapBracketEntry(entry: Record<string, unknown>): BracketEntry {
  const player = entry.profile as Record<string, unknown>;

  return {
    id: String(entry.id),
    bracketId: String(entry.bracket_id),
    playerId: String(entry.player_id),
    position: Number(entry.position),
    seed: entry.seed ? Number(entry.seed) : null,
    profile: {
      id: String(player.id),
      username: String(player.username),
      displayName: String(player.display_name),
      avatarUrl: player.avatar_url ? String(player.avatar_url) : null,
      category: player.category ? String(player.category) : null,
      approvalStatus: String(player.approval_status) as Profile["approvalStatus"],
      bio: player.bio ? String(player.bio) : null,
    },
  };
}

export const getViewerContext = cache(async (): Promise<ViewerContext> => {
  if (!hasSupabaseEnv()) {
    return {
      demoMode: true,
      profileMissing: false,
      profile: null,
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { demoMode: true, profileMissing: false, profile: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      demoMode: false,
      profileMissing: false,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, email, phone, role, approval_status, category, bio, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      demoMode: false,
      profileMissing: true,
      profile: null,
    };
  }

  return {
    demoMode: false,
    profileMissing: false,
    profile: {
      id: String(profile.id),
      username: String(profile.username),
      displayName: String(profile.display_name),
      email: String(profile.email),
      phone: profile.phone ? String(profile.phone) : null,
      role: String(profile.role) as Profile["role"],
      approvalStatus: String(profile.approval_status) as Profile["approvalStatus"],
      category: profile.category ? String(profile.category) : null,
      bio: profile.bio ? String(profile.bio) : null,
      avatarUrl: profile.avatar_url ? String(profile.avatar_url) : null,
    },
  };
});

export async function requireUser(locale: Locale) {
  const viewer = await getViewerContext();

  if (!viewer.demoMode && !viewer.profile) {
    redirect(localizeHref(locale, "/login"));
  }

  return viewer;
}

export async function requireAdmin(locale: Locale) {
  const viewer = await getViewerContext();

  if (!viewer.demoMode && !viewer.profile) {
    redirect(localizeHref(locale, "/login"));
  }

  if (!viewer.demoMode && viewer.profile?.role !== "admin") {
    redirect(localizeHref(locale, "/me"));
  }

  return viewer;
}

export async function getTournament(): Promise<Tournament> {
  if (!hasSupabaseEnv()) {
    return demoTournament;
  }

  const supabase = await createClient();

  const { data } = await supabase!
    .from("tournaments")
    .select("id, name, location, start_date, signup_open, brackets_published, description")
    .eq("is_active", true)
    .single();

  if (!data) {
    return demoTournament;
  }

  return {
    id: String(data.id),
    name: String(data.name),
    location: String(data.location),
    startDate: String(data.start_date),
    signupOpen: Boolean(data.signup_open),
    bracketsPublished: Boolean(data.brackets_published),
    description: String(data.description ?? ""),
  };
}

export async function getPublishedBrackets(): Promise<Bracket[]> {
  if (!hasSupabaseEnv()) {
    return demoBrackets;
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("brackets")
    .select(`
      id,
      tournament_id,
      name,
      format,
      status,
      published_at,
      bracket_entries (
        id,
        bracket_id,
        player_id,
        position,
        seed,
        profile:public_player_profiles!player_id (
          id,
          username,
          display_name,
          avatar_url,
          category,
          approval_status,
          bio
        )
      )
    `)
    .eq("status", "published")
    .order("name");

  if (!data) {
    return [];
  }

  return data.map((bracket) => ({
    id: String(bracket.id),
    tournamentId: String(bracket.tournament_id),
    name: String(bracket.name),
    format: String(bracket.format),
    status: String(bracket.status) as Bracket["status"],
    publishedAt: bracket.published_at ? String(bracket.published_at) : null,
    entries: ((bracket.bracket_entries as Record<string, unknown>[]) ?? [])
      .map(mapBracketEntry)
      .sort((a, b) => a.position - b.position),
  }));
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  if (!hasSupabaseEnv()) {
    const profile = demoProfiles.find((entry) => entry.username === username);
    return profile ? toPublicProfile(profile) : null;
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("public_player_profiles")
    .select("id, username, display_name, avatar_url, category, approval_status, bio")
    .eq("username", username)
    .single();

  if (!data) {
    return null;
  }

  return {
    id: String(data.id),
    username: String(data.username),
    displayName: String(data.display_name),
    avatarUrl: data.avatar_url ? String(data.avatar_url) : null,
    category: data.category ? String(data.category) : null,
    approvalStatus: String(data.approval_status) as PublicProfile["approvalStatus"],
    bio: data.bio ? String(data.bio) : null,
  };
}

export async function getApprovedPlayers(): Promise<PublicProfile[]> {
  if (!hasSupabaseEnv()) {
    return demoProfiles
      .filter((profile) => profile.approvalStatus === "approved" && profile.role === "client")
      .map(toPublicProfile);
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("public_player_profiles")
    .select("id, username, display_name, avatar_url, category, approval_status, bio")
    .eq("approval_status", "approved")
    .order("display_name");

  return (data ?? []).map((profile) => ({
    id: String(profile.id),
    username: String(profile.username),
    displayName: String(profile.display_name),
    avatarUrl: profile.avatar_url ? String(profile.avatar_url) : null,
    category: profile.category ? String(profile.category) : null,
    approvalStatus: String(profile.approval_status) as PublicProfile["approvalStatus"],
    bio: profile.bio ? String(profile.bio) : null,
  }));
}

export async function getAdminPlayers(): Promise<Profile[]> {
  if (!hasSupabaseEnv()) {
    return demoProfiles.filter((profile) => profile.role === "client");
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("profiles")
    .select("id, username, display_name, email, phone, role, approval_status, category, bio, avatar_url")
    .order("created_at", { ascending: false });

  return (data ?? []).map((profile) => ({
    id: String(profile.id),
    username: String(profile.username),
    displayName: String(profile.display_name),
    email: String(profile.email),
    phone: profile.phone ? String(profile.phone) : null,
    role: String(profile.role) as Profile["role"],
    approvalStatus: String(profile.approval_status) as Profile["approvalStatus"],
    category: profile.category ? String(profile.category) : null,
    bio: profile.bio ? String(profile.bio) : null,
    avatarUrl: profile.avatar_url ? String(profile.avatar_url) : null,
  }));
}

export async function getAdminBrackets(): Promise<Bracket[]> {
  if (!hasSupabaseEnv()) {
    return demoBrackets;
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("brackets")
    .select(`
      id,
      tournament_id,
      name,
      format,
      status,
      published_at,
      bracket_entries (
        id,
        bracket_id,
        player_id,
        position,
        seed,
        profile:public_player_profiles!player_id (
          id,
          username,
          display_name,
          avatar_url,
          category,
          approval_status,
          bio
        )
      )
    `)
    .order("created_at");

  return (data ?? []).map((bracket) => ({
    id: String(bracket.id),
    tournamentId: String(bracket.tournament_id),
    name: String(bracket.name),
    format: String(bracket.format),
    status: String(bracket.status) as Bracket["status"],
    publishedAt: bracket.published_at ? String(bracket.published_at) : null,
    entries: ((bracket.bracket_entries as Record<string, unknown>[]) ?? [])
      .map(mapBracketEntry)
      .sort((a, b) => a.position - b.position),
  }));
}
