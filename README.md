# 🎨 AI Pictionary

> Draw it. The AI guesses it — out loud.

An interactive drawing and guessing game where you sketch a word and an AI voice guesser (powered by **ElevenLabs TTS** + **OpenAI GPT-4o Vision**) speaks its guesses aloud until it gets the right answer.

Built for the **Kiro × ElevenLabs Hackathon** using spec-driven development.

---

## How It Works

1. Pick a difficulty and hit **Start Game** — you get a secret word to draw.
2. **Or try these alternatives:**
   - Click **✨ Generate AI Word** for unlimited variety using GPT-4o-mini
   - Click **📅 Word of the Day** for today's special challenge
3. **Start drawing** — the AI watches in real-time and automatically blurts out a new spoken guess every 2–5 seconds: *"Ooh, is that a flamingo?!"*
4. Keep adding detail. Each new stroke gives the AI fresh context, just like a real partner in Pictionary.
5. The AI adapts its timing — if you stop drawing, it waits a bit longer before guessing again, giving you space to think.
6. Want it to guess *right now*? Hit **⚡ Guess Now** (or Space/Enter) to skip the wait.
7. When the AI guesses correctly (or time runs out), it reacts with a voiced celebration or playful consolation.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Vite |
| Backend | Express + TypeScript |
| AI Vision | OpenAI GPT-4o (image analysis) |
| Voice | ElevenLabs TTS (`eleven_flash_v2_5`, Rachel voice) |

---

## Local Setup

### Prerequisites

