import { useEffect, useRef } from "react";

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
  // Keep a stable ref so the effect closure always calls the latest handlers
  // without needing to re-register the event listener on every render.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.repeat) return;

      const h = handlersRef.current;
      const key = e.key;
      const lower = key.length === 1 ? key.toLowerCase() : key;

      if ((e.ctrlKey || e.metaKey) && lower === "z" && h.onUndo) {
        e.preventDefault();
        h.onUndo();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if ((key === " " || key === "Enter") && !isButtonTarget(e.target) && h.onGuess) {
        e.preventDefault();
        h.onGuess();
        return;
      }

      if (lower === "c" && h.onClear) {
        e.preventDefault();
        h.onClear();
        return;
      }
      if (lower === "h" && h.onHint) {
        e.preventDefault();
        h.onHint();
        return;
      }
      if (lower === "s" && h.onStart) {
        e.preventDefault();
        h.onStart();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]); // only re-register when enabled changes, not on every render
}
