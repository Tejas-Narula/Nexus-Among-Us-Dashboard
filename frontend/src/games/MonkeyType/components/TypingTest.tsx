
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Theme, TestResult } from '../types';
import { COMMON_WORDS } from '../constants';

interface TypingTestProps {
  theme: Theme;
  onTestEnd: (result: TestResult) => void;
  isTestRunning: boolean;
  setIsTestRunning: (running: boolean) => void;
}

const TypingTest: React.FC<TypingTestProps> = ({
  theme,
  onTestEnd,
  isTestRunning,
  setIsTestRunning
}) => {
  const [words, setWords] = useState<string[]>([]);
  const [finishedWordsTyped, setFinishedWordsTyped] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(0);
  const [totalChars, setTotalChars] = useState(0);

  // Live stats
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);
  const totalCharsRef = useRef(0);

  useEffect(() => {
    totalCharsRef.current = totalChars;
  }, [totalChars]);

  const initWords = useCallback(() => {
    setIsLoading(true);
    // Generate a sentence of exactly 35 words (between 30 and 40)
    const count = 35;
    const generatedWords: string[] = [];
    for (let i = 0; i < count; i++) {
      generatedWords.push(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)]);
    }

    setWords(generatedWords);
    setFinishedWordsTyped([]);
    setIsLoading(false);
    setInput('');
    setCurrentIndex(0);
    setWpmHistory([]);
    setErrors(0);
    setTotalChars(0);
    setLiveWpm(0);
    setLiveAccuracy(0);
    totalCharsRef.current = 0;
    startTimeRef.current = null;
    setIsTestRunning(false);
  }, [setIsTestRunning]);

  useEffect(() => {
    initWords();
  }, [initWords]);

  const calculateWpm = (chars: number, timeInSec: number) => {
    if (timeInSec === 0) return 0;
    // Ensure WPM never drops below 0 even if errors exceed characters
    return Math.max(0, Math.round((chars / 5) / (timeInSec / 60)));
  };

  const endTest = useCallback(() => {
    setIsTestRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeUsed = (Date.now() - (startTimeRef.current || Date.now())) / 1000;
    const finalWpm = calculateWpm(totalCharsRef.current - errors, timeUsed);
    const finalAccuracy = totalCharsRef.current === 0 ? 0 : Math.max(0, Math.round(((totalCharsRef.current - errors) / totalCharsRef.current) * 100));

    // Fair mission threshold for operatives
    const passed = finalWpm >= 40 && finalAccuracy >= 70;

    onTestEnd({
      wpm: finalWpm,
      rawWpm: calculateWpm(totalCharsRef.current, timeUsed),
      accuracy: finalAccuracy,
      characters: totalCharsRef.current,
      errors,
      time: timeUsed,
      history: wpmHistory,
      passed
    });
  }, [setIsTestRunning, errors, onTestEnd, wpmHistory]);

  useEffect(() => {
    if (isTestRunning) {
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        const currentWpm = calculateWpm(totalCharsRef.current - errors, timeElapsed);
        const currentAcc = totalCharsRef.current === 0 ? 0 : Math.max(0, Math.round(((totalCharsRef.current - errors) / totalCharsRef.current) * 100));

        setLiveWpm(currentWpm);
        setLiveAccuracy(currentAcc);
        setWpmHistory(h => [...h, { time: Math.round(timeElapsed), wpm: currentWpm }]);
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestRunning, errors]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!isTestRunning && value.length > 0) {
      setIsTestRunning(true);
      startTimeRef.current = Date.now();
    }

    const currentWord = words[currentIndex] || "";

    // Complete the last word
    if (currentIndex === words.length - 1 && value === currentWord) {
      setTotalChars(prev => prev + value.length);
      setFinishedWordsTyped(prev => [...prev, value]);
      endTest();
      return;
    }

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const isCorrect = typedWord === currentWord;

      setFinishedWordsTyped(prev => [...prev, typedWord]);

      if (!isCorrect) {
        let wordErrors = 0;
        for (let i = 0; i < Math.max(currentWord.length, typedWord.length); i++) {
          if (currentWord[i] !== typedWord[i]) wordErrors++;
        }
        setErrors(prev => prev + wordErrors);
      }

      setTotalChars(prev => prev + typedWord.length + 1);
      setCurrentIndex(prev => prev + 1);
      setInput('');
      return;
    }

    if (value.length > input.length) {
      const lastTypedIdx = value.length - 1;
      if (lastTypedIdx < currentWord.length) {
        if (value[lastTypedIdx] !== currentWord[lastTypedIdx]) {
          setErrors(prev => prev + 1);
        }
      } else {
        setErrors(prev => prev + 1);
      }
    }

    setInput(value);
  };

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="w-12 h-12 border-4 border-t-transparent animate-spin rounded-full" style={{ borderColor: `${theme.mainColor}33`, borderTopColor: theme.mainColor }}></div>
        <p className="mono animate-pulse" style={{ color: theme.mainColor }}>Preparing your challenge...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full cursor-text" onClick={focusInput}>
      {/* Live Stats at the Top */}
      <div className="mb-12 flex items-center justify-center gap-12 mono font-bold text-xl">
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase opacity-40 mb-1">WPM</span>
          <span style={{ color: liveWpm >= 60 ? theme.successColor : theme.mainColor }} className="text-3xl">
            {liveWpm}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase opacity-40 mb-1">Accuracy</span>
          <span style={{ color: liveAccuracy >= 80 ? theme.successColor : theme.mainColor }} className="text-3xl">
            {liveAccuracy}%
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase opacity-40 mb-1">Progress</span>
          <span style={{ color: theme.subColor }} className="text-3xl">
            {currentIndex}/{words.length}
          </span>
        </div>
      </div>

      <div
        className="text-2xl md:text-3xl leading-relaxed select-none mono relative min-h-48"
        style={{ color: theme.subColor }}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {words.map((word, wIdx) => {
            const isCurrent = wIdx === currentIndex;
            const isFinished = wIdx < currentIndex;
            const typedForWord = finishedWordsTyped[wIdx] || "";

            return (
              <span key={wIdx} className="relative">
                {word.split('').map((char, cIdx) => {
                  let charColor = theme.subColor;
                  let decoration = 'none';

                  if (isFinished) {
                    if (cIdx < typedForWord.length) {
                      charColor = typedForWord[cIdx] === char ? theme.successColor : theme.errorColor;
                    } else {
                      charColor = theme.errorColor;
                    }
                  } else if (isCurrent) {
                    if (cIdx < input.length) {
                      if (input[cIdx] === char) {
                        charColor = theme.successColor;
                      } else {
                        charColor = theme.errorColor;
                      }
                    }
                  }

                  return (
                    <span
                      key={cIdx}
                      style={{ color: charColor, textDecoration: decoration }}
                      className="transition-colors duration-100"
                    >
                      {char}
                      {isCurrent && cIdx === input.length && (
                        <span
                          className="absolute w-0.5 h-[1.2em] caret"
                          style={{ backgroundColor: theme.caretColor, left: `${cIdx * 0.6}em`, top: '10%' }}
                        />
                      )}
                    </span>
                  );
                })}
                {isCurrent && input.length > word.length && (
                  input.slice(word.length).split('').map((char, cIdx) => (
                    <span key={cIdx} style={{ color: theme.errorColor }}>
                      {char}
                    </span>
                  ))
                )}
                {isFinished && typedForWord.length > word.length && (
                  typedForWord.slice(word.length).split('').map((char, cIdx) => (
                    <span key={cIdx} style={{ color: theme.errorColor }}>
                      {char}
                    </span>
                  ))
                )}
              </span>
            );
          })}
        </div>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleInputChange}
        onBlur={() => !isTestRunning && focusInput()}
        className="absolute inset-0 w-full h-full opacity-0 cursor-default"
        autoFocus
      />

      <div className="mt-16 flex justify-center">
        <button
          onClick={initWords}
          className="p-4 rounded-xl hover:bg-black/10 transition-all opacity-40 hover:opacity-100 flex items-center gap-2"
          title="Restart (Tab + Enter)"
          style={{ color: theme.subColor }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
          <span className="mono text-sm">Restart Challenge</span>
        </button>
      </div>
    </div>
  );
};

export default TypingTest;
