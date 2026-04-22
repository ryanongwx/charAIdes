import { Router, Request, Response } from "express";
import { generateGuess } from "../lib/openai";
import { textToSpeechStream } from "../lib/elevenlabs";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { image, guessHistory = [], hint } = req.body as {
      image: string;
      guessHistory: string[];
      hint?: string;
    };

    if (!image) {
      res.status(400).json({ error: "image is required" });
      return;
    }

    // 1. Ask GPT-4o Vision to guess
    const guessText = await generateGuess(image, guessHistory, hint);

    // 2. Convert guess to speech via ElevenLabs
    const audioStream = await textToSpeechStream(guessText);

    // 3. Stream audio back; expose guess text in header
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-Guess-Text", encodeURIComponent(guessText));
    res.setHeader("Access-Control-Expose-Headers", "X-Guess-Text");

    audioStream.pipe(res);

    audioStream.on("error", (err) => {
      console.error("Audio stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Audio stream failed" });
      }
    });
  } catch (err) {
    console.error("Guess route error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
