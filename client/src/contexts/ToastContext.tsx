import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import ToastContainer from "../components/ToastContainer";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (
    message: string,
    type: Toast["type"],
    duration?: number,
    action?: ToastAction
  ) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: Toast["type"],
      duration = 3000,
      action?: ToastAction
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;

      setToasts((prev) => {
        // Deduplicate: skip if same message is already visible
        if (prev.some((t) => t.message === message)) return prev;
        // Cap: drop oldest if at limit
        const capped = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
        return [...capped, { id, message, type, duration, action }];
      });

      if (duration > 0) {
        setTimeout(() => hideToast(id), duration);
      }
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
