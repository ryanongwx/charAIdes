import path from "path";
import dotenv from "dotenv";

// Load .env from the repo root (one level up from server/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Fall back to server/.env or process env if not found
dotenv.config();

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import guessRouter from "./routes/guess";
import celebrateRouter from "./routes/celebrate";
import wordRouter from "./routes/word";
import generateWordRouter from "./routes/generateWord";
import wordOfTheDayRouter from "./routes/wordOfTheDay";

const PORT = Number(process.env.PORT ?? 3001);

const missing: string[] = [];
if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
if (!process.env.ELEVENLABS_API_KEY) missing.push("ELEVENLABS_API_KEY");
if (missing.length > 0) {
  console.error(
    `\n❌ Missing required environment variables: ${missing.join(", ")}\n` +
      `   Create a .env file at the repo root (see .env.example).\n`
  );
  process.exit(1);
}

const app = express();

app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use(cors({ exposedHeaders: ["X-Guess-Text", "X-Celebration-Text"] }));
app.use(limiter);
app.use(express.json({ limit: "10mb" }));

app.use("/api/guess", guessRouter);
app.use("/api/celebrate", celebrateRouter);
app.use("/api/word", wordRouter);
app.use("/api/generate-word", generateWordRouter);
app.use("/api/word-of-the-day", wordOfTheDayRouter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    keys: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    },
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🎨 AI Pictionary server running on http://localhost:${PORT}`);
});
