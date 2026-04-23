import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GuessEntry } from "../hooks/useGameState";

interface LatestGuessChipProps {
  guesses: GuessEntry[];
  isGuessing: boolean;
  visible: boolean;
}

/**
 * A compact "what the AI just said" chip shown only on mobile.
 *
 * Why this exists: on phones the GuessPanel is stacked below the canvas,
 * so the user can't see the AI's guesses without scrolling away from the
 * drawing surface. This chip surfaces the most recent guess (or a
 * "thinking…" state) right next to the canvas so they never have to.
 *
 * Visibility is controlled via CSS (`.mobile-only`) so it disappears
 * cleanly on desktop where the full panel is already visible.
 */
export default function LatestGuessChip({
  guesses,
  isGuessing,
  visible,
}: LatestGuessChipProps) {
  const latestNonHint = useMemo(() => {
    for (let i = guesses.length - 1; i >= 0; i--) {
      const g = guesses[i];
      if (!g.text.startsWith("💡")) return g;
    }
    return null;
  }, [guesses]);

  // Re-trigger the pop animation whenever a new guess arrives.
  const [animKey, setAnimKey] = useState(0);
  const lastStampRef = useRef<number | null>(null);
  useEffect(() => {
    if (latestNonHint && latestNonHint.timestamp !== lastStampRef.current) {
      lastStampRef.current = latestNonHint.timestamp;
      setAnimKey((k) => k + 1);
    }
  }, [latestNonHint]);

  if (!visible) return null;

  const hasContent = isGuessing || latestNonHint !== null;
  if (!hasContent) return null;

  const isCorrect = latestNonHint?.correct ?? false;

  return (
    <div
      className="mobile-only latest-guess-chip"
      style={{
        ...styles.chip,
        ...(isCorrect ? styles.chipCorrect : {}),
      }}
      role="status"
      aria-live="polite"
    >
      <span style={styles.avatar} aria-hidden="true">🤖</span>
      {isGuessing && !latestNonHint && (
        <span style={styles.thinking}>
          Thinking
          <span style={styles.dots}>
            <span>.</span><span>.</span><span>.</span>
          </span>
        </span>
      )}
      {latestNonHint && (
        <span
          key={animKey}
          style={{
            ...styles.text,
            animation: "chipPop 0.35s ease",
          }}
        >
          <span style={styles.prefix}>
            {isCorrect ? "Got it:" : "Is it a"}
          </span>
          <span style={styles.word}>{latestNonHint.text}</span>
          {isGuessing && !isCorrect && (
            <span style={styles.dots}>
              <span>.</span><span>.</span><span>.</span>
            </span>
          )}
        </span>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  chip: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "999px",
    background:
      "linear-gradient(135deg, rgba(78,205,196,0.18) 0%, rgba(154,109,255,0.16) 100%)",
    border: "1px solid rgba(78,205,196,0.4)",
    boxShadow:
      "0 6px 18px rgba(78,205,196,0.18), 0 1px 0 rgba(255,255,255,0.06) inset",
    color: "var(--text)",
    fontSize: "14px",
    fontWeight: 600,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    maxWidth: "100%",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  chipCorrect: {
    background:
      "linear-gradient(135deg, rgba(46,204,113,0.28) 0%, rgba(46,204,113,0.12) 100%)",
    border: "1px solid var(--success)",
    boxShadow:
      "0 6px 22px rgba(46,204,113,0.3), 0 1px 0 rgba(255,255,255,0.08) inset",
  },
  avatar: {
    fontSize: "20px",
    lineHeight: 1,
    filter: "drop-shadow(0 2px 6px rgba(78,205,196,0.4))",
    animation: "bounceSoft 2.2s ease-in-out infinite",
    flexShrink: 0,
  },
  text: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: "6px",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  prefix: {
    color: "var(--text-muted)",
    fontSize: "12px",
    fontWeight: 500,
    letterSpacing: "0.2px",
  },
  word: {
    color: "var(--text)",
    fontFamily: "'Fredoka One', cursive",
    fontSize: "16px",
    letterSpacing: "0.3px",
  },
  thinking: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: "4px",
    color: "var(--text-muted)",
    fontStyle: "italic",
    fontSize: "13px",
  },
  dots: {
    display: "inline-flex",
    gap: "2px",
    color: "var(--accent3)",
  },
};
