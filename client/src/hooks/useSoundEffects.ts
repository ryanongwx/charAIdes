import { useCallback, useRef } from "react";

// Simple sound effects using Web Audio API
export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playClick = useCallback(() => {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = 800;
    gain.gain.value = 0.1;
    
    osc.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  }, [getContext]);

  const playSuccess = useCallback(() => {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = 523.25; // C5
    gain.gain.value = 0.15;
    
    osc.start(ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  }, [getContext]);

  const playError = useCallback(() => {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = 200;
    gain.gain.value = 0.1;
    
    osc.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.stop(ctx.currentTime + 0.2);
  }, [getContext]);

  const playDraw = useCallback(() => {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.value = 1000 + Math.random() * 200;
    gain.gain.value = 0.02;
    
    osc.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.stop(ctx.currentTime + 0.05);
  }, [getContext]);

  return { playClick, playSuccess, playError, playDraw };
}
