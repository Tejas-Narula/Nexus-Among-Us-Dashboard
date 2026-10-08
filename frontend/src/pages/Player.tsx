import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AllocationDatabase } from '../lib/gameDatabase';
import { supabase } from '../lib/supabase';
import { IMPOSTOR_POWERS } from '../games/imposter/Imposter';
import './Player.css';

const STAR_PARTICLES = Array.from({ length: 48 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 61 + 7) % 100}%`,
  size: `${1 + (index % 3)}px`,
  delay: `${(index % 9) * -0.7}s`,
  duration: `${3 + (index % 5) * 0.8}s`,
}));

const CREWMATE_DRIFTERS = [
  { top: '18%', delay: '-6s', duration: '42s', color: 'red' },
  { top: '37%', delay: '-23s', duration: '52s', color: 'blue' },
  { top: '69%', delay: '-14s', duration: '47s', color: 'yellow' },
];

const SABOTAGE_MAP_MARKERS = [
  { power: IMPOSTOR_POWERS[0], label: 'W', top: '60%', left: '65%' },
  { power: IMPOSTOR_POWERS[1], label: 'E', top: '85%', left: '60%' },
  { power: IMPOSTOR_POWERS[2], label: 'M', top: '50%', left: '10%' },
  { power: IMPOSTOR_POWERS[3], label: 'C', top: '40%', left: '65%' },
  { power: IMPOSTOR_POWERS[4], label: 'P', top: '15%', left: '50%' },
];

function GameCardIcon({ gameId }: { gameId: string }) {
  const sharedProps = {
    className: 'player-game-svg-icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.7,
    viewBox: '0 0 24 24',
    'aria-hidden': true as const,
  };

  switch (gameId) {
    case 'wordle':
      return (
        <svg {...sharedProps}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
          <path d="M15.5 17h3M17 15.5v3" />
        </svg>
      );
    case 'emoji':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 10h.01M15 10h.01M8.8 14.2c.8 1.6 1.9 2.3 3.2 2.3s2.4-.7 3.2-2.3" />
        </svg>
      );
    case 'memedecoder':
      return (
        <svg {...sharedProps}>
          <rect x="3.5" y="4" width="17" height="16" rx="2" />
          <circle cx="9" cy="9" r="1.5" />
          <path d="m5 18 5-5 3 3 2-2 4 4M14.5 8h3" />
        </svg>
      );
    case 'monkeytype':
      return (
        <svg {...sharedProps}>
          <rect x="2.5" y="5" width="19" height="14" rx="2" />
          <path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 12h1m3 0h1m3 0h1m3 0h1M8 15h8" />
        </svg>
      );
    case 'pacman':
      return (
        <svg {...sharedProps}>
          <path d="M20.4 8.8A8.5 8.5 0 1 0 20.5 15H12V6.5a8.5 8.5 0 0 1 8.4 2.3Z" />
          <circle cx="16.1" cy="10.1" r=".7" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v4l2.5 2.5" />
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

  // Step 1: Immediate Synchronous Render from localStorage (0ms delay)
  const [session, setSession] = useState<PlayerSession | null>(() => {
    try {
      const raw = localStorage.getItem('nexus_player_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [statusText, setStatusText] = useState('LIVE • CONNECTED');
  const [teamScore, setTeamScore] = useState(0);
  const [completedGames, setCompletedGames] = useState<string[]>([]);
  const [isSabotageAlertActive, setIsSabotageAlertActive] = useState(false);
  const [sabotageAlertSequence, setSabotageAlertSequence] = useState(0);
  const [isSabotageMapOpen, setIsSabotageMapOpen] = useState(false);
  const sabotageAlertTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ensure body background is pitch black (#000000)
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    const originalOverflow = document.body.style.overflow;

    document.body.style.backgroundColor = '#030712';
    document.body.style.color = '#ffffff';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => () => {
    if (sabotageAlertTimeout.current) {
      clearTimeout(sabotageAlertTimeout.current);
    }
  }, []);

  // Redirect if not signed in
  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  // Refresh the current team's score and completed games.
  const refreshGameContext = () => {
    if (!session) return;
    const allTeams = AllocationDatabase.getTeams();
    const myTeamId = session.teamId?.toUpperCase();

    const myTeam = allTeams.find(
      t => t.teamCode?.toUpperCase() === myTeamId || t.id?.toUpperCase() === myTeamId
    );

    if (myTeam) {
      setTeamScore(myTeam.score || 0);
      setCompletedGames((myTeam.gamesPlayed || []).map(g => g.gameId));
    }
  };

  useEffect(() => {
    refreshGameContext();
    const interval = setInterval(refreshGameContext, 2500);
    return () => clearInterval(interval);
  }, [session]);

  // Background sync with API or Supabase
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

        // Option 1: Backend API
        try {
          const res = await fetch(`${API_BASE}/teams/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: creds.teamId,
              phone: creds.phone,
              playerName: creds.playerName,
            }),
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
        } catch {
          // Backend offline - silent fallback
        }

        // Option 2: Direct Supabase Cloud
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
                assignedRoom: teamRecord.assigned_room || teamRecord.assigned_room_name || creds.assignedRoom || 'Room 1 (Command Hub)',
                eventStatus: teamRecord.status || creds.eventStatus || 'active',
              };
              setSession(updatedSession);
              localStorage.setItem('nexus_player_session', JSON.stringify(updatedSession));
              setStatusText('LIVE • CONNECTED');
              updated = true;
            }
          } catch (sbEx) {
            console.warn('Supabase session background check:', sbEx);
          }
        }
      } catch (err) {
        console.warn('Failed background session check:', err);
      } finally {
        isRefreshing = false;
      }
    }

    syncSession();
    const interval = setInterval(syncSession, 5000);
    return () => clearInterval(interval);
  }, []);

  const isImpostor = session?.isImpostor === true;
  const roomName = session?.assignedRoom || 'Room 1 (Command Hub)';

  const triggerSabotageAlert = () => {
    if (!isImpostor) return;
    setIsSabotageAlertActive(true);
    setSabotageAlertSequence(sequence => sequence + 1);

    if (sabotageAlertTimeout.current) {
      clearTimeout(sabotageAlertTimeout.current);
    }

    sabotageAlertTimeout.current = setTimeout(() => {
      setIsSabotageAlertActive(false);
      sabotageAlertTimeout.current = null;
    }, 3000);
  };

  const handleSabotageClick = () => {
    if (!isImpostor) return;
    setIsSabotageMapOpen(true);
    triggerSabotageAlert();
  };

  const handleMapSabotage = (powerName: string) => {
    if (!isImpostor || !session) return;

    const result = AllocationDatabase.triggerPower(session.teamId, powerName);
    if (!result.success) {
      setStatusText(result.message);
      return;
    }

    triggerSabotageAlert();
  };

  // The 5 available games
  const gamesList = AllocationDatabase.getCrewmateGames();

  // Helper to mark a game as completed temporarily from the UI
  // Real implementation would have the games call markGameCompleted when done.
  const handleGameCompleteClick = (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    if (session && !completedGames.includes(gameId)) {
      AllocationDatabase.markGameCompleted(session.teamId, gameId, 5);
      refreshGameContext();
    }
  };

  return (
    <div className={`player-container player-space-dashboard${isImpostor && isSabotageAlertActive ? ' sabotage-alert' : ''}`}>
      <div className="player-space-background" aria-hidden="true">
        <div className="player-map-image" />
        {isSabotageAlertActive && (
          <span key={sabotageAlertSequence} className="player-sabotage-flash" />
        )}
        {STAR_PARTICLES.map((star, index) => (
          <span
            key={index}
            className="player-star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
        <div className="player-reactor-glow" />
        {CREWMATE_DRIFTERS.map((crewmate, index) => (
          <span
            key={index}
            className={`player-crewmate-drifter player-crewmate-${crewmate.color}`}
            style={{
              top: crewmate.top,
              animationDelay: crewmate.delay,
              animationDuration: crewmate.duration,
            }}
          >
            <span className="player-crewmate-visor" />
          </span>
        ))}
      </div>
      <div className="player-dashboard-content">
      <header className="player-dashboard-header">
        <img className="player-nexus-logo" src="/nexus-logo.png" alt="Nexus Logo" />
        <div className="player-heading-copy">
          <h1>Mini Games</h1>
          <p>Choose a mission to begin</p>
        </div>
        <div className="player-score" aria-label={`Team score: ${teamScore}`}>
          <span>Team score</span>
          <strong>{teamScore.toLocaleString()}</strong>
        </div>
      </header>

      <main className="player-games-grid" aria-label="Mini-games">
        {gamesList.map((game, index) => {
          const isCompleted = completedGames.includes(game.id);

          return (
            <button
              key={game.id}
              onClick={() => navigate(game.route)}
              className={`player-game-card player-game-card-${index + 1}${isCompleted ? ' completed' : ''}`}
              type="button"
              aria-label={`Open ${game.title}`}
            >
              <div className="player-game-icon">
                <GameCardIcon gameId={game.id} />
              </div>
              <div className="player-game-title">
                {game.title} {isCompleted && '✓'}
              </div>
              <div className="player-game-description">
                {game.description}
              </div>
            </button>
          );
        })}
      </main>

      <footer className="player-dashboard-footer">
        <div className={`player-role-status${isImpostor ? ' impostor' : ' crewmate'}`}>
          <span className="player-role-indicator" />
          <span>{isImpostor ? 'Impostor' : 'Crewmate'}</span>
          <span className="player-footer-divider">/</span>
          <span>{roomName}</span>
        </div>
        <div className="player-footer-actions">
          {isImpostor ? (
            <>
              <span className="player-live-status">{statusText}</span>
              <button
                className="player-sabotage-button"
                type="button"
                onClick={handleSabotageClick}
                aria-label="Open sabotage map and trigger dashboard alert"
              >
                Sabotage
                <svg className="player-sabotage-arrow" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M3 10h13m-5-5 5 5-5 5" />
                </svg>
              </button>
            </>
          ) : (
            <span className="player-crew-task-status">CREW TASKS ACTIVE</span>
          )}
        </div>
      </footer>

      {isImpostor && isSabotageMapOpen && (
        <div
          className="player-sabotage-map-backdrop"
          onClick={() => setIsSabotageMapOpen(false)}
        >
          <section
            className="player-sabotage-map-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Sabotage map"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="player-sabotage-map-close"
              type="button"
              onClick={() => setIsSabotageMapOpen(false)}
              aria-label="Close sabotage map"
            >
              ×
            </button>
            <div className="imposter-map-container">
              {SABOTAGE_MAP_MARKERS.map(marker => (
                <button
                  key={marker.power.name}
                  className="sabotage-btn"
                  style={{ top: marker.top, left: marker.left }}
                  type="button"
                  onClick={() => handleMapSabotage(marker.power.name)}
                  aria-label={marker.power.title}
                  title={marker.power.title}
                >
                  {marker.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      </div>
    </div>
  );
}
