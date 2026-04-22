import React, { useRef, useState, useCallback } from "react";
import Header from "./components/Header";
import DrawingCanvas, { DrawingCanvasHandle } from "./components/DrawingCanvas";
import GuessPanel from "./components/GuessPanel";
import TimerBar from "./components/TimerBar";
import ResultOverlay from "./components/ResultOverlay";
import { useGameState } from "./hooks/useGameState";
import { useAudio } from "./hooks/useAudio";
import type { Difficulty } from "./hooks/useGameState";

export default function App() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const { fetchAndPlay } = useAudio();
  const [error, setError] = useState<string | null>(null);

  const {
    phase,
    difficulty,
    setDifficulty,
    wordEntry,
    guesses,
    timeLeft,
    hintUsed,
    startRound,
    addGuess,
    useHint,
    setGuessing,
    guessCount,
  } = useGameState();

  const isIdle = phase === "IDLE";
  const isDrawing = phase === "DRAWING";
  const isGuessing = phase === "GUESSING";
  const isOver = phase === "WON" || phase === "LOST";

  const handleGuess = useCallback(async () => {
    if (!canvasRef.current || phase !== "DRAWING") return;
    setError(null);
    setGuessing(true);

    try {
      const image = canvasRef.current.getImageDataUrl();
      const guessHistory = guesses
        .filter((g) => !g.text.startsWith("💡"))
        .map((g) => g.text);
      const hint = hintUsed ? `Category: ${wordEntry?.category}` : undefined;

      const { guessText } = await fetchAndPlay("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, guessHistory, hint }),
      });

      if (guessText) {
        const correct = addGuess(guessText);

        if (correct) {
          // Play celebration audio
          await fetchAndPlay("/api/celebrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              won: true,
              word: wordEntry?.word ?? "",
              guessCount: guessCount + 1,
            }),
          });
        }
      }
    } catch (err) {
      console.error("Guess failed:", err);
      setError("Couldn't reach the AI. Check your API keys and server.");
    } finally {
      setGuessing(false);
    }
  }, [phase, guesses, hintUsed, wordEntry, fetchAndPlay, addGuess, setGuessing, guessCount]);

  const handleLostCelebration = useCallback(async () => {
    if (!wordEntry) return;
    try {
      await fetchAndPlay("/api/celebrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ won: false, word: wordEntry.word, guessCount }),
      });
    } catch {
      // non-critical
    }
  }, [wordEntry, guessCount, fetchAndPlay]);

  // Trigger lost audio when phase becomes LOST
  const prevPhaseRef = useRef(phase);
  if (prevPhaseRef.current !== phase) {
    prevPhaseRef.current = phase;
    if (phase === "LOST") {
      handleLostCelebration();
    }
  }

  const handlePlayAgain = useCallback(() => {
    canvasRef.current?.clear();
    startRound(difficulty);
  }, [startRound, difficulty]);

  const handleDifficultyChange = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
    },
    [setDifficulty]
  );

  return (
    <div style={styles.app}>
      <Header
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        disabled={!isIdle && !isOver}
      />

      <main style={styles.main}>
        {/* Left: Drawing area */}
        <div style={styles.leftCol}>
          {/* Word display */}
          {wordEntry && !isIdle && (
            <div style={styles.wordCard}>
              <div style={styles.wordMeta}>
                <span style={styles.categoryBadge}>{wordEntry.category}</span>
                <span style={styles.diffBadge}>{wordEntry.difficulty}</span>
              </div>
              <div style={styles.secretWord}>
                <span style={styles.wordLabel}>Your word:</span>
                <span style={styles.wordValue}>{wordEntry.word}</span>
              </div>
            </div>
          )}

          {/* Timer */}
          {isDrawing || isGuessing ? (
            <TimerBar timeLeft={timeLeft} />
          ) : null}

          {/* Canvas */}
          <DrawingCanvas
            ref={canvasRef}
            disabled={isGuessing || isIdle || isOver}
          />

          {/* Controls */}
          <div style={styles.controls}>
            {isIdle ? (
              <button
                onClick={() => startRound()}
                style={{ ...styles.btn, ...styles.btnPrimary, fontSize: "18px", padding: "16px 40px" }}
              >
                🎮 Start Game
              </button>
            ) : (
              <>
                <button
                  onClick={handleGuess}
                  disabled={isGuessing || isOver}
                  style={{
                    ...styles.btn,
                    ...styles.btnPrimary,
                    ...(isGuessing ? styles.btnDisabled : {}),
                  }}
                  aria-label="Ask AI to guess"
                >
                  {isGuessing ? "🤔 Thinking..." : "🔍 Guess!"}
                </button>

                <button
                  onClick={() => {
                    useHint();
                  }}
                  disabled={hintUsed || isGuessing || isOver}
                  style={{
                    ...styles.btn,
                    ...styles.btnSecondary,
                    ...(hintUsed ? styles.btnDisabled : {}),
                  }}
                  aria-label="Use hint"
                  title={hintUsed ? "Hint already used" : "Get a category hint (+1 guess penalty)"}
                >
                  💡 {hintUsed ? "Hint Used" : "Hint"}
                </button>

                <button
                  onClick={() => canvasRef.current?.clear()}
                  disabled={isGuessing || isOver}
                  style={{ ...styles.btn, ...styles.btnGhost }}
                  aria-label="Clear canvas"
                >
                  🗑️ Clear
                </button>
              </>
            )}
          </div>

          {error && (
            <div style={styles.errorBanner} role="alert">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Right: Guess panel */}
        <div style={styles.rightCol}>
          <GuessPanel guesses={guesses} isGuessing={isGuessing} />
        </div>
      </main>

      {/* Result overlay */}
      <ResultOverlay
        phase={phase}
        word={wordEntry?.word ?? ""}
        guessCount={guessCount}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  main: {
    display: "flex",
    flex: 1,
    gap: "20px",
    padding: "20px 24px",
    overflow: "hidden",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: "1 1 600px",
    minWidth: 0,
    overflowY: "auto",
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    flex: "0 0 280px",
    minWidth: "240px",
    overflowY: "auto",
  },
  wordCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  wordMeta: {
    display: "flex",
    gap: "6px",
  },
  categoryBadge: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "3px 8px",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  diffBadge: {
    background: "var(--accent)",
    borderRadius: "6px",
    padding: "3px 8px",
    fontSize: "12px",
    color: "#fff",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  secretWord: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  wordLabel: {
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  wordValue: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "22px",
    color: "var(--accent3)",
    letterSpacing: "0.5px",
  },
  controls: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  btn: {
    padding: "10px 20px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    border: "none",
    transition: "all 0.15s",
    fontFamily: "'Fredoka One', cursive",
    letterSpacing: "0.3px",
  },
  btnPrimary: {
    background: "var(--accent)",
    color: "#fff",
  },
  btnSecondary: {
    background: "var(--accent2)",
    color: "#000",
  },
  btnGhost: {
    background: "var(--surface2)",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  errorBanner: {
    background: "rgba(233,69,96,0.15)",
    border: "1px solid var(--accent)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "var(--accent)",
  },
};
