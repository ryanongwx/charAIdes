import { Router, Request, Response } from "express";
import { generateGuess } from "../lib/openai";
import { textToSpeechStream } from "../lib/elevenlabs";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { image, guessHistory, hint, canvasChanged } = req.body as {
      image?: unknown;
      guessHistory?: unknown;
      hint?: unknown;
      canvasChanged?: unknown;
    };

    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      res.status(400).json({ error: "image must be a data URL string" });
      return;
    }
    const history = Array.isArray(guessHistory)
      ? guessHistory.filter((g): g is string => typeof g === "string").slice(-20)
      : [];
    const hintText = typeof hint === "string" && hint.length > 0 ? hint : undefined;
    const changed = typeof canvasChanged === "boolean" ? canvasChanged : true;

    const guessText = await generateGuess(image, history, hintText, changed);

    const audioStream = await textToSpeechStream(guessText);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-Guess-Text", encodeURIComponent(guessText));
    res.setHeader("Access-Control-Expose-Headers", "X-Guess-Text");

    req.on("close", () => {
      audioStream.destroy();
    });

    audioStream.on("error", (err) => {
      console.error("Audio stream error:", err);
      if (!res.headersSent) {
        res.status(502).json({ error: "Audio stream failed" });
      } else {
        res.end();
      }
    });

    audioStream.pipe(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Guess route error:", message);
    if (!res.headersSent) {
      res.status(502).json({ error: "AI guess failed", detail: message });
    }
  }
});

export default router;
