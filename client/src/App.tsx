import React, { useRef, useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import DrawingCanvas, { DrawingCanvasHandle } from "./components/DrawingCanvas";
import GuessPanel from "./components/GuessPanel";
import TimerBar from "./components/TimerBar";
import ResultOverlay from "./components/ResultOverlay";
import StatsPanel from "./components/StatsPanel";
import ShortcutsPanel from "./components/ShortcutsPanel";
import LoadingIndicator from "./components/LoadingIndicator";
import { useGameState } from "./hooks/useGameState";
import { useAudio } from "./hooks/useAudio";
import { useGameStats } from "./hooks/useGameStats";
import { useSoundEffects } from "./hooks/useSoundEffects";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useToast } from "./contexts/ToastContext";
import type { Difficulty } from "./hooks/useGameState";
import { apiUrl } from "./lib/api";

const AUTO_GUESS_MIN_MS = 2000;
const AUTO_GUESS_MAX_MS = 5000;
const UNCHANGED_EXTRA_PER_TICK_MS = 800;
const UNCHANGED_MAX_EXTRA_MS = 3000;

type LoadingState = 
  | { type: "none" }
  | { type: "word-bank"; difficulty: Difficulty }
  | { type: "ai-generate"; difficulty: Difficulty }
  | { type: "word-of-day" };

