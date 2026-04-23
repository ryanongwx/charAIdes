import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15_000,
  maxRetries: 1,
});

const FALLBACK_GUESS = "Hmm, I can't quite tell yet — can you add a little more?";

const firstWord = (s: string) =>
  (s.toLowerCase().match(/[a-z']+/) ?? [""])[0];

export async function generateGuess(
  imageBase64: string,
  guessHistory: string[],
  hint?: string,
  canvasChanged: boolean = true
): Promise<string> {
  const recentOpeners = Array.from(
    new Set(guessHistory.slice(-4).map(firstWord).filter(Boolean))
  );
  const recentGuesses = guessHistory.slice(-6);

  const previousLine =
    recentGuesses.length > 0
      ? `Things you've already said this round (do NOT repeat any of these): ${recentGuesses
          .map((g) => `"${g}"`)
          .join(" | ")}`
      : "This is your very first guess this round.";

  const openerLine =
    recentOpeners.length > 0
      ? `You recently started lines with these words: ${recentOpeners.join(
          ", "
        )}. Do NOT start your next line with any of those words.`
      : "";

  const sameDrawingLine = canvasChanged
    ? "The drawing was just updated — look for new strokes and let them inform your guess."
    : "The drawing has NOT changed since your last look. Pick ONE of these moves:\n  (a) Take a *different* stab at it from a new angle (color, shape, vibe).\n  (b) Honestly admit you're stumped — short, playful (e.g. \"Honestly? No clue.\", \"You've got me!\").\n  (c) Ask the player to add more detail — short and friendly (e.g. \"Could you add a face? I can't tell yet.\", \"More detail please — I need a clue!\").\n  Pick whichever feels most natural; vary across turns.";

  const hintLine = hint ? `Player hint: ${hint}.` : "";

  const systemPrompt = `You are a playful, expressive AI playing Pictionary with a human, watching their drawing live.
You blurt out short reactions in real time, like a friend leaning over their shoulder.

Style rules (READ CAREFULLY):
- ONE short sentence per response. Max ~14 words. These are spoken blurts, not essays.
- VARY your openers and tone every single time. Do not lean on the same phrasing.
- Avoid these overused starters: "Ah,", "Ooh,", "Oh,", "Hmm," — use them at most once every few guesses.
- Mix between these response modes (don't do the same one twice in a row):
  • Direct guess: "Is that a flamingo?", "A bicycle, right?", "Looks like a kite to me."
  • Thinking aloud: "Wait — donut? No, a tire.", "Is that... a pretzel?"
  • Wild guess: "No way — a llama in a tuxedo?!"
  • Stumped: "I'm completely lost on this one.", "You've got me — what is that?"
  • Asking for more: "Add a face maybe? I can't quite tell.", "Could you draw a bit more — I'm stuck."
- Never refuse to engage. "Stumped" and "ask for more" still count as engaging.
- Do not start with the player's name or self-narrate ("I think I'll guess...").

${previousLine}
${openerLine}
${sameDrawingLine}
${hintLine}`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 1.0,
    top_p: 0.95,
    presence_penalty: 0.6,
    frequency_penalty: 0.4,
    max_tokens: 60,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageBase64, detail: "low" } },
          {
            type: "text",
            text: canvasChanged
              ? "What's your next reaction to this drawing?"
              : "The drawing hasn't changed. React naturally — guess differently, admit confusion, or ask for more detail.",
          },
        ],
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || FALLBACK_GUESS;
}

const FALLBACK_WIN_LINES = (word: string, guessCount: number) => [
  `YES! It's a ${word}! I got it in ${guessCount} guess${guessCount === 1 ? "" : "es"}! I'm basically a genius!`,
  `Oh my goodness, it's a ${word}! That took me ${guessCount} tries — your drawing skills are... interesting!`,
  `A ${word}! I knew it! Well, eventually I knew it. ${guessCount} guesses isn't bad at all!`,
  `EUREKA! ${word}! I cracked it in ${guessCount} guess${guessCount === 1 ? "" : "es"}! We make a great team!`,
];

export async function generateCelebrationLine(
  won: boolean,
  word: string,
  guessCount: number
): Promise<string> {
  const prompt = won
    ? `You just won a Pictionary round by guessing the word "${word}" in ${guessCount} guess${
        guessCount === 1 ? "" : "es"
      }. Give a short, playful, spoken celebration line (max 2 sentences). Stay in character as an enthusiastic AI guesser — reference the word and the guess count naturally.`
    : `You just ran out of time in a Pictionary round. The word was "${word}". Give a short, good-natured, spoken "time's up" line (max 2 sentences) that reveals the word and stays playful — no sulking.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.95,
      max_tokens: 80,
      messages: [
        {
          role: "system",
          content:
            "You are a playful, expressive AI that just played Pictionary with the user. You speak out loud in short, conversational lines — curious, funny, slightly dramatic.",
        },
        { role: "user", content: prompt },
      ],
    });
    const line = response.choices[0]?.message?.content?.trim();
    if (line) return line;
  } catch (err) {
    console.error("Celebration generation failed, using fallback:", err);
  }

  if (won) {
    const lines = FALLBACK_WIN_LINES(word, guessCount);
    return lines[Math.floor(Math.random() * lines.length)];
  }
  return `Time's up! The answer was "${word}"! So close... or maybe not. Better luck next round!`;
}
