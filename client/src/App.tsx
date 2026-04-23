import React, { useRef, useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import DrawingCanvas, { DrawingCanvasHandle } from "./components/DrawingCanvas";
import GuessPanel from "./components/GuessPanel";
import TimerBar from "./components/TimerBar";
import ResultOverlay from "./components/ResultOverlay";
import StatsPanel from "./components/StatsPanel";
import ShortcutsPanel from "./components/ShortcutsPanel";
import { useGameState } from "./hooks/useGameState";
import { useAudio } from "./hooks/useAudio";
import { useGameStats } from "./hooks/useGameStats";
import { useSoundEffects } from "./hooks/useSoundEffects";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { Difficulty } from "./hooks/useGameState";

const AUTO_GUESS_MIN_MS = 2000;
const AUTO_GUESS_MAX_MS = 5000;
// When the canvas hasn't changed since the last guess, give the player a beat
// longer between blurts — feels less like the AI is shouting over them.
const UNCHANGED_EXTRA_PER_TICK_MS = 800;
const UNCHANGED_MAX_EXTRA_MS = 3000;

export default function App() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const { fetchAndPlay, stop: stopAudio } = useAudio();
  const { stats, recordGame, resetStats } = useGameStats();
  const { playClick, playSuccess, playError, playDraw } = useSoundEffects();
  const [error, setError] = useState<string | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const gameRecordedRef = useRef(false);
  const lastGuessedSigRef = useRef<string | null>(null);
  const unchangedTicksRef = useRef(0);

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

  const handleCanvasHistory = useCallback((undo: boolean, empty: boolean) => {
    setCanUndo(undo);
    setCanvasEmpty(empty);
  }, []);

  const performGuess = useCallback(async (opts?: { canvasChanged?: boolean }): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.isEmpty()) return;

    setError(null);
    setGuessing(true);

    try {
      const image = canvas.getImageDataUrl();
      const guessHistory = guesses
        .filter((g) => !g.text.startsWith("💡"))
        .map((g) => g.text);
      const hint = hintUsed && wordEntry ? `Category: ${wordEntry.category}` : undefined;
      const canvasChanged = opts?.canvasChanged ?? true;

      const { guessText } = await fetchAndPlay("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, guessHistory, hint, canvasChanged }),
      });

      if (guessText) {
        const correct = addGuess(guessText);

        if (correct) {
          playSuccess();
          gameRecordedRef.current = true;
          recordGame(true, guessCount + 1);
          try {
            await fetchAndPlay("/api/celebrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                won: true,
                word: wordEntry?.word ?? "",
                guessCount: guessCount + 1,
              }),
            });
          } catch (celebrateErr) {
            console.warn("Celebrate audio failed:", celebrateErr);
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("Guess failed:", err);
      setError("Couldn't reach the AI. Check your server and API keys.");
      playError();
    } finally {
      setGuessing(false);
    }
  }, [
    guesses,
    hintUsed,
    wordEntry,
    fetchAndPlay,
    addGuess,
    setGuessing,
    guessCount,
    playSuccess,
    playError,
    recordGame,
  ]);

  // Auto-guess loop: while in DRAWING phase, every 2-5s, fire a guess if the
  // canvas has new content. Skips when canvas is empty or unchanged.
  useEffect(() => {
    if (phase !== "DRAWING") return;

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (cancelled) return;
      const base = AUTO_GUESS_MIN_MS + Math.random() * (AUTO_GUESS_MAX_MS - AUTO_GUESS_MIN_MS);
      const stuckBonus = Math.min(
        unchangedTicksRef.current * UNCHANGED_EXTRA_PER_TICK_MS,
        UNCHANGED_MAX_EXTRA_MS
      );
      timerId = setTimeout(tick, base + stuckBonus);
    };

    const tick = () => {
      if (cancelled) return;
      const c = canvasRef.current;
      if (!c || c.isEmpty()) {
        // Nothing to react to — reset the stuck counter and try again later.
        unchangedTicksRef.current = 0;
        schedule();
        return;
      }
      const sig = c.getImageDataUrl();
      const changed = sig !== lastGuessedSigRef.current;
      unchangedTicksRef.current = changed ? 0 : unchangedTicksRef.current + 1;
      lastGuessedSigRef.current = sig;
      // Fire the guess either way — let the AI reconsider, ask for more,
      // or express confusion when the drawing is static.
      void performGuess({ canvasChanged: changed });
    };

    schedule();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [phase, performGuess]);

  useEffect(() => {
    if (phase !== "LOST" || !wordEntry) return;
    if (gameRecordedRef.current) return;
    gameRecordedRef.current = true;

    recordGame(false, guessCount);

    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        await fetchAndPlay("/api/celebrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ won: false, word: wordEntry.word, guessCount }),
        });
      } catch {
        // non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, wordEntry, guessCount, fetchAndPlay, recordGame]);

  const beginRound = useCallback(
    (d?: Difficulty) => {
      stopAudio();
      canvasRef.current?.clear();
      setIsLoadingWord(true);
      setError(null);
      gameRecordedRef.current = false;
      lastGuessedSigRef.current = null;
      unchangedTicksRef.current = 0;
      playClick();
      startRound(d)
        .catch(() => {
          setError("Failed to start game. Check your connection and server.");
          playError();
        })
        .finally(() => setIsLoadingWord(false));
    },
    [startRound, playClick, playError, stopAudio]
  );

  const handlePlayAgain = useCallback(() => beginRound(difficulty), [beginRound, difficulty]);
  const handleStartGame = useCallback(() => beginRound(), [beginRound]);

  const handleDifficultyChange = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
      playClick();
    },
    [setDifficulty, playClick]
  );

  const handleUndo = useCallback(() => {
    if (canUndo) {
      canvasRef.current?.undo();
      playClick();
    }
  }, [canUndo, playClick]);

  const handleClear = useCallback(() => {
    canvasRef.current?.clear();
    lastGuessedSigRef.current = null;
    playClick();
  }, [playClick]);

  const handleHint = useCallback(() => {
    useHint();
    playClick();
  }, [useHint, playClick]);

  const handleGuessNow = useCallback(() => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      setError("Draw something first!");
      playError();
      return;
    }
    if (isGuessing) return;
    playClick();
    const sig = canvasRef.current.getImageDataUrl();
    const changed = sig !== lastGuessedSigRef.current;
    unchangedTicksRef.current = changed ? 0 : unchangedTicksRef.current + 1;
    lastGuessedSigRef.current = sig;
    void performGuess({ canvasChanged: changed });
  }, [isGuessing, performGuess, playClick, playError]);

  useKeyboardShortcuts(
    {
      onGuess: isDrawing && !canvasEmpty && !isGuessing ? handleGuessNow : undefined,
      onClear: (isDrawing || isGuessing) && !canvasEmpty ? handleClear : undefined,
      onHint: !hintUsed && (isDrawing || isGuessing) ? handleHint : undefined,
      onUndo: (isDrawing || isGuessing) && canUndo ? handleUndo : undefined,
      onStart: isIdle || isOver ? handleStartGame : undefined,
    },
    true
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !showStats) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      } else if (e.key === "Escape") {
        if (showShortcuts) setShowShortcuts(false);
        if (showStats) setShowStats(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStats, showShortcuts]);

  const canDraw = isDrawing || isGuessing;

  return (
    <div style={styles.app}>
      <Header
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        disabled={!isIdle && !isOver}
        onShowStats={() => setShowStats(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <main style={styles.main}>
        <div style={styles.leftCol}>
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

          {canDraw && <TimerBar timeLeft={timeLeft} />}

          <DrawingCanvas
            ref={canvasRef}
            disabled={!canDraw}
            thinking={isGuessing}
            onStrokeStart={playDraw}
            onHistoryChange={handleCanvasHistory}
          />

          <div style={styles.controls}>
            {isIdle ? (
              <button
                onClick={handleStartGame}
                disabled={isLoadingWord}
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  fontSize: "18px",
                  padding: "16px 40px",
                  ...(isLoadingWord ? styles.btnDisabled : {}),
                }}
                title="Start game (S)"
              >
                {isLoadingWord ? "⏳ Loading..." : "🎮 Start Game"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleGuessNow}
                  disabled={isGuessing || isOver || canvasEmpty}
                  style={{
                    ...styles.btn,
                    ...styles.btnSecondary,
                    ...(isGuessing || canvasEmpty ? styles.btnDisabled : {}),
                  }}
                  aria-label="Force AI to guess now"
                  title={canvasEmpty ? "Draw something first" : "Skip the wait — Space or Enter"}
                >
                  ⚡ Guess Now
                </button>

                <button
                  onClick={handleHint}
                  disabled={hintUsed || isOver}
                  style={{
                    ...styles.btn,
                    ...styles.btnSecondary,
                    ...(hintUsed ? styles.btnDisabled : {}),
                  }}
                  aria-label="Use hint"
                  title={hintUsed ? "Hint already used" : "Get a category hint (H)"}
                >
                  💡 {hintUsed ? "Hint Used" : "Hint"}
                </button>

                <button
                  onClick={handleUndo}
                  disabled={!canUndo || isOver}
                  style={{
                    ...styles.btn,
                    ...styles.btnGhost,
                    ...(!canUndo ? styles.btnDisabled : {}),
                  }}
                  aria-label="Undo last stroke"
                  title="Undo (Ctrl/Cmd+Z)"
                >
                  ↩ Undo
                </button>

                <button
                  onClick={handleClear}
                  disabled={isOver || canvasEmpty}
                  style={{
                    ...styles.btn,
                    ...styles.btnGhost,
                    ...(canvasEmpty ? styles.btnDisabled : {}),
                  }}
                  aria-label="Clear canvas"
                  title="Clear canvas (C)"
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

        <div style={styles.rightCol}>
          <GuessPanel guesses={guesses} isGuessing={isGuessing} />
        </div>
      </main>

      <ResultOverlay
        phase={phase}
        word={wordEntry?.word ?? ""}
        guessCount={guessCount}
        onPlayAgain={handlePlayAgain}
      />

      {showStats && (
        <StatsPanel
          stats={stats}
          onClose={() => setShowStats(false)}
          onReset={() => {
            if (confirm("Are you sure you want to reset all stats?")) {
              resetStats();
              playClick();
            }
          }}
        />
      )}

      {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}
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
    animation: "slideUp 0.3s ease",
  },
  wordMeta: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
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
    flexWrap: "wrap",
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
    animation: "shake 0.5s ease",
  },
};
