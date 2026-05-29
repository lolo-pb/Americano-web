import type { Bracket, BracketProgressSlot, PublicTeam, Team, Tournament } from "@/lib/types";

function buildTeamName(playerOneName: string, playerTwoName: string) {
  return `${playerOneName} & ${playerTwoName}`;
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

export const demoTournament: Tournament = {
  id: "demo-tournament",
  name: "Americano Open 2026",
  location: "Buenos Aires Lawn Club",
  startDate: "2026-08-14",
  signupOpen: true,
  bracketsPublished: true,
  description:
    "A weekend Americano-style tennis event with curated doubles brackets, live updates, and a team-first mobile experience.",
};

export const demoTeams: Team[] = [
  {
    id: "admin-1",
    slug: "direccion-torneo",
    playerOneName: "Lucas",
    playerTwoName: "Admin",
    teamName: "Lucas & Admin",
    email: "lucas@americanoopen.com",
    phone: "+54 11 5555-0001",
    role: "admin",
    approvalStatus: "approved",
    category: "Tournament Director",
    bio: "Oversees check-in, approvals, bracket setup, and tournament progress.",
    avatarUrl: null,
  },
  ...Array.from({ length: 32 }, (_, index) => {
    const teamNumber = index + 1;
    const playerOneName = `Player ${teamNumber}A`;
    const playerTwoName = `Player ${teamNumber}B`;

    return {
      id: `team-${teamNumber}`,
      slug: `team-${teamNumber}`,
      playerOneName,
      playerTwoName,
      teamName: buildTeamName(playerOneName, playerTwoName),
      email: `team${teamNumber}@example.com`,
      phone: `+54 11 5555-${String(1000 + teamNumber)}`,
      role: "client" as const,
      approvalStatus: "approved" as const,
      category: teamNumber % 3 === 0 ? "Advanced" : teamNumber % 2 === 0 ? "Intermediate" : "Beginner",
      bio: `Demo team ${teamNumber} ready for the Americano draw.`,
      avatarUrl: null,
    };
  }),
];

const demoClientTeams = demoTeams.filter((team) => team.role === "client");

export const demoBracket: Bracket = {
  id: "bracket-1",
  tournamentId: demoTournament.id,
  name: "Main Draw",
  format: "Americano - 32 teams",
  status: "published",
  setupLocked: true,
  bracketSize: 32,
  publishedAt: "2026-08-10T14:00:00.000Z",
  entries: demoClientTeams.slice(0, 32).map((team, index) => ({
    id: `entry-${index + 1}`,
    bracketId: "bracket-1",
    teamId: team.id,
    position: index,
    seed: index + 1,
    team: toPublicTeam(team),
  })),
};

export const demoBrackets: Bracket[] = [demoBracket];

export const demoBracketProgress: BracketProgressSlot[] = [
  ...demoBracket.entries.map((entry) => ({
    id: `progress-r0-${entry.position}`,
    bracketId: demoBracket.id,
    roundIndex: 0,
    slotIndex: entry.position,
    teamId: entry.teamId,
    team: entry.team,
  })),
  ...Array.from({ length: 8 }, (_, index) => {
    const winningEntry = demoBracket.entries[index * 2];

    return {
      id: `progress-r1-${index}`,
      bracketId: demoBracket.id,
      roundIndex: 1,
      slotIndex: index,
      teamId: winningEntry.teamId,
      team: winningEntry.team,
    };
  }),
  ...Array.from({ length: 4 }, (_, index) => {
    const winningEntry = demoBracket.entries[index * 4];

    return {
      id: `progress-r2-${index}`,
      bracketId: demoBracket.id,
      roundIndex: 2,
      slotIndex: index,
      teamId: winningEntry.teamId,
      team: winningEntry.team,
    };
  }),
];
