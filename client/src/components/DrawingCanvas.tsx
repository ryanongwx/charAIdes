import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";

export interface DrawingCanvasHandle {
  getImageDataUrl: () => string;
  clear: () => void;
  undo: () => void;
  isEmpty: () => boolean;
}

interface DrawingCanvasProps {
  disabled?: boolean;
  thinking?: boolean;
  idleHint?: boolean;
  onStrokeStart?: () => void;
  onStrokeEnd?: () => void;
  onHistoryChange?: (canUndo: boolean, isEmpty: boolean) => void;
}

const COLORS = [
  "#000000", "#ffffff", "#e94560", "#f5a623", "#f7e017",
  "#2ecc71", "#4ecdc4", "#3498db", "#9b59b6", "#e67e22",
  "#795548", "#607d8b",
];

const BRUSH_SIZES = [
  { label: "S", size: 4 },
  { label: "M", size: 10 },
  { label: "L", size: 20 },
];

const HISTORY_CAP = 10;

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ disabled = false, thinking = false, idleHint = false, onStrokeStart, onStrokeEnd, onHistoryChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(10);
    const [isErasing, setIsErasing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [hasDrawn, setHasDrawn] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    const activeColor = isErasing ? "#ffffff" : color;

    useEffect(() => {
      onHistoryChange?.(history.length > 0, !hasDrawn);
    }, [history.length, hasDrawn, onHistoryChange]);

    const fillWhite = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    useImperativeHandle(ref, () => ({
      getImageDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas) return "";
        return canvas.toDataURL("image/png");
      },
      clear: () => {
        fillWhite();
        setHistory([]);
        setHasDrawn(false);
      },
      undo: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        setHistory((h) => {
          if (h.length === 0) return h;
          const prev = h[h.length - 1];
          ctx.putImageData(prev, 0, 0);
          const next = h.slice(0, -1);
          if (next.length === 0) setHasDrawn(false);
          return next;
        });
      },
      isEmpty: () => !hasDrawn,
    }));

    useEffect(() => {
      fillWhite();
    }, [fillWhite]);

    const getPos = useCallback(
      (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ("touches" in e) {
          const touch = e.touches[0];
          if (!touch) return null;
          return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
          };
        }
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      },
      []
    );

    const saveHistory = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev.slice(-(HISTORY_CAP - 1)), imageData]);
    }, []);

    const startDraw = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        saveHistory();
        onStrokeStart?.();
        const pos = getPos(e);
        if (!pos) return;
        lastPos.current = pos;
        setIsDrawing(true);
        setHasDrawn(true);

        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = activeColor;
          ctx.fill();
        }
      },
      [disabled, getPos, saveHistory, brushSize, activeColor, onStrokeStart]
    );

    const draw = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return;
        e.preventDefault();
        const pos = getPos(e);
        if (!pos || !lastPos.current) return;

        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        lastPos.current = pos;
      },
      [isDrawing, disabled, getPos, activeColor, brushSize]
    );

    const stopDraw = useCallback(() => {
      if (isDrawing) {
        onStrokeEnd?.();
      }
      setIsDrawing(false);
      lastPos.current = null;
    }, [isDrawing, onStrokeEnd]);

    return (
      <div style={styles.wrapper}>
        <div style={styles.toolbar} className="canvas-toolbar">
          <div style={styles.colorGrid} role="group" aria-label="Color palette">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setIsErasing(false); }}
                aria-label={`Select color ${c}`}
                aria-pressed={!isErasing && color === c}
                style={{
                  ...styles.colorSwatch,
                  background: c,
                  border: !isErasing && color === c
                    ? "3px solid #fff"
                    : "2px solid rgba(255,255,255,0.15)",
                  transform: !isErasing && color === c ? "scale(1.22)" : "scale(1)",
                  boxShadow:
                    !isErasing && color === c
                      ? `0 0 0 3px ${c}66, 0 2px 10px rgba(0,0,0,0.35)`
                      : "0 1px 3px rgba(0,0,0,0.35)",
                }}
              />
            ))}
          </div>

          <div style={styles.divider} className="toolbar-divider" />

          <div style={styles.brushGroup} role="group" aria-label="Brush size">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => setBrushSize(b.size)}
                aria-pressed={brushSize === b.size}
                aria-label={`Brush size ${b.label}`}
                style={{
                  ...styles.brushBtn,
                  background:
                    brushSize === b.size ? "var(--accent-grad)" : "var(--surface2)",
                  color: brushSize === b.size ? "#fff" : "var(--text-muted)",
                  border:
                    brushSize === b.size
                      ? "1px solid transparent"
                      : "1px solid var(--border)",
                  boxShadow:
                    brushSize === b.size ? "0 2px 8px var(--accent-glow)" : "none",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div style={styles.divider} className="toolbar-divider" />

          <button
            onClick={() => {
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext("2d");
              if (!canvas || !ctx || history.length === 0) return;
              const prev = history[history.length - 1];
              ctx.putImageData(prev, 0, 0);
              setHistory((h) => {
                const next = h.slice(0, -1);
                if (next.length === 0) setHasDrawn(false);
                return next;
              });
            }}
            disabled={history.length === 0 || disabled}
            style={{ ...styles.actionBtn, opacity: history.length === 0 || disabled ? 0.5 : 1 }}
            aria-label="Undo last stroke"
            title="Undo (Ctrl/Cmd+Z)"
          >
            ↩ Undo
          </button>

          <button
            onClick={() => setIsErasing((e) => !e)}
            aria-pressed={isErasing}
            aria-label="Toggle eraser"
            title="Eraser"
            style={{
              ...styles.actionBtn,
              background: isErasing ? "var(--accent3)" : "var(--surface)",
              color: isErasing ? "#000" : "var(--text-muted)",
              border: isErasing ? "1px solid var(--accent3)" : "1px solid var(--border)",
            }}
          >
            ⬜ Erase
          </button>
        </div>

        <div style={{ position: "relative", width: "100%" }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={420}
            style={{
              ...styles.canvas,
              cursor: disabled ? "not-allowed" : isErasing ? "cell" : "crosshair",
              opacity: disabled ? 0.7 : 1,
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            onTouchCancel={stopDraw}
            aria-label="Drawing canvas"
            role="img"
          />
          {thinking && (
            <div style={styles.thinkingBadge} aria-live="polite">
              <span style={styles.thinkingDot} />
              <span>AI is guessing…</span>
            </div>
          )}
          {idleHint && !thinking && (
            <div style={styles.idleHint} aria-hidden="true">
              <div style={styles.idleHintEmoji}>🖍️</div>
              <div style={styles.idleHintText}>
                Your canvas is ready.<br />
                <span style={styles.idleHintSub}>Press <strong style={{ color: "var(--accent)" }}>Start Game</strong> to get your word.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
export default DrawingCanvas;

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    flexWrap: "wrap",
    boxShadow: "var(--shadow-sm)",
  },
  colorGrid: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    maxWidth: "180px",
  },
  colorSwatch: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "transform 0.15s, border 0.15s, box-shadow 0.15s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  divider: {
    width: "1px",
    height: "28px",
    background: "var(--border)",
  },
  brushGroup: {
    display: "flex",
    gap: "6px",
  },
  brushBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 700,
    border: "1px solid var(--border)",
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  actionBtn: {
    padding: "7px 14px",
    borderRadius: "10px",
    background: "var(--surface2)",
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid var(--border)",
    transition: "all 0.15s",
  },
  canvas: {
    display: "block",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "#ffffff",
    width: "100%",
    height: "auto",
    touchAction: "none",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.04), 0 12px 32px rgba(0,0,0,0.45)",
  },
  thinkingBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(15,15,26,0.78)",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    pointerEvents: "none",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    backdropFilter: "blur(6px)",
  },
  thinkingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--accent3)",
    animation: "pulse 1s ease-in-out infinite",
  },
  idleHint: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    pointerEvents: "none",
    textAlign: "center",
    padding: "16px",
  },
  idleHintEmoji: {
    fontSize: "48px",
    lineHeight: 1,
    animation: "floatY 3.5s ease-in-out infinite",
    filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.15))",
  },
  idleHintText: {
    fontSize: "17px",
    color: "#2a2a50",
    fontFamily: "'Fredoka One', cursive",
    letterSpacing: "0.3px",
    lineHeight: 1.35,
  },
  idleHintSub: {
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
    color: "#5e5e80",
    fontWeight: 500,
    letterSpacing: 0,
  },
};