Make sure you have the following installed before starting:

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (comes with Node.js)
- An **ElevenLabs** account with an API key — [elevenlabs.io](https://elevenlabs.io)
- An **OpenAI** account with an API key — [platform.openai.com](https://platform.openai.com)

Check your versions:

```bash
node --version   # should be v18+
npm --version    # should be v9+
```

---

### Step 1 — Install dependencies

From the `ai-charades` directory, install all workspace dependencies in one command:

```bash
npm install
```

This installs packages for both the `client` and `server` workspaces.

---

### Step 2 — Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` and fill in your API keys:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
GAMES_PER_DAY=3
```

`GAMES_PER_DAY` caps the number of games a single IP can start per rolling
24-hour window. This protects your OpenAI / ElevenLabs credits from being
burned by a single user or a tab left open. Defaults to `3` if unset. The
counter is in-memory and resets when the server restarts — swap in a Redis
store (e.g. `rate-limit-redis`) if you run multiple instances.

**Where to get your keys:**

| Key | Where to find it |
|-----|-----------------|
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → click your avatar → **Profile** → **API Keys** → Create new key |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → **Create new secret key** |
| `ELEVENLABS_VOICE_ID` | Optional — defaults to Rachel voice. Find voice IDs at [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library) |

> The `.env` file is gitignored — your keys will never be committed.

---

### Step 3 — Start the development servers

```bash
npm run dev
```

This uses `concurrently` to start both processes at once:

| Process | URL | What it does |
|---------|-----|-------------|
| Express server | `http://localhost:3001` | Proxies requests to OpenAI and ElevenLabs, keeps API keys server-side |
| Vite dev server | `http://localhost:5173` | Serves the React frontend with hot module reload |

You should see output like:

```
[server] 🎨 AI Pictionary server running on http://localhost:3001
[client] VITE v5.x.x  ready in Xms
[client] ➜  Local:   http://localhost:5173/
```

---

### Step 4 — Open the game

Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser.

> **Audio note:** Browsers require a user gesture before playing audio. Click anywhere on the page first, then hit **Start Game** — the AI's voice will play automatically after that.

---

## Playing the Game

### Starting a Game

You have three ways to get a word:

1. **🎮 Start Game** (or press **S**) — Random word from curated word bank (180 words)
2. **✨ Generate AI Word** — GPT-4o-mini creates a unique, drawable word on-demand
3. **📅 Word of the Day** — Get today's special challenge (same for everyone, changes daily)

### Playing

1. **Select a difficulty** in the top-right (Easy / Medium / Hard).
2. Choose your word source (see above).
3. **Start drawing** on the white canvas. Use the color palette and brush size buttons in the toolbar.
4. **The AI watches automatically** — every 2–5 seconds, it analyzes your drawing and speaks a guess aloud.
5. The guess appears in the panel on the right. Keep drawing to give the AI more clues.
6. If you're stuck, click **💡 Hint** (or press **H**) to reveal the word's category (costs +1 guess).
7. Want an immediate guess? Click **⚡ Guess Now** (or press **Space/Enter**).
8. Use **Ctrl/Cmd+Z** to undo strokes, or press **C** to clear the canvas.
9. When the AI guesses correctly, it celebrates with a voiced reaction and confetti.
10. Click **🎮 Play Again** to start a new round.
11. View your stats by clicking the **📊** icon in the header.
12. Press **?** to see all keyboard shortcuts.

### Keyboard Shortcuts

- **Space / Enter** — Force AI to guess now (skip the wait)
- **C** — Clear canvas
- **H** — Use hint
- **Ctrl/Cmd + Z** — Undo stroke
- **S** — Start new game
- **?** — Show shortcuts panel
- **Esc** — Close panels

---

## Running Servers Separately

If you prefer to run the client and server in separate terminals:

**Terminal 1 — backend:**
```bash
npm run dev --workspace=server
```

**Terminal 2 — frontend:**
```bash
npm run dev --workspace=client
```

---

## Troubleshooting

**"Couldn't reach the AI" error banner**

- Check that the server is running on port 3001.
- Verify your `.env` file has valid API keys (no extra spaces or quotes).
- Check the server terminal for error details — OpenAI and ElevenLabs errors are logged there.

**No audio plays**

- Make sure you clicked somewhere on the page before hitting Guess (browser autoplay policy).
- Check your system volume and that the browser tab isn't muted.
- Open DevTools → Console and look for audio-related errors.

**Port already in use**

- Change `PORT=3001` in `.env` to another port (e.g. `3002`).
- The Vite proxy in `client/vite.config.ts` points to `http://localhost:3001` — update that too if you change the port.

**TypeScript errors after pulling changes**

```bash
npm install          # pick up any new dependencies
npx tsc --noEmit     # check for type errors in server
```

---

## Project Structure

```
ai-pictionary/
├── client/                   # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── DrawingCanvas.tsx   # HTML5 canvas with brush tools
│   │   │   ├── ErrorBoundary.tsx   # Crash recovery component
│   │   │   ├── GuessPanel.tsx      # Scrollable AI guess history
│   │   │   ├── Header.tsx          # Title + difficulty + stats/shortcuts buttons
│   │   │   ├── LoadingIndicator.tsx # Smart loading overlay with specific messages
│   │   │   ├── ResultOverlay.tsx   # Win/lose modal with confetti
│   │   │   ├── ShortcutsPanel.tsx  # Keyboard shortcuts help modal
│   │   │   ├── StatsPanel.tsx      # Game statistics modal
│   │   │   ├── TimerBar.tsx        # Animated countdown bar
│   │   │   └── ToastContainer.tsx  # Toast notification system
│   │   ├── contexts/
│   │   │   └── ToastContext.tsx    # Toast state management + provider
│   │   ├── hooks/
│   │   │   ├── useAudio.ts         # Fetch audio blob + Web Audio playback
│   │   │   ├── useGameState.ts     # State machine + timer logic
│   │   │   ├── useGameStats.ts     # LocalStorage stats tracking
│   │   │   ├── useKeyboardShortcuts.ts  # Global keyboard event handling
│   │   │   └── useSoundEffects.ts  # Web Audio API sound effects
│   │   ├── lib/
│   │   │   └── fuzzyMatch.ts       # Guess correctness detection
│   │   ├── App.tsx                 # Root component + auto-guess orchestration
│   │   ├── main.tsx                # React entry point with ErrorBoundary + ToastProvider
│   │   └── index.css               # Global dark theme styles + animations
│   ├── index.html
│   └── vite.config.ts              # Dev server + /api proxy config
│
├── server/                   # Express + TypeScript backend
│   └── src/
│       ├── routes/
│       │   ├── guess.ts            # POST /api/guess — vision → TTS pipeline
│       │   ├── celebrate.ts        # POST /api/celebrate — win/lose voice line
│       │   ├── word.ts             # GET /api/word — cached random word by difficulty
│       │   ├── generateWord.ts     # POST /api/generate-word — AI word generation
│       │   └── wordOfTheDay.ts     # GET /api/word-of-the-day — daily challenge
│       ├── lib/
│       │   ├── openai.ts           # GPT-4o Vision call + celebration lines
│       │   └── elevenlabs.ts       # ElevenLabs TTS streaming
│       └── index.ts                # Express app entry point + rate limiting
│
├── .env.example              # Environment variable template
├── .env                      # Your local keys (gitignored)
├── package.json              # Root workspace config
└── .kiro/specs/ai-pictionary/  # Spec-driven development artifacts
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/word?difficulty=easy\|medium\|hard` | Returns a random word from the curated word bank |
| `POST` | `/api/generate-word` | Accepts `{ difficulty }`, returns AI-generated word using GPT-4o-mini |
| `GET` | `/api/word-of-the-day` | Returns today's word of the day (cached, same for everyone) |
| `POST` | `/api/guess` | Accepts `{ image, guessHistory, hint? }`, returns `audio/mpeg` stream with `X-Guess-Text` header |
| `POST` | `/api/celebrate` | Accepts `{ won, word, guessCount }`, returns `audio/mpeg` stream |
| `GET` | `/health` | Server health check |

---

## Game Features

- 🎨 **Drawing canvas** — brush sizes (S/M/L), 12 colors, undo last stroke, clear
- 🤖 **AI voice guesser** — conversational, playful, expressive (Rachel voice from ElevenLabs)
- 🔄 **Auto-guessing** — AI watches in real-time and guesses every 2–5 seconds automatically
- 🧠 **Adaptive timing** — AI waits longer when you stop drawing, giving you space to think
- ⚡ **Manual guess** — Skip the wait with "Guess Now" button (Space/Enter)
- 📚 **180-word curated bank** — 60 easy, 60 medium, 60 hard words
- ✨ **AI word generation** — GPT-4o-mini creates unlimited unique words on-demand
- 📅 **Word of the Day** — Daily challenge word, same for everyone
- ⏱️ **90-second timer** — color shifts from teal → amber → red as time runs low
- 💡 **Hint system** — reveals the word's category (+1 guess penalty)
- 📜 **Guess history** — scrollable log of every AI guess with correct-answer highlight
- 🎉 **Celebration audio** — unique voiced win/lose reactions generated by GPT-4o
- 🟢🟡🔴 **Three difficulty levels** — Easy (cat, house) through Hard (gravity, procrastination)
- 📊 **Stats tracking** — win rate, streaks, best scores, average guesses (saved locally)
- ⌨️ **Keyboard shortcuts** — Space/Enter to force guess, C to clear, H for hint, Ctrl/Cmd+Z to undo
- 🔊 **Sound effects** — satisfying audio feedback for clicks, success, errors, drawing
- 🔔 **Toast notifications** — non-intrusive popup feedback for all actions (word loaded, hint used, canvas cleared, etc.)
- ⏳ **Smart loading states** — specific messages for each action ("✨ AI is creating a word...", "📅 Loading Word of the Day...")
- 📱 **Mobile responsive** — works great on phones and tablets
- ⚡ **Performance optimized** — rate limiting, caching, smooth animations
- 🛡️ **Error boundary** — graceful crash handling with reload option

---

## Spec-Driven Development

This project was built using **Kiro's spec-driven development** approach:

1. **Requirements** (`.kiro/specs/ai-pictionary/requirements.md`) — user stories and functional requirements
2. **Design** (`.kiro/specs/ai-pictionary/design.md`) — architecture, data flow, component tree, API contracts
3. **Tasks** (`.kiro/specs/ai-pictionary/tasks.md`) — implementation checklist used to drive development

The **ElevenLabs Kiro Power** provided accurate, up-to-date API guidance (correct SDK method names, parameter shapes, streaming patterns) throughout implementation without needing to read external docs.