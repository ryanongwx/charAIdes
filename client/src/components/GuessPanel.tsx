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
            <span style={{ fontSize: "32px" }}>🎨</span>
            <p>Just start drawing — <strong>the AI will guess as you go</strong>.</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
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
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    overflow: "hidden",
    height: "100%",
    minHeight: "300px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface2)",
  },
  aiAvatar: {
    fontSize: "20px",
  },
  headerText: {
    fontWeight: 600,
    fontSize: "14px",
    flex: 1,
  },
  badge: {
    background: "var(--accent)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "10px",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flex: 1,
    color: "var(--text-muted)",
    textAlign: "center",
    padding: "24px",
  },
  guessItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "10px 12px",
    background: "var(--surface2)",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    fontSize: "14px",
    lineHeight: 1.4,
  },
  guessCorrect: {
    background: "rgba(46,204,113,0.15)",
    border: "1px solid var(--success)",
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
