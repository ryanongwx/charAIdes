import React from "react";
import type { Difficulty } from "../hooks/useGameState";

interface HeaderProps {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  disabled: boolean;
  onShowStats: () => void;
  onShowShortcuts: () => void;
  onGenerateWord: () => void;
  onWordOfTheDay: () => void;
}

const difficulties: { value: Difficulty; label: string; emoji: string }[] = [
  { value: "easy", label: "Easy", emoji: "🟢" },
  { value: "medium", label: "Medium", emoji: "🟡" },
  { value: "hard", label: "Hard", emoji: "🔴" },
];

export default function Header({ 
  difficulty, 
  onDifficultyChange, 
  disabled, 
  onShowStats, 
  onShowShortcuts,
  onGenerateWord,
  onWordOfTheDay
}: HeaderProps) {
  return (
    <header style={styles.header}>
      <div style={styles.title}>
        <span style={styles.emoji}>🎨</span>
        <span style={styles.titleText}>AI Charades</span>
        <span style={styles.subtitle}>Draw it. The AI guesses it.</span>
      </div>
      
      <div style={styles.controls}>
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
        
        <div style={styles.iconButtons}>
          <button
            onClick={onWordOfTheDay}
            style={styles.iconBtn}
            aria-label="Word of the day"
            title="Word of the Day"
            disabled={disabled}
          >
            📅
          </button>
          <button
            onClick={onGenerateWord}
            style={styles.iconBtn}
            aria-label="Generate AI word"
            title="Generate AI Word"
            disabled={disabled}
          >
            ✨
          </button>
          <button
            onClick={onShowStats}
            style={styles.iconBtn}
            aria-label="View stats"
            title="View stats"
          >
            📊
          </button>
          <button
            onClick={onShowShortcuts}
            style={styles.iconBtn}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            ⌨️
          </button>
        </div>
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
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
  iconButtons: {
    display: "flex",
    gap: "6px",
  },
  iconBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
