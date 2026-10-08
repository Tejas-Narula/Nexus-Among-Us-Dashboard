import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { AllocationDatabase } from '../lib/gameDatabase';
import '../index.css';


const WORDS = ['ABORT', 'SPEAR', 'YIELD', 'SPEED', 'ROACH', 'MEDIA', 'RHYME', 'QUAKE', 'GLORY', 'EXERT', 'STIFF', 'CHEER', 'FIERY', 'STOIC', 'WHINE', 'TROOP', 'QUEUE', 'LEVER', 'BRAVE', 'ALERT', 'HOVER', 'PIECE', 'TROUT', 'WHISK', 'VAULT', 'YOUTH', 'ROGUE', 'LOGIC', 'INEPT', 'HEIST'];
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const TOTAL_ROUNDS = 2;

export default function WordleClone({ onUnlock = () => {} }) {
  const navigate = useNavigate();

  // Local Game State
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [usedWords, setUsedWords] = useState([]);
  const [localWins, setLocalWins] = useState(0); // Track wins in this session
  const [currentRound, setCurrentRound] = useState(1); // Track which round we're on
  const [gameFinished, setGameFinished] = useState(false); // Track if all rounds completed
  const [awardNotice, setAwardNotice] = useState('');

  // UI State for modals
  const [showUnlockModal, setShowUnlockModal] = useState(null);
  console.log(targetWord)
  useEffect(() => {
    const availableWords = WORDS.filter(word => !usedWords.includes(word));
    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    console.log('WORDLE ANSWER:', randomWord);
    setTargetWord(randomWord);
    setUsedWords(prev => [...prev, randomWord]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isStationFrozen, setIsStationFrozen] = useState(false);
  const [freezeRemaining, setFreezeRemaining] = useState(0);

  useEffect(() => {
    const checkFreeze = () => {
      const frozen = AllocationDatabase.getFrozenGames();
      const freezeTime = frozen['wordle'] || 0;
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

  const handleWin = () => {
    const newLocalWins = localWins + 1;
    setLocalWins(newLocalWins);

    if (newLocalWins >= TOTAL_ROUNDS) {
      setGameFinished(true);
      try {
        const sessionRaw = localStorage.getItem('nexus_player_session');
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          if (session?.teamId) {
            const res = AllocationDatabase.recordGameCompletion(session.teamId, 'wordle', 'Wordle');
            if (res.success) {
              setAwardNotice(`✅ ALL ${TOTAL_ROUNDS} ROUNDS COMPLETED! Wordle station verified for Team ${session.teamName || session.teamId}. Logged to central control.`);
              setTimeout(() => navigate('/player'), 3500);
            }
          }
        }
      } catch (e) {
        console.warn('Score tracking notice:', e);
      }
    } else {
      setAwardNotice(`🎯 ROUND ${newLocalWins} CLEARED! Click "Next Round" below to solve the next code word (${TOTAL_ROUNDS - newLocalWins} remaining).`);
    }
  };

  const getLetterStatus = (letter, index, guess) => {
    if (!guess) return 'empty';
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const getKeyStatus = (key) => {
    let status = 'unused';
    guesses.forEach(guess => {
      guess.split('').forEach((letter, index) => {
        if (letter === key) {
          if (targetWord[index] === letter) status = 'correct';
          else if (targetWord.includes(letter) && status !== 'correct') status = 'present';
          else if (status === 'unused') status = 'absent';
        }
      });
    });
    return status;
  };

  const handleKeyPress = (key) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      if (currentGuess.length === WORD_LENGTH) {
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);

        if (currentGuess === targetWord) {
          setWon(true);
          setGameOver(true);
          handleWin(); // Call global update
        } else if (newGuesses.length === MAX_ATTEMPTS) {
          setGameOver(true);
        }
        setCurrentGuess('');
      } else {
        setError('Not enough letters');
        setShake(true);
        setTimeout(() => { setError(''); setShake(false); }, 2000);
      }
    } else if (key === 'BACK') {
      setCurrentGuess(currentGuess.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(currentGuess + key);
    }
  };

  useEffect(() => {
    const handleKeyboard = (e) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER') handleKeyPress('ENTER');
      else if (key === 'BACKSPACE') handleKeyPress('BACK');
      else if (/^[A-Z]$/.test(key)) handleKeyPress(key);
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [currentGuess, gameOver, guesses, targetWord]);

  const handlePlayAgain = () => {
    // Move to next round
    if (localWins < TOTAL_ROUNDS) {
      setCurrentRound(prev => prev + 1);
    }

    const availableWords = WORDS.filter(word => !usedWords.includes(word));
    if (availableWords.length === 0) {
      setUsedWords([]);
      const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
      console.log('WORDLE ANSWER:', randomWord);
      setTargetWord(randomWord);
      setUsedWords([randomWord]);
    } else {
      const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      console.log('WORDLE ANSWER:', randomWord);
      setTargetWord(randomWord);
      setUsedWords(prev => [...prev, randomWord]);
    }
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
    setShowUnlockModal(null);
  };

  // Helper for rendering rows (Same as before)
  const renderRow = (guess, rowIndex) => {
    const isCurrentRow = rowIndex === guesses.length;
    const letters = guess ? guess.split('') : [];
    return (
      <div className={`flex gap-1 ${shake && isCurrentRow ? 'animate-shake' : ''}`}>
        {[...Array(WORD_LENGTH)].map((_, i) => {
          const letter = letters[i] || (isCurrentRow && currentGuess[i]) || '';
          const status = guess ? getLetterStatus(letter, i, guess) : 'empty';
          return (
            <div key={i} className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold
              ${status === 'correct' ? 'bg-green-600 border-green-600 text-white' : ''}
              ${status === 'present' ? 'bg-yellow-500 border-yellow-500 text-white' : ''}
              ${status === 'absent' ? 'bg-gray-600 border-gray-600 text-white' : ''}
              ${status === 'empty' && letter ? 'border-gray-500' : 'border-gray-700'}
              transition-all duration-300`}>
              {letter}
            </div>
          );
        })}
      </div>
    );
  };

  const keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col relative pt-16">
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/player')} style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #4ade80', borderRadius: '4px', cursor: 'pointer' }}>← Back to Mission Deck</button>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4ade80', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '4px', letterSpacing: '1px' }}>TERMINAL: WORDLE DECODER</div>
      </header>

      {isStationFrozen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-cyan-400 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-pulse">
            <div className="text-5xl mb-4">❄️</div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">STATION FROZEN BY IMPOSTOR</h2>
            <p className="text-gray-300 text-sm mb-4">Central systems sabotaged. Terminal rebooting in {freezeRemaining}s...</p>
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
        <div className="bg-emerald-950 border-b border-emerald-500 text-emerald-200 px-4 py-2 text-center text-sm font-mono font-bold animate-pulse">
          {awardNotice}
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-linear-to-br from-yellow-500 to-orange-600 p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center">
            <Trophy size={80} className="text-white mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-2">NEW UNLOCK!</h2>
            <div className="bg-white/20 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-black">{showUnlockModal.name}</h3>
              <p className="text-black/90">{showUnlockModal.description}</p>
            </div>
            <button onClick={() => setShowUnlockModal(null)} className="bg-white text-orange-600 font-bold px-8 py-3 rounded-lg">
              Continue
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-6xl mx-auto w-full min-h-[calc(100vh-100px)] overflow-y-auto">
        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="flex flex-col gap-1 mb-6">
            {[...Array(MAX_ATTEMPTS)].map((_, i) => <div key={i}>{renderRow(guesses[i], i)}</div>)}
          </div>

          {error && <div className="mb-4 text-red-400 font-bold">{error}</div>}

          {gameOver && !gameFinished && (
            <div className="mb-4 text-center animate-fadeIn">
              <p className="text-3xl font-bold mb-2">{won ? '🎉 You Won!' : '😔 Game Over'}</p>
              <p className="mb-4">{won ? `Solved in ${guesses.length} tries!` : `Word: ${targetWord}`}</p>
              {won && (
                <p className="text-sm text-gray-400 mb-3">Round: {localWins} / {TOTAL_ROUNDS} | {localWins === TOTAL_ROUNDS ? 'Unlocking next level...' : `${TOTAL_ROUNDS - localWins} round${TOTAL_ROUNDS - localWins !== 1 ? 's' : ''} remaining`}</p>
              )}
              <button onClick={handlePlayAgain} className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-bold cursor-pointer transition">
                {localWins >= TOTAL_ROUNDS ? 'Advancing...' : 'Next Round →'}
              </button>
            </div>
          )}

          {gameFinished && (
            <div className="mb-6 text-center animate-fadeIn p-6 bg-slate-900 border border-emerald-500 rounded-xl">
              <p className="text-3xl font-bold text-emerald-400 mb-2">🏆 All Rounds Completed!</p>
              <p className="text-sm text-gray-300 mb-4">Wordle decryption sequence validated.</p>
              <button
                onClick={() => navigate('/player')}
                className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-lg font-bold text-white cursor-pointer transition"
              >
                Return to Mission Deck
              </button>
            </div>
          )}

          {/* Keyboard */}
          <div className="w-full max-w-lg">
            {keyboard.map((row, i) => (
              <div key={i} className="flex gap-1 justify-center mb-2">
                {row.map((key) => {
                  const status = key.length === 1 ? getKeyStatus(key) : 'unused';
                  return (
                    <button key={key} onClick={() => handleKeyPress(key)}
                      className={`h-14 rounded font-bold text-sm ${key.length > 1 ? 'px-4' : 'w-10'}
                        ${status === 'correct' ? 'bg-green-600' : status === 'present' ? 'bg-yellow-500' : status === 'absent' ? 'bg-gray-800' : 'bg-gray-600'}`}>
                      {key === 'BACK' ? '⌫' : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Global Sidebar
        <div className="hidden lg:block h-full">
           <UnlocksSidebar />
        </div> */}
      </main>
    </div>
  );
}