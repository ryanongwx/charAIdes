import React, { useState } from "react";
import type { GameStats } from "../hooks/useGameStats";

interface StatsPanelProps {
  stats: GameStats;
  onClose: () => void;
  onReset: () => void;
}

export default function StatsPanel({ stats, onClose, onReset }: StatsPanelProps) {
  const [confirming, setConfirming] = useState(false);

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>📊 Your Stats</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={styles.grid}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{stats.gamesPlayed}</div>
            <div style={styles.statLabel}>Games Played</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{winRate}%</div>
            <div style={styles.statLabel}>Win Rate</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{stats.currentStreak}</div>
            <div style={styles.statLabel}>Current Streak</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{stats.bestStreak}</div>
            <div style={styles.statLabel}>Best Streak</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>
              {stats.bestGuessCount === Infinity ? "-" : stats.bestGuessCount}
            </div>
            <div style={styles.statLabel}>Best Score</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>
              {stats.gamesPlayed > 0 ? stats.averageGuesses.toFixed(1) : "-"}
            </div>
            <div style={styles.statLabel}>Avg Guesses</div>
          </div>
        </div>

        {confirming ? (
          <div style={styles.confirmRow}>
            <span style={styles.confirmText}>Reset all stats?</span>
            <button
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
              style={{ ...styles.confirmBtn, ...styles.confirmYes }}
            >
              Yes, reset
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={styles.confirmBtn}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} style={styles.resetBtn}>
            🔄 Reset Stats
          </button>
        )}
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
    animation: "fadeIn 0.2s ease",
  },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  title: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "24px",
    color: "var(--accent3)",
    margin: 0,
  },
  closeBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  stat: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  statValue: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "28px",
    color: "var(--accent2)",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "12px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  resetBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  confirmRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  confirmText: {
    flex: 1,
    fontSize: "14px",
    color: "var(--text-muted)",
  },
  confirmBtn: {
    padding: "8px 16px",
    borderRadius: "10px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  confirmYes: {
    background: "var(--accent)",
    border: "1px solid var(--accent)",
    color: "#fff",
  },
};
