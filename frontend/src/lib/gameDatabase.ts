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
  wordle: 50,
  emoji: 40,
  memedecoder: 45,
  monkeytype: 35,
  pacman: 60,
};

export interface CrewmateGame {
  id: keyof GamePointsConfig;
  title: string;
  description: string;
  icon: string;
  route: string;
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
    id: 'memedecoder',
    title: 'Meme Decoder',
    description: 'Decode the popular memes',
    icon: '🖼️',
    route: '/games/memedecoder',
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


// Cryptographically secure ID generator
function generateId(prefix: string): string {
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
    const payload = teams.map(t => {
      const code = t.teamCode || t.badgeCode || null;
      const row: Record<string, any> = {
        name: t.name,
        leader_name: t.leaderName || t.name,
        email: t.email || `${t.name.toLowerCase().replace(/\s+/g, '')}@nexus.org`,
        phone: t.phone || null,
        color: t.color || '#00F0FF',
        score: t.score || 0,
        status: t.status || 'active',
        team_code: code,
        badge_code: code,
        assigned_room: t.assignedRoomName || 'Room 1',
        assigned_room_id: t.assignedRoomId || null,
        assigned_room_name: t.assignedRoomName || null,
        assigned_zone: t.assignedZone || null,
        is_impostor: !!t.isImpostor,
        impostor_player_name: t.impostorPlayerName || null,
        power_ports: t.powerPorts || [],
        active_effects: t.activeEffects || [],
        games_played: t.gamesPlayed || [],
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
      row.id = t.id;
      return row;
    });
    const { error } = await supabase.from('teams').upsert(payload, { onConflict: 'id' });
    if (error) console.error('Supabase team upsert error:', error);
  } catch (err) {
    console.error('Failed to sync teams:', err);
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
    return CREWMATE_GAMES.map(game => ({ ...game }));
  },

  // -------------------------------------------------------------
  // ROOMS & ZONES MANAGEMENT
  // -------------------------------------------------------------
  getRooms(): RoomRecord[] { return cachedRooms; },

  saveRooms(rooms: RoomRecord[]): void { cachedRooms = rooms; syncRoomsToSupabase(rooms).catch(() => {}); },

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
  getTeams(): Team[] { return cachedTeams; },

  saveTeams(teams: Team[]): void { cachedTeams = teams; syncTeamsToSupabase(teams).catch(() => {}); },

  createTeam(teamData: {
    name: string;
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
    const teamId = generateId('team');
    const teamCode = teamData.teamCode?.trim().toUpperCase() || `NX-T${teams.length + 1}`;
    const badgeCode = teamData.badgeCode?.trim().toUpperCase() || teamCode;

    let members: PlayerMember[] = [];
    if (teamData.playerList && teamData.playerList.length > 0) {
      members = teamData.playerList
        .filter(p => p.name && p.name.trim())
        .map(p => ({
          id: generateId('player'),
          name: p.name.trim(),
          regNo: p.regNo?.trim(),
          phone: p.phone?.trim(),
          email: p.email?.trim(),
        }));
    } else if (teamData.memberNames) {
      members = teamData.memberNames
        .filter(n => n && n.trim())
        .map(name => ({
          id: generateId('player'),
          name: name.trim(),
        }));
    }

    const newTeam: Team = {
      id: teamId,
      teamCode,
      badgeCode,
      name: teamData.name.trim(),
      leaderName: teamData.leaderName?.trim() || '',
      phone: teamData.phone?.trim() || '',
      email: teamData.email?.trim() || '',
      notes: teamData.notes?.trim() || '',
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
    const updated = teams.filter(t => t.id !== id);
    this.saveTeams(updated);
    if (supabase) {
      supabase.from('teams').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to delete team:', error);
      });
    }
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
    const impostor = teams.find(
      t => t.id === impostorTeamId || t.teamCode?.toUpperCase() === impostorTeamId.toUpperCase()
    );

    if (!impostor) return { success: false, message: 'Impostor team not found.' };

    const parts = powerNameCombo.split('_');
    const actualPowerName = parts[0];
    const actionType = parts.length > 1 ? parts[1] : 'FREEZE';

    if ((impostor.sabotagesAvailable || 0) <= 0) {
      return { success: false, message: 'No sabotages available.' };
    }

    const hasPower = impostor.powerPorts?.some(p => p.name === actualPowerName && p.status !== 'disabled');
    if (!hasPower) {
      return { success: false, message: 'Power not enabled or available for this team.' };
    }

    const powerToGameId: Record<string, string> = {
      'Wordle Sabotage': 'wordle',
      'Emoji Sabotage': 'emoji',
      'Meme Sabotage': 'memedecoder',
      'MonkeyType Sabotage': 'monkeytype',
      'Pacman Sabotage': 'pacman'
    };
    const gameId = powerToGameId[actualPowerName];
    let actionText = '';

    impostor.sabotagesAvailable = (impostor.sabotagesAvailable || 0) - 1;

    if (actionType === 'FREEZE') {
      if (gameId) {
        this.freezeGame(gameId, 60000); // 1 minute
      }
      actionText = `❄️ IMPOSTOR POWER: ${impostor.name} FROZE ${actualPowerName} for 1 minute!`;
    } else if (actionType === 'STEAL') {
      let stolen = 0;
      teams.forEach(t => {
        if (!t.isImpostor && t.status !== 'eliminated') {
          const completed = t.gamesPlayed?.some(g => g.gameId === gameId);
          if (!completed) {
            t.score = Math.max(0, (t.score || 0) - 5);
            stolen += 5;
          }
        }
      });
      impostor.score = (impostor.score || 0) + stolen;
      actionText = `💰 IMPOSTOR POWER: ${impostor.name} STOLE 5 points from teams playing ${actualPowerName}! (Total stolen: ${stolen})`;
    } else {
      actionText = `🔧 IMPOSTOR POWER: ${impostor.name} triggered RESET on ${actualPowerName} (No effect).`;
    }

    this.saveTeams(teams);

    const logEntry = this.addLog({
      type: 'power',
      message: actionText,
      teamId: impostor.teamCode || impostor.id,
      teamName: impostor.name,
      powerName: actualPowerName,
      severity: 'danger',
    });

    return { success: true, message: actionText, log: logEntry };
  },

  getGamePointsConfig(): GamePointsConfig { return cachedGamePoints; },

  saveGamePointsConfig(config: GamePointsConfig): GamePointsConfig {
    try {
      localStorage.setItem(GAME_POINTS_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save game points config', e);
    }
    return config;
  },

  recordGameCompletion(
    teamIdentifier: string,
    gameId: string,
    gameTitle: string,
    customPoints?: number
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
      score: rawScore,
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
      }

      // 2. Fetch Teams
      const { data: teamsData, error: teamsErr } = await supabase.from('teams').select('*');
      if (!teamsErr && teamsData && teamsData.length > 0) {
        const mappedTeams: Team[] = teamsData.map((t: any) => ({
          id: t.id,
          teamCode: t.team_code || undefined,
          name: t.name,
          leaderName: t.leader_name || t.name,
          phone: t.phone || '',
          email: t.email || '',
          color: t.color || '#00F0FF',
          score: t.score || 0,
          status: t.status || 'active',
          assignedRoom: t.assigned_room || undefined,
          assignedRoomId: t.assigned_room_id || undefined,
          assignedRoomName: t.assigned_room_name || undefined,
          assignedZone: t.assigned_zone || undefined,
          isImpostor: !!t.is_impostor,
          impostorPlayerName: t.impostor_player_name || undefined,
          powerPorts: t.power_ports || (t.is_impostor ? createDefaultPowerPorts() : undefined),
          activeEffects: t.active_effects || [],
          gamesPlayed: t.games_played || t.gamesPlayed || [],
          members: Array.isArray(t.members) ? t.members.map((m: any) => typeof m === 'string' ? m : m.name) : [],
          memberDetails: Array.isArray(t.members) ? t.members.map((m: any, idx: number) => typeof m === 'string' ? { id: `m-${idx}`, name: m } : m) : [],
          createdAt: t.created_at || new Date().toISOString(),
        }));
        cachedTeams = mappedTeams;
        teamsCount = mappedTeams.length;
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
