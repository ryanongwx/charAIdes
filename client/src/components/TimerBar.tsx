import React from "react";

interface TimerBarProps {
  timeLeft: number;
  total?: number;
}

export default function TimerBar({ timeLeft, total = 90 }: TimerBarProps) {
  const pct = (timeLeft / total) * 100;
  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft <= 30;

  const barColor = isUrgent
    ? "var(--accent)"
    : isWarning
    ? "var(--accent2)"
    : "var(--accent3)";

  return (
    <div style={styles.wrapper} role="timer" aria-label={`${timeLeft} seconds remaining`}>
      <div style={styles.track}>
        <div
          style={{
            ...styles.fill,
            width: `${pct}%`,
            background: barColor,
            animation: isUrgent ? "pulse 0.5s ease-in-out infinite" : "none",
          }}
        />
      </div>
      <span
        style={{
          ...styles.label,
          color: isUrgent ? "var(--accent)" : "var(--text-muted)",
          fontWeight: isUrgent ? 700 : 400,
        }}
      >
        {timeLeft}s
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  track: {
    flex: 1,
    height: "8px",
    background: "var(--border)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 1s linear, background 0.5s",
  },
  label: {
    fontSize: "13px",
    minWidth: "32px",
    textAlign: "right",
  },
};
