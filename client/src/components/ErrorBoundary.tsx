import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <span style={styles.emoji}>😵</span>
            <h1 style={styles.title}>Oops! Something went wrong</h1>
            <p style={styles.message}>
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={styles.button}
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "var(--bg)",
    padding: "20px",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  emoji: {
    fontSize: "64px",
  },
  title: {
    fontFamily: "'Fredoka One', cursive",
    fontSize: "28px",
    color: "var(--accent)",
    margin: 0,
  },
  message: {
    fontSize: "14px",
    color: "var(--text-muted)",
    lineHeight: 1.6,
  },
  button: {
    marginTop: "8px",
    padding: "12px 24px",
    borderRadius: "12px",
    background: "var(--accent)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    fontFamily: "'Fredoka One', cursive",
  },
};
