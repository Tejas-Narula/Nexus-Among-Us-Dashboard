export type RoomType =
  | 'Room 1'
  | 'Room 2'
  | 'Room 3'
  | 'Room 4'
  | 'Room 5'
  | 'Room 6'
  | 'Electrical'
  | 'Reactor'
  | 'MedBay'
  | 'Navigation'
  | 'Admin'
  | 'Weapons'
  | 'O2'
  | 'Cafeteria'
  | 'Communications'
  | string;

export interface PlayerMember {
  id: string;
  name: string;
  role?: string;
  isLeader?: boolean;
  regNo?: string;
  phone?: string;
  email?: string;
  assignedRoomId?: string;
  assignedRoomName?: string;
  assignedZone?: string;
}

export interface ImpostorPowerPort {
  port: 1 | 2 | 3;
  id: string; // e.g. "sabotage-lights"
  name: string; // e.g. "Sabotage Lights"
  description: string;
  cooldownSeconds: number;
  durationSeconds?: number;
  status: 'ready' | 'paused' | 'disabled';
  lastUsedAt?: string | null;
  targetRequired: boolean;
}

export interface TeamActiveEffect {
  id: string;
  powerName: string;
  appliedByTeamId: string;
  appliedByTeamName: string;
  appliedAt: string;
  durationSeconds: number;
  expiresAt: number; // epoch ms
  description?: string;
}

export interface Team {
  id: string;
  name: string;
  teamCode?: string; // Player Login Code / Team ID
  leaderName?: string;
  email?: string;
  phone?: string;
  members: string[] | PlayerMember[];
  memberDetails?: PlayerMember[];
  color?: string;
  score?: number;
  tasksCompleted?: number;
  cluesSolved?: number;
  status?: 'active' | 'eliminated' | 'winner';
  registeredEvents?: string[];
  badgeCode?: string;
  assignedRoom?: RoomType;
  assignedRoomId?: string;
  assignedRoomName?: string;
  assignedZone?: string;
  isImpostor?: boolean;
  impostorPlayerName?: string;
  powerPorts?: ImpostorPowerPort[]; // 3 Ports of power for Impostor teams
  sabotagesAvailable?: number; // Added to track sabotages
  activeEffects?: TeamActiveEffect[]; // Active effects targeting this crewmate team
  gamesPlayed?: GamePlayedRecord[]; // Games completed by team members
  notes?: string;
  createdAt: string;
}

export interface GamePlayedRecord {
  id: string;
  gameId: 'wordle' | 'emoji' | 'memedecoder' | 'monkeytype' | 'pacman' | string;
  gameTitle: string;
  pointsAwarded: number;
  score?: number;
  timestamp: string;
}

export interface GamePointsConfig {
  wordle: number;
  emoji: number;
  memedecoder: number;
  monkeytype: number;
  pacman: number;
}

export interface RoomRecord {
  id: string;
  name: string; // e.g. "Room 1", "Room 2", editable by admin
  zone: string; // e.g. "Zone A", "AB1 1st Floor", "Main Audi"
  capacity: number; // max players
  pocName: string; // Point of Contact name
  pocContact: string; // Phone / WhatsApp
  pocEmail?: string;
  notes?: string;
}

export type SabotageType = 'reactor' | 'oxygen' | 'lights' | 'comms' | null;

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface RolePermissions {
  levelName: string;
  levelNumber: number;
  canStartEvent: boolean;
  canPauseEvent: boolean;
  canEndEvent: boolean;
  canToggleImpostorPowers: boolean;
  canAllotRoomsAndImpostors: boolean;
  canAddTeam: boolean;
  canEditTeam: boolean;
  canDeleteTeam: boolean;
  canTriggerSabotage: boolean;
  canCallEmergency: boolean;
  canManageAdmins: boolean;
  canManageTasksAndClues: boolean;
}

export interface AdminUser {
  id: string;
  facilitatorId?: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  pocRoom?: string;
  title?: string;
  password?: string;
}

export interface StationTask {
  id: string;
  title: string;
  room: RoomType;
  description: string;
  snippet?: string;
  clueHint?: string;
  flagAnswer?: string;
  points: number;
  status: 'pending' | 'in_progress' | 'completed';
  completedByTeamId?: string;
  completedAt?: string;
}

export interface SabotageState {
  active: boolean;
  type: SabotageType;
  title: string;
  description: string;
  durationSeconds: number;
  timeRemaining: number;
  triggeredAt: number | null;
}

export interface EmergencyMeetingState {
  active: boolean;
  caller: string | null;
  reason: string | null;
  timeRemaining: number;
  votes: Record<string, string>;
}

export interface MysteryClue {
  id: string;
  caseFile: string;
  title: string;
  difficulty: 'Novice' | 'Investigator' | 'Cyber Detective';
  location: string;
  description: string;
  puzzleContent: string;
  hint: string;
  points: number;
  solvedByTeamIds: string[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  type: 'task' | 'sabotage' | 'emergency' | 'clue' | 'kill' | 'system' | 'power' | 'impostor_assign' | 'login';
  message: string;
  teamName?: string;
  teamId?: string;
  targetTeamId?: string;
  targetTeamName?: string;
  roomId?: string;
  roomName?: string;
  powerName?: string;
  portIndex?: 1 | 2 | 3;
  severity?: 'info' | 'warning' | 'danger' | 'success';
}

export interface GameState {
  matchId: string;
  matchName: string;
  status: 'waiting' | 'in_progress' | 'emergency' | 'ended';
  crewmatesAlive: number;
  impostorsCount: number;
  totalTasks: number;
  completedTasksCount: number;
  sabotage: SabotageState;
  emergency: EmergencyMeetingState;
  startedAt: string | null;
}

export interface EventControlState {
  status: 'standby' | 'running' | 'paused' | 'ended';
  impostorPowersActive: boolean;
  elapsedSeconds: number;
  currentRound: number;
  activeSabotage: SabotageType;
  emergencyActive: boolean;
  pausedBy?: string;
}
