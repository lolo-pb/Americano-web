import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { localizeHref, type Locale } from "@/lib/i18n";
import { demoBrackets, demoTeams, demoTournament } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Bracket, BracketEntry, PublicTeam, Team, Tournament, ViewerContext } from "@/lib/types";

function buildTeamName(playerOneName: string, playerTwoName: string) {
  return playerTwoName ? `${playerOneName} & ${playerTwoName}` : playerOneName;
}

function toPublicTeam(team: Team): PublicTeam {
  return {
    id: team.id,
    slug: team.slug,
    playerOneName: team.playerOneName,
    playerTwoName: team.playerTwoName,
    teamName: team.teamName,
    avatarUrl: team.avatarUrl,
    category: team.category,
    approvalStatus: team.approvalStatus,
    bio: team.bio,
  };
}

function mapBracketEntry(entry: Record<string, unknown>): BracketEntry {
  const team = (entry.team as Record<string, unknown> | null) ?? {};
  const playerOneName = String(team.player_one_name ?? "Unknown");
  const playerTwoName = String(team.player_two_name ?? "");
  const hasTeam = Object.keys(team).length > 0;

  return {
    id: String(entry.id),
    bracketId: String(entry.bracket_id),
    teamId: String(entry.team_id),
    position: Number(entry.position),
    seed: entry.seed ? Number(entry.seed) : null,
    team: {
      id: String(team.id ?? entry.team_id),
      slug: team.slug ? String(team.slug) : "",
      playerOneName,
      playerTwoName,
      teamName: hasTeam ? buildTeamName(playerOneName, playerTwoName) : "Deleted Team",
      avatarUrl: team.avatar_url ? String(team.avatar_url) : null,
      category: team.category ? String(team.category) : null,
      approvalStatus: hasTeam ? (String(team.approval_status) as Team["approvalStatus"]) : "rejected",
      bio: team.bio ? String(team.bio) : null,
    },
  };
}

export const getViewerContext = cache(async (): Promise<ViewerContext> => {
  if (!hasSupabaseEnv()) {
    return {
      demoMode: true,
      teamMissing: false,
      team: null,
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { demoMode: true, teamMissing: false, team: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      demoMode: false,
      teamMissing: false,
      team: null,
    };
  }

  const { data: team } = await supabase
    .from("teams")
    .select(
      "id, slug, player_one_name, player_two_name, email, phone, role, approval_status, category, bio, avatar_url",
    )
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!team) {
    return {
      demoMode: false,
      teamMissing: true,
      team: null,
    };
  }

  const playerOneName = String(team.player_one_name ?? "");
  const playerTwoName = String(team.player_two_name ?? "");

  return {
    demoMode: false,
    teamMissing: false,
    team: {
      id: String(team.id),
      slug: String(team.slug),
      playerOneName,
      playerTwoName,
      teamName: buildTeamName(playerOneName, playerTwoName),
      email: String(team.email),
      phone: team.phone ? String(team.phone) : null,
      role: String(team.role) as Team["role"],
      approvalStatus: String(team.approval_status) as Team["approvalStatus"],
      category: team.category ? String(team.category) : null,
      bio: team.bio ? String(team.bio) : null,
      avatarUrl: team.avatar_url ? String(team.avatar_url) : null,
    },
  };
});

export async function requireUser(locale: Locale) {
  const viewer = await getViewerContext();

  if (!viewer.demoMode && !viewer.team) {
    redirect(localizeHref(locale, "/login"));
  }

  return viewer;
}

export async function requireAdmin(locale: Locale) {
  const viewer = await getViewerContext();

  if (!viewer.demoMode && !viewer.team) {
    redirect(localizeHref(locale, "/login"));
  }

  if (!viewer.demoMode && viewer.team?.role !== "admin") {
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
        team_id,
        position,
        seed,
        team:public_approved_teams!team_id (
          id,
          slug,
          player_one_name,
          player_two_name,
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

export async function getPublicTeam(slug: string): Promise<PublicTeam | null> {
  if (!hasSupabaseEnv()) {
    const team = demoTeams.find((entry) => entry.slug === slug);
    return team ? toPublicTeam(team) : null;
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("public_approved_teams")
    .select("id, slug, player_one_name, player_two_name, avatar_url, category, approval_status, bio")
    .eq("slug", slug)
    .single();

  if (!data) {
    return null;
  }

  const playerOneName = String(data.player_one_name ?? "");
  const playerTwoName = String(data.player_two_name ?? "");

  return {
    id: String(data.id),
    slug: String(data.slug),
    playerOneName,
    playerTwoName,
    teamName: buildTeamName(playerOneName, playerTwoName),
    avatarUrl: data.avatar_url ? String(data.avatar_url) : null,
    category: data.category ? String(data.category) : null,
    approvalStatus: String(data.approval_status) as PublicTeam["approvalStatus"],
    bio: data.bio ? String(data.bio) : null,
  };
}

export async function getApprovedTeams(): Promise<PublicTeam[]> {
  if (!hasSupabaseEnv()) {
    return demoTeams
      .filter((team) => team.approvalStatus === "approved" && team.role === "client")
      .map(toPublicTeam);
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("public_approved_teams")
    .select("id, slug, player_one_name, player_two_name, avatar_url, category, approval_status, bio")
    .eq("approval_status", "approved")
    .order("player_one_name");

  return (data ?? []).map((team) => {
    const playerOneName = String(team.player_one_name ?? "");
    const playerTwoName = String(team.player_two_name ?? "");

    return {
      id: String(team.id),
      slug: String(team.slug),
      playerOneName,
      playerTwoName,
      teamName: buildTeamName(playerOneName, playerTwoName),
      avatarUrl: team.avatar_url ? String(team.avatar_url) : null,
      category: team.category ? String(team.category) : null,
      approvalStatus: String(team.approval_status) as PublicTeam["approvalStatus"],
      bio: team.bio ? String(team.bio) : null,
    };
  });
}

export async function getAdminTeams(): Promise<Team[]> {
  if (!hasSupabaseEnv()) {
    return demoTeams.filter((team) => team.role === "client");
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("teams")
    .select(
      "id, slug, player_one_name, player_two_name, email, phone, role, approval_status, category, bio, avatar_url",
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((team) => {
    const playerOneName = String(team.player_one_name ?? "");
    const playerTwoName = String(team.player_two_name ?? "");

    return {
      id: String(team.id),
      slug: String(team.slug),
      playerOneName,
      playerTwoName,
      teamName: buildTeamName(playerOneName, playerTwoName),
      email: String(team.email),
      phone: team.phone ? String(team.phone) : null,
      role: String(team.role) as Team["role"],
      approvalStatus: String(team.approval_status) as Team["approvalStatus"],
      category: team.category ? String(team.category) : null,
      bio: team.bio ? String(team.bio) : null,
      avatarUrl: team.avatar_url ? String(team.avatar_url) : null,
    };
  });
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
        team_id,
        position,
        seed,
        team:public_approved_teams!team_id (
          id,
          slug,
          player_one_name,
          player_two_name,
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
