import { Router, Request, Response } from "express";
import { generateCelebrationLine } from "../lib/openai";
import { textToSpeechStream } from "../lib/elevenlabs";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { won, word, guessCount } = req.body as {
      won?: unknown;
      word?: unknown;
      guessCount?: unknown;
    };

    if (typeof won !== "boolean") {
      res.status(400).json({ error: "won must be a boolean" });
      return;
    }
    if (typeof word !== "string" || word.trim().length === 0) {
      res.status(400).json({ error: "word must be a non-empty string" });
      return;
    }
    const count =
      typeof guessCount === "number" && Number.isFinite(guessCount) && guessCount >= 0
        ? Math.floor(guessCount)
        : 0;

    const line = await generateCelebrationLine(won, word.trim(), count);
    const audioStream = await textToSpeechStream(line);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-Celebration-Text", encodeURIComponent(line));
    res.setHeader("Access-Control-Expose-Headers", "X-Celebration-Text");

    req.on("close", () => {
      audioStream.destroy();
    });

    audioStream.on("error", (err) => {
      console.error("Celebrate audio stream error:", err);
      if (!res.headersSent) {
        res.status(502).json({ error: "Audio stream failed" });
      } else {
        res.end();
      }
    });

    audioStream.pipe(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Celebrate route error:", message);
    if (!res.headersSent) {
      res.status(502).json({ error: "Celebration failed", detail: message });
    }
  }
});

export default router;
