import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";

export interface DrawingCanvasHandle {
  getImageDataUrl: () => string;
  clear: () => void;
}

interface DrawingCanvasProps {
  disabled?: boolean;
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

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ disabled = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(10);
    const [history, setHistory] = useState<ImageData[]>([]);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => ({
      getImageDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas) return "";
        return canvas.toDataURL("image/png");
      },
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHistory([]);
      },
    }));

    // Initialize canvas with white background
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getPos = useCallback(
      (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ("touches" in e) {
          const touch = e.touches[0];
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
      setHistory((prev) => [...prev.slice(-19), imageData]); // keep last 20
    }, []);

    const startDraw = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        saveHistory();
        const pos = getPos(e);
        if (!pos) return;
        lastPos.current = pos;
        setIsDrawing(true);

        // Draw a dot on click
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      },
      [disabled, getPos, saveHistory, brushSize, color]
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
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        lastPos.current = pos;
      },
      [isDrawing, disabled, getPos, color, brushSize]
    );

    const stopDraw = useCallback(() => {
      setIsDrawing(false);
      lastPos.current = null;
    }, []);

    const undo = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || history.length === 0) return;
      const prev = history[history.length - 1];
      ctx.putImageData(prev, 0, 0);
      setHistory((h) => h.slice(0, -1));
    }, [history]);

    return (
      <div style={styles.wrapper}>
        {/* Toolbar */}
        <div style={styles.toolbar}>
          {/* Colors */}
          <div style={styles.colorGrid} role="group" aria-label="Color palette">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Select color ${c}`}
                aria-pressed={color === c}
                style={{
                  ...styles.colorSwatch,
                  background: c,
                  border: color === c ? "3px solid var(--accent3)" : "2px solid var(--border)",
                  transform: color === c ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>

          <div style={styles.divider} />

          {/* Brush sizes */}
          <div style={styles.brushGroup} role="group" aria-label="Brush size">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => setBrushSize(b.size)}
                aria-pressed={brushSize === b.size}
                aria-label={`Brush size ${b.label}`}
                style={{
                  ...styles.brushBtn,
                  background: brushSize === b.size ? "var(--accent)" : "var(--surface2)",
                  color: brushSize === b.size ? "#fff" : "var(--text-muted)",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div style={styles.divider} />

          {/* Actions */}
          <button
            onClick={undo}
            disabled={history.length === 0 || disabled}
            style={styles.actionBtn}
            aria-label="Undo last stroke"
            title="Undo"
          >
            ↩ Undo
          </button>
        </div>

        {/* Canvas */}
        <div style={{ position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={420}
            style={{
              ...styles.canvas,
              cursor: disabled ? "not-allowed" : "crosshair",
              opacity: disabled ? 0.7 : 1,
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            aria-label="Drawing canvas"
            role="img"
          />
          {disabled && (
            <div style={styles.disabledOverlay}>
              <span>🤔 AI is thinking...</span>
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
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    background: "var(--surface2)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    flexWrap: "wrap",
  },
  colorGrid: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    maxWidth: "160px",
  },
  colorSwatch: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "transform 0.15s, border 0.15s",
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
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid var(--border)",
    transition: "all 0.15s",
  },
  actionBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    background: "var(--surface)",
    color: "var(--text-muted)",
    fontSize: "13px",
    border: "1px solid var(--border)",
    transition: "all 0.15s",
  },
  canvas: {
    display: "block",
    borderRadius: "var(--radius)",
    border: "2px solid var(--border)",
    background: "#ffffff",
    width: "100%",
    maxWidth: "600px",
    touchAction: "none",
    boxShadow: "var(--shadow)",
  },
  disabledOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(15,15,26,0.5)",
    borderRadius: "var(--radius)",
    fontSize: "18px",
    color: "var(--text)",
    fontWeight: 600,
    backdropFilter: "blur(2px)",
  },
};
