import { useEffect } from "react";

interface ShortcutHandlers {
  onGuess?: () => void;
  onClear?: () => void;
  onHint?: () => void;
  onUndo?: () => void;
  onStart?: () => void;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target.isContentEditable) return true;
  return false;
};

const isButtonTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLButtonElement ||
  (target instanceof HTMLElement && target.getAttribute("role") === "button");

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.repeat) return;

      const key = e.key;
      const lower = key.length === 1 ? key.toLowerCase() : key;

      if ((e.ctrlKey || e.metaKey) && lower === "z" && handlers.onUndo) {
        e.preventDefault();
        handlers.onUndo();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if ((key === " " || key === "Enter") && !isButtonTarget(e.target) && handlers.onGuess) {
        e.preventDefault();
        handlers.onGuess();
        return;
      }

      if (lower === "c" && handlers.onClear) {
        e.preventDefault();
        handlers.onClear();
        return;
      }
      if (lower === "h" && handlers.onHint) {
        e.preventDefault();
        handlers.onHint();
        return;
      }
      if (lower === "s" && handlers.onStart) {
        e.preventDefault();
        handlers.onStart();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, enabled]);
}
