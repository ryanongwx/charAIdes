import React, { useEffect, useState } from "react";
import { formatDuration } from "../hooks/useRateLimit";

interface RateLimitModalProps {
  used: number;
  limit: number;
  resetAt: number;
  onClose: () => void;
}

export default function RateLimitModal({
  used,
  limit,
  resetAt,
  onClose,
}: RateLimitModalProps) {
  const [msLeft, setMsLeft] = useState(() => Math.max(0, resetAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setMsLeft(Math.max(0, resetAt - Date.now()));
    }, 30_000);
    return () => clearInterval(id);
  }, [resetAt]);

  return (
    <div
      style={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-limit-title"
      onClick={onClose}
    >
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.emoji} aria-hidden="true">⏳</div>
        <h2 id="rate-limit-title" style={styles.title}>
          Daily limit reached
        </h2>
        <p style={styles.body}>
          You've used all <strong>{limit}</strong> of your daily games
          {" "}({used}/{limit}). This cap keeps our AI credits from running
          out so everyone can play.
        </p>

        <div style={styles.resetRow}>
          <span style={styles.resetLabel}>Resets in</span>
          <span style={styles.resetValue}>{formatDuration(msLeft)}</span>
        </div>

        <button onClick={onClose} style={styles.okBtn} autoFocus>
          Got it
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
    zIndex: 120,
    backdropFilter: "blur(4px)",
    animation: "fadeIn 0.25s ease",
    padding: "20px",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "36px 40px",
    textAlign: "center",
    maxWidth: "420px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  },
  emoji: {
    fontSize: "52px",
    lineHeight: 1,
    animation: "floatY 3s ease-in-out infinite",
  },
  title: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "28px",
    margin: 0,
    color: "var(--accent)",
  },
  body: {
    fontSize: "14px",
    color: "var(--text-muted)",
    lineHeight: 1.5,
    maxWidth: "340px",
  },
  resetRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "var(--surface2)",
    padding: "12px 20px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
  },
  resetLabel: {
    fontSize: "13px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
  },
  resetValue: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "22px",
    color: "var(--accent3)",
  },
  okBtn: {
    marginTop: "8px",
    padding: "12px 28px",
    borderRadius: "12px",
    background: "var(--accent-grad)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontFamily: "'Fredoka One', cursive",
    letterSpacing: "0.5px",
    boxShadow: "0 6px 20px var(--accent-glow)",
  },
};
