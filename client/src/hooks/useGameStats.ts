import { useState, useEffect, useCallback } from "react";

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalGuesses: number;
  bestGuessCount: number;
  currentStreak: number;
  bestStreak: number;
  averageGuesses: number;
}

const STORAGE_KEY = "ai-charades-stats";

const defaultStats: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalGuesses: 0,
  bestGuessCount: Infinity,
  currentStreak: 0,
  bestStreak: 0,
  averageGuesses: 0,
};

export function useGameStats() {
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultStats;
    } catch {
      return defaultStats;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error("Failed to save stats:", e);
    }
  }, [stats]);

  const recordGame = useCallback((won: boolean, guessCount: number) => {
    setStats((prev) => {
      const newGamesPlayed = prev.gamesPlayed + 1;
      const newGamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;
      const newTotalGuesses = prev.totalGuesses + guessCount;
      const newCurrentStreak = won ? prev.currentStreak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newCurrentStreak);
      const newBestGuessCount = won ? Math.min(prev.bestGuessCount, guessCount) : prev.bestGuessCount;

      return {
        gamesPlayed: newGamesPlayed,
        gamesWon: newGamesWon,
        totalGuesses: newTotalGuesses,
        bestGuessCount: newBestGuessCount === Infinity ? guessCount : newBestGuessCount,
        currentStreak: newCurrentStreak,
        bestStreak: newBestStreak,
        averageGuesses: newTotalGuesses / newGamesPlayed,
      };
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats(defaultStats);
  }, []);

  return { stats, recordGame, resetStats };
}
