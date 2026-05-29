import type { Bracket, Profile, Tournament } from "@/lib/types";

export const demoTournament: Tournament = {
  id: "demo-tournament",
  name: "Americano Open 2026",
  location: "Buenos Aires Lawn Club",
  startDate: "2026-08-14",
  signupOpen: true,
  bracketsPublished: true,
  description:
    "A weekend Americano-style tennis event with curated brackets, live updates, and a player-first mobile experience.",
};

export const demoProfiles: Profile[] = [
  {
    id: "admin-1",
    username: "director-lucas",
    displayName: "Lucas Medina",
    email: "lucas@americanoopen.com",
    phone: "+54 11 5555-0001",
    role: "admin",
    approvalStatus: "approved",
    paymentStatus: "confirmed",
    category: "Tournament Director",
    bio: "Oversees check-in, approvals, and bracket publishing.",
    avatarUrl: null,
  },
  {
    id: "player-1",
    username: "sofi-topspin",
    displayName: "Sofia Rojas",
    email: "sofia@example.com",
    phone: "+54 11 5555-0002",
    role: "client",
    approvalStatus: "approved",
    paymentStatus: "confirmed",
    category: "Intermediate",
    bio: "Big forehand, loves long rallies, chasing her first Americano title.",
    avatarUrl: null,
  },
  {
    id: "player-2",
    username: "mateo-volley",
    displayName: "Mateo Acosta",
    email: "mateo@example.com",
    phone: "+54 11 5555-0003",
    role: "client",
    approvalStatus: "approved",
    paymentStatus: "confirmed",
    category: "Advanced",
    bio: "Aggressive net play and a dangerous serve out wide.",
    avatarUrl: null,
  },
  {
    id: "player-3",
    username: "clara-clay",
    displayName: "Clara Benitez",
    email: "clara@example.com",
    phone: "+54 11 5555-0004",
    role: "client",
    approvalStatus: "pending",
    paymentStatus: "pending",
    category: "Beginner",
    bio: "Recently joined the club and is preparing for her first event.",
    avatarUrl: null,
  },
];

export const demoBrackets: Bracket[] = [
  {
    id: "bracket-1",
    tournamentId: demoTournament.id,
    name: "Saturday Sunrise Draw",
    format: "Americano - 8 players",
    status: "published",
    publishedAt: "2026-08-10T14:00:00.000Z",
    entries: [demoProfiles[1], demoProfiles[2]].map((profile, index) => ({
      id: `entry-${index + 1}`,
      bracketId: "bracket-1",
      playerId: profile.id,
      position: index + 1,
      seed: index + 1,
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        category: profile.category,
        approvalStatus: profile.approvalStatus,
        bio: profile.bio,
      },
    })),
  },
];
