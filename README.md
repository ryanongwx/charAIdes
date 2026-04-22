# 🎨 AI Charades

> Draw it. The AI guesses it — out loud.

An interactive drawing game where you sketch a word and an AI voice guesser (powered by **ElevenLabs TTS** + **OpenAI GPT-4o Vision**) speaks its guesses aloud until it gets the right answer.

Built for the **Kiro × ElevenLabs Hackathon** using spec-driven development.

---

## How It Works

1. Pick a difficulty and hit **Start Game** — you get a secret word to draw.
2. Draw on the canvas using the brush tools.
3. Hit **Guess!** — the AI analyses your drawing and speaks a conversational guess: *"Ooh, is that a flamingo?!"*
4. Keep drawing and guessing until the AI gets it right (or time runs out).
5. The AI celebrates with a voiced reaction when it wins.

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
```

**Where to get your keys:**

| Key | Where to find it |
|-----|-----------------|
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → click your avatar → **Profile** → **API Keys** → Create new key |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → **Create new secret key** |

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
[server] 🎨 AI Charades server running on http://localhost:3001
[client] VITE v5.x.x  ready in Xms
[client] ➜  Local:   http://localhost:5173/
```

---

### Step 4 — Open the game

Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser.

> **Audio note:** Browsers require a user gesture before playing audio. Click anywhere on the page first, then hit **Start Game** — the AI's voice will play automatically after that.

---

## Playing the Game

1. **Select a difficulty** in the top-right (Easy / Medium / Hard).
2. Click **🎮 Start Game** — a secret word appears at the top left.
3. **Draw** the word on the white canvas. Use the color palette and brush size buttons in the toolbar.
4. Click **🔍 Guess!** — wait 1–3 seconds while the AI analyses your drawing and speaks its guess aloud.
5. The guess appears in the panel on the right. Keep drawing and guessing.
6. If you're stuck, click **💡 Hint** to reveal the word's category (costs +1 guess).
7. When the AI guesses correctly, it celebrates with a voiced reaction and confetti.
8. Click **🎮 Play Again** to start a new round.

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
ai-charades/
├── client/                   # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── DrawingCanvas.tsx   # HTML5 canvas with brush tools
│   │   │   ├── GuessPanel.tsx      # Scrollable AI guess history
│   │   │   ├── Header.tsx          # Title + difficulty selector
│   │   │   ├── ResultOverlay.tsx   # Win/lose modal with confetti
│   │   │   └── TimerBar.tsx        # Animated countdown bar
│   │   ├── hooks/
│   │   │   ├── useGameState.ts     # State machine + timer logic
│   │   │   └── useAudio.ts         # Fetch audio blob + Web Audio playback
│   │   ├── lib/
│   │   │   └── fuzzyMatch.ts       # Guess correctness detection
│   │   ├── App.tsx                 # Root component + game orchestration
│   │   └── index.css               # Global dark theme styles
│   ├── index.html
│   └── vite.config.ts              # Dev server + /api proxy config
│
├── server/                   # Express + TypeScript backend
│   └── src/
│       ├── routes/
│       │   ├── guess.ts            # POST /api/guess — vision → TTS pipeline
│       │   ├── celebrate.ts        # POST /api/celebrate — win/lose voice line
│       │   └── word.ts             # GET /api/word — random word by difficulty
│       ├── lib/
│       │   ├── openai.ts           # GPT-4o Vision call + celebration lines
│       │   └── elevenlabs.ts       # ElevenLabs TTS streaming
│       └── index.ts                # Express app entry point
│
├── .env.example              # Environment variable template
├── .env                      # Your local keys (gitignored)
├── package.json              # Root workspace config
└── .kiro/specs/ai-charades/  # Spec-driven development artifacts
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/word?difficulty=easy\|medium\|hard` | Returns a random word entry |
| `POST` | `/api/guess` | Accepts `{ image, guessHistory, hint? }`, returns `audio/mpeg` stream with `X-Guess-Text` header |
| `POST` | `/api/celebrate` | Accepts `{ won, word, guessCount }`, returns `audio/mpeg` stream |
| `GET` | `/health` | Server health check |

---

## Game Features

- 🎨 **Drawing canvas** — brush sizes (S/M/L), 12 colors, undo last stroke, clear
- 🤖 **AI voice guesser** — conversational, playful, expressive (Rachel voice)
- ⏱️ **90-second timer** — colour shifts from teal → amber → red as time runs low
- 💡 **Hint system** — reveals the word's category (+1 guess penalty)
- 📜 **Guess history** — scrollable log of every AI guess with correct-answer highlight
- 🎉 **Celebration audio** — unique voiced win/lose reactions generated by GPT-4o
- 🟢🟡🔴 **Three difficulty levels** — Easy (cat, house) through Hard (gravity, procrastination)

---

## Spec-Driven Development

This project was built using **Kiro's spec-driven development** approach:

1. **Requirements** (`.kiro/specs/ai-charades/requirements.md`) — user stories and functional requirements
2. **Design** (`.kiro/specs/ai-charades/design.md`) — architecture, data flow, component tree, API contracts
3. **Tasks** (`.kiro/specs/ai-charades/tasks.md`) — implementation checklist used to drive development

The **ElevenLabs Kiro Power** provided accurate, up-to-date API guidance (correct SDK method names, parameter shapes, streaming patterns) throughout implementation without needing to read external docs.
#   c h a r A I d e s  
 