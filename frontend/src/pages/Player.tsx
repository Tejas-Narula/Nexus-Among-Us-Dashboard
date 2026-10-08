import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AllocationDatabase } from '../lib/gameDatabase';
import { supabase } from '../lib/supabase';
import { Team } from '../types';
import { IMPOSTOR_POWERS } from '../games/imposter/Imposter';
import './Player.css';

const SABOTAGE_MAP_MARKERS = [
  { power: IMPOSTOR_POWERS[0], label: 'WORDLE', top: '55%', left: '60%' },
  { power: IMPOSTOR_POWERS[1], label: 'EMOJI', top: '75%', left: '70%' },
  { power: IMPOSTOR_POWERS[2], label: 'MEME DECODER', top: '45%', left: '20%' },
  { power: IMPOSTOR_POWERS[3], label: 'MONKEYTYPE', top: '35%', left: '65%' },
  { power: IMPOSTOR_POWERS[4], label: 'PACMAN', top: '20%', left: '50%' },
];

function GameCardIcon({ gameId }: { gameId: string }) {
  const sharedProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    'aria-hidden': true as const,
    style: { width: '28px', height: '28px' }
  };

  switch (gameId) {
    case 'wordle':
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h7v7h-7z" fill="currentColor" stroke="none" opacity="0.5" />
        </svg>
      );
    case 'emoji':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 10h.01M15 10h.01M8 14c1.5 2 4.5 2 6 0" />
        </svg>
      );
    case 'memedecoder':
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m4 19 5-5 3 3 2-2 6 6" />
        </svg>
      );
    case 'monkeytype':
      return (
        <svg {...sharedProps}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 15h8" strokeWidth={3} />
        </svg>
      );
    case 'pacman':
      return (
        <svg {...sharedProps}>
          <path d="M21.2 9.4A9 9 0 1 0 21.2 14.6L12 12Z" fill="currentColor" opacity="0.3" />
          <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="20" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l3 3" />
        </svg>
      );
  }
}

interface PlayerSession {
  teamId: string;
  phone?: string;
  playerName?: string;
  teamName?: string;
  isImpostor?: boolean;
  assignedRoom?: string;
  eventStatus?: string;
  currentRound?: string | number;
}

