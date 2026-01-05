import { useCallback, useRef } from 'react';

export const useWoodSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playWoodHit = useCallback((intensity: number = 0.3) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Create noise buffer for wood texture
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter for woody tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800 + Math.random() * 400;
      filter.Q.value = 2;

      // Gain envelope
      const gain = ctx.createGain();
      const volume = Math.min(0.15, intensity * 0.15);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      // Add a subtle tone for body
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 150 + Math.random() * 100;

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(volume * 0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      // Connect nodes
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      // Play
      noise.start(now);
      noise.stop(now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      // Audio not supported or blocked
    }
  }, [getAudioContext]);

  return { playWoodHit };
};
