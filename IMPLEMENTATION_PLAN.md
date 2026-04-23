# Implementation Plan: Loading States & Toast Notifications

## Overview
This document outlines the implementation plan for two UX improvements:
1. **Specific Loading States** for AI word generation features
2. **Toast Notification System** for non-intrusive user feedback

---

## 1. Loading States for AI Features

### Current State
- Generic "⏳ Loading..." message for all loading scenarios
- No distinction between regular word fetch, AI generation, or Word of the Day
- Users don't know why they're waiting or what's happening

### Proposed Solution
Add specific loading messages and visual indicators for each word source.

### Implementation Steps

#### Step 1: Add Loading State Types
**File**: `client/src/App.tsx`

```typescript
type LoadingState = 
  | { type: "none" }
  | { type: "word-bank"; difficulty: Difficulty }
  | { type: "ai-generate"; difficulty: Difficulty }
  | { type: "word-of-day" };

// Replace boolean isLoadingWord with:
const [loadingState, setLoadingState] = useState<LoadingState>({ type: "none" });
```

#### Step 2: Create Loading Indicator Component
**File**: `client/src/components/LoadingIndicator.tsx`

```typescript
interface LoadingIndicatorProps {
  state: LoadingState;
}

export default function LoadingIndicator({ state }: LoadingIndicatorProps) {
  if (state.type === "none") return null;

  const messages = {
    "word-bank": `🎲 Picking a ${state.difficulty} word...`,
    "ai-generate": `✨ AI is creating a ${state.difficulty} word...`,
    "word-of-day": "📅 Loading Word of the Day...",
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.spinner} />
        <p style={styles.message}>{messages[state.type]}</p>
        {state.type === "ai-generate" && (
          <p style={styles.submessage}>This may take a few seconds</p>
        )}
      </div>
    </div>
  );
}
```

#### Step 3: Add CSS Spinner Animation
**File**: `client/src/index.css`

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### Step 4: Update Loading State Management
**File**: `client/src/App.tsx`

```typescript
const handleStartGame = useCallback(() => {
  setLoadingState({ type: "word-bank", difficulty });
  beginRound();
}, [beginRound, difficulty]);

const handleGenerateWord = useCallback(async () => {
  setLoadingState({ type: "ai-generate", difficulty });
  // ... existing logic
  setLoadingState({ type: "none" });
}, [difficulty]);

const handleWordOfTheDay = useCallback(async () => {
  setLoadingState({ type: "word-of-day" });
  // ... existing logic
  setLoadingState({ type: "none" });
}, []);
```

#### Step 5: Render Loading Indicator
**File**: `client/src/App.tsx`

```typescript
return (
  <div style={styles.app}>
    <Header ... />
    <main style={styles.main}>
      {/* existing content */}
    </main>
    
    {/* Add loading indicator */}
    <LoadingIndicator state={loadingState} />
    
    <ResultOverlay ... />
    {showStats && <StatsPanel ... />}
    {showShortcuts && <ShortcutsPanel ... />}
  </div>
);
```

### Visual Design

**Loading Overlay:**
- Semi-transparent dark backdrop (rgba(0,0,0,0.7))
- Centered card with blur effect
- Animated spinner (rotating circle or dots)
- Clear message text
- Smooth fade-in animation

**Spinner Options:**
1. **Rotating Circle**: Simple border spinner
2. **Three Dots**: Bouncing dots animation
3. **Emoji Spinner**: Rotating emoji (🎨 for word-bank, ✨ for AI, 📅 for WOTD)

---

## 2. Toast Notification System

### Current State
- Error messages shown in red banner at bottom
- No success feedback for actions
- Banners stay until dismissed or new game
- Intrusive and blocks content

### Proposed Solution
Implement a toast notification system for temporary, non-intrusive feedback.

### Implementation Steps

#### Step 1: Create Toast Context
**File**: `client/src/contexts/ToastContext.tsx`

```typescript
interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type: Toast["type"], duration?: number) => void;
  hideToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"], duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => hideToast(id), duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
```

#### Step 2: Create Toast Container Component
**File**: `client/src/components/ToastContainer.tsx`

```typescript
interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div style={styles.container}>
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
  const icons = {
    success: "✓",
    info: "ℹ",
    warning: "⚠",
    error: "✕",
  };

  const colors = {
    success: "var(--success)",
    info: "var(--accent3)",
    warning: "var(--accent2)",
    error: "var(--accent)",
  };

  return (
    <div
      style={{
        ...styles.toast,
        borderLeft: `4px solid ${colors[toast.type]}`,
        animation: "slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s",
      }}
      onClick={() => onClose(toast.id)}
    >
      <span style={{ ...styles.icon, color: colors[toast.type] }}>
        {icons[toast.type]}
      </span>
      <span style={styles.message}>{toast.message}</span>
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
```

#### Step 3: Add Toast Animations
**File**: `client/src/index.css`

```css
@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
```

#### Step 4: Wrap App with Toast Provider
**File**: `client/src/main.tsx`

