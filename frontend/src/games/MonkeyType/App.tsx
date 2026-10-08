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

    try {
      const sessionRaw = localStorage.getItem('nexus_player_session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session?.teamId) {
          const res = AllocationDatabase.recordGameCompletion(
            session.teamId,
            'monkeytype',
            'Code Typer Mission',
            10
          );
          if (res.success) {
            setAwardNotice(`✅ MISSION ACCOMPLISHED! Terminal code verified for Team ${session.teamName || session.teamId}. Logged to central control.`);
            setTimeout(() => navigate('/player'), 3000);
          }
        }
      }
    } catch (e) {
      console.warn('MonkeyType score error:', e);
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
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 relative pt-16"
      style={{ backgroundColor: activeTheme.bgColor, color: activeTheme.subColor }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/player')} style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #4ade80', borderRadius: '4px', cursor: 'pointer', zIndex: 100 }}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '4px', zIndex: 100 }}>Score: {teamScore}</div>
      </header>
      
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
