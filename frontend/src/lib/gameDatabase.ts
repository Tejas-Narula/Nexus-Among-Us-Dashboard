import { Team, RoomRecord, PlayerMember, AdminUser, ActivityLogItem, ImpostorPowerPort, TeamActiveEffect, GamePlayedRecord, GamePointsConfig } from '../types';
import { INITIAL_ADMIN_TEAMS, INITIAL_ROOMS } from '../data/initialAdminData';
import { supabase } from './supabase';
import { isRootMasterAccount } from '../utils/permissions';

const ROOMS_STORAGE_KEY = 'nexus_rooms_v2';
const TEAMS_STORAGE_KEY = 'nexus_teams_v2';
const STAFF_STORAGE_KEY = 'nexus_admin_staff_v2';
const LOGS_STORAGE_KEY = 'nexus_activity_logs_v2';
const POWERS_STORAGE_KEY = 'nexus_powers_v2';
const GAME_POINTS_STORAGE_KEY = 'nexus_game_points_config_v2';

export const DEFAULT_GAME_POINTS: GamePointsConfig = {
  wordle: 10,
  emoji: 10,
  monkeytype: 10,
  pacman: 10,
};

export interface CrewmateGame {
  id: keyof GamePointsConfig;
  title: string;
  description: string;
  icon: string;
  route: string;
  points?: number;
}

const CREWMATE_GAMES: readonly CrewmateGame[] = [
  {
    id: 'wordle',
    title: 'Play Wordle',
    description: 'Decipher the secret word',
    icon: '🎮',
    route: '/games/wordle',
  },
  {
    id: 'emoji',
    title: 'Emoji Decoder',
    description: 'Guess the phrase from emojis',
    icon: '🎭',
    route: '/games/emoji',
  },
  {
    id: 'monkeytype',
    title: 'Code Typer',
    description: 'Test your typing speed',
    icon: '⌨️',
    route: '/games/monkeytype',
  },
  {
    id: 'pacman',
    title: 'Pacman',
    description: 'Classic arcade survival',
    icon: '👻',
    route: '/games/pacman',
  },
];

export const STANDARD_POWER_LIBRARY: Omit<ImpostorPowerPort, 'port'>[] = [
  {
    id: 'sabotage-lights',
    name: 'Sabotage Lights',
    description: 'Kill sector power, plunging the room into darkness.',
    cooldownSeconds: 30,
    durationSeconds: 20,
    status: 'ready',
    targetRequired: false,
  },
  {
    id: 'terminal-freeze',
    name: 'Terminal Freeze',
    description: 'Freeze target crewmate team terminal, disabling all actions for 30s.',
    cooldownSeconds: 45,
    durationSeconds: 30,
    status: 'ready',
    targetRequired: true,
  },
  {
    id: 'comms-blackout',
    name: 'Comms Blackout',
    description: 'Disrupt radio signals and clue deciphering for target crewmate team.',
    cooldownSeconds: 40,
    durationSeconds: 25,
    status: 'ready',
    targetRequired: true,
  },
  {
    id: 'door-lockdown',
    name: 'Door Lockdown',
    description: 'Seal sector doors and freeze room movement for target crewmates.',
    cooldownSeconds: 60,
    durationSeconds: 35,
    status: 'ready',
    targetRequired: true,
  },
  {
    id: 'fake-clue-inject',
    name: 'Fake Clue Inject',
    description: 'Transmit corrupted forensic clue decipher to confuse target crewmates.',
    cooldownSeconds: 35,
    durationSeconds: 20,
    status: 'ready',
    targetRequired: true,
  },
  {
    id: 'radio-jammer',
    name: 'Radio Jammer',
    description: 'Jam coordinator hotline and emergency signals for target crewmate team.',
    cooldownSeconds: 50,
    durationSeconds: 30,
    status: 'ready',
    targetRequired: true,
  },
];

export function createDefaultPowerPorts(): ImpostorPowerPort[] {
  return [
    {
      port: 1,
      id: 'sabotage-lights',
      name: 'Sabotage Lights',
      description: 'Kill sector power, plunging the room into darkness.',
      cooldownSeconds: 30,
      durationSeconds: 20,
      status: 'ready',
      targetRequired: false,
    },
    {
      port: 2,
      id: 'terminal-freeze',
      name: 'Terminal Freeze',
      description: 'Freeze target crewmate team terminal, disabling all actions for 30s.',
      cooldownSeconds: 45,
      durationSeconds: 30,
      status: 'ready',
      targetRequired: true,
    },
    {
      port: 3,
      id: 'comms-blackout',
      name: 'Comms Blackout',
      description: 'Disrupt radio signals and clue deciphering for target crewmate team.',
      cooldownSeconds: 40,
      durationSeconds: 25,
      status: 'ready',
      targetRequired: true,
    },
  ];
}

const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'system',
    message: 'System initialized.',
    severity: 'info',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    type: 'impostor_assign',
    message: 'Team 2 (NX-T2) designated as covert IMPOSTOR in Room 2 (Zone A).',
    teamId: 'NX-T2',
    teamName: 'Team 2',
    roomName: 'Room 2',
    severity: 'danger',
  },
];


const INITIAL_STAFF_USERS: AdminUser[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000000',
    facilitatorId: 'NX-SUPER-00',
    username: 'nx-masteradmin',
    name: 'Aditya Goyal',
    title: 'Tech Admin',
    role: 'super_admin',
    email: 'nexus@nexus.org',
  },
  {
    id: 'NX-SUPER-01',
    facilitatorId: 'NX-SUPER-01',
    username: 'NX-SUPER-01',
    name: 'Tejas Narula',
    title: 'Lead Operations Facilitator (Master Admin)',
    role: 'super_admin',
    email: 'tejas@nexus.org',
  },
  {
    id: 'NX-ADMIN-02',
    facilitatorId: 'NX-ADMIN-02',
    username: 'NX-ADMIN-02',
    name: 'Aarav Sharma',
    title: 'Station Operations Admin',
    role: 'admin',
    email: 'aarav@nexus.org',
  },
  {
    id: 'NX-POC-03',
    facilitatorId: 'NX-POC-03',
    username: 'NX-POC-03',
    name: 'Zoya Khan',
    title: 'Field Moderator & Sector POC',
    role: 'moderator',
    email: 'zoya@nexus.org',
    pocRoom: 'Reactor',
  },
];


