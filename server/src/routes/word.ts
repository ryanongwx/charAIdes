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
  { word: "cloud", category: "Nature", difficulty: "easy" },
  { word: "cup", category: "Objects", difficulty: "easy" },
  { word: "shoe", category: "Objects", difficulty: "easy" },
  { word: "eye", category: "Body", difficulty: "easy" },
  { word: "hand", category: "Body", difficulty: "easy" },
  { word: "pencil", category: "Objects", difficulty: "easy" },
  { word: "snake", category: "Animals", difficulty: "easy" },
  { word: "bee", category: "Animals", difficulty: "easy" },
  { word: "cake", category: "Food", difficulty: "easy" },

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
  { word: "castle", category: "Places", difficulty: "medium" },
  { word: "dragon", category: "Mythology", difficulty: "medium" },
  { word: "hamburger", category: "Food", difficulty: "medium" },
  { word: "helicopter", category: "Vehicles", difficulty: "medium" },
  { word: "pyramid", category: "Places", difficulty: "medium" },
  { word: "robot", category: "Technology", difficulty: "medium" },
  { word: "ice cream", category: "Food", difficulty: "medium" },
  { word: "mushroom", category: "Nature", difficulty: "medium" },
  { word: "octopus", category: "Animals", difficulty: "medium" },

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

// Cache filtered word lists for performance
const wordCache: Record<Difficulty, WordEntry[]> = {
  easy: wordBank.filter((w) => w.difficulty === "easy"),
  medium: wordBank.filter((w) => w.difficulty === "medium"),
  hard: wordBank.filter((w) => w.difficulty === "hard"),
};

const router = Router();

const isDifficulty = (v: unknown): v is Difficulty =>
  v === "easy" || v === "medium" || v === "hard";

router.get("/", (req: Request, res: Response) => {
  const raw = req.query.difficulty;
  const difficulty: Difficulty = isDifficulty(raw) ? raw : "medium";
  const filtered = wordCache[difficulty];
  const entry = filtered[Math.floor(Math.random() * filtered.length)];

  res.setHeader("Cache-Control", "no-store");
  res.json(entry);
});

export default router;
