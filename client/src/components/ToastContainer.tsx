import React from "react";
import type { Toast } from "../contexts/ToastContext";

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="toast-container"
      style={styles.container}
      role="status"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons: Record<Toast["type"], string> = {
    success: "✓",
    info: "ℹ",
    warning: "⚠",
    error: "✕",
  };

  const colors: Record<Toast["type"], string> = {
    success: "var(--success)",
    info: "var(--accent3)",
    warning: "var(--accent2)",
    error: "var(--accent)",
  };

  const duration = toast.duration ?? 3000;
  const fadeDelay = duration > 0 ? Math.max(0, (duration - 300) / 1000) : null;
  const animation =
    fadeDelay !== null
      ? `slideInRight 0.3s ease, fadeOut 0.3s ease ${fadeDelay}s forwards`
      : "slideInRight 0.3s ease";

  return (
    <div
      style={{
        ...styles.toast,
        borderLeft: `4px solid ${colors[toast.type]}`,
        animation,
      }}
      onClick={() => onClose(toast.id)}
    >
      <span style={{ ...styles.icon, color: colors[toast.type] }}>
        {icons[toast.type]}
      </span>
      <span style={styles.message}>{toast.message}</span>
      {toast.action && (
        <button
          style={styles.actionBtn}
          onClick={(e) => {
            e.stopPropagation();
            toast.action!.onClick();
            onClose(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        style={styles.closeBtn}
        onClick={(e) => {
          e.stopPropagation();
          onClose(toast.id);
        }}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    top: "20px",
    right: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    zIndex: 9999,
    pointerEvents: "none",
  },
  toast: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: "280px",
    maxWidth: "400px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    pointerEvents: "auto",
    cursor: "pointer",
  },
  icon: {
    fontSize: "18px",
    fontWeight: "bold",
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: "14px",
    color: "var(--text)",
    lineHeight: "1.4",
  },
  actionBtn: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--accent3)",
    fontSize: "13px",
    fontWeight: 600,
    borderRadius: "6px",
    padding: "4px 10px",
    cursor: "pointer",
    flexShrink: 0,
    transition: "color 0.15s",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "color 0.15s",
  },
};