// UUID validation & generation for Postgres UUID columns
export function isValidUuid(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Cryptographically secure ID generator
function generateId(prefix: string): string {
  if (prefix === 'team') {
    return generateUuid();
  }
  const array = new Uint32Array(2);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
    return `${prefix}-${array[0].toString(36)}-${array[1].toString(36)}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000).toString(36)}`;
}

// Ensure members are normalized into PlayerMember objects
export function normalizeTeamMembers(team: Team): PlayerMember[] {
  if (team.memberDetails && Array.isArray(team.memberDetails) && team.memberDetails.length > 0) {
    return team.memberDetails;
  }
  if (team.members && Array.isArray(team.members)) {
    return team.members.map((m, idx) => {
      if (typeof m === 'string') {
        return {
          id: `${team.id}-m-${idx + 1}`,
          name: m,
          assignedRoomId: team.assignedRoomId,
          assignedRoomName: team.assignedRoomName,
          assignedZone: team.assignedZone,
        };
      }
      return m as PlayerMember;
    });
  }
  return [];
}

function isUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Background Supabase Sync Helpers (non-blocking, fault-tolerant)
async function syncRoomsToSupabase(rooms: RoomRecord[]) {
  try {
    if (!supabase) return;
    const payload = rooms.map(r => ({
      id: r.id,
      name: r.name,
      zone: r.zone,
      capacity: r.capacity || 20,
      poc_name: r.pocName || null,
      poc_contact: r.pocContact || null,
      poc_email: r.pocEmail || null,
      notes: r.notes || null,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('rooms').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    // Graceful offline/network fallback
  }
}

async function syncTeamsToSupabase(teams: Team[]) {
  try {
    if (!supabase) return;

    // Check tombstones to ensure deleted teams are NEVER re-synced to Supabase
    let tombstones: string[] = [];
    try {
      const raw = localStorage.getItem('nexus_deleted_team_ids');
      if (raw) tombstones = JSON.parse(raw);
    } catch (e) {}

    const activeTeams = teams.filter(t => {
      const tid = (t.id || '').toUpperCase();
      const tcode = (t.teamCode || '').toUpperCase();
      const tname = (t.name || '').toLowerCase();
      return !tombstones.includes(tid) && !tombstones.includes(tcode) && !tombstones.includes(tname);
    });

    if (activeTeams.length === 0) return;

    // Fetch existing records from Supabase to match canonical UUIDs and prevent 23505 duplicate key violations
    const { data: existingRows } = await supabase.from('teams').select('id, name, team_code');
    const existingMap = new Map<string, string>();
    if (existingRows) {
      existingRows.forEach((r: any) => {
        if (r.id) {
          if (r.name) existingMap.set(`name:${r.name.trim().toLowerCase()}`, r.id);
          if (r.team_code) existingMap.set(`code:${r.team_code.trim().toUpperCase()}`, r.id);
        }
      });
    }

    const payload = activeTeams.map(t => {
      const code = t.teamCode || t.badgeCode || null;

      // Pack metadata record into power_ports JSONB column so gamesPlayed and sabotagesAvailable are preserved without violating schema
      const metaPort = {
        id: '__meta__',
        port: 99,
        name: '__meta__',
        gamesPlayed: t.gamesPlayed || [],
        sabotagesAvailable: t.sabotagesAvailable ?? (t.isImpostor ? 3 : 0),
      };
      const cleanedPowerPorts = (t.powerPorts || []).filter((p: any) => p && p.id !== '__meta__');
      const powerPortsWithMeta = [...cleanedPowerPorts, metaPort];

      // Ensure valid UUID for Postgres UUID column, aligning with existing Supabase row if already present
      let validId = isValidUuid(t.id) ? t.id : '';
      if (!validId && t.name) {
        const found = existingMap.get(`name:${t.name.trim().toLowerCase()}`);
        if (found) validId = found;
      }
      if (!validId && code) {
        const found = existingMap.get(`code:${code.trim().toUpperCase()}`);
        if (found) validId = found;
      }
      if (!validId) {
        validId = generateUuid();
      }
      t.id = validId; // mutate local team object so ID is a consistent valid UUID

      // Ensure safe email to satisfy Postgres NOT NULL constraint
      const safeEmail = (t.email && t.email.trim())
        ? t.email.trim()
        : `${(t.name || 'team').toLowerCase().replace(/[^a-z0-9]/g, '') || 'team'}@nexus.org`;

      // Recalculate score from games played if score is 0
      const gamesPts = (t.gamesPlayed || []).reduce((acc, g) => acc + (g.pointsAwarded || 0), 0);
      const safeScore = (t.gamesPlayed && t.gamesPlayed.length > 0) ? Math.max(t.score || 0, gamesPts) : (t.score || 0);

      const row: Record<string, any> = {
        name: t.name,
        leader_name: t.leaderName || t.name,
        email: safeEmail,
        phone: t.phone || null,
        color: t.color || '#00F0FF',
        score: safeScore,
        tasks_completed: (t.gamesPlayed || []).length || t.tasksCompleted || 0,
        status: t.status || 'active',
        team_code: code,
        badge_code: code,
        assigned_room: t.assignedRoomName || 'Room 1',
        assigned_room_id: t.assignedRoomId || null,
        assigned_room_name: t.assignedRoomName || null,
        assigned_zone: t.assignedZone || null,
        is_impostor: !!t.isImpostor,
        impostor_player_name: t.impostorPlayerName || null,
        power_ports: powerPortsWithMeta,
        active_effects: t.activeEffects || [],
        members: (t.memberDetails || []).map(m => ({
          id: m.id,
          name: m.name,
          role: m.role || 'Member',
          email: m.email || '',
          phone: m.phone || '',
          isLeader: !!m.isLeader,
        })),
        updated_at: new Date().toISOString(),
      };
      row.id = validId;
      return row;
    });

    const { error } = await supabase.from('teams').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Batch team upsert notice, trying individual sync:', error.message);
      // Fallback: upsert individually so one faulty team doesn't block others
      for (const row of payload) {
        await supabase.from('teams').upsert([row], { onConflict: 'id' });
      }
    }
  } catch (err) {
    console.warn('syncTeamsToSupabase fallback:', err);
  }
}

async function syncStaffToSupabase(staff: AdminUser[]) {
  try {
    if (!supabase) return;
    const payload = staff.map(s => {
      const row: Record<string, any> = {
        facilitator_id: s.facilitatorId || s.username || s.id,
        username: s.username,
        name: s.name,
        email: s.email,
        role: s.role,
        title: s.title || null,
        poc_room: s.pocRoom || null,
        password: s.password || 'Nexus@123',
        updated_at: new Date().toISOString(),
      };
      row.id = s.id;
      return row;
    });
    const { error } = await supabase.from('admin_users').upsert(payload, { onConflict: 'username' });
    if (error) {
      console.error('Failed to sync staff to Supabase:', error);
    }
  } catch (err) {
    console.error('syncStaffToSupabase error:', err);
  }
}

async function syncPowersToSupabase(powers: Omit<ImpostorPowerPort, 'port'>[]) {
  try {
    if (!supabase) return;
    const payload = powers.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      cooldown_seconds: p.cooldownSeconds,
      duration_seconds: p.durationSeconds || 20,
      target_required: p.targetRequired,
      status: p.status || 'ready',
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('powers_library').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    // Graceful offline/network fallback
  }
}

async function syncLogToSupabase(log: ActivityLogItem) {
  try {
    if (!supabase) return;
    await supabase.from('activity_logs').insert([{
      type: log.type,
      message: log.message,
      team_id: log.teamId || null,
      team_name: log.teamName || null,
      target_team_id: log.targetTeamId || null,
      target_team_name: log.targetTeamName || null,
      room_name: log.roomName || null,
      power_name: log.powerName || null,
      port_index: log.portIndex || null,
      severity: log.severity || 'info',
      created_at: log.timestamp || new Date().toISOString(),
    }]);
  } catch (err) {
    // Graceful offline/network fallback
  }
}


let cachedRooms: RoomRecord[] = [];
let cachedTeams: Team[] = [];
let cachedStaff: AdminUser[] = [];
let cachedPowers: ImpostorPowerPort[] = [];
let cachedLogs: ActivityLogItem[] = [];
let frozenGames: Record<string, number> = {};
let cachedGamePoints: GamePointsConfig = { ...DEFAULT_GAME_POINTS };
let isLoaded = false;

export const AllocationDatabase = {
  isLoaded: () => isLoaded,
  setLoaded: (val: boolean) => { isLoaded = val; },
  getFrozenGames(): Record<string, number> {
    try {
      const stored = localStorage.getItem('nexus_frozen_games');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return frozenGames;
  },
  freezeGame(gameId: string, durationMs: number): void {
    const current = this.getFrozenGames();
    current[gameId] = Date.now() + durationMs;
    frozenGames = current;
    localStorage.setItem('nexus_frozen_games', JSON.stringify(current));
  },

  getCrewmateGames(): CrewmateGame[] {
    const config = this.getGamePointsConfig();
    return CREWMATE_GAMES.map(game => ({
      ...game,
      points: config[game.id] ?? DEFAULT_GAME_POINTS[game.id] ?? 10,
    }));
  },

  // -------------------------------------------------------------
  // ROOMS & ZONES MANAGEMENT
  // -------------------------------------------------------------
  getRooms(): RoomRecord[] {
    if (cachedRooms.length === 0) {
      try {
        const stored = localStorage.getItem(ROOMS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) cachedRooms = parsed;
        }
      } catch (e) {}
    }
    return cachedRooms;
  },

  saveRooms(rooms: RoomRecord[]): void {
    cachedRooms = rooms;
    try {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch (e) {}
    syncRoomsToSupabase(rooms).catch(() => {});
  },

  createRoom(room: Omit<RoomRecord, 'id'>): RoomRecord {
    const rooms = this.getRooms();
    const newRoom: RoomRecord = {
      ...room,
      id: generateId('room'),
    };
    const updated = [...rooms, newRoom];
    this.saveRooms(updated);
    return newRoom;
  },

  updateRoom(id: string, updates: Partial<RoomRecord>): RoomRecord[] {
    const rooms = this.getRooms();
    const updated = rooms.map(r => (r.id === id ? { ...r, ...updates } : r));
    this.saveRooms(updated);

    // If room name or zone changed, update all teams and players assigned to this room
    if (updates.name || updates.zone) {
      const teams = this.getTeams();
      const targetRoom = updated.find(r => r.id === id);
      if (targetRoom) {
        const updatedTeams = teams.map(t => {
          let teamModified = false;
          let newTeam = { ...t };
          if (newTeam.assignedRoomId === id) {
            newTeam.assignedRoomName = targetRoom.name;
            newTeam.assignedZone = targetRoom.zone;
            teamModified = true;
          }
          if (newTeam.memberDetails) {
            newTeam.memberDetails = newTeam.memberDetails.map(m => {
              if (m.assignedRoomId === id) {
                return {
                  ...m,
                  assignedRoomName: targetRoom.name,
                  assignedZone: targetRoom.zone,
                };
              }
              return m;
            });
          }
          return newTeam;
        });
        this.saveTeams(updatedTeams);
      }
    }

    return updated;
  },

  deleteRoom(id: string): RoomRecord[] {
    const rooms = this.getRooms();
    const updated = rooms.filter(r => r.id !== id);
    this.saveRooms(updated);
    if (supabase) {
      supabase.from('rooms').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to delete room:', error);
      });
    }

    // Unassign teams and players that were in this room
    const teams = this.getTeams();
    const updatedTeams = teams.map(t => {
      let newTeam = { ...t };
      if (newTeam.assignedRoomId === id) {
        delete newTeam.assignedRoomId;
        delete newTeam.assignedRoomName;
        delete newTeam.assignedZone;
      }
      if (newTeam.memberDetails) {
        newTeam.memberDetails = newTeam.memberDetails.map(m => {
          if (m.assignedRoomId === id) {
            return {
              ...m,
              assignedRoomId: undefined,
              assignedRoomName: undefined,
              assignedZone: undefined,
            };
          }
          return m;
        });
      }
      return newTeam;
    });
    this.saveTeams(updatedTeams);

    return updated;
  },

  // -------------------------------------------------------------
  // TEAMS & PLAYERS MANAGEMENT
  // -------------------------------------------------------------
  getTeams(): Team[] {
    if (cachedTeams.length === 0) {
      try {
        const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) cachedTeams = parsed;
        }
      } catch (e) {}
    }
    return cachedTeams;
  },

  getNextTeamCode(teamsList?: Team[]): string {
    const teams = teamsList || this.getTeams();
    let tombstones: string[] = [];
    try {
      const raw = localStorage.getItem('nexus_deleted_team_ids');
      if (raw) tombstones = JSON.parse(raw);
    } catch (e) {}

    let maxNum = 0;
    const allCodes = [
      ...teams.map(t => t.teamCode || t.badgeCode || ''),
      ...tombstones,
    ];

    allCodes.forEach(code => {
      const match = String(code).match(/^NX-T(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    let nextNum = maxNum + 1;
    let candidate = `NX-T${nextNum}`;
    while (
      teams.some(
        t =>
          (t.teamCode && t.teamCode.toUpperCase() === candidate) ||
          (t.badgeCode && t.badgeCode.toUpperCase() === candidate) ||
          (t.id && t.id.toUpperCase() === candidate)
      ) ||
      tombstones.includes(candidate)
    ) {
      nextNum++;
      candidate = `NX-T${nextNum}`;
    }

    return candidate;
  },

  saveTeams(teams: Team[]): void {
    cachedTeams = teams;
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    } catch (e) {}
    syncTeamsToSupabase(teams).catch(() => {});
  },

  createTeam(teamData: {
    name?: string;
    leaderName?: string;
    phone?: string;
    email?: string;
    notes?: string;
    teamCode?: string;
    badgeCode?: string;
    memberNames?: string[];
    playerList?: { name: string; regNo?: string; phone?: string; email?: string }[];
  }): Team {
    const teams = this.getTeams();
    const teamId = generateUuid();

    // Ensure completely unique, non-colliding teamCode
    let teamCode = teamData.teamCode?.trim().toUpperCase();
    if (
      !teamCode ||
      teams.some(t => t.teamCode?.toUpperCase() === teamCode || t.badgeCode?.toUpperCase() === teamCode)
    ) {
      teamCode = this.getNextTeamCode(teams);
    }
    const badgeCode = teamData.badgeCode?.trim().toUpperCase() || teamCode;

    // Team name is optional; fallback to unique Squad label
    const rawName = (teamData.name || '').trim();
    const finalName = rawName || `Squad ${teamCode}`;

    // Clean compulsory 10-digit phone
    const cleanPhone = (teamData.phone || '').trim().replace(/\D/g, '');

    let members: PlayerMember[] = [];
    if (teamData.playerList && teamData.playerList.length > 0) {
      members = teamData.playerList
        .filter(p => p.name && p.name.trim())
        .map(p => ({
          id: generateId('player'),
          name: p.name.trim(),
          regNo: p.regNo?.trim(),
          phone: p.phone?.trim() ? p.phone.trim().replace(/\D/g, '') : undefined,
          email: p.email?.trim(),
        }));
    } else if (teamData.memberNames && teamData.memberNames.length > 0) {
      members = teamData.memberNames
        .filter(n => n && n.trim())
        .map(name => ({
          id: generateId('player'),
          name: name.trim(),
        }));
    }

    const safeEmail = (teamData.email && teamData.email.trim())
      ? teamData.email.trim()
      : `${teamCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@nexus.org`;

    const newTeam: Team = {
      id: teamId,
      teamCode,
      badgeCode,
      name: finalName,
      leaderName: teamData.leaderName?.trim() || '',
      phone: cleanPhone,
      email: safeEmail,
      notes: teamData.notes?.trim() || '',
      score: 0,
      tasksCompleted: 0,
      gamesPlayed: [],
      sabotagesAvailable: 0,
      members: members.map(m => m.name),
      memberDetails: members,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTeam, ...teams];
    this.saveTeams(updated);
    return newTeam;
  },

  updateTeam(id: string, updates: Partial<Team>): Team[] {
    const teams = this.getTeams();
    const updated = teams.map(t => {
      if (t.id === id) {
        const next = { ...t, ...updates };
        if (updates.phone) {
          next.phone = updates.phone.replace(/\D/g, '');
        }
        if (updates.teamCode && !updates.badgeCode) {
          next.badgeCode = updates.teamCode;
        }
        if (updates.members && !updates.memberDetails) {
          next.memberDetails = normalizeTeamMembers(next);
        }
        return next;
      }
      return t;
    });
    this.saveTeams(updated);
    return updated;
  },

  deleteTeam(id: string): Team[] {
    const teams = this.getTeams();
    const cleanId = (id || '').trim();
    const target = teams.find(
      t =>
        t.id === cleanId ||
        (t.teamCode && t.teamCode.toUpperCase() === cleanId.toUpperCase()) ||
        (t.badgeCode && t.badgeCode.toUpperCase() === cleanId.toUpperCase()) ||
        (t.name && t.name.toLowerCase() === cleanId.toLowerCase())
    );

    const targetId = target?.id || cleanId;
    const targetCode = (target?.teamCode || '').trim().toUpperCase();
    const targetBadge = (target?.badgeCode || '').trim().toUpperCase();
    const targetName = (target?.name || '').trim();

    // 1. Remove team and cleanse activeEffects on remaining teams
    const updated = teams
      .filter(
        t =>
          t.id !== cleanId &&
          (!target || (t.id !== target.id && t.teamCode !== target.teamCode && t.name !== target.name))
      )
      .map(t => ({
        ...t,
        activeEffects: (t.activeEffects || []).filter(
          e =>
            e.appliedByTeamId !== targetId &&
            e.appliedByTeamId !== targetCode &&
            e.appliedByTeamId !== targetBadge &&
            (!targetName || e.appliedByTeamName !== targetName)
        ),
      }));

    // 2. Save tombstone so background sync NEVER resurrects this deleted team
    try {
      const tombstonesRaw = localStorage.getItem('nexus_deleted_team_ids');
      const tombstones: string[] = tombstonesRaw ? JSON.parse(tombstonesRaw) : [];
      if (cleanId) tombstones.push(cleanId.toUpperCase());
      if (targetId) tombstones.push(targetId.toUpperCase());
      if (targetCode) tombstones.push(targetCode);
      if (targetBadge) tombstones.push(targetBadge);
      if (targetName) tombstones.push(targetName.toLowerCase());
      localStorage.setItem('nexus_deleted_team_ids', JSON.stringify([...new Set(tombstones)]));
    } catch (e) {}

    // 3. Purge all local activity logs for this team
    try {
      const currentLogs = this.getLogs();
      const filteredLogs = currentLogs.filter(log => {
        const lTeam = (log.teamId || '').trim().toUpperCase();
        const lTarget = (log.targetTeamId || '').trim().toUpperCase();
        const lName = (log.teamName || '').trim().toLowerCase();
        const lTargetName = (log.targetTeamName || '').trim().toLowerCase();

        const matchesTeam =
          (lTeam && (lTeam === targetId.toUpperCase() || lTeam === targetCode || lTeam === targetBadge)) ||
          (lTarget && (lTarget === targetId.toUpperCase() || lTarget === targetCode || lTarget === targetBadge)) ||
          (targetName && (lName === targetName.toLowerCase() || lTargetName === targetName.toLowerCase())) ||
          (targetCode && log.message && log.message.toUpperCase().includes(`(${targetCode})`));

        return !matchesTeam;
      });
      cachedLogs = filteredLogs;
      this.saveLogs(filteredLogs);
    } catch (e) {}

    // 4. Clear active player session if logged in as this deleted team
    try {
      const rawSession = localStorage.getItem('nexus_player_session');
      if (rawSession) {
        const sess = JSON.parse(rawSession);
        const sessId = (sess.teamId || '').trim().toUpperCase();
        if (sessId === targetId.toUpperCase() || sessId === targetCode || sessId === targetBadge) {
          localStorage.removeItem('nexus_player_session');
        }
      }
    } catch (e) {}

    this.saveTeams(updated);

    // 5. Purge all records from Supabase tables
    if (supabase) {
      const purgeFromSupabase = async () => {
        // A. Delete from teams table
        if (targetId && isValidUuid(targetId)) {
          await supabase.from('teams').delete().eq('id', targetId);
        } else if (isValidUuid(cleanId)) {
          await supabase.from('teams').delete().eq('id', cleanId);
        }
        if (targetCode) {
          await supabase.from('teams').delete().eq('team_code', targetCode);
        }
        if (targetName) {
          await supabase.from('teams').delete().eq('name', targetName);
        }

        // B. Purge activity logs for this team
        if (targetCode) {
          await supabase.from('activity_logs').delete().or(`team_id.eq.${targetCode},target_team_id.eq.${targetCode}`);
        }
        if (targetBadge && targetBadge !== targetCode) {
          await supabase.from('activity_logs').delete().or(`team_id.eq.${targetBadge},target_team_id.eq.${targetBadge}`);
        }
        if (targetId && isValidUuid(targetId)) {
          await supabase.from('activity_logs').delete().or(`team_id.eq.${targetId},target_team_id.eq.${targetId}`);
        }
        if (targetName) {
          await supabase.from('activity_logs').delete().or(`team_name.eq.${targetName},target_team_name.eq.${targetName}`);
        }

        // C. Clear completed tasks and sabotage assignments in database
        if (targetId && isValidUuid(targetId)) {
          await supabase.from('station_tasks').update({ completed_by_team_id: null, status: 'pending', completed_at: null }).eq('completed_by_team_id', targetId);
          await supabase.from('sabotage_events').update({ resolved_by_team_id: null }).eq('resolved_by_team_id', targetId);
        }
      };
      purgeFromSupabase().catch(err => console.warn('Supabase complete team purge notice:', err));
    }

    return updated;
  },

  removeGameFromTeam(teamId: string, gamePlayIdOrGameId: string): Team[] {
    const teams = this.getTeams();
    const cleanTeamId = (teamId || '').trim().toUpperCase();
    const cleanGameId = (gamePlayIdOrGameId || '').trim().toLowerCase();

    const updated = teams.map(t => {
      const matches =
        (t.id && t.id.trim().toUpperCase() === cleanTeamId) ||
        (t.teamCode && t.teamCode.trim().toUpperCase() === cleanTeamId) ||
        (t.badgeCode && t.badgeCode.trim().toUpperCase() === cleanTeamId) ||
        (t.name && t.name.trim().toUpperCase() === cleanTeamId);

      if (!matches) return t;

      const currentGames = t.gamesPlayed || [];
      const filteredGames = currentGames.filter(
        g => g.id !== gamePlayIdOrGameId && g.gameId?.toLowerCase() !== cleanGameId
      );

      const recalcScore = filteredGames.reduce((acc, g) => acc + (g.pointsAwarded || 0), 0);

      return {
        ...t,
        gamesPlayed: filteredGames,
        score: recalcScore,
        tasksCompleted: filteredGames.length,
      };
    });

    this.saveTeams(updated);
    return updated;
  },

  clearTeamGames(teamId: string): Team[] {
    const teams = this.getTeams();
    const cleanTeamId = (teamId || '').trim().toUpperCase();

    const updated = teams.map(t => {
      const matches =
        (t.id && t.id.trim().toUpperCase() === cleanTeamId) ||
        (t.teamCode && t.teamCode.trim().toUpperCase() === cleanTeamId) ||
        (t.badgeCode && t.badgeCode.trim().toUpperCase() === cleanTeamId) ||
        (t.name && t.name.trim().toUpperCase() === cleanTeamId);

      if (!matches) return t;

      return {
        ...t,
        gamesPlayed: [],
        score: 0,
        tasksCompleted: 0,
      };
    });

    this.saveTeams(updated);
    return updated;
  },

  addPlayerToTeam(
    teamId: string,
    player: { name: string; regNo?: string; phone?: string; email?: string }
  ): Team[] {
    const teams = this.getTeams();
    const updated = teams.map(t => {
      if (t.id === teamId) {
        const currentMembers = t.memberDetails || normalizeTeamMembers(t);
        const newPlayer: PlayerMember = {
          id: generateId('player'),
          name: player.name.trim(),
          regNo: player.regNo?.trim(),
          phone: player.phone?.trim(),
          email: player.email?.trim(),
          assignedRoomId: t.assignedRoomId,
          assignedRoomName: t.assignedRoomName,
          assignedZone: t.assignedZone,
        };
        const nextMembers = [...currentMembers, newPlayer];
        return {
          ...t,
          members: nextMembers.map(m => m.name),
          memberDetails: nextMembers,
        };
      }
      return t;
    });
    this.saveTeams(updated);
    return updated;
  },

  removePlayerFromTeam(teamId: string, playerId: string): Team[] {
    const teams = this.getTeams();
    const updated = teams.map(t => {
      if (t.id === teamId) {
        const currentMembers = t.memberDetails || normalizeTeamMembers(t);
        const nextMembers = currentMembers.filter(m => m.id !== playerId);
        return {
          ...t,
          members: nextMembers.map(m => m.name),
          memberDetails: nextMembers,
        };
      }
      return t;
    });
    this.saveTeams(updated);
    return updated;
  },

  // -------------------------------------------------------------
  // ALLOCATION ACTIONS (TEAMS & PLAYERS TO ROOMS)
  // -------------------------------------------------------------
  allocateTeamToRoom(teamId: string, roomId: string | null): Team[] {
    const rooms = this.getRooms();
    const targetRoom = roomId ? rooms.find(r => r.id === roomId) : null;
    const teams = this.getTeams();

    const updated = teams.map(t => {
      if (t.id === teamId) {
        const currentMembers = t.memberDetails || normalizeTeamMembers(t);
        if (!targetRoom) {
          // Unassign
          return {
            ...t,
            assignedRoomId: undefined,
            assignedRoomName: undefined,
            assignedZone: undefined,
            memberDetails: currentMembers.map(m => ({
              ...m,
              assignedRoomId: undefined,
              assignedRoomName: undefined,
              assignedZone: undefined,
            })),
          };
        }
        // Assign to room
        return {
          ...t,
          assignedRoomId: targetRoom.id,
          assignedRoomName: targetRoom.name,
          assignedZone: targetRoom.zone,
          memberDetails: currentMembers.map(m => ({
            ...m,
            assignedRoomId: targetRoom.id,
            assignedRoomName: targetRoom.name,
            assignedZone: targetRoom.zone,
          })),
        };
      }
      return t;
    });

    this.saveTeams(updated);
    return updated;
  },

  allocatePlayerToRoom(teamId: string, playerId: string, roomId: string | null): Team[] {
    const rooms = this.getRooms();
    const targetRoom = roomId ? rooms.find(r => r.id === roomId) : null;
    const teams = this.getTeams();

    const updated = teams.map(t => {
      if (t.id === teamId) {
        const currentMembers = t.memberDetails || normalizeTeamMembers(t);
        const updatedMembers = currentMembers.map(m => {
          if (m.id === playerId) {
            if (!targetRoom) {
              return {
                ...m,
                assignedRoomId: undefined,
                assignedRoomName: undefined,
                assignedZone: undefined,
              };
            }
            return {
              ...m,
              assignedRoomId: targetRoom.id,
              assignedRoomName: targetRoom.name,
              assignedZone: targetRoom.zone,
            };
          }
          return m;
        });

        // Check if all members now belong to the same room
        const roomIds = Array.from(new Set(updatedMembers.map(m => m.assignedRoomId).filter(Boolean)));
        let teamRoomId = t.assignedRoomId;
        let teamRoomName = t.assignedRoomName;
        let teamZone = t.assignedZone;

        if (roomIds.length === 1 && updatedMembers.every(m => m.assignedRoomId)) {
          teamRoomId = targetRoom?.id;
          teamRoomName = targetRoom?.name;
          teamZone = targetRoom?.zone;
        } else if (roomIds.length > 1) {
          teamRoomName = 'Split across rooms';
        }

        return {
          ...t,
          assignedRoomId: teamRoomId,
          assignedRoomName: teamRoomName,
          assignedZone: teamZone,
          memberDetails: updatedMembers,
        };
      }
      return t;
    });

    this.saveTeams(updated);
    return updated;
  },

  // Auto-allot all unassigned teams evenly across available rooms
  autoAllotUnassignedTeams(): Team[] {
    const rooms = this.getRooms();
    if (rooms.length === 0) return this.getTeams();

    const teams = this.getTeams();
    let currentRoomIndex = 0;

    const updated = teams.map(t => {
      if (!t.assignedRoomId) {
        const assignedRoom = rooms[currentRoomIndex % rooms.length];
        currentRoomIndex++;

        const currentMembers = t.memberDetails || normalizeTeamMembers(t);
        return {
          ...t,
          assignedRoomId: assignedRoom.id,
          assignedRoomName: assignedRoom.name,
          assignedZone: assignedRoom.zone,
          memberDetails: currentMembers.map(m => ({
            ...m,
            assignedRoomId: assignedRoom.id,
            assignedRoomName: assignedRoom.name,
            assignedZone: assignedRoom.zone,
          })),
        };
      }
      return t;
    });

    this.saveTeams(updated);
    return updated;
  },

  // Reset all room allocations
  resetAllAllocations(): Team[] {
    const teams = this.getTeams();
    const updated = teams.map(t => {
      const currentMembers = t.memberDetails || normalizeTeamMembers(t);
      return {
        ...t,
        assignedRoomId: undefined,
        assignedRoomName: undefined,
        assignedZone: undefined,
        memberDetails: currentMembers.map(m => ({
          ...m,
          assignedRoomId: undefined,
          assignedRoomName: undefined,
          assignedZone: undefined,
        })),
      };
    });
    this.saveTeams(updated);
    return updated;
  },

  markGameCompleted(teamId: string, gameId: string, points: number = 5): Team | null {
    const teams = this.getTeams();
    let updatedTeam: Team | null = null;
    const updated: Team[] = teams.map(t => {
      // Allow matching by teamId, teamCode, or badgeCode
      if (t.id === teamId || t.teamCode?.toUpperCase() === teamId.toUpperCase() || t.badgeCode?.toUpperCase() === teamId.toUpperCase()) {
        const gamesPlayed = t.gamesPlayed || [];
        if (!gamesPlayed.some(g => g.gameId === gameId)) {
          const newTeam: Team = {
            ...t,
            score: (t.score || 0) + points,
            gamesPlayed: [
              ...gamesPlayed,
              {
                id: generateId('game'),
                gameId,
                gameTitle: gameId,
                pointsAwarded: points,
                score: points,
                timestamp: new Date().toISOString(),
              }
            ]
          };
          updatedTeam = newTeam;
          return newTeam;
        }
      }
      return t;
    });
    
    if (updatedTeam) {
      this.saveTeams(updated);
    }
    return updatedTeam;
  },

  // -------------------------------------------------------------
  // STAFF & USER MANAGEMENT (MASTER ADMIN, SUB-ADMIN, MODERATOR)
  // -------------------------------------------------------------
  getStaffUsers(): AdminUser[] { return cachedStaff; },

  saveStaffUsers(users: AdminUser[]): void { const finalUsers = [...users]; const rootAccount = cachedStaff.find(u => isRootMasterAccount(u)); if (rootAccount && !finalUsers.some(u => isRootMasterAccount(u))) { finalUsers.unshift(rootAccount); } cachedStaff = finalUsers; syncStaffToSupabase(finalUsers).catch(() => {}); },

  createStaffUser(user: Omit<AdminUser, 'id'>): AdminUser {
    const cleanUsername = (user.username || '').trim().toLowerCase();
    if (cleanUsername === 'nx-masteradmin' || (user.name || '').toLowerCase() === 'aditya goyal') {
      throw new Error('Username reserved for Root Master administrator.');
    }
    const users = this.getStaffUsers();
    const newUser: AdminUser = {
      ...user,
      id: generateId('staff'),
      facilitatorId: user.facilitatorId || user.username,
      password: user.password || 'Nexus@123',
    };
    const updated = [...users, newUser];
    this.saveStaffUsers(updated);

    // Immediate Supabase write
    if (supabase) {
      supabase.from('admin_users').upsert([{
        facilitator_id: newUser.facilitatorId || newUser.username,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        title: newUser.title || null,
        poc_room: newUser.pocRoom || null,
        password: newUser.password,
        updated_at: new Date().toISOString(),
      }], { onConflict: 'username' }).then(({ error }) => {
        if (error) console.error('Failed to create staff in Supabase:', error);
      }, () => {});
    }

    return newUser;
  },

  updateStaffUser(id: string, updates: Partial<AdminUser>, callerUsername?: string): AdminUser[] {
    const users = this.getStaffUsers();
    const target = users.find(u => u.id === id);
    if (target && isRootMasterAccount(target)) {
      // Only Aditya (nx-masteradmin) can alter this account!
      const caller = (callerUsername || '').trim().toLowerCase();
      if (caller !== 'nx-masteradmin') {
        console.warn('Blocked unauthorized edit attempt on root master account.');
        return users;
      }
      // Never allow demoting from super_admin or changing username away from nx-masteradmin
      if (updates.role && updates.role !== 'super_admin') {
        delete updates.role;
      }
      if (updates.username && updates.username.toLowerCase() !== 'nx-masteradmin') {
        delete updates.username;
      }
    }
    const updated = users.map(u => (u.id === id ? { ...u, ...updates } : u));
    this.saveStaffUsers(updated);

    // Immediate Supabase write
    const updatedUser = updated.find(u => u.id === id);
    if (updatedUser && supabase) {
      supabase.from('admin_users').upsert([{
        facilitator_id: updatedUser.facilitatorId || updatedUser.username,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        title: updatedUser.title || null,
        poc_room: updatedUser.pocRoom || null,
        password: updatedUser.password || 'Nexus@123',
        updated_at: new Date().toISOString(),
      }], { onConflict: 'username' }).then(({ error }) => {
        if (error) console.error('Failed to update staff in Supabase:', error);
      }, () => {});
    }

    return updated;
  },

  deleteStaffUser(id: string): AdminUser[] {
    const users = this.getStaffUsers();
    // Protect root master admin and primary facilitators from deletion
    const target = users.find(u => u.id === id);
    if (target && (isRootMasterAccount(target) || target.id === 'NX-SUPER-01' || target.role === 'super_admin')) {
      console.warn('Blocked attempt to delete protected master admin account.');
      return users;
    }
    const updated = users.filter(u => u.id !== id);
    this.saveStaffUsers(updated);

    // Immediate Supabase delete
    if (target && supabase) {
      supabase.from('admin_users').delete().eq('username', target.username).then(({ error }) => {
        if (error) console.error('Failed to delete staff from Supabase:', error);
      }, () => {});
    }

    return updated;
  },

  // -------------------------------------------------------------
  // IMPOSTOR SELECTION & ROLE OVERRIDES PER ROOM
  // -------------------------------------------------------------
  setTeamImpostor(teamId: string, isImpostor: boolean): Team[] {
    const teams = this.getTeams();
    const updated = teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          isImpostor,
          powerPorts: isImpostor ? (t.powerPorts?.length === 3 ? t.powerPorts : createDefaultPowerPorts()) : t.powerPorts,
        };
      }
      return t;
    });
    this.saveTeams(updated);

    const target = updated.find(t => t.id === teamId);
    if (target) {
      this.addLog({
        type: 'impostor_assign',
        message: isImpostor
          ? `Team ${target.name} (${target.teamCode || target.id}) set as IMPOSTOR with 3 Active Power Ports.`
          : `Team ${target.name} (${target.teamCode || target.id}) set as CREWMATE.`,
        teamId: target.teamCode || target.id,
        teamName: target.name,
        roomName: target.assignedRoomName,
        severity: isImpostor ? 'danger' : 'info',
      });
    }

    return updated;
  },

  setRoomImpostor(roomId: string, targetTeamId: string | null): Team[] {
    const teams = this.getTeams();
    const rooms = this.getRooms();
    const room = rooms.find(r => r.id === roomId);

    const updated = teams.map(t => {
      if (t.assignedRoomId === roomId) {
        const isImp = targetTeamId ? t.id === targetTeamId : false;
        return {
          ...t,
          isImpostor: isImp,
          powerPorts: isImp ? (t.powerPorts?.length === 3 ? t.powerPorts : createDefaultPowerPorts()) : t.powerPorts,
        };
      }
      return t;
    });

    this.saveTeams(updated);

    if (targetTeamId) {
      const chosen = updated.find(t => t.id === targetTeamId);
      if (chosen) {
        this.addLog({
          type: 'impostor_assign',
          message: `Admin override in ${room?.name || roomId}: Team ${chosen.name} (${chosen.teamCode || chosen.id}) set as IMPOSTOR with 3 Active Power Ports.`,
          teamId: chosen.teamCode || chosen.id,
          teamName: chosen.name,
          roomName: room?.name,
          severity: 'danger',
        });
      }
    } else {
      this.addLog({
        type: 'impostor_assign',
        message: `All teams in ${room?.name || roomId} reset to CREWMATE.`,
        roomName: room?.name,
        severity: 'info',
      });
    }

    return updated;
  },

  rollRandomImpostorInRoom(roomId: string): { updatedTeams: Team[]; selectedTeam: Team | null } {
    const teams = this.getTeams();
    const rooms = this.getRooms();
    const room = rooms.find(r => r.id === roomId);
    const roomTeams = teams.filter(t => t.assignedRoomId === roomId);

    if (roomTeams.length === 0) {
      return { updatedTeams: teams, selectedTeam: null };
    }

    // Cryptographically secure random selection
    let randomIndex = 0;
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      randomIndex = array[0] % roomTeams.length;
    } else {
      randomIndex = Math.floor(Math.random() * roomTeams.length);
    }

    const chosen = roomTeams[randomIndex];

    const updated = teams.map(t => {
      if (t.assignedRoomId === roomId) {
        const isImp = t.id === chosen.id;
        return {
          ...t,
          isImpostor: isImp,
          powerPorts: isImp ? (t.powerPorts?.length === 3 ? t.powerPorts : createDefaultPowerPorts()) : t.powerPorts,
        };
      }
      return t;
    });

    this.saveTeams(updated);

    this.addLog({
      type: 'impostor_assign',
      message: `🎲 Random Impostor roll in ${room?.name || roomId}: Team ${chosen.name} (${chosen.teamCode || chosen.id}) chosen as IMPOSTOR with 3 Active Power Ports.`,
      teamId: chosen.teamCode || chosen.id,
      teamName: chosen.name,
      roomName: room?.name,
      severity: 'danger',
    });

    return { updatedTeams: updated, selectedTeam: chosen };
  },

  // -------------------------------------------------------------
  // 3-PORT POWER SYSTEM CONTROLS (ADMIN MANAGEMENT & TARGETING)
  // -------------------------------------------------------------
  getPowerLibrary(): Omit<ImpostorPowerPort, 'port'>[] {
    try {
      const stored = localStorage.getItem(POWERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse power library from localStorage', e);
    }
    try {
      localStorage.setItem(POWERS_STORAGE_KEY, JSON.stringify(STANDARD_POWER_LIBRARY));
    } catch (e) {}
    return STANDARD_POWER_LIBRARY;
  },

  savePowerLibrary(powers: Omit<ImpostorPowerPort, 'port'>[]): void {
    try {
      localStorage.setItem(POWERS_STORAGE_KEY, JSON.stringify(powers));
    } catch (e) {
      console.error('Failed to save power library to localStorage', e);
    }
    syncPowersToSupabase(powers).catch(() => {});
  },

  addPowerToLibrary(power: Omit<ImpostorPowerPort, 'port'>): Omit<ImpostorPowerPort, 'port'>[] {
    const list = this.getPowerLibrary();
    const existingIndex = list.findIndex(p => p.id === power.id);
    let updated: Omit<ImpostorPowerPort, 'port'>[];
    if (existingIndex >= 0) {
      updated = list.map((p, idx) => (idx === existingIndex ? power : p));
    } else {
      updated = [...list, power];
    }
    this.savePowerLibrary(updated);
    return updated;
  },

  deletePowerFromLibrary(id: string): Omit<ImpostorPowerPort, 'port'>[] {
    const list = this.getPowerLibrary();
    const updated = list.filter(p => p.id !== id);
    this.savePowerLibrary(updated);
    try {
      if (supabase) {
        supabase.from('powers_library').delete().eq('id', id).then(() => {}, () => {});
      }
    } catch (e) {}
    return updated;
  },

  resetPowerLibraryToDefault(): Omit<ImpostorPowerPort, 'port'>[] {
    this.savePowerLibrary(STANDARD_POWER_LIBRARY);
    return STANDARD_POWER_LIBRARY;
  },

  getStandardPowerLibrary(): Omit<ImpostorPowerPort, 'port'>[] {
    return this.getPowerLibrary();
  },

  getTeamPowerPorts(teamId: string): ImpostorPowerPort[] {
    const teams = this.getTeams();
    const team = teams.find(t => t.id === teamId || t.teamCode?.toUpperCase() === teamId.toUpperCase());
    if (!team) return createDefaultPowerPorts();
    if (!team.powerPorts || team.powerPorts.length !== 3) {
      team.powerPorts = createDefaultPowerPorts();
      this.saveTeams(teams);
    }
    return team.powerPorts;
  },

  pausePowerPort(teamId: string, portIndex: 1 | 2 | 3, paused: boolean, adminName?: string): Team[] {
    const teams = this.getTeams();
    let updatedTeam: Team | null = null;
    let targetPortName = `Port ${portIndex}`;

    const updated: Team[] = teams.map(t => {
      if (t.id === teamId || t.teamCode?.toUpperCase() === teamId.toUpperCase()) {
        const ports = t.powerPorts && t.powerPorts.length === 3 ? [...t.powerPorts] : createDefaultPowerPorts();
        const portIdx = ports.findIndex(p => p.port === portIndex);
        if (portIdx !== -1) {
          targetPortName = ports[portIdx].name;
          ports[portIdx] = {
            ...ports[portIdx],
            status: paused ? 'paused' : 'ready',
          };
        }
        const nextTeam: Team = { ...t, powerPorts: ports };
        updatedTeam = nextTeam;
        return nextTeam;
      }
      return t;
    });

    this.saveTeams(updated);

    if (updatedTeam) {
      this.addLog({
        type: 'power',
        message: paused
          ? `⏸️ ADMIN POWER CONTROL: ${adminName || 'Admin'} PAUSED Port ${portIndex} (${targetPortName}) for Team ${(updatedTeam as Team).name}. Impostors cannot trigger this power.`
          : `▶️ ADMIN POWER CONTROL: ${adminName || 'Admin'} RESUMED Port ${portIndex} (${targetPortName}) for Team ${(updatedTeam as Team).name}. Power is now active.`,
        teamId: (updatedTeam as Team).teamCode || (updatedTeam as Team).id,
        teamName: (updatedTeam as Team).name,
        roomName: (updatedTeam as Team).assignedRoomName,
        powerName: targetPortName,
        portIndex: portIndex,
        severity: paused ? 'warning' : 'info',
      });
    }

    return updated;
  },

  changePowerPort(
    teamId: string,
    portIndex: 1 | 2 | 3,
    powerConfig: {
      name: string;
      description?: string;
      cooldownSeconds: number;
      durationSeconds?: number;
      targetRequired?: boolean;
    },
    adminName?: string
  ): Team[] {
    const teams = this.getTeams();
    let updatedTeam: Team | null = null;

    const updated: Team[] = teams.map(t => {
      if (t.id === teamId || t.teamCode?.toUpperCase() === teamId.toUpperCase()) {
        const ports = t.powerPorts && t.powerPorts.length === 3 ? [...t.powerPorts] : createDefaultPowerPorts();
        const portIdx = ports.findIndex(p => p.port === portIndex);
        const newPort: ImpostorPowerPort = {
          port: portIndex,
          id: generateId('pwr'),
          name: powerConfig.name.trim(),
          description: powerConfig.description || 'Custom administrative power.',
          cooldownSeconds: Math.max(5, powerConfig.cooldownSeconds || 30),
          durationSeconds: powerConfig.durationSeconds || 25,
          status: 'ready',
          lastUsedAt: null,
          targetRequired: powerConfig.targetRequired !== false,
        };

        if (portIdx !== -1) {
          ports[portIdx] = newPort;
        } else {
          ports.push(newPort);
        }
        const nextTeam: Team = { ...t, powerPorts: ports };
        updatedTeam = nextTeam;
        return nextTeam;
      }
      return t;
    });

    this.saveTeams(updated);

    if (updatedTeam) {
      this.addLog({
        type: 'power',
        message: `🔄 ADMIN POWER CONTROL: ${adminName || 'Admin'} CHANGED Port ${portIndex} for Team ${(updatedTeam as Team).name} to "${powerConfig.name}" (${powerConfig.cooldownSeconds}s cooldown).`,
        teamId: (updatedTeam as Team).teamCode || (updatedTeam as Team).id,
        teamName: (updatedTeam as Team).name,
        roomName: (updatedTeam as Team).assignedRoomName,
        powerName: powerConfig.name,
        portIndex: portIndex,
        severity: 'info',
      });
    }

    return updated;
  },

  deletePowerPort(teamId: string, portIndex: 1 | 2 | 3, adminName?: string): Team[] {
    const teams = this.getTeams();
    let updatedTeam: Team | null = null;
    let oldName = `Port ${portIndex}`;

    const updated: Team[] = teams.map(t => {
      if (t.id === teamId || t.teamCode?.toUpperCase() === teamId.toUpperCase()) {
        const ports = t.powerPorts && t.powerPorts.length === 3 ? [...t.powerPorts] : createDefaultPowerPorts();
        const portIdx = ports.findIndex(p => p.port === portIndex);
        if (portIdx !== -1) {
          oldName = ports[portIdx].name;
          ports[portIdx] = {
            port: portIndex,
            id: generateId('empty'),
            name: '[Empty Port]',
            description: 'No power assigned to this port.',
            cooldownSeconds: 0,
            durationSeconds: 0,
            status: 'disabled',
            lastUsedAt: null,
            targetRequired: false,
          };
        }
        const nextTeam: Team = { ...t, powerPorts: ports };
        updatedTeam = nextTeam;
        return nextTeam;
      }
      return t;
    });

    this.saveTeams(updated);

    if (updatedTeam) {
      this.addLog({
        type: 'power',
        message: `🗑️ ADMIN POWER CONTROL: ${adminName || 'Admin'} CLEARED Port ${portIndex} (previously ${oldName}) for Team ${(updatedTeam as Team).name}.`,
        teamId: (updatedTeam as Team).teamCode || (updatedTeam as Team).id,
        teamName: (updatedTeam as Team).name,
        roomName: (updatedTeam as Team).assignedRoomName,
        powerName: oldName,
        portIndex: portIndex,
        severity: 'warning',
      });
    }

    return updated;
  },

  resetPowerCooldowns(teamId: string, adminName?: string): Team[] {
    const teams = this.getTeams();
    let updatedTeam: Team | null = null;

    const updated: Team[] = teams.map(t => {
      if (t.id === teamId || t.teamCode?.toUpperCase() === teamId.toUpperCase()) {
        const ports: ImpostorPowerPort[] = (t.powerPorts || createDefaultPowerPorts()).map(p => ({
          ...p,
          lastUsedAt: null,
          status: (p.status === 'paused' || p.status === 'disabled' ? p.status : 'ready') as 'ready' | 'paused' | 'disabled',
        }));
        const nextTeam: Team = { ...t, powerPorts: ports };
        updatedTeam = nextTeam;
        return nextTeam;
      }
      return t;
    });

    this.saveTeams(updated);

    if (updatedTeam) {
      this.addLog({
        type: 'power',
        message: `⚡ ADMIN POWER CONTROL: ${adminName || 'Admin'} RESET all power cooldowns for Team ${(updatedTeam as Team).name}.`,
        teamId: (updatedTeam as Team).teamCode || (updatedTeam as Team).id,
        teamName: (updatedTeam as Team).name,
        roomName: (updatedTeam as Team).assignedRoomName,
        severity: 'info',
      });
    }

    return updated;
  },

  useImpostorPowerWithTarget(
    impostorTeamId: string,
    portIndex: 1 | 2 | 3,
    targetTeamId?: string
  ): { success: boolean; message: string; log?: ActivityLogItem; targetTeam?: Team } {
    const teams = this.getTeams();
    const impostor = teams.find(t => t.id === impostorTeamId || t.teamCode?.toUpperCase() === impostorTeamId.toUpperCase());

    if (!impostor) {
      return { success: false, message: 'Impostor team not found.' };
    }
    if (!impostor.isImpostor) {
      return { success: false, message: 'Only designated Impostor teams can activate power ports.' };
    }

    const ports = impostor.powerPorts && impostor.powerPorts.length === 3 ? impostor.powerPorts : createDefaultPowerPorts();
    const port = ports.find(p => p.port === portIndex);

    if (!port) {
      return { success: false, message: `Port ${portIndex} does not exist.` };
    }
    if (port.status === 'paused') {
      return { success: false, message: `Port ${portIndex} (${port.name}) is PAUSED by the Game Admin.` };
    }
    if (port.status === 'disabled') {
      return { success: false, message: `Port ${portIndex} is empty. No power equipped.` };
    }

    // Check cooldown
    if (port.lastUsedAt) {
      const elapsed = (Date.now() - new Date(port.lastUsedAt).getTime()) / 1000;
      if (elapsed < port.cooldownSeconds) {
        const remaining = Math.ceil(port.cooldownSeconds - elapsed);
        return { success: false, message: `Port ${portIndex} (${port.name}) is recharging! (${remaining}s remaining)` };
      }
    }

    // Target team in the same room
    let targetTeam: Team | undefined;
    if (port.targetRequired && targetTeamId) {
      targetTeam = teams.find(t => t.id === targetTeamId || t.teamCode?.toUpperCase() === targetTeamId.toUpperCase());
    }

    // Apply active effect to target team
    const duration = port.durationSeconds || 30;
    if (targetTeam) {
      const newEffect: TeamActiveEffect = {
        id: generateId('eff'),
        powerName: port.name,
        appliedByTeamId: impostor.teamCode || impostor.id,
        appliedByTeamName: impostor.name,
        appliedAt: new Date().toISOString(),
        durationSeconds: duration,
        expiresAt: Date.now() + duration * 1000,
        description: port.description,
      };

      const now = Date.now();
      targetTeam.activeEffects = [
        ...(targetTeam.activeEffects || []).filter(e => e.expiresAt > now),
        newEffect,
      ];
    }

    // Update port cooldown
    port.lastUsedAt = new Date().toISOString();
    impostor.powerPorts = ports;

    // Save updated teams
    this.saveTeams(teams);

    // Issue activity log
    const actionText = targetTeam
      ? `⚡ IMPOSTOR POWER: ${impostor.name} (${impostor.teamCode || impostor.id}) used [Port ${portIndex}: ${port.name}] on ${targetTeam.name} (${targetTeam.teamCode || targetTeam.id}) in ${impostor.assignedRoomName || 'Room'}! Effect active for ${duration}s.`
      : `⚡ IMPOSTOR POWER: ${impostor.name} (${impostor.teamCode || impostor.id}) activated [Port ${portIndex}: ${port.name}] in ${impostor.assignedRoomName || 'Room'}!`;

    const logEntry = this.addLog({
      type: 'power',
      message: actionText,
      teamId: impostor.teamCode || impostor.id,
      teamName: impostor.name,
      targetTeamId: targetTeam ? (targetTeam.teamCode || targetTeam.id) : undefined,
      targetTeamName: targetTeam ? targetTeam.name : undefined,
      roomId: impostor.assignedRoomId,
      roomName: impostor.assignedRoomName,
      powerName: port.name,
      portIndex: portIndex,
      severity: 'danger',
    });

    return {
      success: true,
      message: actionText,
      log: logEntry,
      targetTeam,
    };
  },

  useImpostorPower(teamId: string, powerName: string, details?: string): ActivityLogItem {
    const teams = this.getTeams();
    const team = teams.find(t => t.id === teamId || t.teamCode?.toLowerCase() === teamId.toLowerCase());

    const logEntry = this.addLog({
      type: 'power',
      message: `⚡ IMPOSTOR POWER: ${team?.name || teamId} activated ${powerName}${details ? ` (${details})` : ''} in ${team?.assignedRoomName || 'assigned room'}!`,
      teamId: team?.teamCode || team?.id,
      teamName: team?.name || teamId,
      roomName: team?.assignedRoomName,
      powerName: powerName,
      severity: 'danger',
    });

    return logEntry;
  },

  triggerPower(
    impostorTeamId: string,
    powerNameCombo: string,
    targetTeamId?: string
  ): { success: boolean; message: string; log?: ActivityLogItem; targetTeam?: Team } {
    const teams = this.getTeams();
    const cleanImpostorId = (impostorTeamId || '').trim().toUpperCase();
    const impostor = teams.find(
      t =>
        (t.id && t.id.trim().toUpperCase() === cleanImpostorId) ||
        (t.teamCode && t.teamCode.trim().toUpperCase() === cleanImpostorId) ||
        (t.badgeCode && t.badgeCode.trim().toUpperCase() === cleanImpostorId) ||
        (t.name && t.name.trim().toLowerCase() === cleanImpostorId.toLowerCase())
    );

    if (!impostor) return { success: false, message: 'Impostor team not found.' };

    const parts = powerNameCombo.split('_');
    const actualPowerName = parts[0];
    const actionType = parts.length > 1 ? parts[1] : 'FREEZE';

    if (impostor.sabotagesAvailable === undefined) {
      impostor.sabotagesAvailable = 3;
    }

    if ((impostor.sabotagesAvailable || 0) <= 0) {
      return { success: false, message: 'No sabotages available. Complete tasks or wait for recharge.' };
    }

    const powerToGameId: Record<string, string> = {
      'Wordle Sabotage': 'wordle',
      'Emoji Sabotage': 'emoji',
      'MonkeyType Sabotage': 'monkeytype',
      'Pacman Sabotage': 'pacman',
      'wordle': 'wordle',
      'emoji': 'emoji',
      'monkeytype': 'monkeytype',
      'pacman': 'pacman',
    };
    const gameId = powerToGameId[actualPowerName] || actualPowerName.toLowerCase().replace(/\s+/g, '');

    const hasPower =
      !impostor.powerPorts ||
      impostor.powerPorts.length === 0 ||
      powerToGameId[actualPowerName] !== undefined ||
      impostor.powerPorts.some(p => p.name === actualPowerName && p.status !== 'disabled');

    if (!hasPower) {
      return { success: false, message: 'Power not enabled or available for this team.' };
    }

    impostor.sabotagesAvailable = Math.max(0, (impostor.sabotagesAvailable || 0) - 1);

    let targetTeam: Team | undefined;
    if (targetTeamId) {
      const cleanTargetId = targetTeamId.trim().toUpperCase();
      targetTeam = teams.find(
        t =>
          (t.id && t.id.trim().toUpperCase() === cleanTargetId) ||
          (t.teamCode && t.teamCode.trim().toUpperCase() === cleanTargetId) ||
          (t.badgeCode && t.badgeCode.trim().toUpperCase() === cleanTargetId) ||
          (t.name && t.name.trim().toLowerCase() === cleanTargetId.toLowerCase())
      );
    }

    let actionText = '';
    const now = Date.now();

    if (actionType === 'FREEZE') {
      if (gameId) {
        this.freezeGame(gameId, 60000); // 1 minute
      }
      const effect: TeamActiveEffect = {
        id: generateId('eff'),
        powerName: `Terminal Freeze: ${actualPowerName}`,
        appliedByTeamId: impostor.teamCode || impostor.id,
        appliedByTeamName: impostor.name,
        appliedAt: new Date().toISOString(),
        durationSeconds: 60,
        expiresAt: now + 60000,
        description: `❄️ ${actualPowerName} frozen for 60s by Impostor!`,
      };

      if (targetTeam) {
        targetTeam.activeEffects = [
          ...(targetTeam.activeEffects || []).filter(e => e.expiresAt > now),
          effect,
        ];
        actionText = `❄️ IMPOSTOR POWER: ${impostor.name} FROZE ${actualPowerName} targeting ${targetTeam.name} (${targetTeam.teamCode || targetTeam.id})!`;
      } else {
        teams.forEach(t => {
          if (!t.isImpostor && (t.assignedRoomName === impostor.assignedRoomName || t.assignedRoomId === impostor.assignedRoomId || t.assignedRoom === impostor.assignedRoom || (!t.assignedRoom && !impostor.assignedRoom))) {
            t.activeEffects = [
              ...(t.activeEffects || []).filter(e => e.expiresAt > now),
              effect,
            ];
          }
        });
        actionText = `❄️ IMPOSTOR POWER: ${impostor.name} FROZE ${actualPowerName} across sector for 1 minute!`;
      }
    } else if (actionType === 'STEAL') {
      if (targetTeam) {
        const stolen = Math.min(10, targetTeam.score || 0);
        targetTeam.score = Math.max(0, (targetTeam.score || 0) - stolen);
        impostor.score = (impostor.score || 0) + stolen;
        const effect: TeamActiveEffect = {
          id: generateId('eff'),
          powerName: `Point Siphon: ${actualPowerName}`,
          appliedByTeamId: impostor.teamCode || impostor.id,
          appliedByTeamName: impostor.name,
          appliedAt: new Date().toISOString(),
          durationSeconds: 30,
          expiresAt: now + 30000,
          description: `💰 Impostor siphoned points from your squad!`,
        };
        targetTeam.activeEffects = [
          ...(targetTeam.activeEffects || []).filter(e => e.expiresAt > now),
          effect,
        ];
        actionText = `💰 IMPOSTOR POWER: ${impostor.name} STOLE ${stolen} points from ${targetTeam.name} (${targetTeam.teamCode || targetTeam.id})!`;
      } else {
        let stolen = 0;
        teams.forEach(t => {
          if (!t.isImpostor && t.status !== 'eliminated') {
            const completed = t.gamesPlayed?.some(g => g.gameId === gameId);
            if (!completed) {
              const deduct = Math.min(5, t.score || 0);
              t.score = Math.max(0, (t.score || 0) - deduct);
              stolen += deduct;
              t.activeEffects = [
                ...(t.activeEffects || []).filter(e => e.expiresAt > now),
                {
                  id: generateId('eff'),
                  powerName: `Point Siphon: ${actualPowerName}`,
                  appliedByTeamId: impostor.teamCode || impostor.id,
                  appliedByTeamName: impostor.name,
                  appliedAt: new Date().toISOString(),
                  durationSeconds: 30,
                  expiresAt: now + 30000,
                  description: `💰 Impostor siphoned 5 points from your team!`,
                }
              ];
            }
          }
        });
        impostor.score = (impostor.score || 0) + stolen;
        actionText = `💰 IMPOSTOR POWER: ${impostor.name} STOLE points from sector teams playing ${actualPowerName}! (Total stolen: ${stolen})`;
      }
    } else {
      if (targetTeam) {
        if (gameId) {
          targetTeam.gamesPlayed = (targetTeam.gamesPlayed || []).filter(g => g.gameId !== gameId);
        }
        const effect: TeamActiveEffect = {
          id: generateId('eff'),
          powerName: `Station Reset: ${actualPowerName}`,
          appliedByTeamId: impostor.teamCode || impostor.id,
          appliedByTeamName: impostor.name,
          appliedAt: new Date().toISOString(),
          durationSeconds: 30,
          expiresAt: now + 30000,
          description: `🔧 Station reset on ${actualPowerName} by Impostor!`,
        };
        targetTeam.activeEffects = [
          ...(targetTeam.activeEffects || []).filter(e => e.expiresAt > now),
          effect,
        ];
        actionText = `🔧 IMPOSTOR POWER: ${impostor.name} RESET ${actualPowerName} progress for ${targetTeam.name}!`;
      } else {
        teams.forEach(t => {
          if (!t.isImpostor) {
            if (gameId) {
              t.gamesPlayed = (t.gamesPlayed || []).filter(g => g.gameId !== gameId);
            }
          }
        });
        actionText = `🔧 IMPOSTOR POWER: ${impostor.name} triggered station reset on ${actualPowerName} for sector squads!`;
      }
    }

    this.saveTeams(teams);

    const logEntry = this.addLog({
      type: 'power',
      message: actionText,
      teamId: impostor.teamCode || impostor.id,
      teamName: impostor.name,
      targetTeamId: targetTeam ? (targetTeam.teamCode || targetTeam.id) : undefined,
      targetTeamName: targetTeam ? targetTeam.name : undefined,
      roomId: impostor.assignedRoomId,
      roomName: impostor.assignedRoomName,
      powerName: actualPowerName,
      severity: 'danger',
    });

    return { success: true, message: actionText, log: logEntry, targetTeam };
  },

  getGamePointsConfig(): GamePointsConfig {
    try {
      const stored = localStorage.getItem(GAME_POINTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          cachedGamePoints = {
            wordle: typeof parsed.wordle === 'number' ? parsed.wordle : (parseInt(parsed.wordle, 10) || DEFAULT_GAME_POINTS.wordle),
            emoji: typeof parsed.emoji === 'number' ? parsed.emoji : (parseInt(parsed.emoji, 10) || DEFAULT_GAME_POINTS.emoji),
            monkeytype: typeof parsed.monkeytype === 'number' ? parsed.monkeytype : (parseInt(parsed.monkeytype, 10) || DEFAULT_GAME_POINTS.monkeytype),
            pacman: typeof parsed.pacman === 'number' ? parsed.pacman : (parseInt(parsed.pacman, 10) || DEFAULT_GAME_POINTS.pacman),
          };
          return cachedGamePoints;
        }
      }
    } catch (e) {
      console.warn('Failed reading game points config from storage', e);
    }
    return cachedGamePoints;
  },

  saveGamePointsConfig(config: GamePointsConfig, recalculateExistingScores: boolean = true): GamePointsConfig {
    const sanitized: GamePointsConfig = {
      wordle: Number(config.wordle) || DEFAULT_GAME_POINTS.wordle,
      emoji: Number(config.emoji) || DEFAULT_GAME_POINTS.emoji,
      monkeytype: Number(config.monkeytype) || DEFAULT_GAME_POINTS.monkeytype,
      pacman: Number(config.pacman) || DEFAULT_GAME_POINTS.pacman,
    };
    cachedGamePoints = sanitized;
    try {
      localStorage.setItem(GAME_POINTS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Failed to save game points config', e);
    }

    if (recalculateExistingScores) {
      try {
        const teams = this.getTeams();
        let anyModified = false;
        const updatedTeams = teams.map(team => {
          if (Array.isArray(team.gamesPlayed) && team.gamesPlayed.length > 0) {
            const updatedGames = team.gamesPlayed.map(g => {
              const newPts = sanitized[g.gameId as keyof GamePointsConfig];
              if (typeof newPts === 'number') {
                anyModified = true;
                return {
                  ...g,
                  pointsAwarded: newPts,
                  score: newPts,
                };
              }
              return g;
            });
            const newScore = updatedGames.reduce((acc, g) => acc + (g.pointsAwarded || 0), 0);
            return {
              ...team,
              gamesPlayed: updatedGames,
              score: newScore,
            };
          }
          return team;
        });

        if (anyModified) {
          this.saveTeams(updatedTeams);
        }
      } catch (err) {
        console.warn('Score recalculation notice:', err);
      }
    }

    // Broadcast across Supabase event controls so all connected client devices receive the points
    if (supabase) {
      supabase
        .from('event_controls')
        .update({
          active_sabotage: JSON.stringify({ gamePoints: sanitized }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'primary_match')
        .then(() => {}, () => {});
    }

    try {
      window.dispatchEvent(new CustomEvent('nexus_game_points_updated', { detail: sanitized }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    return sanitized;
  },

  recordGameCompletion(
    teamIdentifier: string,
    gameId: string,
    gameTitle: string,
    customPoints?: number,
    rawScore?: number
  ): { success: boolean; team?: Team; pointsAwarded: number; newScore: number } {
    const teams = this.getTeams();
    const config = this.getGamePointsConfig();
    const pointsAwarded = customPoints !== undefined ? customPoints : ((config as any)[gameId] ?? 50);

    const team = teams.find(
      t =>
        t.id === teamIdentifier ||
        t.teamCode?.toUpperCase() === teamIdentifier.toUpperCase() ||
        t.name.toLowerCase() === teamIdentifier.toLowerCase()
    );

    if (!team) {
      return { success: false, pointsAwarded, newScore: 0 };
    }

    const record: GamePlayedRecord = {
      id: generateId('game-play'),
      gameId,
      gameTitle,
      pointsAwarded,
      score: rawScore ?? pointsAwarded,
      timestamp: new Date().toISOString(),
    };

    const newScore = (team.score || 0) + pointsAwarded;
    team.score = newScore;
    team.tasksCompleted = (team.tasksCompleted || 0) + 1;
    team.gamesPlayed = [record, ...(team.gamesPlayed || [])];
    
    if (team.isImpostor) {
      team.sabotagesAvailable = (team.sabotagesAvailable || 0) + 1;
    }

    this.saveTeams(teams);

    this.addLog({
      type: 'task',
      message: `🎮 GAME COMPLETED: ${team.name} (${team.teamCode || team.id}) completed ${gameTitle} and earned +${pointsAwarded} pts! (Total: ${newScore} pts)`,
      teamId: team.teamCode || team.id,
      teamName: team.name,
      roomId: team.assignedRoomId,
      roomName: team.assignedRoomName,
      severity: 'success',
    });

    return {
      success: true,
      team,
      pointsAwarded,
      newScore,
    };
  },

  adjustTeamScore(
    teamId: string,
    deltaPoints: number,
    reason: string = 'Admin score adjustment'
  ): { success: boolean; team?: Team; newScore: number } {
    const teams = this.getTeams();
    const team = teams.find(
      t => t.id === teamId || t.teamCode?.toUpperCase() === teamId.toUpperCase()
    );

    if (!team) {
      return { success: false, newScore: 0 };
    }

    const newScore = Math.max(0, (team.score || 0) + deltaPoints);
    team.score = newScore;
    this.saveTeams(teams);

    this.addLog({
      type: 'task',
      message: `⚙️ SCORE ADJUSTMENT: ${team.name} (${team.teamCode || team.id}) ${deltaPoints >= 0 ? '+' : ''}${deltaPoints} pts (${reason}). New Total: ${newScore} pts.`,
      teamId: team.teamCode || team.id,
      teamName: team.name,
      severity: deltaPoints >= 0 ? 'success' : 'warning',
    });

    return { success: true, team, newScore };
  },

  // -------------------------------------------------------------
  // ACTIVITY & AUDIT LOGS
  // -------------------------------------------------------------
  getLogs(): ActivityLogItem[] {
    try {
      const stored = localStorage.getItem(LOGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse logs from localStorage', e);
    }
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    } catch (e) {}
    return INITIAL_ACTIVITY_LOGS;
  },

  saveLogs(logs: ActivityLogItem[]): void {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs to localStorage', e);
    }
  },

  addLog(entry: Omit<ActivityLogItem, 'id' | 'timestamp'> & { timestamp?: string }): ActivityLogItem {
    const logs = this.getLogs();
    const newLog: ActivityLogItem = {
      ...entry,
      id: generateId('log'),
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    // Keep last 500 logs
    const updated = [newLog, ...logs].slice(0, 500);
    this.saveLogs(updated);
    syncLogToSupabase(newLog).catch(() => {});
    return newLog;
  },

  clearLogs(): void {
    this.saveLogs([]);
  },

  // Pull latest data directly from Supabase into local storage cache
  async syncAllFromSupabase(): Promise<{ roomsCount: number; teamsCount: number; staffCount: number; powersCount: number }> {
    let roomsCount = 0;
    let teamsCount = 0;
    let staffCount = 0;
    let powersCount = 0;

    if (!supabase) return { roomsCount, teamsCount, staffCount, powersCount };

    try {
      // 1. Fetch Rooms
      const { data: roomsData, error: roomsErr } = await supabase.from('rooms').select('*');
      if (!roomsErr && roomsData && roomsData.length > 0) {
        const mappedRooms: RoomRecord[] = roomsData.map((r: any) => ({
          id: r.id,
          name: r.name,
          zone: r.zone,
          capacity: r.capacity || 20,
          pocName: r.poc_name || undefined,
          pocContact: r.poc_contact || undefined,
          pocEmail: r.poc_email || undefined,
          notes: r.notes || undefined,
        }));
        cachedRooms = mappedRooms;
        roomsCount = mappedRooms.length;
        try {
          localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(mappedRooms));
        } catch (e) {}
      }

      // 2. Fetch Teams
      const { data: teamsData, error: teamsErr } = await supabase.from('teams').select('*');
      if (!teamsErr && teamsData && teamsData.length > 0) {
        let tombstones: string[] = [];
        try {
          const raw = localStorage.getItem('nexus_deleted_team_ids');
          if (raw) tombstones = JSON.parse(raw);
        } catch (e) {}

        const mappedTeams: Team[] = teamsData
          .filter((t: any) => {
            const tid = (t.id || '').trim().toUpperCase();
            const tcode = (t.team_code || '').trim().toUpperCase();
            const tbadge = (t.badge_code || '').trim().toUpperCase();
            const tname = (t.name || '').trim().toLowerCase();
            return (
              !tombstones.includes(tid) &&
              !tombstones.includes(tcode) &&
              !tombstones.includes(tbadge) &&
              !tombstones.includes(tname)
            );
          })
          .map((t: any) => {
          const rawPowerPorts = Array.isArray(t.power_ports) ? t.power_ports : [];
          const metaPort = rawPowerPorts.find((p: any) => p && p.id === '__meta__');
          const cleanPowerPorts = rawPowerPorts.filter((p: any) => p && p.id !== '__meta__');

          const gamesPlayed = (metaPort && Array.isArray(metaPort.gamesPlayed))
            ? metaPort.gamesPlayed
            : (Array.isArray(t.games_played) ? t.games_played : (Array.isArray(t.gamesPlayed) ? t.gamesPlayed : []));

          const calculatedPoints = gamesPlayed.reduce((acc: number, g: any) => acc + (g.pointsAwarded || 0), 0);
          const score = (gamesPlayed && gamesPlayed.length > 0) ? Math.max(t.score || 0, calculatedPoints) : (t.score || 0);

          const sabotagesAvailable = (metaPort && typeof metaPort.sabotagesAvailable === 'number')
            ? metaPort.sabotagesAvailable
            : (t.sabotages_available ?? (t.is_impostor ? 3 : 0));

          return {
            id: t.id,
            teamCode: t.team_code || undefined,
            badgeCode: t.badge_code || t.team_code || undefined,
            name: t.name,
            leaderName: t.leader_name || t.name,
            phone: t.phone || '',
            email: t.email || '',
            color: t.color || '#00F0FF',
            score,
            tasksCompleted: (gamesPlayed && gamesPlayed.length > 0) ? gamesPlayed.length : (t.tasks_completed ?? 0),
            status: t.status || 'active',
            assignedRoom: t.assigned_room || undefined,
            assignedRoomId: t.assigned_room_id || undefined,
            assignedRoomName: t.assigned_room_name || undefined,
            assignedZone: t.assigned_zone || undefined,
            isImpostor: !!t.is_impostor,
            impostorPlayerName: t.impostor_player_name || undefined,
            sabotagesAvailable,
            powerPorts: cleanPowerPorts.length > 0 ? cleanPowerPorts : (t.is_impostor ? createDefaultPowerPorts() : undefined),
            activeEffects: t.active_effects || [],
            gamesPlayed,
            members: Array.isArray(t.members) ? t.members.map((m: any) => typeof m === 'string' ? m : m.name) : [],
            memberDetails: Array.isArray(t.members) ? t.members.map((m: any, idx: number) => typeof m === 'string' ? { id: `m-${idx}`, name: m } : m) : [],
            createdAt: t.created_at || new Date().toISOString(),
          };
        });
        cachedTeams = mappedTeams;
        teamsCount = mappedTeams.length;
        try {
          localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(mappedTeams));
        } catch (e) {}
      }

      // 3. Fetch Admin Users from Supabase
      const { data: staffData, error: staffErr } = await supabase
        .from('admin_users')
        .select('*');
      if (!staffErr && staffData && staffData.length > 0) {
        const mappedStaff: AdminUser[] = staffData.map((s: any) => ({
          id: s.id,
          facilitatorId: s.facilitator_id || s.username || s.id,
          username: s.username,
          name: s.name,
          email: s.email,
          role: s.role,
          pocRoom: s.poc_room || undefined,
          title: s.title || undefined,
        }));
        // Never persist cleartext passwords in browser client storage (CWE-312 / CodeQL Alert #12)
        const sanitizedStaff = mappedStaff.map(({ password: _pwd, ...rest }) => rest);
        cachedStaff = sanitizedStaff;
        staffCount = mappedStaff.length;
      }

      // 4. Fetch Powers Library
      const { data: powersData, error: powersErr } = await supabase.from('powers_library').select('*');
      if (!powersErr && powersData && powersData.length > 0) {
        const mappedPowers: ImpostorPowerPort[] = powersData.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          cooldownSeconds: p.cooldown_seconds || 30,
          durationSeconds: p.duration_seconds || 20,
          targetRequired: !!p.target_required,
          status: p.status || 'ready',
          port: 1, // Default port since it's required by the type
        }));
        cachedPowers = mappedPowers;
        powersCount = mappedPowers.length;
      }

      // 5. Fetch Activity Logs from Supabase
      const { data: logsData, error: logsErr } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (!logsErr && logsData && logsData.length > 0) {
        const mappedLogs: ActivityLogItem[] = logsData.map((l: any) => ({
          id: l.id,
          type: l.type,
          message: l.message,
          teamId: l.team_id || undefined,
          roomName: l.room_name || undefined,
          powerName: l.power_name || undefined,
          portIndex: l.port_index || undefined,
          severity: l.severity || 'info',
          timestamp: l.created_at,
        }));
        cachedLogs = mappedLogs;
        try {
          localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(mappedLogs));
        } catch (e) {}

        // Correlate task completion logs with teams strictly by exact ID/code
        const taskLogs = mappedLogs.filter(l => l.type === 'task' && l.message && l.message.includes('completed'));
        if (taskLogs.length > 0 && cachedTeams.length > 0) {
          cachedTeams = cachedTeams.map(team => {
            const teamCode = (team.teamCode || '').trim().toUpperCase();
            const teamId = (team.id || '').trim().toUpperCase();
            const badgeCode = (team.badgeCode || '').trim().toUpperCase();

            const relevantLogs = taskLogs.filter(l => {
              const lTeam = (l.teamId || '').trim().toUpperCase();
              if (lTeam && (lTeam === teamCode || lTeam === teamId || lTeam === badgeCode)) {
                return true;
              }
              if (teamCode && l.message && l.message.toUpperCase().includes(`(${teamCode})`)) {
                return true;
              }
              return false;
            });

            if (relevantLogs.length === 0) return team;

            const existingGames = [...(team.gamesPlayed || [])];
            let modified = false;

            relevantLogs.forEach(log => {
              const msg = log.message || '';
              let detectedGameId: string | null = null;
              let detectedTitle = '';

              if (msg.includes('Emoji Decoder') || msg.toLowerCase().includes('emoji')) {
                detectedGameId = 'emoji';
                detectedTitle = 'Emoji Decoder';
              } else if (msg.includes('Code Typer') || msg.toLowerCase().includes('monkeytype') || msg.toLowerCase().includes('typer')) {
                detectedGameId = 'monkeytype';
                detectedTitle = 'Code Typer Mission';
              } else if (msg.includes('Wordle') || msg.toLowerCase().includes('wordle')) {
                detectedGameId = 'wordle';
                detectedTitle = 'Wordle';
              } else if (msg.includes('Pacman') || msg.toLowerCase().includes('pacman')) {
                detectedGameId = 'pacman';
                detectedTitle = 'Pacman Sector Defense';
              }

              if (detectedGameId && !existingGames.some(g => g.gameId === detectedGameId)) {
                existingGames.push({
                  id: log.id || generateId('game-play'),
                  gameId: detectedGameId,
                  gameTitle: detectedTitle,
                  pointsAwarded: 40,
                  score: 40,
                  timestamp: log.timestamp || new Date().toISOString(),
                });
                modified = true;
              }
            });

            if (modified) {
              const recalcPoints = existingGames.reduce((acc, g) => acc + (g.pointsAwarded || 40), 0);
              return {
                ...team,
                score: Math.max(team.score || 0, recalcPoints),
                gamesPlayed: existingGames,
                tasksCompleted: existingGames.length,
              };
            }
            return team;
          });

          try {
            localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(cachedTeams));
          } catch (e) {}
        }
      }

      // 6. Fetch Global Game Points Configuration
      try {
        const { data: ecData } = await supabase
          .from('event_controls')
          .select('active_sabotage')
          .eq('id', 'primary_match')
          .maybeSingle();

        if (ecData?.active_sabotage) {
          const parsed = JSON.parse(ecData.active_sabotage);
          if (parsed?.gamePoints && typeof parsed.gamePoints === 'object') {
            const remotePoints: GamePointsConfig = {
              wordle: Number(parsed.gamePoints.wordle) || DEFAULT_GAME_POINTS.wordle,
              emoji: Number(parsed.gamePoints.emoji) || DEFAULT_GAME_POINTS.emoji,
              monkeytype: Number(parsed.gamePoints.monkeytype) || DEFAULT_GAME_POINTS.monkeytype,
              pacman: Number(parsed.gamePoints.pacman) || DEFAULT_GAME_POINTS.pacman,
            };
            cachedGamePoints = remotePoints;
            try {
              localStorage.setItem(GAME_POINTS_STORAGE_KEY, JSON.stringify(remotePoints));
            } catch (e) {}
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    } catch (e) {
      console.warn('Sync from Supabase failed or offline', e);
    }

    return { roomsCount, teamsCount, staffCount, powersCount };
  },
};

// Backward compatibility GameDatabase alias for any existing imports
export const GameDatabase = {
  ...AllocationDatabase,
  getTeams: () => Promise.resolve(AllocationDatabase.getTeams()),
  subscribeToTeams: (cb: (teams: Team[]) => void) => {
    cb(AllocationDatabase.getTeams());
    return () => {};
  },
};
