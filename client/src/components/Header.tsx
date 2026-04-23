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
  onWordOfTheDay,
}: HeaderProps) {
  return (
    <header style={styles.header} className="app-header">
      <div style={styles.title}>
        <span style={styles.emoji} className="header-emoji" aria-hidden="true">🎨</span>
        <span style={styles.titleText} className="header-title-text">AI Charades</span>
        <span style={styles.subtitle} className="header-subtitle">
          Draw it. The AI guesses it.
        </span>
      </div>

      <div style={styles.controls}>
        <div style={styles.difficultyGroup} role="group" aria-label="Difficulty">
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
              className="header-diff-btn"
              aria-pressed={difficulty === d.value}
              aria-label={`Set difficulty to ${d.label}`}
            >
              <span>{d.emoji}</span>
              <span className="header-diff-label">{d.label}</span>
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
    padding: "14px 24px",
    borderBottom: "1px solid var(--border)",
    background:
      "linear-gradient(180deg, rgba(23,23,48,0.9) 0%, rgba(18,18,37,0.75) 100%)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    flexWrap: "wrap",
    gap: "12px",
    position: "relative",
    zIndex: 10,
    boxShadow: "0 1px 0 rgba(255,255,255,0.02), 0 8px 24px rgba(0,0,0,0.2)",
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  emoji: {
    fontSize: "28px",
    lineHeight: 1,
    filter: "drop-shadow(0 2px 8px rgba(255, 77, 109, 0.4))",
  },
  titleText: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "26px",
    letterSpacing: "0.5px",
    background: "linear-gradient(135deg, #ff4d6d 0%, #ffb648 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
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
    flexWrap: "wrap",
  },
  difficultyGroup: {
    display: "flex",
    gap: "6px",
    padding: "4px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "999px",
  },
  diffBtn: {
    padding: "6px 14px",
    borderRadius: "999px",
    background: "transparent",
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid transparent",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  diffBtnActive: {
    background: "var(--accent-grad)",
    color: "#fff",
    boxShadow: "0 2px 10px var(--accent-glow)",
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
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--text)",
  },
};
