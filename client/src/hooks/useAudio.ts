import { useRef, useCallback } from "react";

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playBlob = useCallback((blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      audio.play().catch(reject);
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  /**
   * Fetches audio from the server and plays it.
   * Returns the guess text from the X-Guess-Text header (if present).
   */
  const fetchAndPlay = useCallback(
    async (
      url: string,
      options: RequestInit
    ): Promise<{ guessText: string | null; celebrationText: string | null }> => {
      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Request failed");
      }

      const guessText = res.headers.get("X-Guess-Text")
        ? decodeURIComponent(res.headers.get("X-Guess-Text")!)
        : null;
      const celebrationText = res.headers.get("X-Celebration-Text")
        ? decodeURIComponent(res.headers.get("X-Celebration-Text")!)
        : null;

      const blob = await res.blob();
      await playBlob(blob);

      return { guessText, celebrationText };
    },
    [playBlob]
  );

  return { fetchAndPlay, stop };
}
