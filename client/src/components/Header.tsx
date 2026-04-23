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
        <div style={styles.titleBlock}>
          <span style={styles.titleText} className="header-title-text">
            AI Charades
          </span>
          <span style={styles.subtitle} className="header-subtitle">
            Draw it. The AI guesses it.
          </span>
        </div>
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

        <div style={styles.actionGroup}>
          <button
            onClick={onWordOfTheDay}
            disabled={disabled}
            style={{
              ...styles.actionBtn,
              ...(disabled ? styles.actionBtnDisabled : {}),
            }}
            className="header-action-btn"
            aria-label="Use word of the day"
            title="Start with today's Word of the Day"
          >
            <span aria-hidden="true">📅</span>
            <span className="header-action-label">Daily</span>
          </button>
          <button
            onClick={onGenerateWord}
            disabled={disabled}
            style={{
              ...styles.actionBtn,
              ...(disabled ? styles.actionBtnDisabled : {}),
            }}
            className="header-action-btn"
            aria-label="Generate an AI word"
            title="Generate a fresh word with AI"
          >
            <span aria-hidden="true">✨</span>
            <span className="header-action-label">AI Word</span>
          </button>

          <div style={styles.actionDivider} aria-hidden="true" />

          <button
            onClick={onShowStats}
            style={styles.actionBtn}
            className="header-action-btn"
            aria-label="View stats"
            title="View your stats"
          >
            <span aria-hidden="true">📊</span>
            <span className="header-action-label">Stats</span>
          </button>
          <button
            onClick={onShowShortcuts}
            style={styles.actionBtn}
            className="header-action-btn"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <span aria-hidden="true">⌨️</span>
            <span className="header-action-label">Shortcuts</span>
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
      "linear-gradient(180deg, rgba(23,23,48,0.92) 0%, rgba(18,18,37,0.72) 100%)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    flexWrap: "wrap",
    gap: "14px",
    position: "relative",
    zIndex: 10,
    boxShadow:
      "inset 0 -1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.25)",
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  emoji: {
    fontSize: "30px",
    lineHeight: 1,
    filter: "drop-shadow(0 2px 10px rgba(255, 77, 109, 0.5))",
    animation: "floatY 4s ease-in-out infinite",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1,
  },
  titleText: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "28px",
    letterSpacing: "0.5px",
    background:
      "linear-gradient(90deg, #ff4d6d 0%, #ffb648 33%, #4ecdc4 66%, #9a6dff 100%)",
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    animation: "hueShift 6s ease-in-out infinite",
  },
  subtitle: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "2px",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  difficultyGroup: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: "999px",
  },
  diffBtn: {
    padding: "7px 14px",
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
    boxShadow: "0 2px 12px var(--accent-glow)",
  },
  diffBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    borderRadius: "10px",
    background: "var(--surface2)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  actionBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  actionDivider: {
    width: "1px",
    height: "22px",
    background: "var(--border)",
    margin: "0 2px",
  },
};
