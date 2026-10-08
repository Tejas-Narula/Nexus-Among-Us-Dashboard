import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StartScreen from './components/StartScreen';
import GameScreen from './screens/GameScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import { GameStatus } from './types';
import { AllocationDatabase } from '../../lib/gameDatabase';

interface AppProps {
  initialTeamName?: string;
}

const App: React.FC<AppProps> = ({ initialTeamName = '' }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<GameStatus>('START');
  const [teamName, setTeamName] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [awardNotice, setAwardNotice] = useState('');

  // Auto-start if team name is provided from context or localStorage session
  useEffect(() => {
    let name = initialTeamName;
    if (!name) {
      try {
        const raw = localStorage.getItem('nexus_player_session');
        if (raw) {
          const s = JSON.parse(raw);
          name = s.teamName || s.teamId || '';
        }
      } catch {}
    }
    if (name) {
      setTeamName(name);
    }
  }, [initialTeamName]);

  const handleStartGame = (name: string) => {
    setTeamName(name);
    setStatus('PLAYING');
  };

  const recordScore = (score: number, isWin: boolean) => {
    try {
      const sessionRaw = localStorage.getItem('nexus_player_session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session?.teamId && (score > 100 || isWin)) {
          const res = AllocationDatabase.recordGameCompletion(
            session.teamId,
            'pacman',
            'Pacman Sector Defense'
          );
          if (res.success) {
            setAwardNotice(`✅ MISSION ACCOMPLISHED! Sector cleared for Team ${session.teamName || session.teamId}. Logged to central control.`);
            setTimeout(() => navigate('/player'), 3000);
          }
        }
      }
    } catch (e) {
      console.warn('Pacman score recording notice:', e);
    }
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setStatus('GAME_OVER');
    recordScore(score, false);
  };
  
  const handleGameWin = (score: number) => {
    setFinalScore(score);
    setStatus('VICTORY');
    recordScore(score, true);
  };

  const handleRestart = () => {
    setStatus('START');
    setFinalScore(0);
    setAwardNotice('');
  };

  const [isStationFrozen, setIsStationFrozen] = useState(false);
  const [freezeRemaining, setFreezeRemaining] = useState(0);

  useEffect(() => {
    const checkFreeze = () => {
      const frozen = AllocationDatabase.getFrozenGames();
      const freezeTime = frozen['pacman'] || 0;
      if (freezeTime > Date.now()) {
        setIsStationFrozen(true);
        setFreezeRemaining(Math.ceil((freezeTime - Date.now()) / 1000));
      } else {
        setIsStationFrozen(false);
      }
    };
    checkFreeze();
    const interval = setInterval(checkFreeze, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative pt-16">
      {/* Unified Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/player')} style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #4ade80', borderRadius: '4px', cursor: 'pointer', zIndex: 100 }}>← Back to Mission Deck</button>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4ade80', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '4px', zIndex: 100, letterSpacing: '1px' }}>TERMINAL: PACMAN DEFENSE</div>
      </header>

      {isStationFrozen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-cyan-400 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-pulse">
            <div className="text-5xl mb-4">❄️</div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">STATION FROZEN BY IMPOSTOR</h2>
            <p className="text-gray-300 text-sm mb-4">Grid navigation matrix disrupted. Rebooting in {freezeRemaining}s...</p>
            <button
              onClick={() => navigate('/player')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Return to Mission Deck
            </button>
          </div>
        </div>
      )}
      
      {awardNotice && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 px-3 py-1 rounded text-xs font-mono font-bold animate-pulse absolute top-16 z-50 text-center">
          {awardNotice}
        </div>
      )}

      <div className="w-full max-w-3xl">
        {status === 'START' && (
          <StartScreen onStart={handleStartGame} />
        )}

        {status === 'PLAYING' && (
          <GameScreen 
            teamName={teamName} 
            onGameOver={handleGameOver} 
            onGameWin={handleGameWin}
          />
        )}

        {(status === 'GAME_OVER' || status === 'VICTORY' || status === 'LEADERBOARD') && (
          <div>
            {awardNotice && (
              <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 p-3 rounded text-center text-sm font-bold mb-4 animate-pulse">
                {awardNotice}
              </div>
            )}
            <LeaderboardScreen 
              currentScore={finalScore} 
              teamName={teamName}
              onRestart={handleRestart}
              isGameOver={status === 'GAME_OVER' || status === 'VICTORY'}
              isVictory={status === 'VICTORY'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;