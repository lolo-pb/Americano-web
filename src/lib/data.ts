import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { localizeHref, type Locale } from "@/lib/i18n";
import { demoBracket, demoBracketProgress, demoBrackets, demoTeams, demoTournament } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type {
  Bracket,
  BracketEntry,
  BracketProgressColumn,
  BracketProgressSlot,
  PaymentStatus,
  PublicTeam,
  Team,
  Tournament,
  ViewerContext,
} from "@/lib/types";

export const BRACKET_ROUND_SLOT_COUNTS = [32, 16, 8, 4, 2, 1] as const;

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

function mapPublicTeam(team: Record<string, unknown> | null, fallbackTeamId?: string | null): PublicTeam | null {
  if (!team) {
    return fallbackTeamId
      ? {
          id: fallbackTeamId,
          slug: "",
          playerOneName: "Unknown",
          playerTwoName: "",
          teamName: "Deleted Team",
          avatarUrl: null,
          category: null,
          approvalStatus: "rejected",
          bio: null,
        }
      : null;
  }

  const playerOneName = String(team.player_one_name ?? "Unknown");
  const playerTwoName = String(team.player_two_name ?? "");

  return {
    id: String(team.id ?? fallbackTeamId ?? ""),
    slug: team.slug ? String(team.slug) : "",
    playerOneName,
    playerTwoName,
    teamName: buildTeamName(playerOneName, playerTwoName),
    avatarUrl: team.avatar_url ? String(team.avatar_url) : null,
    category: team.category ? String(team.category) : null,
    approvalStatus: String(team.approval_status ?? "rejected") as Team["approvalStatus"],
    bio: team.bio ? String(team.bio) : null,
  };
}

function mapBracketEntry(entry: Record<string, unknown>): BracketEntry {
  const team = mapPublicTeam((entry.team as Record<string, unknown> | null) ?? null, String(entry.team_id));

  return {
    id: String(entry.id),
    bracketId: String(entry.bracket_id),
    teamId: String(entry.team_id),
    position: Number(entry.position),
    seed: entry.seed ? Number(entry.seed) : null,
    team: team!,
  };
}

function mapProgressSlot(slot: Record<string, unknown>): BracketProgressSlot {
  return {
    id: String(slot.id),
    bracketId: String(slot.bracket_id),
    roundIndex: Number(slot.round_index),
    slotIndex: Number(slot.slot_index),
    teamId: slot.team_id ? String(slot.team_id) : null,
    team: mapPublicTeam((slot.team as Record<string, unknown> | null) ?? null, slot.team_id ? String(slot.team_id) : null),
  };
}

function buildProgressColumns(progressSlots: BracketProgressSlot[]): BracketProgressColumn[] {
  const slotMap = new Map(progressSlots.map((slot) => [`${slot.roundIndex}:${slot.slotIndex}`, slot]));

  return BRACKET_ROUND_SLOT_COUNTS.map((slotCount, roundIndex) => ({
    roundIndex,
    slotCount,
    slots: Array.from({ length: slotCount }, (_, slotIndex) => {
      const key = `${roundIndex}:${slotIndex}`;
      return (
        slotMap.get(key) ?? {
          id: `empty-${key}`,
          bracketId: progressSlots[0]?.bracketId ?? "",
          roundIndex,
          slotIndex,
          teamId: null,
          team: null,
        }
      );
    }),
  }));
}

