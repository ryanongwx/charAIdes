import React from "react";

type LoadingState =
  | { type: "none" }
  | { type: "word-bank"; difficulty: string }
  | { type: "ai-generate"; difficulty: string }
  | { type: "word-of-day" };

interface LoadingIndicatorProps {
  state: LoadingState;
  onCancel?: () => void;
}

export default function LoadingIndicator({ state, onCancel }: LoadingIndicatorProps) {
  if (state.type === "none") return null;

  const messages: Record<string, string> = {
    "word-bank": `🎲 Picking a ${state.type === "word-bank" ? state.difficulty : ""} word...`,
    "ai-generate": `✨ AI is creating a ${state.type === "ai-generate" ? state.difficulty : ""} word...`,
    "word-of-day": "📅 Loading Word of the Day...",
  };

  const submessages: Record<string, string | undefined> = {
    "ai-generate": "This may take a few seconds",
  };

  return (
    <div
      style={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div style={styles.card}>
        <div style={styles.spinner} />
        <p style={styles.message}>{messages[state.type]}</p>
        {submessages[state.type] && (
          <p style={styles.submessage}>{submessages[state.type]}</p>
        )}
        {onCancel && (
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
    animation: "fadeIn 0.2s ease",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "32px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    minWidth: "280px",
    boxShadow: "var(--shadow)",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid var(--border)",
    borderTop: "4px solid var(--accent3)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  message: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text)",
    textAlign: "center",
  },
  submessage: {
    fontSize: "13px",
    color: "var(--text-muted)",
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: "4px",
    padding: "8px 24px",
    borderRadius: "8px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
