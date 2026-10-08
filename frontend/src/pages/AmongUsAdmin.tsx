import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Building,
  UserPlus,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Phone,
  Download,
  Search,
  ArrowRight,
  RefreshCw,
  LogOut,
  Layers,
  Menu,
  Sparkles,
  AlertCircle,
  X,
  Shield,
  ShieldCheck,
  Crown,
  Zap,
  Skull,
  Dices,
  History,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Target,
  ArrowUpRight,
  Sliders,
  Wrench,
  Gamepad2,
  Trophy,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Team, RoomRecord, PlayerMember, AdminUser, AdminRole, ActivityLogItem, ImpostorPowerPort, GamePointsConfig, GamePlayedRecord } from '../types';
import { AllocationDatabase } from '../lib/gameDatabase';
import { isRootMasterAccount, isCurrentAdityaUser } from '../utils/permissions';


export default function AmongUsAdmin() {
  const { user, login, logout, isAuthenticated } = useAdminAuth();

  // -------------------------------------------------------------
  // AUTH LOGIN FORM STATE (EMPTY BY DEFAULT, NO DEMO LOGINS)
  // -------------------------------------------------------------
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // -------------------------------------------------------------
  // DASHBOARD DATA STATE
  // -------------------------------------------------------------
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [staffUsers, setStaffUsers] = useState<AdminUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'allocation' | 'teams' | 'rooms' | 'powers' | 'games' | 'users' | 'logs'>('allocation');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'power' | 'impostor_assign' | 'sabotage' | 'login' | 'system'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [allocationSearchQuery, setAllocationSearchQuery] = useState('');
  const [allocationFilter, setAllocationFilter] = useState<'all' | 'infiltrated' | 'vacant' | 'empty'>('all');
  const [isStagingOpen, setIsStagingOpen] = useState(true);

  // -------------------------------------------------------------
  // GAME POINTS & LEADERBOARD STATE
  // -------------------------------------------------------------
  const [gamePointsConfig, setGamePointsConfig] = useState<GamePointsConfig>(() => AllocationDatabase.getGamePointsConfig());
  const [pointsForm, setPointsForm] = useState<GamePointsConfig>(() => AllocationDatabase.getGamePointsConfig());
  const [selectedTeamGames, setSelectedTeamGames] = useState<Team | null>(null);
  const [adjustPointsTeam, setAdjustPointsTeam] = useState<Team | null>(null);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<number>(10);
  const [adjustPointsReason, setAdjustPointsReason] = useState<string>('Bonus Challenge Reward');

  // -------------------------------------------------------------
  // POWERS LIBRARY DASHBOARD & POWERSET MANAGEMENT STATE
  // -------------------------------------------------------------
  const [powerLibrary, setPowerLibrary] = useState<Omit<ImpostorPowerPort, 'port'>[]>([]);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [editingLibraryPower, setEditingLibraryPower] = useState<Omit<ImpostorPowerPort, 'port'> | null>(null);
  const [powerSearchQuery, setPowerSearchQuery] = useState('');
  const [powerFilterScope, setPowerFilterScope] = useState<'all' | 'targeted' | 'room'>('all');
  const [libraryForm, setLibraryForm] = useState<{
    id: string;
    name: string;
    description: string;
    cooldownSeconds: number;
    durationSeconds: number;
    targetRequired: boolean;
    status: 'ready' | 'paused' | 'disabled';
  }>({
    id: '',
    name: '',
    description: '',
    cooldownSeconds: 30,
    durationSeconds: 20,
    targetRequired: true,
    status: 'ready',
  });

  // -------------------------------------------------------------
  // FULL ROOM POPUP / SETTINGS INSPECTION MODAL STATE
  // -------------------------------------------------------------
  const [selectedDetailRoom, setSelectedDetailRoom] = useState<RoomRecord | null>(null);


  // -------------------------------------------------------------
  // MODALS STATE
  // -------------------------------------------------------------
  // Room Modal (Add / Edit)
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    zone: '',
    pocName: '',
    pocContact: '',
  });

  // Team Modal (Add / Edit)
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    teamCode: '',
    leaderName: '',
    phone: '',
    playerNames: '',
    assignedRoomId: '',
  });

  // Add Player to Team Modal
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null);
  const [personForm, setPersonForm] = useState({
    name: '',
    phone: '',
  });

  // User / Staff Modal (Add / Edit for Master Admin)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState<{
    name: string;
    username: string;
    email: string;
    role: AdminRole;
    password: string;
    pocRoom: string;
    title: string;
  }>({
    name: '',
    username: '',
    email: '',
    role: 'admin',
    password: '',
    pocRoom: '',
    title: '',
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // -------------------------------------------------------------
  // INITIAL LOAD & LOG POLLING
  // -------------------------------------------------------------
  useEffect(() => {
    // Seed immediately from local storage cache
    setRooms(AllocationDatabase.getRooms());
    setTeams(AllocationDatabase.getTeams());
    setStaffUsers(AllocationDatabase.getStaffUsers());
    setActivityLogs(AllocationDatabase.getLogs());
    setPowerLibrary(AllocationDatabase.getPowerLibrary());
    const initialPts = AllocationDatabase.getGamePointsConfig();
    setGamePointsConfig(initialPts);
    setPointsForm(initialPts);

    const handlePointsEvent = (ev: any) => {
      if (ev?.detail) {
        setGamePointsConfig(ev.detail);
        setPointsForm(ev.detail);
      }
    };
    window.addEventListener('nexus_game_points_updated', handlePointsEvent);

    const refreshFromSupabase = async () => {
      try {
        await AllocationDatabase.syncAllFromSupabase();
        setRooms(AllocationDatabase.getRooms());
        setTeams(AllocationDatabase.getTeams());
        setStaffUsers(AllocationDatabase.getStaffUsers());
        setActivityLogs(AllocationDatabase.getLogs());
        setPowerLibrary(AllocationDatabase.getPowerLibrary());
        const remotePts = AllocationDatabase.getGamePointsConfig();
        setGamePointsConfig(remotePts);
      } catch (err) {
        setActivityLogs(AllocationDatabase.getLogs());
        setTeams(AllocationDatabase.getTeams());
      }
    };

    // Immediate background sync from Supabase
    refreshFromSupabase();

    // Auto-poll logs and teams so live player actions, game completions & points display immediately
    const pollLogs = setInterval(() => {
      refreshFromSupabase();
    }, 4000);
    return () => {
      clearInterval(pollLogs);
      window.removeEventListener('nexus_game_points_updated', handlePointsEvent);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await AllocationDatabase.syncAllFromSupabase();
      setRooms(AllocationDatabase.getRooms());
      setTeams(AllocationDatabase.getTeams());
      setStaffUsers(AllocationDatabase.getStaffUsers());
      setActivityLogs(AllocationDatabase.getLogs());
      setPowerLibrary(AllocationDatabase.getPowerLibrary());
      const remotePts = AllocationDatabase.getGamePointsConfig();
      setGamePointsConfig(remotePts);
      setPointsForm(remotePts);
      notify('All logs, teams, and scores synced from database!');
    } catch (err) {
      setActivityLogs(AllocationDatabase.getLogs());
      setTeams(AllocationDatabase.getTeams());
      notify('Refreshed local records');
    } finally {
      setIsSyncing(false);
    }
  };

  // -------------------------------------------------------------
  // GAME POINTS & LEADERBOARD HANDLERS
  // -------------------------------------------------------------
  const handleSaveGamePoints = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = AllocationDatabase.saveGamePointsConfig(pointsForm, true);
    setGamePointsConfig(saved);
    setPointsForm(saved);
    setTeams(AllocationDatabase.getTeams());
    notify('Station game points saved and recalculated across all squads!');
  };

  const handleApplyPointsAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPointsTeam) return;
    const res = AllocationDatabase.adjustTeamScore(adjustPointsTeam.id, adjustPointsDelta, adjustPointsReason);
    setTeams(AllocationDatabase.getTeams());
    setActivityLogs(AllocationDatabase.getLogs());
    notify(`Updated points for ${adjustPointsTeam.name}! New score: ${res.newScore} PTS`);
    setAdjustPointsTeam(null);
  };

  // -------------------------------------------------------------
  // IMPOSTOR SELECTION HANDLERS
  // -------------------------------------------------------------
  const handleRollRandomImpostor = (roomId: string, roomName: string) => {
    const res = AllocationDatabase.rollRandomImpostorInRoom(roomId);
    if (!res.selectedTeam) {
      notify(`No teams in ${roomName} to select from.`);
      return;
    }
    setTeams(res.updatedTeams);
    setActivityLogs(AllocationDatabase.getLogs());
    notify(`🎲 Rolled Impostor in ${roomName}: ${res.selectedTeam.name} (${res.selectedTeam.teamCode || res.selectedTeam.id})`);
  };

  const handleRollAllRoomImpostors = () => {
    let rolled = 0;
    rooms.forEach(r => {
      const roomTeams = teams.filter(t => t.assignedRoomId === r.id || t.assignedRoom === r.id || t.assignedRoomName === r.name);
      if (roomTeams.length > 0 && !roomTeams.some(t => t.isImpostor)) {
        AllocationDatabase.rollRandomImpostorInRoom(r.id);
        rolled++;
      }
    });
    setTeams(AllocationDatabase.getTeams());
    setActivityLogs(AllocationDatabase.getLogs());
    if (rolled > 0) {
      notify(`🎲 Rolled random Impostors for ${rolled} pending rooms!`);
    } else {
      notify('All rooms with teams already have an Impostor, or have no teams assigned.');
    }
  };

  const handleSetRoomImpostor = (roomId: string, targetTeamId: string | null) => {
    const updated = AllocationDatabase.setRoomImpostor(roomId, targetTeamId);
    setTeams(updated);
    setActivityLogs(AllocationDatabase.getLogs());
    const targetTeam = updated.find(t => t.id === targetTeamId);
    if (targetTeam) {
      notify(`Set ${targetTeam.name} as Impostor in room`);
    } else {
      notify('Reset room to all Crewmates');
    }
  };

  const handleToggleTeamImpostor = (teamId: string, currentStatus: boolean | undefined) => {
    const newStatus = !currentStatus;
    const updated = AllocationDatabase.setTeamImpostor(teamId, newStatus);
    setTeams(updated);
    setActivityLogs(AllocationDatabase.getLogs());
    const team = updated.find(t => t.id === teamId);
    notify(`${team?.name} is now ${newStatus ? 'an IMPOSTOR' : 'a CREWMATE'}`);
  };

  // -------------------------------------------------------------
  // 3-PORT POWER SYSTEM ADMIN CONTROLS
  // -------------------------------------------------------------
  const [powerModalOpen, setPowerModalOpen] = useState(false);
  const [editingPortTeam, setEditingPortTeam] = useState<Team | null>(null);
  const [editingPortIndex, setEditingPortIndex] = useState<1 | 2 | 3>(1);
  const [powerForm, setPowerForm] = useState<{
    selectedLibraryPower: string;
    name: string;
    description: string;
    cooldownSeconds: number;
    durationSeconds: number;
    targetRequired: boolean;
  }>({
    selectedLibraryPower: '',
    name: '',
    description: '',
    cooldownSeconds: 30,
    durationSeconds: 20,
    targetRequired: true,
  });

  const handlePausePowerPort = (teamId: string, portIndex: 1 | 2 | 3, currentStatus: string) => {
    const isPaused = currentStatus === 'paused';
    const updated = AllocationDatabase.pausePowerPort(teamId, portIndex, !isPaused, user?.name);
    setTeams(updated);
    setActivityLogs(AllocationDatabase.getLogs());
    notify(!isPaused ? `⏸️ Paused Port ${portIndex}` : `▶️ Resumed Port ${portIndex}`);
  };

  const handleDeletePowerPort = (teamId: string, portIndex: 1 | 2 | 3) => {
    const updated = AllocationDatabase.deletePowerPort(teamId, portIndex, user?.name);
    setTeams(updated);
    setActivityLogs(AllocationDatabase.getLogs());
    notify(`🗑️ Cleared Port ${portIndex}`);
  };

  const handleResetCooldowns = (teamId: string) => {
    const updated = AllocationDatabase.resetPowerCooldowns(teamId, user?.name);
    setTeams(updated);
    setActivityLogs(AllocationDatabase.getLogs());
    notify(`⚡ Reset power cooldowns`);
  };

  const handleOpenPowerModal = (team: Team, portIndex: 1 | 2 | 3) => {
    setEditingPortTeam(team);
    setEditingPortIndex(portIndex);
    const ports = team.powerPorts || AllocationDatabase.getTeamPowerPorts(team.id);
    const port = ports.find(p => p.port === portIndex);
    if (port && port.status !== 'disabled') {
      setPowerForm({
        selectedLibraryPower: port.id || '',
        name: port.name,
        description: port.description,
        cooldownSeconds: port.cooldownSeconds,
        durationSeconds: port.durationSeconds || 20,
        targetRequired: port.targetRequired,
      });
    } else {
      setPowerForm({
        selectedLibraryPower: 'sabotage-lights',
        name: 'Sabotage Lights',
        description: 'Kill sector power, plunging the room into darkness.',
        cooldownSeconds: 30,
        durationSeconds: 20,
        targetRequired: false,
      });
    }
    setPowerModalOpen(true);
  };

  const handleSavePowerPort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPortTeam || !powerForm.name.trim()) return;

    const updated = AllocationDatabase.changePowerPort(
      editingPortTeam.id,
      editingPortIndex,
      {
        name: powerForm.name.trim(),
        description: powerForm.description.trim(),
        cooldownSeconds: Number(powerForm.cooldownSeconds) || 30,
        durationSeconds: Number(powerForm.durationSeconds) || 20,
        targetRequired: powerForm.targetRequired,
      },
      user?.name
    );

    setTeams(updated);
    setActivityLogs(AllocationDatabase.getLogs());
    setPowerModalOpen(false);
    notify(`⚡ Equipped "${powerForm.name}" into Port ${editingPortIndex}`);
  };

  // -------------------------------------------------------------
  // POWERS ARSENAL & LIBRARY MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreatePower = () => {
    setEditingLibraryPower(null);
    setLibraryForm({
      id: '',
      name: '',
      description: '',
      cooldownSeconds: 30,
      durationSeconds: 20,
      targetRequired: true,
      status: 'ready',
    });
    setLibraryModalOpen(true);
  };

  const handleOpenEditPower = (power: Omit<ImpostorPowerPort, 'port'>) => {
    setEditingLibraryPower(power);
    setLibraryForm({
      id: power.id,
      name: power.name,
      description: power.description,
      cooldownSeconds: power.cooldownSeconds,
      durationSeconds: power.durationSeconds || 20,
      targetRequired: power.targetRequired,
      status: power.status || 'ready',
    });
    setLibraryModalOpen(true);
  };

  const handleSaveLibraryPower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!libraryForm.name.trim()) {
      notify('Power name is required.');
      return;
    }
    const cleanId = editingLibraryPower
      ? editingLibraryPower.id
      : (libraryForm.id.trim() || libraryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));

    const newPower: Omit<ImpostorPowerPort, 'port'> = {
      id: cleanId,
      name: libraryForm.name.trim(),
      description: libraryForm.description.trim() || 'Custom station disruption power.',
      cooldownSeconds: Number(libraryForm.cooldownSeconds) || 30,
      durationSeconds: Number(libraryForm.durationSeconds) || 20,
      targetRequired: !!libraryForm.targetRequired,
      status: libraryForm.status || 'ready',
    };

    const updated = AllocationDatabase.addPowerToLibrary(newPower);
    setPowerLibrary(updated);
    AllocationDatabase.addLog({
      type: 'power',
      message: `${user?.name || 'Admin'} ${editingLibraryPower ? 'updated' : 'created'} power "${newPower.name}" in standard library.`,
      severity: 'info',
    });
    setActivityLogs(AllocationDatabase.getLogs());
    setLibraryModalOpen(false);
    notify(`Power "${newPower.name}" saved to library.`);
  };

  const handleDeleteLibraryPower = (powerId: string, powerName: string) => {
    if (!window.confirm(`Delete power "${powerName}" from library?`)) return;
    const updated = AllocationDatabase.deletePowerFromLibrary(powerId);
    setPowerLibrary(updated);
    AllocationDatabase.addLog({
      type: 'power',
      message: `${user?.name || 'Admin'} deleted power "${powerName}" from standard library.`,
      severity: 'warning',
    });
    setActivityLogs(AllocationDatabase.getLogs());
    notify(`Power "${powerName}" deleted.`);
  };

  const handleToggleLibraryPowerStatus = (power: Omit<ImpostorPowerPort, 'port'>) => {
    const nextStatus = power.status === 'paused' ? 'ready' : 'paused';
    const updated = AllocationDatabase.addPowerToLibrary({ ...power, status: nextStatus });
    setPowerLibrary(updated);
    notify(`Power "${power.name}" is now ${nextStatus.toUpperCase()}`);
  };

  const handleResetLibraryDefaults = () => {
    if (!window.confirm('Reset the powers library back to the official 6 standard powers? Any custom powers will be replaced.')) return;
    const updated = AllocationDatabase.resetPowerLibraryToDefault();
    setPowerLibrary(updated);
    notify('Reset to standard powers library.');
  };

  const handleClearLogs = () => {
    if (window.confirm('Clear all activity logs? This cannot be undone.')) {
      AllocationDatabase.clearLogs();
      setActivityLogs([]);
      notify('Activity logs cleared');
    }
  };

  const handleExportLogsCSV = () => {
    const rows = [
      ['Timestamp', 'Type', 'Severity', 'Team ID', 'Team Name', 'Game Name', 'Message'],
    ];

    activityLogs.forEach(l => {
      rows.push([
        new Date(l.timestamp).toLocaleString(),
        l.type.toUpperCase(),
        l.severity || 'info',
        l.teamId || '-',
        l.teamName || '-',
        l.roomName || '-',
        `"${(l.message || '').replace(/"/g, '""')}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NEXUS_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify('Exported Activity Logs CSV');
  };



  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // AUTH HANDLER
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await login(loginId, loginPassword);
      if (!res.success) {
        setLoginError(res.error || 'Invalid ID or password.');
      }
    } catch {
      setLoginError('Authentication error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // -------------------------------------------------------------
  // ROOM CRUD
  // -------------------------------------------------------------
  const openAddRoom = () => {
    const created = AllocationDatabase.createRoom({
      name: `Game ${rooms.length + 1}`,
      zone: '-',
      capacity: 20,
      pocName: '',
      pocContact: '',
      pocEmail: '',
      notes: ''
    });
    setRooms(AllocationDatabase.getRooms());
    notify(`Created Game ${rooms.length + 1}`);
  };

  const openEditRoom = (room: RoomRecord) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name,
      zone: room.zone,
      pocName: room.pocName,
      pocContact: room.pocContact,
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.name.trim()) return;

    if (editingRoom) {
      const updated = AllocationDatabase.updateRoom(editingRoom.id, {
        name: roomForm.name.trim(),
        zone: roomForm.zone.trim() || 'Zone A',
        pocName: roomForm.pocName.trim(),
        pocContact: roomForm.pocContact.trim(),
      });
      setRooms(updated);
      setTeams(AllocationDatabase.getTeams());
      notify(`Updated ${roomForm.name}`);
    } else {
      const created = AllocationDatabase.createRoom({
        name: roomForm.name.trim(),
        zone: roomForm.zone.trim() || 'Zone A',
        capacity: 20,
        pocName: roomForm.pocName.trim(),
        pocContact: roomForm.pocContact.trim(),
      });
      setRooms(AllocationDatabase.getRooms());
      notify(`Created ${created.name}`);
    }

    setRoomModalOpen(false);
  };

  const handleDeleteRoom = (roomId: string, roomName: string) => {
    if (window.confirm(`Delete ${roomName}? Teams in this room will become unassigned.`)) {
      const updated = AllocationDatabase.deleteRoom(roomId);
      setRooms(updated);
      setTeams(AllocationDatabase.getTeams());
      notify(`Deleted ${roomName}`);
    }
  };

  // -------------------------------------------------------------
  // TEAM CRUD
  // -------------------------------------------------------------
  const openAddTeam = () => {
    setEditingTeamId(null);
    const nextCode = AllocationDatabase.getNextTeamCode(teams);
    setTeamForm({
      name: '',
      teamCode: nextCode,
      leaderName: '',
      phone: '',
      playerNames: '',
      assignedRoomId: '',
    });
    setTeamModalOpen(true);
  };

  const openEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    const names = (team.memberDetails || [])
      .map(m => m.name)
      .join('\n');
    setTeamForm({
      name: team.name,
      teamCode: team.teamCode || team.badgeCode || team.id,
      leaderName: team.leaderName || '',
      phone: team.phone || '',
      playerNames: names,
      assignedRoomId: team.assignedRoomId || '',
    });
    setTeamModalOpen(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Mobile number is COMPULSORY and must be exactly 10 digits
    const cleanPhone = (teamForm.phone || '').trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert('Leader Mobile Number is compulsory and must be exactly 10 digits (e.g. 9876543210).');
      return;
    }

    // 2. Team Code is guaranteed unique
    const cleanTeamCode = teamForm.teamCode.trim().toUpperCase() || AllocationDatabase.getNextTeamCode(teams);

    // 3. Team Name is OPTIONAL (defaults to unique squad label)
    const rawName = teamForm.name.trim();
    const finalName = rawName || `Squad ${cleanTeamCode}`;
    const cleanLeaderName = teamForm.leaderName.trim() || undefined;

    // 4. Members / Player list is NOT required (optional)
    const names = teamForm.playerNames
      ? teamForm.playerNames
          .split(/[\n,]+/)
          .map(n => n.trim())
          .filter(Boolean)
      : [];

    if (editingTeamId) {
      // Edit existing team
      const existingTeam = teams.find(t => t.id === editingTeamId);
      const existingMembers = existingTeam?.memberDetails || [];

      // Preserve member IDs if names match, otherwise create new
      const updatedMembers: PlayerMember[] = names.map(name => {
        const found = existingMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
        if (found) return found;
        return {
          id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name,
        };
      });

      AllocationDatabase.updateTeam(editingTeamId, {
        name: finalName,
        teamCode: cleanTeamCode,
        badgeCode: cleanTeamCode,
        leaderName: cleanLeaderName,
        phone: cleanPhone,
        members: names,
        memberDetails: updatedMembers,
      });

      if (teamForm.assignedRoomId) {
        AllocationDatabase.allocateTeamToRoom(editingTeamId, teamForm.assignedRoomId);
      } else if (existingTeam?.assignedRoomId) {
        AllocationDatabase.allocateTeamToRoom(editingTeamId, null);
      }

      setTeams(AllocationDatabase.getTeams());
      notify(`Updated ${finalName}`);
    } else {
      // Add new team
      const created = AllocationDatabase.createTeam({
        name: finalName,
        teamCode: cleanTeamCode,
        badgeCode: cleanTeamCode,
        leaderName: cleanLeaderName,
        phone: cleanPhone,
        memberNames: names,
      });

      if (teamForm.assignedRoomId) {
        AllocationDatabase.allocateTeamToRoom(created.id, teamForm.assignedRoomId);
      }

      setTeams(AllocationDatabase.getTeams());
      notify(`Added ${created.name} (Code: ${created.teamCode || created.id})`);
    }

    setTeamModalOpen(false);
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (window.confirm(`Delete ${teamName}? This will permanently purge the squad and all its scores, logs, and progress.`)) {
      const updated = AllocationDatabase.deleteTeam(teamId);
      setTeams(updated);
      setActivityLogs(AllocationDatabase.getLogs());
      notify(`Deleted ${teamName} and all associated data.`);
    }
  };

  const handleClearAllGames = (teamId: string) => {
    if (window.confirm('Clear all recorded games and points for this team?')) {
      const updated = AllocationDatabase.clearTeamGames(teamId);
      setTeams(updated);
      const cleanTeam = updated.find(t => t.id === teamId || t.teamCode === teamId);
      if (cleanTeam) setSelectedTeamGames(cleanTeam);
      notify('All games cleared for team.');
    }
  };

  const handleRemoveGame = (teamId: string, gamePlayIdOrGameId: string) => {
    const updated = AllocationDatabase.removeGameFromTeam(teamId, gamePlayIdOrGameId);
    setTeams(updated);
    const cleanTeam = updated.find(t => t.id === teamId || t.teamCode === teamId);
    if (cleanTeam) setSelectedTeamGames(cleanTeam);
    notify('Game record removed.');
  };

  // -------------------------------------------------------------
  // PLAYER CRUD
  // -------------------------------------------------------------
  const openAddPerson = (teamId: string) => {
    setTargetTeamId(teamId);
    setPersonForm({ name: '', phone: '' });
    setPersonModalOpen(true);
  };

  const handleSavePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeamId || !personForm.name.trim()) return;

    const updated = AllocationDatabase.addPlayerToTeam(targetTeamId, personForm);
    setTeams(updated);
    notify(`Added ${personForm.name}`);
    setPersonModalOpen(false);
  };

  const handleRemovePerson = (teamId: string, memberId: string, memberName: string) => {
    if (window.confirm(`Remove ${memberName} from this team?`)) {
      const updated = AllocationDatabase.removePlayerFromTeam(teamId, memberId);
      setTeams(updated);
      notify(`Removed ${memberName}`);
    }
  };

  // -------------------------------------------------------------
  // ALLOCATION ACTIONS
  // -------------------------------------------------------------
  const handleAssignTeamToRoom = (teamId: string, roomId: string) => {
    const targetRoomId = roomId === 'unassigned' ? null : roomId;
    const updated = AllocationDatabase.allocateTeamToRoom(teamId, targetRoomId);
    setTeams(updated);
    const roomObj = rooms.find(r => r.id === targetRoomId);
    notify(targetRoomId ? `Assigned to ${roomObj?.name}` : `Unassigned`);
  };

  const handleAutoAllot = () => {
    if (rooms.length === 0) {
      notify('Please create at least 1 room first');
      return;
    }
    const updated = AllocationDatabase.autoAllotUnassignedTeams();
    setTeams(updated);
    notify('Auto-allotted unassigned teams across rooms');
  };

  const handleResetAll = () => {
    if (window.confirm('Clear all team room assignments? (Teams and players are preserved)')) {
      const updated = AllocationDatabase.resetAllAllocations();
      setTeams(updated);
      notify('All room assignments cleared');
    }
  };

  // -------------------------------------------------------------
  // USER / STAFF CRUD (MASTER ADMIN ONLY)
  // -------------------------------------------------------------
  const openAddUser = (defaultRole: AdminRole = 'admin') => {
    setEditingUser(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      role: defaultRole,
      password: '',
      pocRoom: '',
      title: defaultRole === 'admin' ? 'Sub-Admin' : 'Sector Moderator',
    });
    setUserModalOpen(true);
  };

  const openEditUser = (targetUser: AdminUser) => {
    if (isRootMasterAccount(targetUser) && !isAditya) {
      notify('⛔ ACCESS DENIED: Root Master account is hidden and protected. Only Aditya can view or modify this account.');
      return;
    }
    setEditingUser(targetUser);
    setUserForm({
      name: targetUser.name,
      username: targetUser.username,
      email: targetUser.email || '',
      role: targetUser.role,
      password: targetUser.password || '',
      pocRoom: targetUser.pocRoom || '',
      title: targetUser.title || '',
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.username.trim()) {
      notify('Name and Facilitator ID / Username are required.');
      return;
    }

    if (editingUser) {
      if (isRootMasterAccount(editingUser) && !isAditya) {
        notify('⛔ ACCESS DENIED: Only Aditya can modify the Root Master account.');
        return;
      }
      const updated = AllocationDatabase.updateStaffUser(
        editingUser.id,
        {
          name: userForm.name.trim(),
          username: isRootMasterAccount(editingUser) ? editingUser.username : userForm.username.trim(),
          facilitatorId: isRootMasterAccount(editingUser) ? editingUser.facilitatorId : userForm.username.trim(),
          email: userForm.email.trim(),
          role: isRootMasterAccount(editingUser) ? 'super_admin' : userForm.role,
          password: userForm.password ? userForm.password.trim() : editingUser.password,
          pocRoom: userForm.pocRoom.trim() || undefined,
          title: userForm.title.trim() || undefined,
        },
        user?.username
      );
      setStaffUsers(updated);
      notify(`User ${userForm.name} updated.`);
    } else {
      const cleanUsername = userForm.username.trim().toLowerCase();
      if (cleanUsername === 'nx-masteradmin' || userForm.name.trim().toLowerCase() === 'aditya goyal') {
        notify('⛔ Identifier reserved for Root Master administrator.');
        return;
      }
      if (staffUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
        notify('A user with this Facilitator ID already exists.');
        return;
      }
      AllocationDatabase.createStaffUser({
        name: userForm.name.trim(),
        username: userForm.username.trim(),
        facilitatorId: userForm.username.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        password: userForm.password.trim() || 'pass2026',
        pocRoom: userForm.pocRoom.trim() || undefined,
        title: userForm.title.trim() || (userForm.role === 'admin' ? 'Sub-Admin' : 'Sector Moderator'),
      });
      setStaffUsers(AllocationDatabase.getStaffUsers());
      notify(`New ${userForm.role === 'admin' ? 'Sub-Admin' : 'Moderator'} created successfully.`);
    }
    setUserModalOpen(false);
  };

  const handleQuickRoleChange = (userId: string, newRole: AdminRole) => {
    const target = staffUsers.find(u => u.id === userId);
    if (!target) return;
    if (isRootMasterAccount(target)) {
      notify('⛔ Root Master Admin clearance is permanent and cannot be altered.');
      return;
    }
    if (target.id === 'NX-SUPER-01' || target.role === 'super_admin') {
      notify('Master Admin clearance cannot be altered.');
      return;
    }
    const updated = AllocationDatabase.updateStaffUser(userId, { role: newRole }, user?.username);
    setStaffUsers(updated);
    notify(`${target.name} role changed to ${newRole === 'admin' ? 'Sub-Admin' : 'Moderator'}.`);
  };

  const handleDeleteUser = (userId: string) => {
    const target = staffUsers.find(u => u.id === userId);
    if (!target) return;
    if (isRootMasterAccount(target)) {
      notify('⛔ Root Master account is protected and cannot be deleted.');
      return;
    }
    if (target.id === 'NX-SUPER-01' || target.role === 'super_admin') {
      notify('Master Admin cannot be deleted.');
      return;
    }
    if (window.confirm(`Delete staff account for ${target.name} (${target.username})?`)) {
      const updated = AllocationDatabase.deleteStaffUser(userId);
      setStaffUsers(updated);
      notify(`Staff user ${target.name} deleted.`);
    }
  };

  // -------------------------------------------------------------
  // EXPORT CSV
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    const rows = [
      ['Game Name', 'Zone', 'POC In-Charge', 'POC Phone', 'Team ID', 'Team Name', 'Player Name', 'Player Phone'],
    ];

    teams.forEach(t => {
      const room = rooms.find(r => r.id === t.assignedRoomId);
      const members = t.memberDetails || [];

      if (members.length === 0) {
        rows.push([
          room?.name || 'Unassigned',
          room?.zone || '-',
          room?.pocName || 'None',
          room?.pocContact || '-',
          t.teamCode || t.id,
          t.name,
          '-',
          '-',
        ]);
      } else {
        members.forEach(m => {
          rows.push([
            room?.name || 'Unassigned',
            room?.zone || '-',
            room?.pocName || 'None',
            room?.pocContact || '-',
            t.teamCode || t.id,
            t.name,
            m.name,
            m.phone || '-',
          ]);
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NEXUS_Room_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify('Exported CSV roster');
  };

  // -------------------------------------------------------------
  // ROOT MASTER GUARDIAN & COMPUTED COUNTS
  // -------------------------------------------------------------
  const isAditya = useMemo(() => isCurrentAdityaUser(user), [user]);

  // Root Master account (Aditya Goyal) is completely hidden from all other admins & moderators
  const visibleStaffUsers = useMemo(() => {
    if (isAditya) {
      return staffUsers;
    }
    return staffUsers.filter(u => !isRootMasterAccount(u));
  }, [staffUsers, isAditya]);

  const masterAdminCount = useMemo(() => {
    return visibleStaffUsers.filter(u => u.role === 'super_admin').length;
  }, [visibleStaffUsers]);

  const subAdminCount = useMemo(() => {
    return visibleStaffUsers.filter(u => u.role === 'admin').length;
  }, [visibleStaffUsers]);

  const moderatorCount = useMemo(() => {
    return visibleStaffUsers.filter(u => u.role === 'moderator').length;
  }, [visibleStaffUsers]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return visibleStaffUsers;
    const q = userSearchQuery.toLowerCase();
    return visibleStaffUsers.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (u.pocRoom && u.pocRoom.toLowerCase().includes(q))
    );
  }, [visibleStaffUsers, userSearchQuery]);

  const impostorTeamsCount = useMemo(() => {
    return teams.filter(t => t.isImpostor).length;
  }, [teams]);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesFilter =
        logFilter === 'all' ||
        (logFilter === 'power' && log.type === 'power') ||
        (logFilter === 'impostor_assign' && log.type === 'impostor_assign') ||
        (logFilter === 'sabotage' && (log.type === 'sabotage' || log.type === 'emergency')) ||
        (logFilter === 'login' && log.type === 'login') ||
        (logFilter === 'system' && log.type === 'system');

      if (!matchesFilter) return false;

      if (!logSearchQuery.trim()) return true;
      const q = logSearchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        (log.teamName && log.teamName.toLowerCase().includes(q)) ||
        (log.teamId && log.teamId.toLowerCase().includes(q)) ||
        (log.roomName && log.roomName.toLowerCase().includes(q)) ||
        log.type.toLowerCase().includes(q)
      );
    });
  }, [activityLogs, logFilter, logSearchQuery]);

  const totalPlayersCount = useMemo(() => {
    return teams.reduce((acc, t) => acc + (t.memberDetails?.length || t.members?.length || 0), 0);
  }, [teams]);

  const unassignedTeams = useMemo(() => {
    return teams.filter(t => !t.assignedRoomId);
  }, [teams]);

  const assignedTeams = useMemo(() => {
    return teams.filter(t => t.assignedRoomId);
  }, [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        (t.teamCode && t.teamCode.toLowerCase().includes(q)) ||
        (t.badgeCode && t.badgeCode.toLowerCase().includes(q)) ||
        (t.leaderName && t.leaderName.toLowerCase().includes(q)) ||
        (t.phone && t.phone.toLowerCase().includes(q)) ||
        (t.memberDetails && t.memberDetails.some(m => m.name.toLowerCase().includes(q) || (m.phone && m.phone.includes(q))))
      );
    });
  }, [teams, searchQuery]);

  const targetedPowersCount = useMemo(() => {
    return powerLibrary.filter(p => p.targetRequired).length;
  }, [powerLibrary]);

  const roomWidePowersCount = useMemo(() => {
    return powerLibrary.filter(p => !p.targetRequired).length;
  }, [powerLibrary]);

  const filteredPowerLibrary = useMemo(() => {
    return powerLibrary.filter(p => {
      if (powerFilterScope === 'targeted' && !p.targetRequired) return false;
      if (powerFilterScope === 'room' && p.targetRequired) return false;
      if (!powerSearchQuery.trim()) return true;
      const q = powerSearchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [powerLibrary, powerFilterScope, powerSearchQuery]);

  const teamsByRoom = useMemo(() => {
    const map: Record<string, Team[]> = {};
    rooms.forEach(r => {
      map[r.id] = [];
    });
    teams.forEach(t => {
      if (t.assignedRoomId && map[t.assignedRoomId]) {
        map[t.assignedRoomId].push(t);
      }
    });
    return map;
  }, [rooms, teams]);

  const filteredRoomsForAllocation = useMemo(() => {
    return rooms.filter(room => {
      const roomTeams = teamsByRoom[room.id] || [];
      const hasImpostor = roomTeams.some(t => t.isImpostor);

      if (allocationFilter === 'infiltrated' && !hasImpostor) return false;
      if (allocationFilter === 'vacant' && (hasImpostor || roomTeams.length === 0)) return false;
      if (allocationFilter === 'empty' && roomTeams.length > 0) return false;

      if (!allocationSearchQuery.trim()) return true;
      const q = allocationSearchQuery.toLowerCase();
      const matchRoom = room.name.toLowerCase().includes(q) || (room.zone && room.zone.toLowerCase().includes(q)) || (room.pocName && room.pocName.toLowerCase().includes(q));
      const matchTeam = roomTeams.some(t => t.name.toLowerCase().includes(q) || (t.teamCode && t.teamCode.toLowerCase().includes(q)));
      return matchRoom || matchTeam;
    });
  }, [rooms, teamsByRoom, allocationFilter, allocationSearchQuery]);

  // =============================================================
  // 1. LOGIN SCREEN (CLEAN, MODERN BLACK & WHITE, NO DEMO LOGINS)
  // =============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4 text-black font-sans">
        <div className="w-full max-w-sm border border-neutral-300 rounded-xl p-8 bg-white shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <img
              src="/logo.jpeg"
              alt="NEXUS"
              className="w-16 h-16 object-contain mx-auto rounded-lg border border-neutral-200 p-1 mb-2"
            />
            <h1 className="text-xl font-bold tracking-tight">
              NEXUS AMONG US
            </h1>
            <p className="text-xs text-neutral-500 uppercase font-medium">
              Admin Allocation Portal
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            {loginError && (
              <div className="p-3 border border-neutral-300 bg-neutral-100 rounded-md text-xs font-medium text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-neutral-700 font-semibold text-xs">
                Facilitator ID / Username
              </label>
              <input
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="Enter username..."
                required
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm outline-none focus:border-black transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-neutral-700 font-semibold text-xs">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Enter password..."
                required
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm outline-none focus:border-black transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-black text-white hover:bg-neutral-800 rounded-md font-medium text-sm transition"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =============================================================
  // 2. MAIN ADMIN CONSOLE (CLEAN MODERN BLACK & WHITE)
  // =============================================================
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2.5 border border-black bg-black text-white text-xs font-medium rounded-md shadow-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Layout Wrapper with Responsive Sidebar */}
      <div className="flex min-h-screen">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-neutral-900 text-white flex flex-col transition-transform duration-200 ease-in-out border-r border-neutral-800 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-16 px-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpeg"
                alt="NEXUS"
                className="w-8 h-8 object-contain rounded-md border border-neutral-700 bg-black"
              />
              <div>
                <span className="font-bold text-sm block tracking-tight leading-none text-white">
                  NEXUS AMONG US
                </span>
                <span className="text-[10px] text-neutral-400 block font-normal tracking-wide mt-1">
                  Management Console
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Module Links */}
          <div className="px-4 pt-4 pb-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Navigation Modules
          </div>
          <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
            <button
              onClick={() => { setActiveTab('allocation'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'allocation'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span>1. Game Allocation</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'allocation' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                {rooms.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('teams'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'teams'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>2. Teams & Players</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'teams' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                {teams.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('rooms'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'rooms'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4" />
                <span>3. Game Management</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'rooms' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                {rooms.length}
              </span>
            </button>


            <button
              onClick={() => { setActiveTab('games'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'games'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
                <span>4. Minigames & Points</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'games' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                Leaderboard
              </span>
            </button>

            {user?.role === 'super_admin' && (
              <button
                onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'users'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>5. User Panel</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'users' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                  {staffUsers.length}
                </span>
              </button>
            )}

            <button
              onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'logs'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-4 h-4" />
                <span>{user?.role === 'super_admin' ? '6' : '5'}. Activity Logs</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === 'logs' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                {activityLogs.length}
              </span>
            </button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-neutral-800 space-y-2">
            <div className="px-3 py-2 bg-neutral-800/60 rounded-lg flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-semibold text-white block truncate">{user?.name}</span>
                <span className="text-[10px] text-neutral-400 capitalize block truncate">{user?.role?.replace('_', ' ')}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            </div>

            <button
              onClick={handleExportCSV}
              className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={logout}
              className="w-full py-2 px-3 border border-neutral-800 hover:border-red-800 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="border-b border-neutral-200 bg-white sticky top-0 z-30 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-neutral-700 hover:text-black rounded-lg hover:bg-neutral-100"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <span className="font-bold text-sm sm:text-base block tracking-tight uppercase">
                  {activeTab === 'allocation' && '1. Game Allocation'}
                  {activeTab === 'teams' && '2. Teams & Rosters'}
                  {activeTab === 'rooms' && '3. Game Management'}
                  {activeTab === 'games' && '4. Minigames & Points'}
                  {activeTab === 'users' && '5. Admin User Panel'}
                  {activeTab === 'logs' && '6. Audit & Activity Logs'}
                </span>
                <span className="text-xs text-neutral-500 hidden sm:block">
                  Nexus Control Deck • Live real-time allocation
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Sync database from Supabase"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 hover:border-black rounded-full font-medium text-[11px] transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-neutral-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
              </span>

              <button
                onClick={handleExportCSV}
                className="lg:hidden px-2.5 py-1.5 border border-neutral-300 hover:border-black rounded-md font-medium text-xs transition flex items-center gap-1.5"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={logout}
                className="lg:hidden px-2.5 py-1.5 border border-neutral-300 hover:border-black rounded-md font-medium text-xs transition"
              >
                Log Out
              </button>
            </div>
          </header>

          {/* Main Dashboard Panel */}
          <main className="p-4 sm:p-6 space-y-6 max-w-7xl w-full">
        {/* ========================================================= */}
        {/* TAB 1: ROOM ALLOCATION MATRIX (UPGRADED TACTICAL DESIGN)  */}
        {/* ========================================================= */}
        {activeTab === 'allocation' && (() => {
          const allocationPct = teams.length > 0 ? Math.round((assignedTeams.length / teams.length) * 100) : 0;
          const infiltratedCount = rooms.filter(r => (teamsByRoom[r.id] || []).some(t => t.isImpostor)).length;
          const needsImpostorCount = rooms.filter(r => {
            const rTeams = teamsByRoom[r.id] || [];
            return rTeams.length > 0 && !rTeams.some(t => t.isImpostor);
          }).length;
          const emptyCount = rooms.filter(r => (teamsByRoom[r.id] || []).length === 0).length;
          const totalPlayersInField = assignedTeams.reduce(
            (acc, t) => acc + (t.memberDetails?.length || t.members?.length || 0),
            0
          );

          return (
            <div className="space-y-6">
              {/* Top Tactical Telemetry & Command Strip */}
              <div className="p-4 sm:p-5 border border-neutral-300 rounded-xl bg-white shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200">


                  {/* Matrix Quick Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleAutoAllot}
                      className="px-3.5 py-2 bg-black text-white hover:bg-neutral-800 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Auto-Assign All Teams</span>
                    </button>



                    <button
                      onClick={handleRollAllRoomImpostors}
                      className="px-3.5 py-2 bg-neutral-900 text-white hover:bg-black rounded-lg font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 border border-neutral-700 cursor-pointer"
                      title="Automatically roll 1 random Impostor for each game that lacks one"
                    >
                      <Dices className="w-3.5 h-3.5 text-red-400" />
                      <span>Roll All Impostors</span>
                    </button>

                    <button
                      onClick={handleResetAll}
                      className="px-3 py-2 border border-neutral-300 hover:border-black rounded-lg font-medium text-xs transition text-neutral-700 hover:text-black active:scale-95 cursor-pointer"
                    >
                      Clear Allocation
                    </button>
                  </div>
                </div>

                {/* Telemetry KPI Strip */}

                {/* Filter and Search Bar */}
                <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={allocationSearchQuery}
                      onChange={e => setAllocationSearchQuery(e.target.value)}
                      placeholder="Search sector name, zone, POC, or team inside..."
                      className="w-full pl-8 pr-3 py-1.5 border border-neutral-300 rounded-lg text-xs outline-none focus:border-black bg-white"
                    />
                    {allocationSearchQuery && (
                      <button
                        onClick={() => setAllocationSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAllocationFilter('all')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        allocationFilter === 'all'
                          ? 'bg-black text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      All ({rooms.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocationFilter('infiltrated')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        allocationFilter === 'infiltrated'
                          ? 'bg-red-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      ⚡ Infiltrated ({infiltratedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocationFilter('vacant')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        allocationFilter === 'vacant'
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      ⚠️ Needs Impostor ({needsImpostorCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAllocationFilter('empty')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        allocationFilter === 'empty'
                          ? 'bg-neutral-800 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      Empty ({emptyCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Unassigned Teams Staging Area (Collapsible) */}
              <div className="border border-neutral-300 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsStagingOpen(!isStagingOpen)}
                  className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition flex items-center justify-between text-left text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-neutral-600" />
                    <span className="font-bold uppercase tracking-wider text-[11px] text-neutral-800">
                      Unassigned Teams
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      unassignedTeams.length > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {unassignedTeams.length} {unassignedTeams.length === 1 ? 'Team' : 'Teams'} Unassigned
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                    <span>{isStagingOpen ? 'Collapse' : 'Expand'}</span>
                    {isStagingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isStagingOpen && (
                  <div className="p-4 border-t border-neutral-200">
                    {unassignedTeams.length === 0 ? (
                      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong>All Teams Assigned!</strong> Every registered team is currently assigned to a room.
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                        {unassignedTeams.map(t => (
                          <div
                            key={t.id}
                            className="p-3 border border-neutral-200 hover:border-neutral-400 rounded-lg bg-neutral-50/70 hover:bg-white transition flex flex-col justify-between gap-2.5 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold truncate text-black" title={t.name}>{t.name}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-neutral-200 rounded font-semibold text-neutral-700 shrink-0">
                                  {t.teamCode || t.id}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-500 block mt-1">
                                👥 {t.memberDetails?.length || t.members?.length || 0} Players
                                {t.leaderName && ` • Leader: ${t.leaderName}`}
                              </span>
                            </div>

                            <select
                              onChange={e => {
                                if (e.target.value) {
                                  handleAssignTeamToRoom(t.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              defaultValue=""
                              className="w-full border border-neutral-300 rounded-md px-2 py-1.5 text-[11px] outline-none bg-white font-medium hover:border-black cursor-pointer transition"
                            >
                              <option value="" disabled>Assign to Room →</option>
                              {rooms.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.zone || 'Room'})
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Room List */}
              <div className="flex flex-col gap-4">
                {filteredRoomsForAllocation.map(room => {
                  const roomTeams = teamsByRoom[room.id] || [];
                  const totalPlayersInRoom = roomTeams.reduce(
                    (acc, t) => acc + (t.memberDetails?.length || t.members?.length || 0),
                    0
                  );
                  const currentImpostorInRoom = roomTeams.find(t => t.isImpostor);

                  return (
                    <div
                      key={room.id}
                      className={`border rounded-xl bg-white p-4 space-y-3.5 flex flex-col justify-between transition shadow-xs hover:shadow-md ${
                        currentImpostorInRoom
                          ? 'border-neutral-300 hover:border-black'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {/* Top Accent Strip */}
                      <div>
                        {/* Room Header */}
                        <div className="space-y-2 border-b border-neutral-100 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${currentImpostorInRoom ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                <span className="font-extrabold text-base tracking-tight text-black">
                                  {room.name}
                                </span>
                              </div>
                              <span className="inline-block mt-0.5 px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-mono font-medium text-neutral-600">
                                {room.zone || 'Main Deck'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-1 rounded bg-neutral-100 text-[10px] font-mono font-bold text-neutral-700">
                                {roomTeams.length} {roomTeams.length === 1 ? 'Team' : 'Teams'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedDetailRoom(room)}
                                title="Open Full Room Details & Settings"
                                className="px-2 py-1 border border-neutral-300 hover:border-black rounded bg-white text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <span>Inspect</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* POC Telemetry */}
                          <div className="flex items-center justify-between text-xs text-neutral-600 pt-0.5">
                            <div>
                              <span className="text-neutral-400 text-[11px]">POC: </span>
                              <strong className="text-black font-semibold">{room.pocName || 'Unassigned'}</strong>
                            </div>
                            {room.pocContact && (
                              <span className="text-neutral-500 font-mono text-[10px]">
                                {room.pocContact}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Teams in Game */}
                        <div className="space-y-2 mt-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                              Teams in Game ({roomTeams.length})
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              {totalPlayersInRoom} players
                            </span>
                          </div>

                          {roomTeams.length === 0 ? (
                            <div className="p-4 border border-dashed border-neutral-300 rounded-lg text-center text-xs text-neutral-400 bg-neutral-50/50">
                              No teams currently assigned.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {roomTeams.map(t => (
                                <div
                                  key={t.id}
                                  className={`p-2.5 border rounded-lg text-xs space-y-1.5 transition ${
                                    t.isImpostor
                                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                                      : 'border-neutral-200 bg-neutral-50 text-black hover:border-neutral-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-semibold">
                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                      <span className="truncate max-w-[150px]">{t.name}</span>
                                      <span className={`font-mono text-[10px] px-1 py-0.2 rounded font-bold ${t.isImpostor ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200 text-neutral-700'}`}>
                                        {t.teamCode || t.id}
                                      </span>
                                      {t.isImpostor ? (
                                        <span className="px-1.5 py-0.5 bg-red-600 text-white font-bold text-[9px] rounded uppercase tracking-wider flex items-center gap-0.5">
                                          <Skull className="w-2.5 h-2.5" />
                                          IMPOSTOR
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 border border-neutral-300 bg-white text-neutral-700 text-[9px] rounded uppercase font-medium">
                                          Crewmate
                                        </span>
                                      )}
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleToggleTeamImpostor(t.id, t.isImpostor)}
                                        className={`text-[10px] px-2 py-0.5 rounded border transition font-medium cursor-pointer ${
                                          t.isImpostor
                                            ? 'border-neutral-700 hover:border-neutral-500 text-neutral-300'
                                            : 'border-neutral-300 hover:border-black text-black bg-white'
                                        }`}
                                      >
                                        {t.isImpostor ? 'Make Crew' : 'Make Impostor'}
                                      </button>
                                      <button
                                        onClick={() => handleAssignTeamToRoom(t.id, 'unassigned')}
                                        title="Remove squad from this game"
                                        className={`text-[11px] px-1.5 py-0.5 hover:underline cursor-pointer ${
                                          t.isImpostor ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
                                        }`}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>

                                  <div className={`text-[11px] truncate ${t.isImpostor ? 'text-neutral-400' : 'text-neutral-500'}`} title={(t.memberDetails || []).map(m => m.name).join(', ')}>
                                    Players: {(t.memberDetails || []).map(m => m.name).join(', ') || 'No player records'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add Team Dropdown */}
                      <div className="border-t border-neutral-100 pt-3 mt-3">
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              handleAssignTeamToRoom(e.target.value, room.id);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="w-full border border-neutral-300 hover:border-black rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-medium cursor-pointer transition"
                        >
                          <option value="" disabled>
                            + Deploy Squad to {room.name}...
                          </option>
                          {unassignedTeams.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.memberDetails?.length || t.members?.length || 0} players)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRoomsForAllocation.length === 0 && (
                <div className="p-12 border border-dashed border-neutral-300 rounded-xl text-center space-y-2 bg-neutral-50/50">
                  <Building className="w-8 h-8 text-neutral-400 mx-auto" />
                  <div className="font-bold text-sm text-neutral-700">No matching rooms found</div>
                  <p className="text-xs text-neutral-500">
                    No rooms match your search query or filter criteria. Try resetting the filters above.
                  </p>
                  <button
                    onClick={() => { setAllocationSearchQuery(''); setAllocationFilter('all'); }}
                    className="mt-2 px-3 py-1.5 bg-black text-white rounded-md text-xs font-medium cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================= */}
        {/* TAB 2: TEAMS & PLAYERS */}
        {/* ========================================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
              <button
                onClick={openAddTeam}
                className="px-3.5 py-2 bg-black text-white hover:bg-neutral-800 rounded-md text-xs font-medium transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Team</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2 border border-neutral-300 rounded-lg bg-white flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-400 ml-1.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search team name or player name..."
                className="w-full text-xs outline-none"
              />
            </div>

            {/* Teams List */}
            <div className="space-y-3">
              {filteredTeams.map(team => {
                const room = rooms.find(r => r.id === team.assignedRoomId);
                const members = team.memberDetails || [];

                return (
                  <div
                    key={team.id}
                    className="border border-neutral-200 rounded-lg bg-white p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">
                          {team.name}
                        </span>
                        <span className="px-2 py-0.5 bg-black text-white rounded text-[11px] font-mono font-bold tracking-wider" title="Player Login Team ID">
                          ID: {team.teamCode || team.badgeCode || team.id}
                        </span>
                        {team.leaderName && (
                          <span className="px-2 py-0.5 border border-neutral-300 rounded text-[11px] font-medium bg-neutral-100 flex items-center gap-1 text-neutral-800" title="Team Leader">
                            <Crown className="w-3 h-3 text-neutral-600" />
                            <span>Leader: {team.leaderName}</span>
                          </span>
                        )}
                        {team.phone && (
                          <span className="px-2 py-0.5 border border-neutral-300 rounded text-[11px] font-mono font-medium bg-neutral-50 flex items-center gap-1 text-neutral-700" title="Leader Mobile (for Player Login)">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            <span>{team.phone}</span>
                          </span>
                        )}
                        {room ? (
                          <span className="px-2 py-0.5 border border-neutral-200 rounded text-[11px] font-medium bg-neutral-50">
                            {room.name} ({room.zone})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 border border-neutral-300 rounded text-[11px] font-medium text-neutral-500">
                            Unassigned
                          </span>
                        )}

                        <span className="px-2 py-0.5 border border-amber-300 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 flex items-center gap-1 shadow-xs" title="Total Score">
                          <Trophy className="w-3 h-3 text-amber-600" />
                          <span>{Math.max(team.score || 0, (team.gamesPlayed || []).reduce((acc, g) => acc + (g.pointsAwarded || 0), 0))} PTS</span>
                        </span>

                        <span className="px-2 py-0.5 border border-blue-200 rounded text-[11px] font-mono font-medium bg-blue-50 text-blue-700 flex items-center gap-1" title="Games Completed">
                          <Gamepad2 className="w-3 h-3 text-blue-600" />
                          <span>{team.gamesPlayed?.length || 0} Games</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <select
                          value={team.assignedRoomId || 'unassigned'}
                          onChange={e => handleAssignTeamToRoom(team.id, e.target.value)}
                          className="border border-neutral-300 rounded px-2 py-1 text-xs outline-none bg-white font-medium"
                        >
                          <option value="unassigned">No Room</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => setSelectedTeamGames(team)}
                          className="px-2.5 py-1 border border-neutral-300 hover:border-black rounded text-xs font-medium transition flex items-center gap-1 text-neutral-700 hover:text-black bg-white"
                          title="View Game History & Breakdown"
                        >
                          <Gamepad2 className="w-3 h-3 text-emerald-600" />
                          <span>Games ({team.gamesPlayed?.length || 0})</span>
                        </button>

                        <button
                          onClick={() => {
                            setAdjustPointsTeam(team);
                            setAdjustPointsDelta(10);
                            setAdjustPointsReason('Bonus Challenge Reward');
                          }}
                          className="px-2.5 py-1 border border-neutral-300 hover:border-black rounded text-xs font-medium transition flex items-center gap-1 text-neutral-700 hover:text-black bg-white"
                          title="Award or Deduct Score Points"
                        >
                          <span>± Pts</span>
                        </button>
                        <button
                          onClick={() => {
                            const current = team.sabotagesAvailable || 0;
                            const newVal = window.prompt(`Update Sabotages for ${team.name} (Current: ${current}):`, current.toString());
                            if (newVal !== null) {
                              const parsed = parseInt(newVal, 10);
                              if (!isNaN(parsed)) {
                                const tIndex = teams.findIndex(t => t.id === team.id);
                                if (tIndex > -1) {
                                  const newTeams = [...teams];
                                  newTeams[tIndex].sabotagesAvailable = parsed;
                                  AllocationDatabase.saveTeams(newTeams);
                                  setTeams(newTeams);
                                }
                              }
                            }
                          }}
                          className="px-2.5 py-1 border border-neutral-300 hover:border-black rounded text-xs font-medium transition flex items-center gap-1 text-neutral-700 hover:text-black bg-white"
                          title="Adjust Sabotages Available"
                        >
                          <span>± Sabotages</span>
                        </button>


                        <button
                          onClick={() => openEditTeam(team)}
                          className="px-2.5 py-1 border border-neutral-300 hover:border-black rounded text-xs font-medium transition flex items-center gap-1 text-neutral-700 hover:text-black bg-white"
                          title="Edit Team, Code, Leader & Mobile"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => openAddPerson(team.id)}
                          className="px-2.5 py-1 border border-neutral-300 hover:border-black rounded text-xs font-medium transition bg-white"
                        >
                          + Player
                        </button>

                        <button
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          className="p-1 border border-neutral-300 hover:border-black rounded text-neutral-600 hover:text-black transition bg-white"
                          title="Delete Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Players List */}
                    <div className="space-y-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase block">
                        Players ({members.length}):
                      </span>

                      {members.length === 0 ? (
                        <div className="text-neutral-400 italic text-xs">
                          No players in this team. Click "+ Player" above to add one.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {members.map(m => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-neutral-200 rounded-md bg-neutral-50 text-xs"
                            >
                              <span className="font-medium">{m.name}</span>
                              {m.phone && <span className="text-neutral-400 text-[10px]">({m.phone})</span>}
                              <button
                                onClick={() => handleRemovePerson(team.id, m.id, m.name)}
                                className="text-neutral-400 hover:text-black font-bold ml-0.5"
                                title="Remove player"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ROOMS & POCS */}
        {/* ========================================================= */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
              <button
                onClick={openAddRoom}
                className="px-3.5 py-2 bg-black text-white hover:bg-neutral-800 rounded-md text-xs font-medium transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Game</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className="border border-neutral-200 rounded-lg bg-white p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="font-bold text-base">{room.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 border border-neutral-200 rounded text-[11px] bg-neutral-50">
                        {room.zone}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDetailRoom(room)}
                        title="Open Full Room Details & Settings"
                        className="px-2 py-0.5 border border-neutral-300 hover:border-black rounded bg-white hover:bg-neutral-100 text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-neutral-700">
                    <div>
                      <span className="text-neutral-400 text-[11px] block">POC in Charge:</span>
                      <span className="font-semibold">{room.pocName || 'None assigned'}</span>
                    </div>
                    {room.pocContact && (
                      <div>
                        <span className="text-neutral-400 text-[11px] block">Phone:</span>
                        <span>{room.pocContact}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => openEditRoom(room)}
                      className="flex-1 py-1 border border-neutral-300 hover:border-black rounded font-medium text-xs transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                      className="px-3 py-1 border border-neutral-300 hover:border-black rounded font-medium text-xs transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: POWERS ARSENAL & POWERSET SYSTEM */}
        {/* ========================================================= */}
        {/* TAB: STATION GAME POINTS & LIVE LEADERBOARD */}
        {/* ========================================================= */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            {/* Game Points Configuration Card */}
            <div className="p-5 border border-neutral-200 rounded-lg bg-white space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                    Point Allocation Per Game
                  </h3>
                </div>
                <span className="text-xs text-neutral-400">Values update instantly across all player consoles</span>
              </div>

              <form onSubmit={handleSaveGamePoints} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">🎮 Wordle</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Word Decoder</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={pointsForm.wordle}
                        onChange={e => setPointsForm({ ...pointsForm, wordle: parseInt(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-black outline-none focus:border-black"
                      />
                      <span className="text-xs font-mono font-bold text-neutral-500">PTS</span>
                    </div>
                  </div>

                  <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">🎭 Emoji Decoder</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Movie Guess</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={pointsForm.emoji}
                        onChange={e => setPointsForm({ ...pointsForm, emoji: parseInt(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-black outline-none focus:border-black"
                      />
                      <span className="text-xs font-mono font-bold text-neutral-500">PTS</span>
                    </div>
                  </div>

                  <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">⌨️ Code Typer</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Speed Typing</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={pointsForm.monkeytype}
                        onChange={e => setPointsForm({ ...pointsForm, monkeytype: parseInt(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-black outline-none focus:border-black"
                      />
                      <span className="text-xs font-mono font-bold text-neutral-500">PTS</span>
                    </div>
                  </div>

                  <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">👻 Pacman</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Arcade Survival</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={pointsForm.pacman}
                        onChange={e => setPointsForm({ ...pointsForm, pacman: parseInt(e.target.value) || 0 })}
                        className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-black outline-none focus:border-black"
                      />
                      <span className="text-xs font-mono font-bold text-neutral-500">PTS</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded text-xs font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Station Game Points</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Leaderboard & Games Played Table */}
            <div className="p-5 border border-neutral-200 rounded-lg bg-white space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                    Live Scoreboard & Game Progression
                  </h3>
                </div>
                <span className="text-xs text-neutral-500 font-mono">
                  Ranked by Total Score • {teams.length} Teams Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Rank</th>
                      <th className="py-2.5 px-3 font-semibold">Team & ID</th>
                      <th className="py-2.5 px-3 font-semibold">Role</th>
                      <th className="py-2.5 px-3 font-semibold">Sector</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Score</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Games Completed</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {[...teams]
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((t, idx) => {
                        const rank = idx + 1;
                        const isImp = Boolean(t.isImpostor);
                        return (
                          <tr key={t.id} className="hover:bg-neutral-50/80 transition">
                            <td className="py-3 px-3 font-mono font-bold">
                              {rank === 1 && <span className="px-2 py-0.5 bg-amber-400 text-black rounded text-[11px] font-bold">🥇 #1</span>}
                              {rank === 2 && <span className="px-2 py-0.5 bg-neutral-300 text-black rounded text-[11px] font-bold">🥈 #2</span>}
                              {rank === 3 && <span className="px-2 py-0.5 bg-amber-700 text-white rounded text-[11px] font-bold">🥉 #3</span>}
                              {rank > 3 && <span className="text-neutral-500">#{rank}</span>}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold block text-black">{t.name}</span>
                              <span className="font-mono text-[10px] text-neutral-400">ID: {t.teamCode || t.id}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${isImp ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-neutral-100 text-neutral-700'}`}>
                                {isImp ? '⚡ Impostor' : '🛡️ Crewmate'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-neutral-600">
                              {t.assignedRoomName || t.assignedRoom || 'Unassigned'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-1 bg-amber-50 border border-amber-300 rounded font-mono font-bold text-amber-900 text-xs shadow-xs inline-block">
                                ⭐ {t.score || 0} PTS
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono">
                              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-800 text-[11px] font-medium inline-block">
                                🎮 {t.gamesPlayed?.length || 0} Finished
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedTeamGames(t)}
                                  className="px-2.5 py-1 border border-neutral-300 hover:border-black rounded text-xs font-medium transition bg-white text-neutral-700 hover:text-black"
                                  title="View Games Played History"
                                >
                                  Inspect Games
                                </button>
                                <button
                                  onClick={() => {
                                    setAdjustPointsTeam(t);
                                    setAdjustPointsDelta(10);
                                    setAdjustPointsReason('Bonus Challenge Reward');
                                  }}
                                  className="px-2.5 py-1 border border-neutral-300 hover:border-black rounded text-xs font-medium transition bg-white text-neutral-700 hover:text-black"
                                  title="Adjust Team Score"
                                >
                                  ± Points
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: USER & ROLE MANAGEMENT (MASTER ADMIN ONLY) */}
        {/* ========================================================= */}
        {activeTab === 'users' && user?.role === 'super_admin' && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => openAddUser('admin')}
                  className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-md font-medium text-xs transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ New Sub-Admin</span>
                </button>
                <button
                  onClick={() => openAddUser('moderator')}
                  className="px-3 py-1.5 border border-neutral-300 hover:border-black rounded-md font-medium text-xs transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ New Moderator</span>
                </button>
              </div>
            </div>

            {/* Role Summary Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 border border-black rounded-lg bg-black text-white">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-300 uppercase text-[10px] tracking-wider">Master Admins</span>
                  <Crown className="w-3.5 h-3.5 text-neutral-200" />
                </div>
                <div className="text-2xl font-bold mt-1">{masterAdminCount}</div>
                <span className="text-[11px] text-neutral-400 block mt-0.5">Full root clearance & staff authority</span>
              </div>

              <div className="p-3.5 border border-neutral-300 rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-500 uppercase text-[10px] tracking-wider">Sub-Admins</span>
                  <Shield className="w-3.5 h-3.5 text-black" />
                </div>
                <div className="text-2xl font-bold mt-1 text-black">{subAdminCount}</div>
                <span className="text-[11px] text-neutral-500 block mt-0.5">Manage teams, rooms & allocations</span>
              </div>

              <div className="p-3.5 border border-neutral-300 rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-500 uppercase text-[10px] tracking-wider">Moderators</span>
                  <Users className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                <div className="text-2xl font-bold mt-1 text-black">{moderatorCount}</div>
                <span className="text-[11px] text-neutral-500 block mt-0.5">Ground check-in & sector POCs</span>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                placeholder="Search staff by name, Facilitator ID, email, or role..."
                className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-xs outline-none focus:border-black"
              />
            </div>

            {/* User List / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUsers.map(staff => {
                const isRootMaster = isRootMasterAccount(staff);
                const isMaster = staff.role === 'super_admin';
                const isSubAdmin = staff.role === 'admin';

                return (
                  <div
                    key={staff.id}
                    className={`p-4 border rounded-lg bg-white space-y-3 text-xs flex flex-col justify-between transition ${
                      isRootMaster
                        ? 'border-black ring-1 ring-black bg-neutral-50/50 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm block">{staff.name}</span>
                            {isRootMaster && (
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono bg-black text-white rounded">
                                HIDDEN
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-neutral-500">
                            ID: {staff.username || staff.id}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                            isRootMaster
                              ? 'bg-black text-white font-bold'
                              : isMaster
                              ? 'bg-black text-white'
                              : isSubAdmin
                              ? 'bg-neutral-100 border border-neutral-400 text-black font-semibold'
                              : 'bg-neutral-50 border border-neutral-200 text-neutral-700'
                          }`}
                        >
                          {isRootMaster ? 'ROOT MASTER' : isMaster ? 'Master Admin' : isSubAdmin ? 'Sub-Admin' : 'Moderator'}
                        </span>
                      </div>

                      {isRootMaster && (
                        <div className="p-2 bg-neutral-900 text-white rounded text-[11px] space-y-0.5">
                          <div className="font-semibold flex items-center gap-1.5 text-xs text-white">
                            <Shield className="w-3.5 h-3.5 text-white" />
                            Hidden Root Master Account
                          </div>
                          <div className="text-neutral-300 text-[10px] leading-tight">
                            Completely invisible to other admins, moderators, and the website. Only you can view or edit this account.
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 text-neutral-600 text-xs">
                        {staff.email && (
                          <div className="truncate">
                            <span className="text-neutral-400 text-[11px]">Email: </span>
                            <span>{staff.email}</span>
                          </div>
                        )}
                        {staff.title && (
                          <div>
                            <span className="text-neutral-400 text-[11px]">Designation: </span>
                            <span>{staff.title}</span>
                          </div>
                        )}
                        {staff.pocRoom && (
                          <div>
                            <span className="text-neutral-400 text-[11px]">Assigned Sector: </span>
                            <span className="font-medium text-black">{staff.pocRoom}</span>
                          </div>
                        )}
                        <div className="font-mono text-[11px] text-neutral-500">
                          Passcode: <span className="text-neutral-800">{staff.password || '••••••••'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 space-y-2">
                      {/* Role Switcher (Promote/Demote) */}
                      {!isMaster ? (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-neutral-500">Change Role:</span>
                          <select
                            value={staff.role}
                            onChange={e => handleQuickRoleChange(staff.id, e.target.value as AdminRole)}
                            className="flex-1 border border-neutral-300 rounded px-1.5 py-0.5 bg-white text-xs outline-none focus:border-black font-medium"
                          >
                            <option value="admin">Sub-Admin</option>
                            <option value="moderator">Moderator</option>
                          </select>
                        </div>
                      ) : isRootMaster ? (
                        <div className="text-[11px] text-black font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-black" /> Root Master (Private & Protected)
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-400 italic">
                          Primary Master Admin account (Protected)
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditUser(staff)}
                          disabled={isRootMaster && !isAditya}
                          className={`flex-1 py-1 border rounded font-medium text-xs transition ${
                            isRootMaster && !isAditya
                              ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                              : 'border-neutral-300 hover:border-black'
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(staff.id)}
                          disabled={isMaster || isRootMaster}
                          className={`px-3 py-1 border rounded font-medium text-xs transition ${
                            isMaster || isRootMaster
                              ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                              : 'border-neutral-300 hover:border-black text-black'
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ACTIVITY & AUDIT LOGS */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-5">
            {/* Top Action Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 border border-neutral-300 hover:border-black rounded-md font-medium text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={handleExportLogsCSV}
                  className="px-3 py-1.5 border border-neutral-300 hover:border-black rounded-md font-medium text-xs transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 border border-neutral-300 hover:border-red-600 hover:text-red-600 rounded-md font-medium text-xs transition"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Log Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex border border-neutral-300 rounded-lg p-1 bg-neutral-100 gap-1 text-xs overflow-x-auto flex-1">
                {[
                  { key: 'all', label: `All (${activityLogs.length})` },
                  { key: 'power', label: '⚡ Impostor Powers' },
                  { key: 'impostor_assign', label: '🎯 Impostor Roles' },
                  { key: 'sabotage', label: '🚨 Sabotage & Alert' },
                  { key: 'login', label: '🔐 Logins' },
                  { key: 'system', label: '⚙️ System' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setLogFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${
                      logFilter === f.key
                        ? 'bg-black text-white shadow-sm'
                        : 'text-neutral-700 hover:text-black'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={e => setLogSearchQuery(e.target.value)}
                  placeholder="Filter logs by team, room, text..."
                  className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-xs outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Logs List Container */}
            <div className="border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-sm">
              <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs font-semibold text-neutral-700">
                <span>Event Stream ({filteredLogs.length} events)</span>
                <span className="text-neutral-400 text-[11px] font-normal">Auto-updates every 3s</span>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  No activity logs matching current filter.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-[600px] overflow-y-auto">
                  {filteredLogs.map(log => {
                    const isPower = log.type === 'power';
                    const isAssign = log.type === 'impostor_assign';
                    const isSabotage = log.type === 'sabotage' || log.type === 'emergency';
                    const isLogin = log.type === 'login';

                    return (
                      <div
                        key={log.id}
                        className={`p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-neutral-50/80 transition ${
                          isPower ? 'bg-neutral-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-2.5 flex-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap ${
                              isPower
                                ? 'bg-black text-white'
                                : isAssign
                                ? 'border border-black text-black'
                                : isSabotage
                                ? 'bg-neutral-800 text-white'
                                : isLogin
                                ? 'border border-neutral-400 text-neutral-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {isPower
                              ? '⚡ IMPOSTOR POWER'
                              : isAssign
                              ? '🎯 ROLE ASSIGN'
                              : isSabotage
                              ? '🚨 SABOTAGE'
                              : isLogin
                              ? '🔐 LOGIN'
                              : 'SYSTEM'}
                          </span>

                          <div className="space-y-0.5">
                            <div className="font-medium text-black">
                              {log.message}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                              {log.teamId && <span>Team: {log.teamId}</span>}
                              {log.roomName && <span>• Room: {log.roomName}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="font-mono text-[11px] text-neutral-400 whitespace-nowrap sm:text-right">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
          </main>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT ROOM */}
      {/* ========================================================= */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-300 rounded-xl p-5 shadow-lg space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <span className="font-bold text-sm">
                {editingRoom ? `Edit ${editingRoom.name}` : 'Add Room'}
              </span>
              <button onClick={() => setRoomModalOpen(false)} className="text-neutral-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Game Name</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="e.g. Room 1, Lab 102"
                  required
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Campus Zone</label>
                <input
                  type="text"
                  value={roomForm.zone}
                  onChange={e => setRoomForm({ ...roomForm, zone: e.target.value })}
                  placeholder="e.g. Zone A, Ground Floor"
                  required
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">POC Name</label>
                <input
                  type="text"
                  value={roomForm.pocName}
                  onChange={e => setRoomForm({ ...roomForm, pocName: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">POC Phone</label>
                <input
                  type="text"
                  value={roomForm.pocContact}
                  onChange={e => setRoomForm({ ...roomForm, pocContact: e.target.value })}
                  placeholder="+91 98111 22334"
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-md font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-md font-medium text-xs transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT TEAM */}
      {/* ========================================================= */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-neutral-300 rounded-xl p-5 shadow-2xl space-y-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs">
                  {editingTeamId ? '✎' : '+'}
                </div>
                <span className="font-bold text-sm text-neutral-900">
                  {editingTeamId ? 'Edit Team Details' : 'Add New Team'}
                </span>
              </div>
              <button
                onClick={() => setTeamModalOpen(false)}
                className="text-neutral-400 hover:text-black transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-xs flex items-center justify-between">
                    <span>Team Name</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                    placeholder={`Optional (defaults to Squad ${teamForm.teamCode || '...'})`}
                    className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-xs flex items-center justify-between">
                    <span>Team ID / Code</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Login ID</span>
                  </label>
                  <input
                    type="text"
                    value={teamForm.teamCode}
                    onChange={e => setTeamForm({ ...teamForm, teamCode: e.target.value.toUpperCase() })}
                    placeholder="Auto-assigned unique ID"
                    className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-xs flex items-center gap-1">
                    <Crown className="w-3 h-3 text-neutral-600" />
                    <span>Team Leader Name</span>
                    <span className="text-[10px] text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={teamForm.leaderName}
                    onChange={e => setTeamForm({ ...teamForm, leaderName: e.target.value })}
                    placeholder="e.g. Arjun Verma"
                    className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-neutral-600" />
                      <span>Leader Mobile <span className="text-red-500">*</span></span>
                    </span>
                    <span className="text-[10px] text-red-500 font-semibold">10 Digits Required</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={teamForm.phone}
                    onChange={e => setTeamForm({ ...teamForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit mobile number"
                    className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-semibold text-xs">
                  Assigned Sector / Room (Optional)
                </label>
                <select
                  value={teamForm.assignedRoomId}
                  onChange={e => setTeamForm({ ...teamForm, assignedRoomId: e.target.value })}
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none bg-white font-medium"
                >
                  <option value="">Leave Unassigned</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-semibold text-xs flex items-center justify-between">
                  <span>Player Roster</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Optional (not required)</span>
                </label>
                <textarea
                  value={teamForm.playerNames}
                  onChange={e => setTeamForm({ ...teamForm, playerNames: e.target.value })}
                  placeholder="Optional: Enter player names (one per line) or leave blank"
                  rows={3}
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setTeamModalOpen(false)}
                  className="px-3.5 py-1.5 border border-neutral-300 hover:border-black rounded-md font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-md font-medium text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingTeamId ? 'Save Changes' : 'Create Team'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD PLAYER */}
      {/* ========================================================= */}
      {personModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white border border-neutral-300 rounded-xl p-5 shadow-lg space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <span className="font-bold text-sm">Add Player</span>
              <button onClick={() => setPersonModalOpen(false)} className="text-neutral-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Player Name</label>
                <input
                  type="text"
                  value={personForm.name}
                  onChange={e => setPersonForm({ ...personForm, name: e.target.value })}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Phone (Optional)</label>
                <input
                  type="text"
                  value={personForm.phone}
                  onChange={e => setPersonForm({ ...personForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPersonModalOpen(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-md font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-md font-medium text-xs transition"
                >
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT STAFF USER (MASTER ADMIN) */}
      {/* ========================================================= */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-300 rounded-xl p-5 shadow-lg space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <span className="font-bold text-sm">
                {editingUser
                  ? isRootMasterAccount(editingUser)
                    ? 'Edit Root Master Profile (Aditya Goyal)'
                    : `Edit ${editingUser.name}`
                  : `Create ${userForm.role === 'admin' ? 'Sub-Admin' : 'Moderator'}`}
              </span>
              <button onClick={() => setUserModalOpen(false)} className="text-neutral-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingUser && isRootMasterAccount(editingUser) && (
              <div className="p-2.5 bg-neutral-900 text-white rounded-lg text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-white">
                  <Shield className="w-3.5 h-3.5 text-white" />
                  Root Master Account Protection
                </div>
                <div className="text-neutral-300 text-[11px] leading-tight">
                  This account is hidden from all other admins and the website. Only you can view or modify your master credentials.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Role</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value as AdminRole })}
                  disabled={editingUser?.role === 'super_admin' || (!!editingUser && isRootMasterAccount(editingUser))}
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none bg-white font-medium disabled:bg-neutral-100"
                >
                  <option value="admin">Sub-Admin (Full Operations Access)</option>
                  <option value="moderator">Moderator (Sector POC / Check-In)</option>
                  {editingUser?.role === 'super_admin' && (
                    <option value="super_admin">
                      {isRootMasterAccount(editingUser) ? 'Root Master Admin (Protected)' : 'Master Admin'}
                    </option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Full Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  required
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Facilitator ID / Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g. NX-ADMIN-03 or rohan.admin"
                  required
                  disabled={!!editingUser && isRootMasterAccount(editingUser)}
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black font-mono disabled:bg-neutral-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@nexus.org"
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Security Passcode (Login Password)</label>
                <input
                  type="text"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Enter login password e.g. pass2026"
                  required={!editingUser}
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Designation / Title (Optional)</label>
                <input
                  type="text"
                  value={userForm.title}
                  onChange={e => setUserForm({ ...userForm, title: e.target.value })}
                  placeholder="e.g. Operations Assistant, Sector POC"
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-medium text-xs">Assigned Sector / Room (Optional)</label>
                <select
                  value={userForm.pocRoom}
                  onChange={e => setUserForm({ ...userForm, pocRoom: e.target.value })}
                  className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs outline-none bg-white"
                >
                  <option value="">No Specific Room Assigned</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.name}>
                      {r.name} ({r.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-md font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-md font-medium text-xs transition"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Power Port Configuration Modal */}
      {powerModalOpen && editingPortTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-black border border-black rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-black" />
                  <span>Configure Power Port {editingPortIndex}</span>
                </h3>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Team: {editingPortTeam.name} ({editingPortTeam.teamCode || editingPortTeam.id})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPowerModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePowerPort} className="space-y-3.5 text-xs">
              {/* Preset selection from Library */}
              <div className="space-y-1">
                <label className="block text-neutral-700 font-semibold text-[11px]">
                  Choose Preset from Standard Powers:
                </label>
                <select
                  value={powerForm.selectedLibraryPower}
                  onChange={e => {
                    const library = AllocationDatabase.getPowerLibrary();
                    const libPower = library.find(p => p.id === e.target.value);
                    if (libPower) {
                      setPowerForm({
                        selectedLibraryPower: libPower.id,
                        name: libPower.name,
                        description: libPower.description,
                        cooldownSeconds: libPower.cooldownSeconds,
                        durationSeconds: libPower.durationSeconds || 20,
                        targetRequired: libPower.targetRequired,
                      });
                    } else {
                      setPowerForm(prev => ({ ...prev, selectedLibraryPower: '' }));
                    }
                  }}
                  className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs outline-none bg-white font-medium"
                >
                  <option value="">-- Custom Power --</option>
                  {AllocationDatabase.getPowerLibrary().map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.cooldownSeconds}s CD, {p.targetRequired ? 'Targeted' : 'Room'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-semibold text-[11px]">
                  Power Name *
                </label>
                <input
                  type="text"
                  required
                  value={powerForm.name}
                  onChange={e => setPowerForm({ ...powerForm, name: e.target.value })}
                  placeholder="e.g. Sabotage Lights, Terminal Freeze"
                  className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-700 font-semibold text-[11px]">
                  Description / Effect
                </label>
                <textarea
                  rows={2}
                  value={powerForm.description}
                  onChange={e => setPowerForm({ ...powerForm, description: e.target.value })}
                  placeholder="Describe power effect..."
                  className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-black resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-[11px]">
                    Cooldown (Seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    required
                    value={powerForm.cooldownSeconds}
                    onChange={e => setPowerForm({ ...powerForm, cooldownSeconds: parseInt(e.target.value) || 30 })}
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-black font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-[11px]">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    required
                    value={powerForm.durationSeconds}
                    onChange={e => setPowerForm({ ...powerForm, durationSeconds: parseInt(e.target.value) || 20 })}
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              <div className="p-2 border border-neutral-200 rounded-md bg-neutral-50 flex items-center justify-between">
                <div>
                  <span className="font-semibold block text-[11px]">Target Specific Crewmate Team</span>
                  <span className="text-[10px] text-neutral-500">
                    If checked, Impostors must select a crewmate team in their room.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={powerForm.targetRequired}
                  onChange={e => setPowerForm({ ...powerForm, targetRequired: e.target.checked })}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setPowerModalOpen(false)}
                  className="px-3 py-1.5 border border-neutral-300 hover:border-black rounded-md font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-md font-medium text-xs transition"
                >
                  Equip Port {editingPortIndex}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CREATE / EDIT LIBRARY POWER MODAL */}
      {/* ========================================================= */}
      {libraryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-black rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-black" />
                <span className="font-bold text-sm">
                  {editingLibraryPower ? 'Edit Power in Arsenal' : 'Create New Power in Arsenal'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLibraryModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLibraryPower} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-neutral-700 font-semibold text-[11px]">
                  Power Name *
                </label>
                <input
                  type="text"
                  required
                  value={libraryForm.name}
                  onChange={e => setLibraryForm({ ...libraryForm, name: e.target.value })}
                  placeholder="e.g. EMP Wave, Quantum Decoy"
                  className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-black font-medium"
                />
              </div>

              {!editingLibraryPower && (
                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-[11px]">
                    Identifier Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={libraryForm.id}
                    onChange={e => setLibraryForm({ ...libraryForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="e.g. emp-wave (auto-generated if empty)"
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs font-mono outline-none focus:border-black"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-neutral-700 font-semibold text-[11px]">
                  Description & Mechanics *
                </label>
                <textarea
                  required
                  rows={2}
                  value={libraryForm.description}
                  onChange={e => setLibraryForm({ ...libraryForm, description: e.target.value })}
                  placeholder="Describe in-game effect and duration rules..."
                  className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-black resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-[11px]">
                    Cooldown (Seconds) *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    required
                    value={libraryForm.cooldownSeconds}
                    onChange={e => setLibraryForm({ ...libraryForm, cooldownSeconds: Math.max(5, parseInt(e.target.value) || 30) })}
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs font-mono outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-neutral-700 font-semibold text-[11px]">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={libraryForm.durationSeconds}
                    onChange={e => setLibraryForm({ ...libraryForm, durationSeconds: Math.max(5, parseInt(e.target.value) || 20) })}
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs font-mono outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-neutral-700 font-semibold text-[11px]">
                  Target Scope:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2 border rounded-md cursor-pointer flex items-center gap-2 transition ${
                    libraryForm.targetRequired ? 'border-black bg-neutral-100 font-bold' : 'border-neutral-200'
                  }`}>
                    <input
                      type="radio"
                      name="libTargetScope"
                      checked={libraryForm.targetRequired}
                      onChange={() => setLibraryForm({ ...libraryForm, targetRequired: true })}
                      className="accent-black"
                    />
                    <span>Target Team</span>
                  </label>

                  <label className={`p-2 border rounded-md cursor-pointer flex items-center gap-2 transition ${
                    !libraryForm.targetRequired ? 'border-black bg-neutral-100 font-bold' : 'border-neutral-200'
                  }`}>
                    <input
                      type="radio"
                      name="libTargetScope"
                      checked={!libraryForm.targetRequired}
                      onChange={() => setLibraryForm({ ...libraryForm, targetRequired: false })}
                      className="accent-black"
                    />
                    <span>Entire Room</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setLibraryModalOpen(false)}
                  className="px-3 py-1.5 border border-neutral-300 hover:border-black rounded-md font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-md font-medium text-xs transition shadow-sm"
                >
                  {editingLibraryPower ? 'Save Changes' : 'Create Power'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FULL ROOM SETTINGS & DETAILS INSPECTION POPUP MODAL */}
      {/* ========================================================= */}
      {selectedDetailRoom && (() => {
        const room = selectedDetailRoom;
        const roomTeams = teams.filter(t => t.assignedRoomId === room.id);
        const totalPlayersInRoom = roomTeams.reduce(
          (acc, t) => acc + (t.memberDetails?.length || t.members?.length || 0),
          0
        );
        const currentImpostorInRoom = roomTeams.find(t => t.isImpostor);
        const roomCapacity = room.capacity || 20;
        const occupancyPercent = Math.min(100, Math.round((totalPlayersInRoom / roomCapacity) * 100));

        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-black rounded-lg max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold tracking-tight">{room.name}</h2>
                    <span className="px-2 py-0.5 border border-neutral-300 rounded text-xs font-mono font-semibold bg-neutral-100">
                      {room.zone}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-0.5 block">
                    Room ID: {room.id}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDetailRoom(null)}
                  className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-black transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Occupancy and POC Information Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 border border-neutral-200 rounded-lg bg-neutral-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700">Room Occupancy:</span>
                    <span className="font-mono font-bold text-black">
                      {totalPlayersInRoom} / {roomCapacity} Players ({occupancyPercent}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        occupancyPercent >= 100 ? 'bg-black' : 'bg-neutral-800'
                      }`}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {roomTeams.length} active teams deployed in this sector.
                  </div>
                </div>

                <div className="p-3.5 border border-neutral-200 rounded-lg bg-neutral-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700">Point of Contact (POC):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDetailRoom(null);
                        openEditRoom(room);
                      }}
                      className="text-[11px] font-medium text-black hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit POC</span>
                    </button>
                  </div>
                  <div className="text-sm font-bold text-black">{room.pocName || 'No Coordinator Assigned'}</div>
                  {room.pocContact && (
                    <div className="text-[11px] text-neutral-600 font-mono">
                      Phone: {room.pocContact}
                    </div>
                  )}
                  {room.pocEmail && (
                    <div className="text-[11px] text-neutral-600">
                      Email: {room.pocEmail}
                    </div>
                  )}
                  {room.notes && (
                    <div className="text-[11px] text-neutral-500 italic mt-1">
                      Note: {room.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Teams & Player Roster */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Teams in this Game ({roomTeams.length}):
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {totalPlayersInRoom} individual players
                  </span>
                </div>

                {roomTeams.length === 0 ? (
                  <div className="p-6 border border-dashed border-neutral-300 rounded-lg text-center text-neutral-500 text-xs">
                    No teams currently assigned to this game.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {roomTeams.map(team => {
                      const members = team.memberDetails || [];
                      return (
                        <div
                          key={team.id}
                          className={`p-3.5 border rounded-lg bg-white space-y-2 text-xs transition ${
                            team.isImpostor ? 'border-black shadow-sm' : 'border-neutral-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{team.name}</span>
                                <span className="px-2 py-0.5 bg-black text-white rounded text-[10px] font-mono font-bold">
                                  {team.teamCode || team.id}
                                </span>
                                {team.isImpostor ? (
                                  <span className="px-2 py-0.5 bg-black text-white rounded text-[10px] font-bold flex items-center gap-1">
                                    <Skull className="w-3 h-3" />
                                    <span>IMPOSTOR</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 border border-neutral-200 rounded text-[10px] text-neutral-600 font-medium">
                                    Crewmate
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-500 mt-0.5">
                                Leader: <strong className="text-black">{team.leaderName || 'None'}</strong> {team.phone && `• ${team.phone}`}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleTeamImpostor(team.id, team.isImpostor)}
                                className="px-2 py-1 border border-neutral-300 hover:border-black rounded text-[10px] font-medium transition"
                              >
                                {team.isImpostor ? 'Make Crew' : 'Make Impostor'}
                              </button>
                              <select
                                value={team.assignedRoomId || ''}
                                onChange={e => handleAssignTeamToRoom(team.id, e.target.value)}
                                className="border border-neutral-300 rounded px-2 py-1 text-[11px] outline-none bg-white font-medium"
                              >
                                <option value="unassigned">Unassign</option>
                                {rooms.map(r => (
                                  <option key={r.id} value={r.id}>
                                    Move to {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Player Members Roster */}
                          <div className="pt-2 border-t border-neutral-100">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                              Squad Members ({members.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {members.map((m, idx) => (
                                <span
                                  key={m.id || idx}
                                  className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[11px] text-neutral-800 font-medium"
                                >
                                  {m.name} {m.phone && <span className="text-neutral-500 font-mono text-[10px]">({m.phone})</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer Quick Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetailRoom(null);
                    openEditRoom(room);
                  }}
                  className="px-3 py-1.5 border border-neutral-300 hover:border-black rounded font-medium text-xs transition"
                >
                  Edit Room Settings
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDetailRoom(null)}
                  className="px-4 py-1.5 bg-black text-white hover:bg-neutral-800 rounded font-medium text-xs transition shadow-sm"
                >
                  Done / Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Inspect Team Games Played Modal */}
      {selectedTeamGames && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-black flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-600" />
                  <span>{selectedTeamGames.name}</span>
                </h3>
                <span className="text-xs text-neutral-500 font-mono">
                  ID: {selectedTeamGames.teamCode || selectedTeamGames.id} • Score: {Math.max(selectedTeamGames.score || 0, (selectedTeamGames.gamesPlayed || []).reduce((acc, g) => acc + (g.pointsAwarded || 0), 0))} PTS
                </span>
              </div>
              <button
                onClick={() => setSelectedTeamGames(null)}
                className="text-neutral-400 hover:text-black font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {!selectedTeamGames.gamesPlayed || selectedTeamGames.gamesPlayed.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 italic bg-neutral-50 rounded border border-dashed border-neutral-200">
                  No mini-games completed yet by this team.
                </div>
              ) : (
                selectedTeamGames.gamesPlayed.map((g, idx) => (
                  <div
                    key={g.id || idx}
                    className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold block text-black">{g.gameTitle || g.gameId}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(g.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Raw Score: {g.score ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded font-mono font-bold text-xs">
                        +{g.pointsAwarded} PTS
                      </span>
                      <button
                        onClick={() => handleRemoveGame(selectedTeamGames.id, g.id || g.gameId)}
                        className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition"
                        title="Remove Game Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
              <span className="text-xs font-mono font-bold text-neutral-700">
                Total Games Completed: {selectedTeamGames.gamesPlayed?.length || 0}
              </span>
              <div className="flex items-center gap-2">
                {selectedTeamGames.gamesPlayed && selectedTeamGames.gamesPlayed.length > 0 && (
                  <button
                    onClick={() => handleClearAllGames(selectedTeamGames.id)}
                    className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedTeamGames(null)}
                  className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white rounded text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {adjustPointsTeam && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-black flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Adjust Points</span>
                </h3>
                <span className="text-xs text-neutral-500">
                  {adjustPointsTeam.name} (Current: {adjustPointsTeam.score || 0} PTS)
                </span>
              </div>
              <button
                onClick={() => setAdjustPointsTeam(null)}
                className="text-neutral-400 hover:text-black font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyPointsAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Points Delta (+ or -):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={adjustPointsDelta}
                    onChange={e => setAdjustPointsDelta(parseInt(e.target.value) || 0)}
                    className="w-full border border-neutral-300 rounded px-3 py-1.5 font-mono text-sm font-bold outline-none focus:border-black"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustPointsDelta(10)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded font-mono text-[11px]"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustPointsDelta(25)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded font-mono text-[11px]"
                    >
                      +25
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustPointsDelta(-10)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded font-mono text-[11px]"
                    >
                      -10
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Reason / Note:</label>
                <input
                  type="text"
                  value={adjustPointsReason}
                  onChange={e => setAdjustPointsReason(e.target.value)}
                  placeholder="e.g. Completed physical room task"
                  className="w-full border border-neutral-300 rounded px-3 py-1.5 text-xs outline-none focus:border-black"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustPointsTeam(null)}
                  className="px-3 py-1.5 border border-neutral-300 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white rounded text-xs font-bold transition"
                >
                  Apply {adjustPointsDelta >= 0 ? `+${adjustPointsDelta}` : adjustPointsDelta} PTS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
