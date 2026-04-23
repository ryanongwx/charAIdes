import React, { useEffect, useRef } from "react";
import type { GuessEntry } from "../hooks/useGameState";

interface GuessPanelProps {
  guesses: GuessEntry[];
  isGuessing: boolean;
}

export default function GuessPanel({ guesses, isGuessing }: GuessPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guesses, isGuessing]);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.aiAvatar} aria-hidden="true">🤖</span>
        <span style={styles.headerText}>AI Guesser</span>
        {guesses.length > 0 && (
          <span style={styles.badge}>{guesses.filter(g => !g.text.startsWith("💡")).length} guesses</span>
        )}
      </div>

      <div style={styles.list} role="log" aria-live="polite" aria-label="Guess history">
        {guesses.length === 0 && !isGuessing && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon} aria-hidden="true">🎨</div>
            <p style={styles.emptyTitle}>
              Just start drawing — <strong style={{ color: "var(--text)" }}>the AI will guess as you go</strong>.
            </p>
            <p style={styles.emptyHint}>
              Every couple of seconds it'll call out what it thinks you're drawing.
            </p>
          </div>
        )}

        {guesses.map((g, i) => (
          <div
            key={g.timestamp}
            style={{
              ...styles.guessItem,
              ...(g.correct ? styles.guessCorrect : {}),
              ...(g.text.startsWith("💡") ? styles.guessHint : {}),
              animation: "fadeIn 0.3s ease",
            }}
          >
            {g.text.startsWith("💡") ? (
              <span>{g.text}</span>
            ) : (
              <>
                <span style={styles.guessNumber}>#{i + 1 - guesses.slice(0, i + 1).filter(x => x.text.startsWith("💡")).length}</span>
                <span style={styles.guessText}>{g.text}</span>
                {g.correct && <span style={styles.correctBadge}>✓ Correct!</span>}
              </>
            )}
          </div>
        ))}

        {isGuessing && (
          <div style={{ ...styles.guessItem, ...styles.thinking }}>
            <span style={styles.guessNumber}>🤔</span>
            <span>Thinking</span>
            <span style={styles.dots}>
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(180deg, rgba(30,30,60,0.55) 0%, rgba(23,23,48,0.75) 100%)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    overflow: "hidden",
    height: "100%",
    minHeight: "320px",
    boxShadow: "var(--shadow-sm)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 18px",
    borderBottom: "1px solid var(--border)",
    background:
      "linear-gradient(90deg, rgba(78,205,196,0.10) 0%, rgba(154,109,255,0.08) 100%)",
  },
  aiAvatar: {
    fontSize: "22px",
    filter: "drop-shadow(0 2px 6px rgba(78,205,196,0.4))",
    animation: "bounceSoft 2.2s ease-in-out infinite",
    display: "inline-block",
  },
  headerText: {
    fontWeight: 700,
    fontSize: "14px",
    flex: 1,
    letterSpacing: "0.2px",
  },
  badge: {
    background: "var(--accent-grad)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: "999px",
    boxShadow: "0 2px 8px var(--accent-glow)",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    flex: 1,
    color: "var(--text-muted)",
    textAlign: "center",
    padding: "28px 20px",
  },
  emptyIcon: {
    fontSize: "40px",
    lineHeight: 1,
    animation: "floatY 3s ease-in-out infinite",
    filter: "drop-shadow(0 4px 14px rgba(78,205,196,0.25))",
  },
  emptyTitle: {
    fontSize: "14px",
    lineHeight: 1.5,
    maxWidth: "240px",
  },
  emptyHint: {
    fontSize: "12px",
    color: "var(--text-dim)",
    maxWidth: "240px",
  },
  guessItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "10px 14px",
    background: "var(--surface2)",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    fontSize: "14px",
    lineHeight: 1.4,
  },
  guessCorrect: {
    background:
      "linear-gradient(135deg, rgba(46,204,113,0.22) 0%, rgba(46,204,113,0.08) 100%)",
    border: "1px solid var(--success)",
    boxShadow: "0 0 0 1px rgba(46,204,113,0.2), 0 4px 16px rgba(46,204,113,0.15)",
  },
  guessHint: {
    background: "rgba(245,166,35,0.1)",
    border: "1px solid var(--accent2)",
    fontSize: "13px",
    color: "var(--accent2)",
  },
  guessNumber: {
    color: "var(--text-muted)",
    fontSize: "12px",
    minWidth: "24px",
    paddingTop: "1px",
  },
  guessText: {
    flex: 1,
  },
  correctBadge: {
    color: "var(--success)",
    fontWeight: 700,
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  thinking: {
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  dots: {
    display: "inline-flex",
    gap: "2px",
  },
};