export default function App() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const { fetchAndPlay, stop: stopAudio } = useAudio();
  const { stats, recordGame, resetStats } = useGameStats();
  const { playClick, playSuccess, playError, playDraw } = useSoundEffects();
  const { showToast } = useToast();
  const [loadingState, setLoadingState] = useState<LoadingState>({ type: "none" });
  const [showStats, setShowStats] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const gameRecordedRef = useRef(false);
  const lastGuessedSigRef = useRef<string | null>(null);
  const unchangedTicksRef = useRef(0);
  const loadingAbortRef = useRef<AbortController | null>(null);
  const beginRoundRef = useRef<(d?: Difficulty) => void>(() => {});

  const {
    phase,
    difficulty,
    setDifficulty,
    wordEntry,
    guesses,
    timeLeft,
    hintUsed,
    startRound,
    startCustomRound,
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

    setGuessing(true);

    try {
      const image = canvas.getImageDataUrl();
      const guessHistory = guesses
        .filter((g) => !g.text.startsWith("💡"))
        .map((g) => g.text);
      const hint = hintUsed && wordEntry ? `Category: ${wordEntry.category}` : undefined;
      const canvasChanged = opts?.canvasChanged ?? true;

      const { guessText } = await fetchAndPlay(apiUrl("/api/guess"), {
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
            await fetchAndPlay(apiUrl("/api/celebrate"), {
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
      showToast("Couldn't reach the AI. Check your server and API keys.", "error", 5000);
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
    showToast,
  ]);

  // Auto-guess loop
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
        unchangedTicksRef.current = 0;
        schedule();
        return;
      }
      const sig = c.getImageDataUrl();
      const changed = sig !== lastGuessedSigRef.current;
      unchangedTicksRef.current = changed ? 0 : unchangedTicksRef.current + 1;
      lastGuessedSigRef.current = sig;
      void performGuess({ canvasChanged: changed });
    };

    schedule();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [phase, performGuess]);

  // Handle game lost
  useEffect(() => {
    if (phase !== "LOST" || !wordEntry) return;
    if (gameRecordedRef.current) return;
    gameRecordedRef.current = true;

    recordGame(false, guessCount);
    showToast(`⏰ Time's up! The word was "${wordEntry.word}"`, "warning", 5000);

    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        await fetchAndPlay(apiUrl("/api/celebrate"), {
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
  }, [phase, wordEntry, guessCount, fetchAndPlay, recordGame, showToast]);

  // Handle game won
  useEffect(() => {
    if (phase === "WON") {
      showToast(`🎉 You won in ${guessCount} guesses!`, "success", 5000);
    }
  }, [phase, guessCount, showToast]);

  const beginRound = useCallback(
    (d?: Difficulty, customWord?: { word: string; category: string; difficulty: Difficulty }) => {
      stopAudio();
      canvasRef.current?.clear();
      gameRecordedRef.current = false;
      lastGuessedSigRef.current = null;
      unchangedTicksRef.current = 0;
      playClick();

      if (customWord) {
        startCustomRound(customWord);
        setLoadingState({ type: "none" });
      } else {
        const targetDiff = d ?? difficulty;

        // Cancel any previous in-flight request
        loadingAbortRef.current?.abort();
        const controller = new AbortController();
        loadingAbortRef.current = controller;

        setLoadingState({ type: "word-bank", difficulty: targetDiff });

        const timeoutId = setTimeout(() => {
          controller.abort();
          setLoadingState({ type: "none" });
          showToast("Request timed out.", "error", 8000, {
            label: "Retry",
            onClick: () => beginRoundRef.current(d),
          });
        }, 15000);

        startRound(d, controller.signal)
          .catch((err) => {
            if ((err as Error)?.name === "AbortError") return;
            showToast("Failed to start game.", "error", 8000, {
              label: "Retry",
              onClick: () => beginRoundRef.current(d),
            });
            playError();
          })
          .finally(() => {
            clearTimeout(timeoutId);
            setLoadingState({ type: "none" });
            loadingAbortRef.current = null;
          });
      }
    },
    [startRound, startCustomRound, playClick, playError, stopAudio, difficulty, showToast]
  );

  // Keep ref current so retry closures always call the latest version
  beginRoundRef.current = beginRound;

  const handleGenerateWord = useCallback(async () => {
    if (!isIdle && !isOver) return;

    loadingAbortRef.current?.abort();
    const controller = new AbortController();
    loadingAbortRef.current = controller;

    setLoadingState({ type: "ai-generate", difficulty });
    playClick();

    const timeoutId = setTimeout(() => {
      controller.abort();
      setLoadingState({ type: "none" });
      showToast("Request timed out. Falling back to word bank.", "error", 5000);
      playError();
      beginRound(difficulty);
    }, 20000);

    try {
      const res = await fetch(apiUrl("/api/generate-word"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Failed to generate word");

      const word = await res.json();
      showToast(`✨ AI generated: "${word.word}"`, "success");
      beginRound(undefined, word);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("Generate word failed:", err);
      showToast("Failed to generate AI word. Using word bank instead.", "error");
      playError();
      beginRound(difficulty);
    } finally {
      clearTimeout(timeoutId);
      setLoadingState({ type: "none" });
      loadingAbortRef.current = null;
    }
  }, [isIdle, isOver, difficulty, playClick, playError, beginRound, showToast]);

  const handleWordOfTheDay = useCallback(async () => {
    if (!isIdle && !isOver) return;

    loadingAbortRef.current?.abort();
    const controller = new AbortController();
    loadingAbortRef.current = controller;

    setLoadingState({ type: "word-of-day" });
    playClick();

    const timeoutId = setTimeout(() => {
      controller.abort();
      setLoadingState({ type: "none" });
      showToast("Request timed out. Falling back to word bank.", "error", 5000);
      playError();
      beginRound(difficulty);
    }, 15000);

    try {
      const res = await fetch(apiUrl("/api/word-of-the-day"), { signal: controller.signal });

      if (!res.ok) throw new Error("Failed to get word of the day");

      const word = await res.json();
      showToast(`📅 Word of the Day: "${word.word}"`, "success");
      beginRound(undefined, word);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("Word of the day failed:", err);
      showToast("Failed to get word of the day. Using word bank instead.", "error");
      playError();
      beginRound(difficulty);
    } finally {
      clearTimeout(timeoutId);
      setLoadingState({ type: "none" });
      loadingAbortRef.current = null;
    }
  }, [isIdle, isOver, difficulty, playClick, playError, beginRound, showToast]);

  const handleCancelLoading = useCallback(() => {
    loadingAbortRef.current?.abort();
    loadingAbortRef.current = null;
    setLoadingState({ type: "none" });
  }, []);

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
      showToast("↩ Undone", "info", 1500);
      playClick();
    }
  }, [canUndo, playClick, showToast]);

  const handleClear = useCallback(() => {
    canvasRef.current?.clear();
    lastGuessedSigRef.current = null;
    showToast("🗑️ Canvas cleared", "info");
    playClick();
  }, [playClick, showToast]);

  const handleHint = useCallback(() => {
    useHint();
    showToast(`💡 Hint: Category is "${wordEntry?.category}"`, "info");
    playClick();
  }, [useHint, wordEntry, playClick, showToast]);

  const handleGuessNow = useCallback(() => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      showToast("Draw something first!", "warning");
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
  }, [isGuessing, performGuess, playClick, playError, showToast]);

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
  const isLoading = loadingState.type !== "none";

  return (
    <div style={styles.app} className="app-root">
      <Header
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        disabled={!isIdle && !isOver}
        onShowStats={() => setShowStats(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
        onGenerateWord={handleGenerateWord}
        onWordOfTheDay={handleWordOfTheDay}
      />

      <main style={styles.main} className="game-main">
        <div style={styles.leftCol} className="game-left-col">
          {isIdle ? (
            <div style={styles.startStrip} className="start-strip">
              <div style={styles.startStripGlow} aria-hidden="true" />
              <div style={styles.startStripInner} className="start-strip-inner">
                <div style={styles.startStripLeft}>
                  <div style={styles.startStripEmoji} aria-hidden="true">🎨</div>
                  <div>
                    <div style={styles.startStripEyebrow}>Ready when you are</div>
                    <div style={styles.startStripTitle} className="start-strip-title">
                      Let's draw something!
                    </div>
                    <div style={styles.startStripHint} className="start-strip-hint">
                      Word source: <strong>Word Bank</strong> · Use{" "}
                      <strong>📅 Daily</strong> or <strong>✨ AI Word</strong> in the top bar
                      to switch.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleStartGame}
                  disabled={isLoading}
                  style={{
                    ...styles.btn,
                    ...styles.btnPrimary,
                    ...styles.startBtn,
                    ...(isLoading ? styles.btnDisabled : {}),
                  }}
                  className="start-btn"
                  title="Start game (S)"
                >
                  {isLoading ? "⏳ Loading…" : "▶  Start Game"}
                </button>
              </div>
            </div>
          ) : wordEntry ? (
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
          ) : null}

          {canDraw && <TimerBar timeLeft={timeLeft} />}

          <DrawingCanvas
            ref={canvasRef}
            disabled={!canDraw}
            thinking={isGuessing}
            idleHint={isIdle}
            onStrokeStart={playDraw}
            onHistoryChange={handleCanvasHistory}
          />

          {!isIdle && (
            <div style={styles.controls} className="game-controls">
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
            </div>
          )}
        </div>

        <div style={styles.rightCol} className="game-right-col">
          <GuessPanel guesses={guesses} isGuessing={isGuessing} />
        </div>
      </main>

      <LoadingIndicator state={loadingState} onCancel={isLoading ? handleCancelLoading : undefined} />

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
            resetStats();
            playClick();
            showToast("Stats have been reset", "info", 2500);
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
    gap: "16px",
    padding: "16px 20px",
    overflow: "hidden",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: "1 1 0",
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
  startStrip: {
    position: "relative",
    borderRadius: "var(--radius-lg)",
    padding: "2px",
    background:
      "conic-gradient(from 90deg at 50% 50%, #ff4d6d, #ffb648, #4ecdc4, #9a6dff, #ff4d6d)",
    boxShadow: "0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03)",
    overflow: "hidden",
    animation: "fadeIn 0.3s ease",
    flexShrink: 0,
  },
  startStripGlow: {
    position: "absolute",
    inset: "-40%",
    background:
      "conic-gradient(from 0deg at 50% 50%, rgba(255,77,109,0.5), rgba(255,182,72,0.5), rgba(78,205,196,0.5), rgba(154,109,255,0.5), rgba(255,77,109,0.5))",
    filter: "blur(30px)",
    opacity: 0.35,
    animation: "spin 18s linear infinite",
    pointerEvents: "none",
    zIndex: 0,
  },
  startStripInner: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "22px 26px",
    borderRadius: "calc(var(--radius-lg) - 2px)",
    background:
      "linear-gradient(180deg, rgba(22,22,44,0.92) 0%, rgba(16,16,32,0.95) 100%)",
    flexWrap: "wrap",
  },
  startStripLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    minWidth: 0,
    flex: "1 1 300px",
  },
  startStripEmoji: {
    fontSize: "48px",
    lineHeight: 1,
    animation: "floatY 3s ease-in-out infinite",
    filter: "drop-shadow(0 6px 16px rgba(255, 77, 109, 0.45))",
    flexShrink: 0,
  },
  startStripEyebrow: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "2px",
    color: "var(--text-dim)",
    fontWeight: 600,
    marginBottom: "4px",
  },
  startStripTitle: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "28px",
    background: "linear-gradient(135deg, #ff4d6d 0%, #ffb648 45%, #4ecdc4 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    letterSpacing: "0.3px",
    lineHeight: 1.1,
  },
  startStripHint: {
    marginTop: "6px",
    fontSize: "12px",
    color: "var(--text-muted)",
    lineHeight: 1.4,
  },
  startBtn: {
    fontSize: "18px",
    padding: "16px 36px",
    animation: "pulseGlow 2.4s ease-in-out infinite",
    flexShrink: 0,
  },
  wordCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    animation: "slideUp 0.3s ease",
    boxShadow: "var(--shadow-sm)",
    flexWrap: "wrap",
    flexShrink: 0,
  },
  wordMeta: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  categoryBadge: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "12px",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  diffBadge: {
    background: "var(--accent-grad)",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "12px",
    color: "#fff",
    fontWeight: 700,
    textTransform: "capitalize",
    boxShadow: "0 2px 8px var(--accent-glow)",
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
    fontSize: "24px",
    color: "var(--accent3)",
    letterSpacing: "0.5px",
    textShadow: "0 0 24px var(--accent3-glow)",
  },
  controls: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
    flexShrink: 0,
  },
  btn: {
    padding: "11px 22px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 600,
    border: "1px solid transparent",
    transition: "all 0.18s ease",
    fontFamily: "'Fredoka One', cursive",
    letterSpacing: "0.3px",
  },
  btnPrimary: {
    background: "var(--accent-grad)",
    color: "#fff",
    boxShadow: "0 6px 20px var(--accent-glow)",
  },
  btnSecondary: {
    background: "var(--surface2)",
    color: "var(--text)",
    border: "1px solid var(--border-strong)",
  },
  btnGhost: {
    background: "transparent",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
  },
  btnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
    boxShadow: "none",
    animation: "none",
  },
};
