import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AllocationDatabase } from '../lib/gameDatabase';
import MapCharacter from '../components/MapCharacter';

interface PlayerMapProps {
  teamId: string;
  playerName: string;
  completedGames: string[];
}

interface PlayerState {
  teamId: string;
  name: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  lastSeen: number;
}

const GAMES = [
  { id: 'wordle', title: 'Wordle (Admin)', route: '/games/wordle', x: 65, y: 60 },
  { id: 'emoji', title: 'Emoji (Coms)', route: '/games/emoji', x: 60, y: 85 },
  { id: 'monkeytype', title: 'Code Typer (O2)', route: '/games/monkeytype', x: 65, y: 40 },
  { id: 'pacman', title: 'Pacman (Cafeteria)', route: '/games/pacman', x: 50, y: 15 },
];

const INTERACTION_DISTANCE = 5; // percentage distance

export default function PlayerMap({ teamId, playerName, completedGames }: PlayerMapProps) {
  const navigate = useNavigate();
  const [otherPlayers, setOtherPlayers] = useState<Record<string, PlayerState>>({});
  
  // Local state
  const [localX, setLocalX] = useState(50);
  const [localY, setLocalY] = useState(50);
  const [nearbyGame, setNearbyGame] = useState<typeof GAMES[0] | null>(null);

  const localXRef = useRef(50);
  const localYRef = useRef(50);
  const channelRef = useRef<any>(null);
  const lastBroadcastRef = useRef(0);
  const requestRef = useRef<number>();

  // Input state
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!supabase) return;

    // Initialize Supabase Channel for Broadcast
    const channel = supabase.channel('nexus_map', {
      config: {
        broadcast: { self: false, ack: false },
      },
    });

    channel
      .on('broadcast', { event: 'movement' }, (payload) => {
        const data = payload.payload as PlayerState;
        if (data.teamId !== teamId) {
          setOtherPlayers(prev => ({
            ...prev,
            [data.teamId]: { ...data, lastSeen: Date.now() }
          }));
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [teamId]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop
  const updateLoop = useCallback(() => {
    const speed = 0.5; // percentage per frame
    let dx = 0;
    let dy = 0;

    if (keys.current['w'] || keys.current['arrowup']) dy -= speed;
    if (keys.current['s'] || keys.current['arrowdown']) dy += speed;
    if (keys.current['a'] || keys.current['arrowleft']) dx -= speed;
    if (keys.current['d'] || keys.current['arrowright']) dx += speed;

    if (dx !== 0 || dy !== 0) {
      let nx = Math.max(0, Math.min(100, localXRef.current + dx));
      let ny = Math.max(0, Math.min(100, localYRef.current + dy));
      
      localXRef.current = nx;
      localYRef.current = ny;
      setLocalX(nx);
      setLocalY(ny);

      // Check proximity to games
      let closestGame = null;
      let minDistance = INTERACTION_DISTANCE;
      
      for (const game of GAMES) {
        const dist = Math.sqrt(Math.pow(game.x - nx, 2) + Math.pow(game.y - ny, 2));
        if (dist < minDistance) {
          closestGame = game;
          minDistance = dist;
        }
      }
      setNearbyGame(closestGame);

      // Broadcast throttled to 50ms
      const now = Date.now();
      if (now - lastBroadcastRef.current > 50 && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'movement',
          payload: { teamId, name: playerName, x: nx, y: ny },
        });
        lastBroadcastRef.current = now;
      }
    } else {
      // Heartbeat broadcast every 2 seconds even if not moving
      const now = Date.now();
      if (now - lastBroadcastRef.current > 2000 && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'movement',
          payload: { teamId, name: playerName, x: localXRef.current, y: localYRef.current },
        });
        lastBroadcastRef.current = now;
      }
    }

    // Cleanup stale players (> 5 seconds)
    setOtherPlayers(prev => {
      const now = Date.now();
      let changed = false;
      const next = { ...prev };
      for (const id in next) {
        if (now - next[id].lastSeen > 5000) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    requestRef.current = requestAnimationFrame(updateLoop);
  }, [teamId, playerName]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updateLoop]);

  // Handle interact key (E or Enter)
  useEffect(() => {
    const handleInteract = (e: KeyboardEvent) => {
      if ((e.key.toLowerCase() === 'e' || e.key === 'Enter') && nearbyGame) {
        navigate(nearbyGame.route);
      }
    };
    window.addEventListener('keydown', handleInteract);
    return () => window.removeEventListener('keydown', handleInteract);
  }, [nearbyGame, navigate]);

  return (
    <div 
      style={{
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#1a1a1a',
        position: 'relative',
        border: '2px solid #3f3f46',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundImage: 'url(/skeld.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Interaction Prompt Overlay */}
      {nearbyGame && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid #4ade80',
          fontFamily: "'JetBrains Mono', monospace",
          zIndex: 2000,
          textAlign: 'center'
        }}>
          <div>Press <strong style={{ color: '#4ade80' }}>E</strong> to play</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{nearbyGame.title}</div>
          {completedGames.includes(nearbyGame.id) && (
            <div style={{ fontSize: '12px', color: '#a1a1aa' }}>(Completed)</div>
          )}
        </div>
      )}

      {/* Render Games as Zones/Markers */}
      {GAMES.map(game => (
        <div 
          key={game.id}
          style={{
            position: 'absolute',
            left: `${game.x}%`,
            top: `${game.y}%`,
            width: '40px',
            height: '40px',
            transform: 'translate(-50%, -50%)',
            background: completedGames.includes(game.id) ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: `2px dashed ${completedGames.includes(game.id) ? '#4ade80' : '#a1a1aa'}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: completedGames.includes(game.id) ? '#4ade80' : '#a1a1aa',
            fontSize: '10px',
            fontFamily: 'monospace'
          }}
          title={game.title}
        >
          {game.title.charAt(0)}
        </div>
      ))}

      {/* Render local player */}
      <MapCharacter
        x={localX}
        y={localY}
        name={playerName}
        teamId={teamId}
        isLocal={true}
      />

      {/* Render other players */}
      {Object.values(otherPlayers).map(p => (
        <MapCharacter
          key={p.teamId}
          x={p.x}
          y={p.y}
          name={p.name}
          teamId={p.teamId}
        />
      ))}
    </div>
  );
}
