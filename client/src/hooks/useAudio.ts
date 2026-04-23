import { useRef, useCallback, useEffect } from "react";

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const playBlob = useCallback((blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      urlRef.current = url;

      const cleanup = () => {
        if (urlRef.current === url) {
          URL.revokeObjectURL(url);
          urlRef.current = null;
        }
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      audio.onended = () => {
        cleanup();
        resolve();
      };
      audio.onerror = () => {
        cleanup();
        reject(new Error("Audio playback failed"));
      };

      audio.play().catch((err) => {
        cleanup();
        reject(err);
      });
    });
  }, []);

  const fetchAndPlay = useCallback(
    async (
      url: string,
      options: RequestInit
    ): Promise<{ guessText: string | null; celebrationText: string | null }> => {
      stop();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: `Request failed (${res.status})` }));
        throw new Error(err.error ?? "Request failed");
      }

      const getHeader = (name: string) => {
        const raw = res.headers.get(name);
        return raw ? decodeURIComponent(raw) : null;
      };
      const guessText = getHeader("X-Guess-Text");
      const celebrationText = getHeader("X-Celebration-Text");

      const blob = await res.blob();
      if (controller.signal.aborted) {
        return { guessText, celebrationText };
      }
      await playBlob(blob);

      return { guessText, celebrationText };
    },
    [playBlob, stop]
  );

  return { fetchAndPlay, stop };
}
