import { Router, Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15_000,
  maxRetries: 1,
});

type Difficulty = "easy" | "medium" | "hard";

interface GeneratedWord {
  word: string;
  category: string;
  difficulty: Difficulty;
  source: "ai";
}

const router = Router();

const isDifficulty = (v: unknown): v is Difficulty =>
  v === "easy" || v === "medium" || v === "hard";

router.post("/", async (req: Request, res: Response) => {
  try {
    const raw = req.body.difficulty;
    const difficulty: Difficulty = isDifficulty(raw) ? raw : "medium";

    const difficultyGuidance = {
      easy: "simple, concrete objects that are easy to draw (animals, food, everyday objects)",
      medium: "more complex objects or concepts that require some creativity to draw (vehicles, places, activities)",
      hard: "abstract concepts, emotions, or scientific terms that are challenging to represent visually",
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 100,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a word generator for a drawing game like Pictionary. Generate a single word or short phrase (max 3 words) that can be drawn.

Rules:
- The word must be drawable/visual
- Difficulty: ${difficulty} - ${difficultyGuidance[difficulty]}
- Return ONLY a JSON object with this exact format: {"word": "example", "category": "Category Name"}
- Categories: Animals, Nature, Objects, Food, Sports, Vehicles, Music, Technology, Science, Concepts, Emotions, Places, Body, Symbols, Mythology, Performance, Seasonal
- No explanations, just the JSON object`,
        },
        {
          role: "user",
          content: `Generate a ${difficulty} difficulty word for a drawing game.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("No content from OpenAI");
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    if (!parsed.word || !parsed.category) {
      throw new Error("Invalid response format from OpenAI");
    }

    const result: GeneratedWord = {
      word: parsed.word,
      category: parsed.category,
      difficulty,
      source: "ai",
    };

    res.json(result);
  } catch (err) {
    console.error("Generate word error:", err);
    res.status(500).json({ 
      error: "Failed to generate word",
      details: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

export default router;
