import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateGuess(
  imageBase64: string,
  guessHistory: string[],
  hint?: string
): Promise<string> {
  const previousGuesses =
    guessHistory.length > 0
      ? `Previous guesses (don't repeat these): ${guessHistory.join(", ")}.`
      : "This is your first guess.";

  const hintLine = hint ? `Hint from the player: ${hint}.` : "";

  const systemPrompt = `You are a playful, expressive AI playing Pictionary. 
You look at drawings and make spoken guesses out loud. 
Your personality: curious, funny, slightly dramatic, enthusiastic.
Rules:
- Make exactly ONE guess per response.
- Speak naturally as if talking to the player, e.g. "Ooh, is that a... flamingo?!" or "Hmm, I'm thinking this might be a bicycle?"
- Keep it to 1-2 sentences max.
- Be creative — consider abstract interpretations if the drawing is unclear.
- Never say "I give up" or refuse to guess.
- ${previousGuesses}
- ${hintLine}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.9,
    max_tokens: 80,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageBase64,
              detail: "low",
            },
          },
          {
            type: "text",
            text: "What do you think this drawing is? Make your guess!",
          },
        ],
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "Hmm, I'm not sure... is it something round?";
}

export async function generateCelebrationLine(
  won: boolean,
  word: string,
  guessCount: number
): Promise<string> {
  if (won) {
    const lines = [
      `YES! It's a ${word}! I got it in ${guessCount} guess${guessCount === 1 ? "" : "es"}! I'm basically a genius!`,
      `Oh my goodness, it's a ${word}! That took me ${guessCount} tries — your drawing skills are... interesting!`,
      `A ${word}! I knew it! Well, eventually I knew it. ${guessCount} guesses isn't bad at all!`,
      `EUREKA! ${word}! I cracked it in ${guessCount} guess${guessCount === 1 ? "" : "es"}! We make a great team!`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  } else {
    return `Time's up! The answer was "${word}"! I was so close... or maybe not. Better luck next round!`;
  }
}
