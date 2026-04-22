import { Router, Request, Response } from "express";

type Difficulty = "easy" | "medium" | "hard";

interface WordEntry {
  word: string;
  category: string;
  difficulty: Difficulty;
}

const wordBank: WordEntry[] = [
  // Easy
  { word: "cat", category: "Animals", difficulty: "easy" },
  { word: "dog", category: "Animals", difficulty: "easy" },
  { word: "sun", category: "Nature", difficulty: "easy" },
  { word: "tree", category: "Nature", difficulty: "easy" },
  { word: "house", category: "Objects", difficulty: "easy" },
  { word: "car", category: "Objects", difficulty: "easy" },
  { word: "fish", category: "Animals", difficulty: "easy" },
  { word: "bird", category: "Animals", difficulty: "easy" },
  { word: "apple", category: "Food", difficulty: "easy" },
  { word: "pizza", category: "Food", difficulty: "easy" },
  { word: "star", category: "Nature", difficulty: "easy" },
  { word: "flower", category: "Nature", difficulty: "easy" },
  { word: "boat", category: "Objects", difficulty: "easy" },
  { word: "hat", category: "Objects", difficulty: "easy" },
  { word: "book", category: "Objects", difficulty: "easy" },
  { word: "clock", category: "Objects", difficulty: "easy" },
  { word: "moon", category: "Nature", difficulty: "easy" },
  { word: "heart", category: "Symbols", difficulty: "easy" },
  { word: "key", category: "Objects", difficulty: "easy" },
  { word: "ball", category: "Sports", difficulty: "easy" },

  // Medium
  { word: "elephant", category: "Animals", difficulty: "medium" },
  { word: "bicycle", category: "Objects", difficulty: "medium" },
  { word: "rainbow", category: "Nature", difficulty: "medium" },
  { word: "guitar", category: "Music", difficulty: "medium" },
  { word: "volcano", category: "Nature", difficulty: "medium" },
  { word: "lighthouse", category: "Places", difficulty: "medium" },
  { word: "umbrella", category: "Objects", difficulty: "medium" },
  { word: "penguin", category: "Animals", difficulty: "medium" },
  { word: "spaghetti", category: "Food", difficulty: "medium" },
  { word: "basketball", category: "Sports", difficulty: "medium" },
  { word: "telescope", category: "Objects", difficulty: "medium" },
  { word: "waterfall", category: "Nature", difficulty: "medium" },
  { word: "submarine", category: "Vehicles", difficulty: "medium" },
  { word: "cactus", category: "Nature", difficulty: "medium" },
  { word: "tornado", category: "Nature", difficulty: "medium" },
  { word: "kangaroo", category: "Animals", difficulty: "medium" },
  { word: "skateboard", category: "Sports", difficulty: "medium" },
  { word: "campfire", category: "Nature", difficulty: "medium" },
  { word: "snowman", category: "Seasonal", difficulty: "medium" },
  { word: "treasure chest", category: "Objects", difficulty: "medium" },

  // Hard
  { word: "democracy", category: "Concepts", difficulty: "hard" },
  { word: "gravity", category: "Science", difficulty: "hard" },
  { word: "procrastination", category: "Concepts", difficulty: "hard" },
  { word: "photosynthesis", category: "Science", difficulty: "hard" },
  { word: "jazz", category: "Music", difficulty: "hard" },
  { word: "déjà vu", category: "Concepts", difficulty: "hard" },
  { word: "black hole", category: "Science", difficulty: "hard" },
  { word: "mime", category: "Performance", difficulty: "hard" },
  { word: "paradox", category: "Concepts", difficulty: "hard" },
  { word: "nostalgia", category: "Emotions", difficulty: "hard" },
  { word: "evolution", category: "Science", difficulty: "hard" },
  { word: "sarcasm", category: "Concepts", difficulty: "hard" },
  { word: "time travel", category: "Concepts", difficulty: "hard" },
  { word: "invisible", category: "Concepts", difficulty: "hard" },
  { word: "echo", category: "Concepts", difficulty: "hard" },
  { word: "karma", category: "Concepts", difficulty: "hard" },
  { word: "wifi", category: "Technology", difficulty: "hard" },
  { word: "algorithm", category: "Technology", difficulty: "hard" },
  { word: "quantum", category: "Science", difficulty: "hard" },
  { word: "infinity", category: "Concepts", difficulty: "hard" },
];

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const difficulty = (req.query.difficulty as Difficulty) || "medium";
  const filtered = wordBank.filter((w) => w.difficulty === difficulty);
  const entry = filtered[Math.floor(Math.random() * filtered.length)];
  res.json(entry);
});

export default router;
