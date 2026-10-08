import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import TypingTest from './components/TypingTest';
import ResultView from './components/ResultView';
import ThemeSelector from './components/ThemeSelector';
import { THEMES } from './constants';
import { TestSettings, TestResult } from './types';
import { AllocationDatabase } from '../../lib/gameDatabase';
import './App.css';

const MonkeyType: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TestSettings>({
    theme: 'dark'
  });

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [awardNotice, setAwardNotice] = useState('');

  const activeTheme = useMemo(() =>
    THEMES.find(t => t.id === settings.theme) || THEMES[0],
    [settings.theme]
  );

  useEffect(() => {
    document.body.style.backgroundColor = activeTheme.bgColor;
    document.body.style.color = activeTheme.subColor;
  }, [activeTheme]);

  const handleTestEnd = (result: TestResult) => {
    setTestResult(result);
    setIsTestRunning(false);

    if (result.passed) {
      try {
        const sessionRaw = localStorage.getItem('nexus_player_session');
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          if (session?.teamId) {
            const res = AllocationDatabase.recordGameCompletion(
              session.teamId,
              'monkeytype',
              'Code Typer Mission'
            );
            if (res.success) {
              setAwardNotice(`✅ MISSION ACCOMPLISHED! Code speed & accuracy verified for Team ${session.teamName || session.teamId} (+${res.pointsAwarded} pts). Points credited.`);
            }
          }
        }
      } catch (e) {
        console.warn('MonkeyType score error:', e);
      }
    } else {
      setAwardNotice(`⚠️ TEST INCOMPLETE: Target requirement is 40+ WPM & 70%+ Accuracy (Achieved: ${result.wpm} WPM, ${result.accuracy}% Acc). Click "Play Again" below to retry.`);
    }
  };

  const startTest = () => {
    setTestResult(null);
    setIsTestRunning(false);
  };

  const resetTest = () => {
    setTestResult(null);
    setIsTestRunning(false);
  };

  const [isStationFrozen, setIsStationFrozen] = useState(false);
  const [freezeRemaining, setFreezeRemaining] = useState(0);

  useEffect(() => {
    const checkFreeze = () => {
      const frozen = AllocationDatabase.getFrozenGames();
      const freezeTime = frozen['monkeytype'] || 0;
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
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 relative pt-16"
      style={{ backgroundColor: activeTheme.bgColor, color: activeTheme.subColor }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/player')} style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #4ade80', borderRadius: '4px', cursor: 'pointer', zIndex: 100 }}>← Back to Mission Deck</button>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4ade80', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '4px', zIndex: 100, letterSpacing: '1px' }}>TERMINAL: CODE TYPER</div>
      </header>

      {isStationFrozen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-cyan-400 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-pulse">
            <div className="text-5xl mb-4">❄️</div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">STATION FROZEN BY IMPOSTOR</h2>
            <p className="text-gray-300 text-sm mb-4">Input buffer locked by central sabotage. Rebooting in {freezeRemaining}s...</p>
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
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 px-3 py-1 rounded text-xs font-mono font-bold animate-pulse text-center">
          {awardNotice}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full">
        <div className="w-full">
          {testResult ? (
            <ResultView
              result={testResult}
              theme={activeTheme}
              onRestart={startTest}
            />
          ) : (
            <TypingTest
              theme={activeTheme}
              onTestEnd={handleTestEnd}
              isTestRunning={isTestRunning}
              setIsTestRunning={setIsTestRunning}
            />
          )}
        </div>
      </main>

      {showThemeSelector && (
        <ThemeSelector
          currentTheme={settings.theme}
          onSelect={(themeId) => {
            setSettings(prev => ({ ...prev, theme: themeId }));
            setShowThemeSelector(false);
          }}
          onClose={() => setShowThemeSelector(false)}
          theme={activeTheme}
        />
      )}

      <footer className="py-8 text-center text-xs opacity-50 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-4 opacity-70">
          <span>Press <kbd className="bg-gray-700/20 px-1 rounded">Tab</kbd> + <kbd className="bg-gray-700/20 px-1 rounded">Enter</kbd> to restart</span>
          <span>&bull;</span>
          <span>MonkeyType v1.0</span>
        </div>
      </footer>
    </div>
  );
};

export default MonkeyType;
