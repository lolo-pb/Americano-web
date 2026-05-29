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

export type PublicProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  category?: string | null;
  approvalStatus: ApprovalStatus;
  bio?: string | null;
};

export type Profile = PublicProfile & {
  email: string;
  phone?: string | null;
  role: Role;
};

export type Registration = {
  id: string;
  tournamentId: string;
  playerId: string;
  createdAt: string;
  notes?: string | null;
};

export type BracketEntry = {
  id: string;
  bracketId: string;
  playerId: string;
  position: number;
  seed?: number | null;
  profile: PublicProfile;
};

export type Bracket = {
  id: string;
  tournamentId: string;
  name: string;
  format: string;
  status: BracketStatus;
  publishedAt?: string | null;
  entries: BracketEntry[];
};

export type ViewerContext = {
  demoMode: boolean;
  profileMissing?: boolean;
  profile: Profile | null;
};