```typescript
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

#### Step 5: Use Toasts Throughout App
**File**: `client/src/App.tsx`

```typescript
export default function App() {
  const { showToast } = useToast();

  // Word of the Day loaded
  const handleWordOfTheDay = useCallback(async () => {
    try {
      const word = await fetchWordOfTheDay();
      showToast(`📅 Word of the Day: "${word.word}"`, "success");
      beginRound(undefined, word);
    } catch (err) {
      showToast("Failed to load Word of the Day", "error");
    }
  }, [showToast]);

  // AI word generated
  const handleGenerateWord = useCallback(async () => {
    try {
      const word = await generateWord();
      showToast(`✨ AI generated: "${word.word}"`, "success");
      beginRound(undefined, word);
    } catch (err) {
      showToast("Failed to generate AI word", "error");
    }
  }, [showToast]);

  // Hint used
  const handleHint = useCallback(() => {
    useHint();
    showToast(`💡 Hint: Category is "${wordEntry?.category}"`, "info");
    playClick();
  }, [useHint, wordEntry, showToast, playClick]);

  // Canvas cleared
  const handleClear = useCallback(() => {
    canvasRef.current?.clear();
    showToast("🗑️ Canvas cleared", "info");
    playClick();
  }, [showToast, playClick]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (canUndo) {
      canvasRef.current?.undo();
      showToast("↩ Undone", "info", 1500); // Shorter duration
      playClick();
    }
  }, [canUndo, showToast, playClick]);

  // Game won
  useEffect(() => {
    if (phase === "WON") {
      showToast(`🎉 You won in ${guessCount} guesses!`, "success", 5000);
    }
  }, [phase, guessCount, showToast]);

  // Game lost
  useEffect(() => {
    if (phase === "LOST") {
      showToast(`⏰ Time's up! The word was "${wordEntry?.word}"`, "warning", 5000);
    }
  }, [phase, wordEntry, showToast]);
}
```

### Toast Positioning & Styling

**Container Position:**
- Fixed position: top-right corner
- 20px from top, 20px from right
- Stack vertically with 10px gap
- z-index: 9999 (above everything)

**Toast Card:**
- Width: 320px (max)
- Padding: 16px
- Background: var(--surface)
- Border-radius: 12px
- Box-shadow: 0 4px 12px rgba(0,0,0,0.3)
- Left border: 4px colored stripe (type-based)

**Responsive:**
- Mobile: Full width minus 20px margins
- Position: top-center on mobile
- Smaller font size

### Toast Types & Use Cases

| Type | Color | Use Cases |
|------|-------|-----------|
| **success** | Green | Word loaded, game won, action completed |
| **info** | Teal | Hint used, canvas cleared, undo/redo |
| **warning** | Orange | Time running low, game lost |
| **error** | Red | API failures, network errors |

### Duration Guidelines

- **Quick actions** (undo, clear): 1500ms
- **Standard** (hint, word loaded): 3000ms
- **Important** (game results): 5000ms
- **Errors**: 5000ms or manual dismiss

---

## Integration Checklist

### Loading States
- [ ] Create `LoadingState` type
- [ ] Create `LoadingIndicator` component
- [ ] Add spinner CSS animations
- [ ] Update `handleStartGame` to set specific state
- [ ] Update `handleGenerateWord` to set specific state
- [ ] Update `handleWordOfTheDay` to set specific state
- [ ] Render `LoadingIndicator` in App
- [ ] Test all three loading scenarios
- [ ] Verify loading clears on error
- [ ] Test on mobile devices

### Toast Notifications
- [ ] Create `ToastContext` and provider
- [ ] Create `useToast` hook
- [ ] Create `ToastContainer` component
- [ ] Create `ToastItem` component
- [ ] Add toast CSS animations
- [ ] Wrap App with `ToastProvider`
- [ ] Replace error banner with error toasts
- [ ] Add success toasts for word loading
- [ ] Add info toasts for actions (hint, clear, undo)
- [ ] Add game result toasts (won/lost)
- [ ] Test toast stacking (multiple at once)
- [ ] Test toast auto-dismiss timing
- [ ] Test manual dismiss (click to close)
- [ ] Test on mobile (positioning, sizing)
- [ ] Verify accessibility (screen reader announcements)

---

## Testing Scenarios

### Loading States
1. Click "Start Game" → Should show "🎲 Picking a [difficulty] word..."
2. Click "✨ Generate AI Word" → Should show "✨ AI is creating a [difficulty] word..." with submessage
3. Click "📅 Word of the Day" → Should show "📅 Loading Word of the Day..."
4. Simulate API failure → Loading should clear and show error toast
5. Test rapid clicking → Should not stack multiple loaders

### Toast Notifications
1. Load Word of the Day → Success toast with word name
2. Generate AI word → Success toast with word name
3. Use hint → Info toast with category
4. Clear canvas → Info toast confirmation
5. Undo stroke → Quick info toast
6. Win game → Success toast with guess count
7. Lose game → Warning toast with answer
8. API error → Error toast with message
9. Multiple actions quickly → Toasts should stack properly
10. Wait for auto-dismiss → Toast should fade out after duration
11. Click toast → Should dismiss immediately
12. Mobile view → Toasts should be properly positioned

---

## Estimated Time

- **Loading States**: 1-2 hours
  - Component creation: 30 min
  - State management: 30 min
  - Styling & animations: 30 min
  - Testing: 30 min

- **Toast Notifications**: 2-3 hours
  - Context & provider: 45 min
  - Components: 45 min
  - Integration: 45 min
  - Testing & polish: 45 min

**Total**: 3-5 hours

---

## Future Enhancements

### Loading States
- Add progress bar for AI generation
- Show estimated time remaining
- Add cancel button for long operations
- Animate the emoji icons

### Toast Notifications
- Add sound effects per toast type
- Add action buttons in toasts ("Undo", "Retry")
- Add toast history panel
- Add "Do not show again" option for certain toasts
- Add toast grouping (collapse similar toasts)
- Add swipe-to-dismiss on mobile
- Add toast queue limit (max 5 visible)

---

## Notes

- Keep loading messages friendly and conversational
- Use emojis consistently with button icons
- Ensure toasts don't block important UI elements
- Make sure toasts are keyboard accessible
- Test with screen readers for accessibility
- Consider reduced motion preferences for animations
- Ensure color contrast meets WCAG standards
