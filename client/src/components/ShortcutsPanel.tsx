import React from "react";

interface ShortcutsPanelProps {
  onClose: () => void;
}

const shortcuts = [
  { key: "Space / Enter", action: "Make AI guess" },
  { key: "C", action: "Clear canvas" },
  { key: "H", action: "Use hint" },
  { key: "Ctrl/Cmd + Z", action: "Undo stroke" },
  { key: "S", action: "Start new game" },
  { key: "?", action: "Show shortcuts" },
];

export default function ShortcutsPanel({ onClose }: ShortcutsPanelProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>⌨️ Keyboard Shortcuts</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={styles.list}>
          {shortcuts.map((shortcut, i) => (
            <div key={i} style={styles.item}>
              <kbd style={styles.kbd}>{shortcut.key}</kbd>
              <span style={styles.action}>{shortcut.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
    animation: "fadeIn 0.2s ease",
  },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  title: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "24px",
    color: "var(--accent3)",
    margin: 0,
  },
  closeBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
  },
  kbd: {
    padding: "4px 8px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
    color: "var(--accent2)",
    minWidth: "100px",
    textAlign: "center",
  },
  action: {
    fontSize: "14px",
    color: "var(--text)",
  },
};
