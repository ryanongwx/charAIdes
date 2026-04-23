const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (s: string): string[] => normalize(s).split(" ").filter(Boolean);

const containsToken = (guessTokens: string[], word: string): boolean => {
  if (!word) return false;
  const w = word.toLowerCase();
  const singular = w.endsWith("s") && w.length > 3 ? w.slice(0, -1) : null;
  const plural = !w.endsWith("s") ? w + "s" : null;
  return guessTokens.some((t) => t === w || t === singular || t === plural);
};

export function isCorrectGuess(guessText: string, secretWord: string): boolean {
  const guessToks = tokens(guessText);
  const secretToks = tokens(secretWord);
  if (guessToks.length === 0 || secretToks.length === 0) return false;

  return secretToks.every((sw) => containsToken(guessToks, sw));
}