export default function Player() {
  const navigate = useNavigate();

  const [session, setSession] = useState<PlayerSession | null>(() => {
    try {
      const raw = localStorage.getItem('nexus_player_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [statusText, setStatusText] = useState('LIVE • CONNECTED');
  const [completedGames, setCompletedGames] = useState<string[]>([]);
  
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [selectedGameMarker, setSelectedGameMarker] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [sabotagedMarkers, setSabotagedMarkers] = useState<string[]>([]);
  const [sabotagesAvailable, setSabotagesAvailable] = useState(0);
  const [frozenGames, setFrozenGames] = useState<Record<string, number>>({});
  const [activeSabotageAlert, setActiveSabotageAlert] = useState<{ powerName: string; description: string; remaining: number } | null>(null);
  const [sabotageToast, setSabotageToast] = useState<string | null>(null);
  
  const [roomTeams, setRoomTeams] = useState<Team[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const cards = containerRef.current.querySelectorAll('.mission-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const refreshGameContext = () => {
    if (!session) return;
    const allTeams = AllocationDatabase.getTeams();
    const myTeamId = session.teamId?.toUpperCase();

    const myTeam = allTeams.find(
      t => t.teamCode?.toUpperCase() === myTeamId || t.id?.toUpperCase() === myTeamId
    );

    const now = Date.now();
    const activeFrozen = { ...AllocationDatabase.getFrozenGames() };

    if (myTeam) {
      setCompletedGames((myTeam.gamesPlayed || []).map(g => g.gameId));
      setSabotagesAvailable(myTeam.sabotagesAvailable ?? (myTeam.isImpostor ? 3 : 0));

      const validEffects = (myTeam.activeEffects || []).filter(e => e.expiresAt > now);
      if (validEffects.length > 0) {
        const primary = validEffects[0];
        const remaining = Math.max(1, Math.ceil((primary.expiresAt - now) / 1000));
        setActiveSabotageAlert({
          powerName: primary.powerName,
          description: primary.description || 'Station affected by Impostor sabotage.',
          remaining,
        });

        validEffects.forEach(eff => {
          const lower = eff.powerName.toLowerCase();
          ['wordle', 'emoji', 'memedecoder', 'monkeytype', 'pacman'].forEach(gId => {
            const shortKey = gId.replace('decoder', '');
            if (lower.includes(gId) || lower.includes(shortKey)) {
              activeFrozen[gId] = Math.max(activeFrozen[gId] || 0, eff.expiresAt);
            }
          });
        });
      } else {
        setActiveSabotageAlert(null);
      }
    }

    const assignedRoom = session.assignedRoom || 'Room 1';
    const teamsInRoom = allTeams.filter(t => (t.assignedRoomName || t.assignedRoom || 'Room 1') === assignedRoom);
    setRoomTeams(teamsInRoom);
    
    setFrozenGames(activeFrozen);
  };

  useEffect(() => {
    refreshGameContext();
    const interval = setInterval(refreshGameContext, 2000);
    // Background polling from Supabase to sync across crewmate and impostor devices
    const syncInterval = setInterval(() => {
      AllocationDatabase.syncAllFromSupabase().catch(() => {});
    }, 3500);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;

    let isRefreshing = false;
    const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

    async function syncSession() {
      if (isRefreshing) return;
      isRefreshing = true;

      try {
        const currentRaw = localStorage.getItem('nexus_player_session');
        if (!currentRaw) return;
        const creds = JSON.parse(currentRaw);
        let updated = false;

        try {
          const res = await fetch(`${API_BASE}/teams/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: creds.teamId, phone: creds.phone, playerName: creds.playerName }),
          });
          const result = await res.json().catch(() => null);
          if (res.ok && result?.success && result?.data) {
            const d = result.data;
            const updatedSession: PlayerSession = {
              teamId: d.team?.teamCode || creds.teamId,
              phone: d.player?.phone || creds.phone,
              playerName: d.player?.name || creds.playerName,
              teamName: d.team?.name || creds.teamName,
              isImpostor: Boolean(d.team?.isImpostor),
              assignedRoom: d.team?.assignedRoom || creds.assignedRoom,
              eventStatus: d.eventSession?.status || creds.eventStatus || 'active',
              currentRound: d.eventSession?.currentRound ?? creds.currentRound ?? 1,
            };
            setSession(updatedSession);
            localStorage.setItem('nexus_player_session', JSON.stringify(updatedSession));
            setStatusText(`EVENT ${(d.eventSession?.status || 'ACTIVE').toUpperCase()}`);
            updated = true;
          }
        } catch { /* empty */ }

        if (!updated && supabase) {
          try {
            const { data: teamRecord } = await supabase
              .from('teams')
              .select('*')
              .or(`team_code.ilike.${creds.teamId},badge_code.ilike.${creds.teamId}`)
              .limit(1)
              .single();

            if (teamRecord) {
              const updatedSession: PlayerSession = {
                ...creds,
                teamName: teamRecord.name,
                isImpostor: Boolean(teamRecord.is_impostor),
                assignedRoom: teamRecord.assigned_room || teamRecord.assigned_room_name || creds.assignedRoom || 'Room 1',
                eventStatus: teamRecord.status || creds.eventStatus || 'active',
              };
              setSession(updatedSession);
              localStorage.setItem('nexus_player_session', JSON.stringify(updatedSession));
              setStatusText('SYSTEM ONLINE');
            }
          } catch (sbEx) { /* empty */ }
        }
      } finally {
        isRefreshing = false;
      }
    }

    syncSession();
    const interval = setInterval(syncSession, 5000);
    return () => clearInterval(interval);
  }, []);

  const isImpostor = session?.isImpostor === true;
  const roomName = session?.assignedRoom || 'Sector Alpha';
  const currentRound = session?.currentRound ?? 1;

  const togglePanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen);
    if (isRightPanelOpen) setSelectedGameMarker(null);
  };

  const targetCrewmates = roomTeams.filter(t => !t.isImpostor && (t.teamCode !== session?.teamId && t.id !== session?.teamId));

  const handleMapSabotage = (powerName: string, actionType: string) => {
    if (!isImpostor || !session) return;
    const result = AllocationDatabase.triggerPower(
      session.teamId,
      `${powerName}_${actionType}`,
      selectedTargetId || undefined
    );
    if (!result.success) {
      alert(`SABOTAGE FAILED: ${result.message}`);
      return;
    }
    
    setSabotageToast(result.message);
    setTimeout(() => setSabotageToast(null), 5000);

    // Refresh context immediately to update sabotages count
    refreshGameContext();

    setSabotagedMarkers(prev => {
      if (!prev.includes(powerName)) return [...prev, powerName];
      return prev;
    });
  };

  const gamesList = AllocationDatabase.getCrewmateGames();
  const padIndex = (idx: number) => (idx + 1).toString().padStart(2, '0');

  const getMissionClass = (id: string) => {
    if (id === 'wordle') return 'mission-wordle';
    if (id === 'emoji') return 'mission-emoji';
    if (id === 'memedecoder') return 'mission-meme';
    if (id === 'monkeytype') return 'mission-type';
    if (id === 'pacman') return 'mission-pacman';
    return 'mission-type';
  };

  return (
    <div className="player-container" ref={containerRef}>
      
      {/* Immersive Background */}
      <div className="player-environment" aria-hidden="true"></div>
      <div className="environment-overlay" aria-hidden="true"></div>
      <div className="hud-scanlines" aria-hidden="true"></div>

      <div className="player-viewport">
        
        {/* HUD Top */}
        <header className="hud-top">
          <div className="hud-brand">
            <img src="/nexus-logo.png" alt="Nexus Logo" className="brand-logo" />
            <div className={`brand-role ${isImpostor ? 'imposter' : ''}`}>
              {isImpostor ? 'IMPOSTER' : 'CREWMATE'}
            </div>
          </div>
          <div className="hud-task-progress">
            <span className="progress-label">TASKS_SECURED</span>
            <span className="progress-value">{completedGames.length} / {gamesList.length}</span>
          </div>
        </header>

        {/* Active Sabotage Alert Ribbon (Visible to affected crewmates) */}
        {activeSabotageAlert && (
          <div className="active-sabotage-alert-banner">
            <span className="pulse-alert-dot"></span>
            <span className="alert-text">
              🚨 WARNING: {activeSabotageAlert.powerName.toUpperCase()} — {activeSabotageAlert.description} ({activeSabotageAlert.remaining}s REMAINING)
            </span>
          </div>
        )}

        {/* Tasks Arena */}
        <main className="task-arena">
          {gamesList.map((game, index) => {
            const isCompleted = completedGames.includes(game.id);
            const freezeUntil = frozenGames[game.id] || 0;
            const isFrozen = freezeUntil > Date.now();
            const freezeSecs = isFrozen ? Math.ceil((freezeUntil - Date.now()) / 1000) : 0;
            const missionClass = getMissionClass(game.id);
            
            return (
              <div 
                key={game.id} 
                className={`mission-card ${missionClass} ${isCompleted ? 'completed' : ''} ${isFrozen ? 'frozen' : ''}`}
                onClick={() => {
                  if (!isCompleted && !isFrozen) navigate(game.route);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="mission-header">
                  <span className="mission-id">TSK-{padIndex(index)}</span>
                  <div className="mission-icon">
                    <GameCardIcon gameId={game.id} />
                  </div>
                </div>
                
                <div className="mission-body">
                  <h3 className="mission-title">{game.title}</h3>
                  <p className="mission-desc">{game.description}</p>
                </div>
                
                <div className="mission-status">
                  {isFrozen ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      FROZEN BY IMPOSTOR ({freezeSecs}s)
                    </>
                  ) : isCompleted ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      COMPLETED
                    </>
                  ) : (
                    <>
                      INITIATE MISSION
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        {/* HUD Bottom */}
        <footer className="hud-bottom">
          <div className="status-indicator">
            <div className={`dot ${statusText.includes('LIVE') || statusText.includes('ONLINE') ? 'live' : ''}`}></div>
            <span className="status-text">{statusText}</span>
          </div>
          <div className="location-info">
            <h4 className="round-text">ROUND {String(currentRound).padStart(2, '0')}</h4>
            <span className="room-text">{roomName}</span>
          </div>
        </footer>

      </div>

      {/* Right Side Tactical Toggle */}
      <button 
        className={`tactical-toggle ${isRightPanelOpen ? 'open' : ''}`}
        onClick={() => togglePanel()}
        aria-label="Toggle Tactical Panel"
      >
        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2.5" width="24" height="24">
          {isRightPanelOpen ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
        </svg>
      </button>

      {/* Panel Overlay (Mobile/Focus) */}
      <div 
        className={`panel-overlay ${isRightPanelOpen ? 'open' : ''}`} 
        onClick={() => setIsRightPanelOpen(false)}
      ></div>

      {/* Right Tactical Panel */}
      <aside className={`tactical-panel ${isRightPanelOpen ? 'open' : ''}`}>
        
        {!isImpostor ? (
          <div className="access-denied">
            <svg className="denied-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round"/>
              <path d="M12 8v4" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
            </svg>
            <h2 className="denied-title">RESTRICTED</h2>
            <p className="denied-text">TACTICAL MAP UNAVAILABLE</p>
            <p className="denied-sub">Access requires Level 4 clearance. Focus on completing assigned tasks to secure the ship.</p>
          </div>
        ) : (
          <div className="tactical-map-view">
            <div className="tactical-header">
              <h2>SHIP SURVEILLANCE</h2>
              <p>SELECT SECTOR NODE TO INITIATE SABOTAGE</p>
              <div className="sabotage-count">
                SABOTAGES: <span className={sabotagesAvailable > 0 ? 'available' : 'empty'}>{sabotagesAvailable}</span>
              </div>
            </div>

            {/* Target Crewmate Squad Selector */}
            <div className="target-selection-box">
              <div className="target-selection-header">
                <span>🎯 SELECT TARGET CREWMATE SQUAD:</span>
                <span className="target-count">{targetCrewmates.length} IN SECTOR</span>
              </div>
              <div className="target-chips-container">
                <button
                  type="button"
                  className={`target-chip ${selectedTargetId === null ? 'active' : ''}`}
                  onClick={() => setSelectedTargetId(null)}
                >
                  ⚡ ALL SQUADS IN SECTOR
                </button>
                {targetCrewmates.map(t => {
                  const tCode = t.teamCode || t.id;
                  const isSelected = selectedTargetId === tCode || selectedTargetId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`target-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedTargetId(tCode)}
                    >
                      <span>{t.name}</span>
                      <span className="chip-code">[{tCode}]</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="map-viewport">
              <div className="map-bg"></div>
              <div className="map-scanline"></div>
              
              {SABOTAGE_MAP_MARKERS.map((marker) => {
                const isSelected = selectedGameMarker === marker.power.name;
                const isSabotaged = sabotagedMarkers.includes(marker.power.name);
                return (
                  <button
                    key={marker.power.name}
                    className={`node-marker ${isSelected ? 'active' : ''} ${isSabotaged ? 'sabotaged' : ''}`}
                    style={{ top: marker.top, left: marker.left }}
                    onClick={() => setSelectedGameMarker(marker.power.name)}
                  >
                    {marker.label}
                  </button>
                );
              })}
            </div>

            {selectedGameMarker && (
              <div className="target-info">
                {(() => {
                  const markerData = SABOTAGE_MAP_MARKERS.find(m => m.power.name === selectedGameMarker);
                  const isSabotaged = sabotagedMarkers.includes(selectedGameMarker);
                  const currentTargetObj = targetCrewmates.find(t => (t.teamCode || t.id) === selectedTargetId);
                  const targetLabel = currentTargetObj ? `${currentTargetObj.name} [${currentTargetObj.teamCode || currentTargetObj.id}]` : 'ALL SQUADS IN SECTOR';

                  return (
                    <>
                      <div className="target-head">
                        <div>
                          <h3>{markerData?.power.title.toUpperCase()}</h3>
                          <div className="targeted-label">TARGET: <span>{targetLabel}</span></div>
                        </div>
                        <button className="close-target" onClick={() => setSelectedGameMarker(null)}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>

                      <div className="sabotage-actions-grid">
                        <button 
                          className={`sabotage-btn freeze ${isSabotaged ? 'disabled' : ''}`}
                          onClick={() => handleMapSabotage(selectedGameMarker, 'FREEZE')}
                          disabled={isSabotaged || sabotagesAvailable <= 0}
                          title="Freeze terminal station"
                        >
                          FREEZE (60s)
                        </button>
                        <button 
                          className={`sabotage-btn steal ${isSabotaged ? 'disabled' : ''}`}
                          onClick={() => handleMapSabotage(selectedGameMarker, 'STEAL')}
                          disabled={isSabotaged || sabotagesAvailable <= 0}
                          title="Steal points"
                        >
                          STEAL
                        </button>
                        <button 
                          className={`sabotage-btn reset ${isSabotaged ? 'disabled' : ''}`}
                          onClick={() => handleMapSabotage(selectedGameMarker, 'RESET')}
                          disabled={isSabotaged || sabotagesAvailable <= 0}
                          title="Reset station progress"
                        >
                          RESET
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {sabotageToast && (
              <div className="sabotage-toast-banner">
                {sabotageToast}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
