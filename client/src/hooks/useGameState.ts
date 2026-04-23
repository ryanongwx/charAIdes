import { useState, useEffect, useCallback, useRef } from "react";
import { isCorrectGuess } from "../lib/fuzzyMatch";

export type GamePhase = "IDLE" | "DRAWING" | "GUESSING" | "WON" | "LOST";
export type Difficulty = "easy" | "medium" | "hard";

export interface WordEntry {
  word: string;
  category: string;
  difficulty: Difficulty;
}

export interface GuessEntry {
  text: string;
  correct: boolean;
  timestamp: number;
}

const TIMER_SECONDS = 90;

export function useGameState() {
  const [phase, setPhase] = useState<GamePhase>("IDLE");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [wordEntry, setWordEntry] = useState<WordEntry | null>(null);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [hintUsed, setHintUsed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase("LOST");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const startRound = useCallback(
    async (selectedDifficulty?: Difficulty) => {
      const diff = selectedDifficulty ?? difficulty;
      setDifficulty(diff);
      setGuesses([]);
      setHintUsed(false);
      setWordEntry(null);
      clearTimer();

      const res = await fetch(`/api/word?difficulty=${diff}`);
      if (!res.ok) {
        setPhase("IDLE");
        throw new Error(`Failed to fetch word (${res.status})`);
      }
      const data: WordEntry = await res.json();
      setWordEntry(data);
      setPhase("DRAWING");
      startTimer();
    },
    [difficulty, startTimer, clearTimer]
  );

  const addGuess = useCallback(
    (text: string): boolean => {
      if (!wordEntry) return false;
      const correct = isCorrectGuess(text, wordEntry.word);
      const entry: GuessEntry = { text, correct, timestamp: Date.now() };
      setGuesses((prev) => [...prev, entry]);

      if (correct) {
        clearTimer();
        setPhase("WON");
      }
      return correct;
    },
    [wordEntry, clearTimer]
  );

  const useHint = useCallback(() => {
    if (!hintUsed) {
      setHintUsed(true);
      // Add a "penalty" guess entry
      setGuesses((prev) => [
        ...prev,
        {
          text: `💡 Hint used: category is "${wordEntry?.category}"`,
          correct: false,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [hintUsed, wordEntry]);

  const setGuessing = useCallback((val: boolean) => {
    setPhase((prev) => {
      if (val && prev === "DRAWING") return "GUESSING";
      if (!val && prev === "GUESSING") return "DRAWING";
      return prev;
    });
  }, []);

  return {
    phase,
    difficulty,
    setDifficulty,
    wordEntry,
    guesses,
    timeLeft,
    hintUsed,
    startRound,
    addGuess,
    useHint,
    setGuessing,
    guessCount: guesses.filter((g) => !g.text.startsWith("💡")).length,
  };
}
