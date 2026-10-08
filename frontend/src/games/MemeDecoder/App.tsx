import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { memeData, Meme } from './memeData';
import { Terminal, Scan, CheckCircle2, XCircle, Play, RotateCcw } from 'lucide-react';
import { AllocationDatabase } from '../../lib/gameDatabase';

type GameState = 'start' | 'playing' | 'won' | 'lost';

export default function MemeDecoder() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [blurAmount, setBlurAmount] = useState<number>(8);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [hintTimer, setHintTimer] = useState<number>(0);
  const [awardNotice, setAwardNotice] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [gameMemes, setGameMemes] = useState<Meme[]>([]);

  // Hint Timer Effect
  useEffect(() => {
    let timer: number | undefined;
    if (gameState === 'playing') {
      timer = window.setInterval(() => {
        setHintTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // Hint Reveal Effect - reveal one letter every 30 seconds
  useEffect(() => {
    if (gameState === 'playing' && hintTimer > 0 && hintTimer % 30 === 0) {
      const currentMeme = gameMemes[currentIndex];
      if (!currentMeme) return;
      
      const normalized = normalize(currentMeme.answer);
      const availableIndices = Array.from({ length: normalized.length }, (_, i) => i)
        .filter(i => !revealedHints.includes(i));
      
      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setRevealedHints(prev => [...prev, randomIndex]);
      }
    }
  }, [hintTimer, gameState, gameMemes, currentIndex]);

  // Canvas Image Rendering with Blur
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'start') return;
    if (gameMemes.length === 0 && gameState === 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = "Anonymous";

    // Use the randomized subset
    const currentMeme = gameState === 'start' ? memeData[0] : gameMemes[currentIndex];

    // Safety check
    if (!currentMeme) return;

    image.src = currentMeme.imageUrl;

    image.onload = () => {
      // Set canvas size to match image or fixed aspect ratio
      canvas.width = 600;
      canvas.height = 400;

      // Clear previous draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply blur - This 'burns' the blur into the canvas bitmap
      // so turning off CSS rules won't reveal the image.
      if (gameState === 'playing') {
        ctx.filter = `blur(${blurAmount}px)`;
      } else {
        ctx.filter = 'none';
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };

  }, [currentIndex, blurAmount, gameState, gameMemes]);

  const handleStart = () => {
    // Randomly select 4 memes
    const shuffled = [...memeData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    setGameMemes(selected);

    setGameState('playing');
    setScore(0);
    setCurrentIndex(0);
    setBlurAmount(6);
    setRevealedHints([]);
    setHintTimer(0);
  };

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentMeme = gameMemes[currentIndex];
    if (e.target.value.length <= normalize(currentMeme.answer).length) {
      setUserInput(e.target.value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentMeme = gameMemes[currentIndex];

    if (normalize(userInput) === normalize(currentMeme.answer)) {
      // Correct!
      if (currentIndex + 1 < gameMemes.length) {
        setScore((prev) => prev + 10);
        setCurrentIndex((prev) => prev + 1);
        setUserInput('');
        setBlurAmount(15); // Reset blur for next meme
        setRevealedHints([]); // Reset hints for next meme
        setHintTimer(0); // Reset hint timer
      } else {
        const finalScore = score + 10;
        setScore(finalScore);
        setGameState('won');

        try {
          const sessionRaw = localStorage.getItem('nexus_player_session');
          if (sessionRaw) {
            const session = JSON.parse(sessionRaw);
            if (session?.teamId) {
              const res = AllocationDatabase.recordGameCompletion(
                session.teamId,
                'memedecoder',
                'Meme Decoder Terminal',
                10
              );
              if (res.success) {
                setAwardNotice(`✅ MISSION ACCOMPLISHED! Meme station decoded for Team ${session.teamName || session.teamId}. Logged to central control.`);
                setTimeout(() => navigate('/player'), 3000);
              }
            }
          }
        } catch (err) {
          console.warn('Meme decoder score notice:', err);
        }
      }
    } else {
      // Wrong - shake effect
      const inputEl = document.getElementById('meme-input');
      if (inputEl) {
        inputEl.classList.add('animate-shake');
        setTimeout(() => inputEl.classList.remove('animate-shake'), 500);
      }
    }
  };

  const renderSlots = () => {
    const currentMeme = gameMemes[currentIndex];
    if (!currentMeme) return null;

    const words = currentMeme.answer.split(' ');
    let globalCharIndex = 0;

    return (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {words.map((word, wordIdx) => {
          const wordSlots = word.split('').map((char, charIdx) => {
            const normalized = normalize(currentMeme.answer);
            const userChar = userInput[globalCharIndex] || "";
            const isHinted = revealedHints.includes(globalCharIndex);
            const hintChar = normalized[globalCharIndex];
            globalCharIndex++;
            
            return (
              <div 
                key={charIdx} 
                className="border-2 border-green-700 bg-zinc-900/80 w-10 h-12 flex items-center justify-center text-xl font-bold uppercase transition-all"
                style={{
                  color: isHinted ? '#fbbf24' : '#86efac',
                  borderColor: isHinted ? '#fbbf24' : '#15803d',
                  boxShadow: isHinted ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none'
                }}
              >
                {isHinted && !userChar ? hintChar : userChar}
              </div>
            );
          });
          
          return (
            <div key={wordIdx} style={{ display: 'flex', gap: '4px' }}>
              {wordSlots}
            </div>
          );
        })}
      </div>
    );
  };

  const [teamScore, setTeamScore] = useState(0);
  useEffect(() => {
    try {
      const sessionRaw = localStorage.getItem('nexus_player_session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session?.teamId) {
           const team = AllocationDatabase.getTeams().find(t => t.id === session.teamId);
           if (team) setTeamScore(team.score || 0);
        }
      }
    } catch(e) {}
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-green-500 font-mono p-4 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-50 animate-pulse opacity-5 bg-green-900 mix-blend-overlay"></div>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/player')} style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #4ade80', borderRadius: '4px', cursor: 'pointer', zIndex: 100 }}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '4px', zIndex: 100 }}>Score: {teamScore}</div>
      </header>

      {/* Game Content */}
      <main className="w-full max-w-2xl z-10 flex flex-col items-center gap-6">

        {gameState === 'start' && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="border-2 border-green-700 p-8 rounded bg-zinc-900/50 backdrop-blur-sm">
              <h2 className="text-2xl mb-4 text-green-400">MISSION BRIEFING</h2>
              <p className="mb-2">1. Identify the viral phenomenon from the corrupted data.</p>
              <p className="mb-2">2. Enter the codename (meme name) to decrypt.</p>
              <p className="mb-6">3. Time is critical. You have 60 seconds.</p>

              <button
                onClick={handleStart}
                className="group relative px-8 py-3 bg-green-900/20 border border-green-500 hover:bg-green-500 hover:text-black transition-all duration-300 uppercase tracking-widest font-bold flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5" />
                Initialize
                <div className="absolute inset-0 bg-green-400/20 blur-lg group-hover:bg-green-400/40 transition-all opacity-0 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="w-full flex flex-col items-center gap-6 animate-fade-in" onClick={() => inputRef.current?.focus()}>
            {/* Canvas Container */}
            <div className="relative border-4 border-zinc-800 bg-black shadow-2xl rounded-lg overflow-hidden group">
              <canvas
                ref={canvasRef}
                className="block max-w-full h-auto"
              />
              {/* Decorative corner markers */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-green-500/50"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-green-500/50"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-green-500/50"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-green-500/50"></div>

              {/* Scanline for image */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-4 w-full animate-scan" />
            </div>

            {/* Slot Display */}
            <div className="w-full flex flex-col items-center gap-2 mb-6">
              {renderSlots()}
              <p className="text-sm text-green-700 mt-2">Click anywhere and type to fill slots</p>
            </div>

            {/* Hidden Input + Submit */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <input
                ref={inputRef}
                id="meme-input"
                type="text"
                value={userInput}
                onChange={handleInputChange}
                className="absolute opacity-0 pointer-events-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-8 py-3 bg-green-600 text-black font-bold uppercase hover:bg-green-400 transition-colors border-2 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)] mx-auto"
              >
                <Scan className="inline mr-2" size={20} />
                SUBMIT ANSWER
              </button>
            </form>

            <p className="text-sm text-green-700">Level {currentIndex + 1} / {gameMemes.length}</p>
          </div>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <div className="text-center space-y-6 animate-fade-in z-20">
            <div className={`border-4 ${gameState === 'won' ? 'border-green-500' : 'border-red-500'} p-12 rounded-lg bg-black/90 backdrop-blur shadow-2xl`}>
              {gameState === 'won' ? (
                <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
              )}

              <h2 className={`text-4xl font-bold mb-2 ${gameState === 'won' ? 'text-green-400' : 'text-red-500'}`}>
                {gameState === 'won' ? 'SYSTEM SECURED' : 'CRITICAL FAILURE'}
              </h2>

              {awardNotice && (
                <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-2 rounded text-sm font-bold my-4">
                  {awardNotice}
                </div>
              )}

              <p className="text-xl mb-8 text-zinc-400">
                {score / 10} / {gameMemes.length} decoded
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleStart}
                  className="px-6 py-3 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 hover:border-zinc-400 text-white transition-all uppercase tracking-widest flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reboot System
                </button>
                <button
                  onClick={() => navigate('/player')}
                  className="px-6 py-3 bg-green-950 border border-green-600 hover:bg-green-900 text-green-300 transition-all uppercase tracking-widest"
                >
                  ← Player Terminal
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CSS for custom animations that might not be in Tailwind Config */}
      <style>{`
        .glow-text {
          text-shadow: 0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(34, 197, 94, 0.3);
        }
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 3;
        }
      `}</style>
    </div>
  );
}
