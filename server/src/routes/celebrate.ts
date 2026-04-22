import { Router, Request, Response } from "express";
import { generateCelebrationLine } from "../lib/openai";
import { textToSpeechStream } from "../lib/elevenlabs";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { won, word, guessCount } = req.body as {
      won: boolean;
      word: string;
      guessCount: number;
    };

    const line = await generateCelebrationLine(won, word, guessCount);
    const audioStream = await textToSpeechStream(line);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-Celebration-Text", encodeURIComponent(line));
    res.setHeader("Access-Control-Expose-Headers", "X-Celebration-Text");

    audioStream.pipe(res);
  } catch (err) {
    console.error("Celebrate route error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
