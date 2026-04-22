/**
 * Checks if the AI's guess text contains the secret word (case-insensitive).
 * Also handles simple plurals and common variations.
 */
export function isCorrectGuess(guessText: string, secretWord: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  const guess = normalize(guessText);
  const secret = normalize(secretWord);

  // Direct match
  if (guess.includes(secret)) return true;

  // Check each word in the secret phrase
  const secretWords = secret.split(/\s+/);
  if (secretWords.length > 1) {
    // Multi-word: all words must appear in guess
    return secretWords.every((w) => guess.includes(w));
  }

  // Simple plural/singular
  if (guess.includes(secret + "s")) return true;
  if (secret.endsWith("s") && guess.includes(secret.slice(0, -1))) return true;

  return false;
}

/**
 * Extracts the core guess noun/phrase from a conversational sentence.
 * e.g. "Ooh, is that a flamingo?!" → "flamingo"
 */
export function extractGuessWord(sentence: string): string {
  // Remove punctuation and common filler phrases
  return sentence
    .replace(/[?!.,;:]/g, "")
    .replace(/\b(is it|is that|maybe|perhaps|could it be|i think|i guess|ooh|hmm|wait|oh|ah|wow|definitely|probably|possibly|a|an|the)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}
