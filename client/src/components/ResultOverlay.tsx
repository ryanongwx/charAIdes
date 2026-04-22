import React, { useEffect, useState } from "react";
import type { GamePhase } from "../hooks/useGameState";

interface ResultOverlayProps {
  phase: GamePhase;
  word: string;
  guessCount: number;
  onPlayAgain: () => void;
}

interface Confetti {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
}

export default function ResultOverlay({ phase, word, guessCount, onPlayAgain }: ResultOverlayProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  const visible = phase === "WON" || phase === "LOST";
  const won = phase === "WON";

  useEffect(() => {
    if (won) {
      const pieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ["#e94560", "#f5a623", "#4ecdc4", "#f7e017", "#9b59b6"][Math.floor(Math.random() * 5)],
        delay: Math.random() * 1.5,
        size: 8 + Math.random() * 8,
      }));
      setConfetti(pieces);
    } else {
      setConfetti([]);
    }
  }, [won, phase]);

  if (!visible) return null;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={won ? "You won!" : "Time's up!"}>
      {/* Confetti */}
      {confetti.map((c) => (
        <div
          key={c.id}
          style={{
            position: "fixed",
            left: `${c.x}%`,
            top: "-20px",
            width: `${c.size}px`,
            height: `${c.size}px`,
            background: c.color,
            borderRadius: "2px",
            animation: `confetti-fall ${2 + Math.random()}s ${c.delay}s ease-in forwards`,
            zIndex: 999,
          }}
        />
      ))}

      <div style={styles.card}>
        <div style={styles.emoji}>{won ? "🎉" : "⏰"}</div>
        <h2 style={{ ...styles.title, color: won ? "var(--success)" : "var(--accent)" }}>
          {won ? "Got it!" : "Time's Up!"}
        </h2>

        <div style={styles.wordReveal}>
          <span style={styles.wordLabel}>The word was</span>
          <span style={styles.word}>{word}</span>
        </div>

        {won && (
          <div style={styles.score}>
            <span style={styles.scoreLabel}>Guessed in</span>
            <span style={styles.scoreValue}>{guessCount}</span>
            <span style={styles.scoreLabel}>guess{guessCount !== 1 ? "es" : ""}</span>
          </div>
        )}

        {!won && (
          <p style={styles.lostMsg}>
            Better luck next time! Keep practicing your drawing skills 🖌️
          </p>
        )}

        <button onClick={onPlayAgain} style={styles.playAgainBtn} autoFocus>
          🎮 Play Again
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
    animation: "fadeIn 0.3s ease",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "40px 48px",
    textAlign: "center",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  emoji: {
    fontSize: "56px",
    lineHeight: 1,
  },
  title: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "36px",
    margin: 0,
  },
  wordReveal: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  wordLabel: {
    fontSize: "13px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  word: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "32px",
    color: "var(--accent3)",
  },
  score: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "var(--surface2)",
    padding: "10px 20px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
  },
  scoreLabel: {
    fontSize: "14px",
    color: "var(--text-muted)",
  },
  scoreValue: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "28px",
    color: "var(--accent2)",
  },
  lostMsg: {
    fontSize: "14px",
    color: "var(--text-muted)",
    maxWidth: "280px",
  },
  playAgainBtn: {
    marginTop: "8px",
    padding: "14px 32px",
    borderRadius: "12px",
    background: "var(--accent)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    transition: "transform 0.15s, opacity 0.15s",
    fontFamily: "'Fredoka One', cursive",
    letterSpacing: "0.5px",
  },
};
