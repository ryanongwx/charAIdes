import { Router, Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15_000,
  maxRetries: 1,
});

type Difficulty = "easy" | "medium" | "hard";

interface WordOfTheDay {
  word: string;
  category: string;
  difficulty: Difficulty;
  date: string;
  source: "wotd";
}

const router = Router();

// Cache for word of the day (in-memory, resets on server restart)
let cachedWOTD: WordOfTheDay | null = null;
let cachedDate: string | null = null;

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const today = getTodayDateString();

    // Return cached word if it's still today
    if (cachedWOTD && cachedDate === today) {
      return res.json(cachedWOTD);
    }

    // Generate new word of the day
    const seed = parseInt(today.replace(/-/g, ""), 10);
    const difficulties: Difficulty[] = ["easy", "medium", "hard"];
    const difficulty = difficulties[seed % 3];

    const difficultyGuidance = {
      easy: "simple, concrete objects that are easy to draw (animals, food, everyday objects)",
      medium: "more complex objects or concepts that require some creativity to draw (vehicles, places, activities)",
      hard: "abstract concepts, emotions, or scientific terms that are challenging to represent visually",
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 100,
      seed: seed,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are generating the "Word of the Day" for a drawing game like Pictionary. Generate a single interesting word or short phrase (max 3 words) that can be drawn.

Rules:
- The word must be drawable/visual and interesting
- Difficulty: ${difficulty} - ${difficultyGuidance[difficulty]}
- Return ONLY a JSON object with this exact format: {"word": "example", "category": "Category Name"}
- Categories: Animals, Nature, Objects, Food, Sports, Vehicles, Music, Technology, Science, Concepts, Emotions, Places, Body, Symbols, Mythology, Performance, Seasonal
- No explanations, just the JSON object
- Make it fun and engaging!`,
        },
        {
          role: "user",
          content: `Generate today's word of the day (${today}) with ${difficulty} difficulty.`,
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

    const result: WordOfTheDay = {
      word: parsed.word,
      category: parsed.category,
      difficulty,
      date: today,
      source: "wotd",
    };

    // Cache the result
    cachedWOTD = result;
    cachedDate = today;

    res.json(result);
  } catch (err) {
    console.error("Word of the day error:", err);
    res.status(500).json({ 
      error: "Failed to get word of the day",
      details: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

export default router;
