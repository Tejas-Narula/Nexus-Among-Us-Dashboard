import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AllocationDatabase } from './lib/gameDatabase';
import { AdminAuthProvider } from './context/AdminAuthContext';

const AmongUsAdmin = lazy(() => import('./pages/AmongUsAdmin'));
const Login = lazy(() => import('./pages/Login'));
const Player = lazy(() => import('./pages/Player'));
const Wordle = lazy(() => import('./games/Wordle'));
const Emoji = lazy(() => import('./games/Emoji/Emoji'));
const MemeDecoder = lazy(() => import('./games/MemeDecoder/App'));
const MonkeyType = lazy(() => import('./games/MonkeyType/App'));
const Pacman = lazy(() => import('./games/Pacman/App'));

function GlobalFreezeListener() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const interval = setInterval(() => {
      const frozen = AllocationDatabase.getFrozenGames();
      const now = Date.now();
      const path = location.pathname;
      let gameId = '';
      if (path.includes('wordle')) gameId = 'wordle';
      else if (path.includes('emoji')) gameId = 'emoji';
      else if (path.includes('memedecoder')) gameId = 'memedecoder';
      else if (path.includes('monkeytype')) gameId = 'monkeytype';
      else if (path.includes('pacman')) gameId = 'pacman';

      if (gameId && frozen[gameId] && frozen[gameId] > now) {
        alert('⚠️ SABOTAGE DETECTED: This terminal has been frozen by an Imposter!');
        navigate('/player');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [location.pathname, navigate]);
  return null;
}

export default function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Suspense
          fallback={
            <div className="min-h-screen bg-black flex items-center justify-center font-mono text-xs text-zinc-400">
              <div className="p-4 border border-zinc-800 bg-zinc-950 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>SYNCHRONIZING NEXUS TERMINAL...</span>
              </div>
            </div>
          }
        >
          <GlobalFreezeListener />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/player" element={<Player />} />
            <Route path="/admin" element={<AmongUsAdmin />} />
            <Route path="/dashboard" element={<AmongUsAdmin />} />
            <Route path="/games/wordle" element={<Wordle />} />
            <Route path="/games/emoji" element={<Emoji />} />
            <Route path="/games/memedecoder" element={<MemeDecoder />} />
            <Route path="/games/monkeytype" element={<MonkeyType />} />
            <Route path="/games/pacman" element={<Pacman />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AdminAuthProvider>
  );
}
