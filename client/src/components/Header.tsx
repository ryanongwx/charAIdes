import React from "react";
import type { Difficulty } from "../hooks/useGameState";

interface HeaderProps {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  disabled: boolean;
}

const difficulties: { value: Difficulty; label: string; emoji: string }[] = [
  { value: "easy", label: "Easy", emoji: "🟢" },
  { value: "medium", label: "Medium", emoji: "🟡" },
  { value: "hard", label: "Hard", emoji: "🔴" },
];

export default function Header({ difficulty, onDifficultyChange, disabled }: HeaderProps) {
  return (
    <header style={styles.header}>
      <div style={styles.title}>
        <span style={styles.emoji}>🎨</span>
        <span style={styles.titleText}>AI Charades</span>
        <span style={styles.subtitle}>Draw it. The AI guesses it.</span>
      </div>
      <div style={styles.difficultyGroup}>
        {difficulties.map((d) => (
          <button
            key={d.value}
            onClick={() => onDifficultyChange(d.value)}
            disabled={disabled}
            style={{
              ...styles.diffBtn,
              ...(difficulty === d.value ? styles.diffBtnActive : {}),
              ...(disabled ? styles.diffBtnDisabled : {}),
            }}
            aria-pressed={difficulty === d.value}
            aria-label={`Set difficulty to ${d.label}`}
          >
            {d.emoji} {d.label}
          </button>
        ))}
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  emoji: {
    fontSize: "28px",
  },
  titleText: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "26px",
    color: "var(--accent)",
    letterSpacing: "0.5px",
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--text-muted)",
    marginLeft: "4px",
  },
  difficultyGroup: {
    display: "flex",
    gap: "8px",
  },
  diffBtn: {
    padding: "6px 14px",
    borderRadius: "20px",
    background: "var(--surface2)",
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid var(--border)",
    transition: "all 0.2s",
  },
  diffBtnActive: {
    background: "var(--accent)",
    color: "#fff",
    border: "1px solid var(--accent)",
  },
  diffBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
