export type Role = "client" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type BracketStatus = "draft" | "published";

export type Tournament = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  signupOpen: boolean;
  bracketsPublished: boolean;
  description: string;
};

export type PublicTeam = {
  id: string;
  slug: string;
  playerOneName: string;
  playerTwoName: string;
  teamName: string;
  avatarUrl?: string | null;
  category?: string | null;
  approvalStatus: ApprovalStatus;
  bio?: string | null;
};

export type Team = PublicTeam & {
  email: string;
  phone?: string | null;
  role: Role;
};

export type Registration = {
  id: string;
  tournamentId: string;
  teamId: string;
  createdAt: string;
  notes?: string | null;
};

export type CustomSignupLinkStats = {
  id: string;
  code: string;
  label: string;
  uniqueAccessCount: number;
  signupCount: number;
};

export type BracketEntry = {
  id: string;
  bracketId: string;
  teamId: string;
  position: number;
  seed?: number | null;
  team: PublicTeam;
};

export type Bracket = {
  id: string;
  tournamentId: string;
  name: string;
  format: string;
  status: BracketStatus;
  setupLocked: boolean;
  bracketSize: number;
  publishedAt?: string | null;
  entries: BracketEntry[];
};

export type BracketProgressSlot = {
  id: string;
  bracketId: string;
  roundIndex: number;
  slotIndex: number;
  teamId: string | null;
  team: PublicTeam | null;
};

export type BracketProgressColumn = {
  roundIndex: number;
  slotCount: number;
  slots: BracketProgressSlot[];
};

export type ViewerContext = {
  demoMode: boolean;
  teamMissing?: boolean;
  team: Team | null;
};
