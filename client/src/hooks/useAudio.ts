import { useRef, useCallback, useEffect } from "react";

/**
 * Builds a tiny silent WAV blob URL used to "unlock" HTML5 audio
 * playback on mobile browsers. On iOS Safari and mobile Chrome the
 * browser refuses to play any audio element that was not started
 * inside a user-gesture callback; once *any* audio has played from
 * inside a gesture, the rest of the page is unlocked for the session.
 *
 * The blob is a valid 1-sample 44.1 kHz mono PCM WAV — ~44 bytes —
 * which decodes and "plays" instantly so the unlock completes before
 * the gesture callback returns.
 */
function createSilentWavUrl(): string {
  const wav = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x26, 0x00, 0x00, 0x00, // file size - 8 (= 36 + 2 bytes of data)
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6d, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // fmt chunk size (16 for PCM)
    0x01, 0x00,             // PCM
    0x01, 0x00,             // mono
    0x44, 0xac, 0x00, 0x00, // 44100 Hz sample rate
    0x88, 0x58, 0x01, 0x00, // byte rate = sample rate * block align
    0x02, 0x00,             // block align = 2 bytes
    0x10, 0x00,             // 16 bits per sample
    0x64, 0x61, 0x74, 0x61, // "data"
    0x02, 0x00, 0x00, 0x00, // data size = 2 bytes
    0x00, 0x00,             // one silent 16-bit sample
  ]);
  return URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
}

export interface FetchAndPlayResult {
  guessText: string | null;
  celebrationText: string | null;
  /** True if audio played successfully. False if blocked (e.g. mobile
   * autoplay policy) or aborted. The caller should still act on
   * guessText/celebrationText regardless. */
  audioOk: boolean;
}

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const primedRef = useRef(false);

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

  /**
   * Unlock HTML5 audio playback on mobile. Must be called *synchronously*
   * from inside a user-gesture handler (click/touch/keydown). Idempotent:
   * after the first successful call, subsequent calls are no-ops.
   */
  const prime = useCallback(() => {
    if (primedRef.current) return;
    primedRef.current = true; // Set eagerly so we never re-attempt.
    try {
      const url = createSilentWavUrl();
      const a = new Audio(url);
      a.volume = 0;
      const p = a.play();
      const cleanup = () => {
        try { a.pause(); } catch { /* ignore */ }
        URL.revokeObjectURL(url);
      };
      if (p && typeof p.then === "function") {
        p.then(cleanup).catch(() => {
          // Still flip primedRef so we don't spam retries. The user
          // will experience text-only guesses, which is acceptable.
          cleanup();
        });
      } else {
        cleanup();
      }
    } catch {
      // Some browsers (very old) don't support Audio at all — ignore.
    }
  }, []);

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

  /**
   * Fetch a (usually audio) response from `url` and attempt to play
   * the returned blob. The text payload from the response headers is
   * always returned if the fetch itself succeeded, even when audio
   * playback is blocked by the browser (which happens on mobile when
   * the call isn't triggered by a user gesture).
   *
   * Throws only on network/HTTP failures — NOT on audio playback
   * failures — so callers can reliably distinguish "the API is down"
   * from "the user is on mobile and autoplay is blocked".
   */
  const fetchAndPlay = useCallback(
    async (url: string, options: RequestInit): Promise<FetchAndPlayResult> => {
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
        return { guessText, celebrationText, audioOk: false };
      }

      try {
        await playBlob(blob);
        return { guessText, celebrationText, audioOk: true };
      } catch (err) {
        // Don't propagate — the API call succeeded. Most commonly this
        // is a mobile autoplay block (NotAllowedError). Callers will
        // decide whether to notify the user about audio unavailability.
        console.warn(
          "Audio playback blocked or failed (falling back to text-only):",
          err
        );
        return { guessText, celebrationText, audioOk: false };
      }
    },
    [playBlob, stop]
  );

  return { fetchAndPlay, stop, prime };
}