function mapBracket(bracket: Record<string, unknown>): Bracket {
  return {
    id: String(bracket.id),
    tournamentId: String(bracket.tournament_id),
    name: String(bracket.name),
    format: String(bracket.format),
    status: String(bracket.status) as Bracket["status"],
    setupLocked: Boolean(bracket.setup_locked),
    bracketSize: Number(bracket.bracket_size ?? 32),
    publishedAt: bracket.published_at ? String(bracket.published_at) : null,
    entries: ((bracket.bracket_entries as Record<string, unknown>[]) ?? [])
      .map(mapBracketEntry)
      .sort((a, b) => a.position - b.position),
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
      "id, slug, player_one_name, player_two_name, email, phone, role, approval_status, payment_status, mercadopago_preference_id, mercadopago_payment_id, payment_amount_ars, payment_paid_at, category, bio, avatar_url",
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
      paymentStatus: String(team.payment_status ?? "pending") as PaymentStatus,
      mercadopagoPreferenceId: team.mercadopago_preference_id ? String(team.mercadopago_preference_id) : null,
      mercadopagoPaymentId: team.mercadopago_payment_id ? String(team.mercadopago_payment_id) : null,
      paymentAmountArs: typeof team.payment_amount_ars === "number" ? team.payment_amount_ars : null,
      paymentPaidAt: team.payment_paid_at ? String(team.payment_paid_at) : null,
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

  return mapPublicTeam(data as unknown as Record<string, unknown>);
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

  return (data ?? []).map((team) => mapPublicTeam(team as unknown as Record<string, unknown>)!);
}

export async function getAdminTeams(): Promise<Team[]> {
  if (!hasSupabaseEnv()) {
    return demoTeams.filter((team) => team.role === "client");
  }

  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("teams")
    .select(
      "id, slug, player_one_name, player_two_name, email, phone, role, approval_status, payment_status, mercadopago_preference_id, mercadopago_payment_id, payment_amount_ars, payment_paid_at, category, bio, avatar_url",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin teams: ${error.message}`);
  }

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
      paymentStatus: String(team.payment_status ?? "pending") as PaymentStatus,
      mercadopagoPreferenceId: team.mercadopago_preference_id ? String(team.mercadopago_preference_id) : null,
      mercadopagoPaymentId: team.mercadopago_payment_id ? String(team.mercadopago_payment_id) : null,
      paymentAmountArs: typeof team.payment_amount_ars === "number" ? team.payment_amount_ars : null,
      paymentPaidAt: team.payment_paid_at ? String(team.payment_paid_at) : null,
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

  const tournament = await getTournament();
  const supabase = await createClient();
  const { data } = await supabase!
    .from("brackets")
    .select(`
      id,
      tournament_id,
      name,
      format,
      status,
      setup_locked,
      bracket_size,
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
    .eq("tournament_id", tournament.id)
    .order("created_at");

  return (data ?? []).map((bracket) => mapBracket(bracket as unknown as Record<string, unknown>));
}

export async function getActiveAdminBracket(): Promise<Bracket | null> {
  if (!hasSupabaseEnv()) {
    return demoBracket;
  }

  const brackets = await getAdminBrackets();
  return brackets[0] ?? null;
}

export async function getBracketProgress(bracketId: string): Promise<BracketProgressColumn[]> {
  if (!hasSupabaseEnv()) {
    return buildProgressColumns(demoBracketProgress.filter((slot) => slot.bracketId === bracketId));
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("bracket_progress")
    .select(`
      id,
      bracket_id,
      round_index,
      slot_index,
      team_id,
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
    `)
    .eq("bracket_id", bracketId)
    .order("round_index")
    .order("slot_index");

  return buildProgressColumns(((data ?? []) as Record<string, unknown>[]).map(mapProgressSlot));
}

export async function getPublicBracketView(): Promise<{ bracket: Bracket; columns: BracketProgressColumn[] } | null> {
  if (!hasSupabaseEnv()) {
    return {
      bracket: demoBracket,
      columns: buildProgressColumns(demoBracketProgress),
    };
  }

  const tournament = await getTournament();
  const supabase = await createClient();
  const { data } = await supabase!
    .from("brackets")
    .select(`
      id,
      tournament_id,
      name,
      format,
      status,
      setup_locked,
      bracket_size,
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
    .eq("tournament_id", tournament.id)
    .eq("status", "published")
    .eq("setup_locked", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const bracket = mapBracket(data as unknown as Record<string, unknown>);
  const columns = await getBracketProgress(bracket.id);

  return { bracket, columns };
}
