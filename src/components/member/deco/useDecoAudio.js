import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'hugo-deco-audio';

export const DECO_SOUNDTRACKS = Object.freeze([
  { id: 'cozy', label: 'Cozy Lo-fi', detail: 'Ấm, nhẹ và thư giãn' },
  { id: 'rain', label: 'Rain Glass', detail: 'Mưa dịu bên cửa sổ' },
  { id: 'night', label: 'Midnight', detail: 'Không gian đêm sâu' },
]);

const CHORDS = {
  cozy: [130.81, 164.81, 196],
  rain: [110, 146.83, 220],
  night: [98, 123.47, 146.83],
};

function readPreference() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      enabled: Boolean(stored.enabled),
      soundtrack: CHORDS[stored.soundtrack] ? stored.soundtrack : 'cozy',
    };
  } catch {
    return { enabled: false, soundtrack: 'cozy' };
  }
}

export default function useDecoAudio() {
  const initial = useRef(null);
  if (!initial.current) initial.current = readPreference();

  const [enabled, setEnabled] = useState(initial.current.enabled);
  const [soundtrack, setSoundtrackState] = useState(initial.current.soundtrack);
  const audioRef = useRef(null);
  const ambientRef = useRef(null);

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioRef.current = new AudioContext();
    }
    if (audioRef.current.state === 'suspended') {
      audioRef.current.resume().catch(() => {});
    }
    return audioRef.current;
  }, []);

  const stopAmbient = useCallback(() => {
    const ambient = ambientRef.current;
    if (!ambient) return;
    const now = ambient.context.currentTime;
    ambient.master.gain.cancelScheduledValues(now);
    ambient.master.gain.setTargetAtTime(0.0001, now, 0.08);
    window.setTimeout(() => {
      ambient.nodes.forEach((node) => {
        try { node.stop(); } catch {}
        try { node.disconnect(); } catch {}
      });
      try { ambient.master.disconnect(); } catch {}
    }, 320);
    ambientRef.current = null;
  }, []);

  const startAmbient = useCallback((track) => {
    const context = ensureContext();
    if (!context) return;
    stopAmbient();

    const master = context.createGain();
    const lowPass = context.createBiquadFilter();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.032, context.currentTime + 1.2);
    lowPass.type = 'lowpass';
    lowPass.frequency.value = track === 'rain' ? 1500 : 760;
    lowPass.Q.value = 0.5;
    master.connect(lowPass);
    lowPass.connect(context.destination);

    const nodes = CHORDS[track].map((frequency, index) => {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      oscillator.type = track === 'night' ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      voice.gain.value = index === 0 ? 0.42 : 0.25;
      lfo.type = 'sine';
      lfo.frequency.value = 0.045 + index * 0.017;
      lfoGain.gain.value = 2.5;
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.detune);
      oscillator.connect(voice);
      voice.connect(master);
      oscillator.start();
      lfo.start();
      return [oscillator, lfo, voice, lfoGain];
    }).flat();

    if (track === 'rain') {
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
      const rain = context.createBufferSource();
      const rainFilter = context.createBiquadFilter();
      const rainGain = context.createGain();
      rain.buffer = buffer;
      rain.loop = true;
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 2100;
      rainFilter.Q.value = 0.65;
      rainGain.gain.value = 0.12;
      rain.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(master);
      rain.start();
      nodes.push(rain, rainFilter, rainGain);
    }

    ambientRef.current = { context, master, nodes };
  }, [ensureContext, stopAmbient]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, soundtrack }));
    } catch {}
    if (enabled) startAmbient(soundtrack);
    else stopAmbient();
  }, [enabled, soundtrack, startAmbient, stopAmbient]);

  useEffect(() => () => {
    stopAmbient();
    const context = audioRef.current;
    if (context && context.state !== 'closed') context.close().catch(() => {});
  }, [stopAmbient]);

  const playCue = useCallback((cue = 'select') => {
    if (!enabled) return;
    const context = ensureContext();
    if (!context) return;

    const presets = {
      select: [[520, 0], [660, 0.06]],
      place: [[330, 0], [495, 0.08]],
      open: [[420, 0], [630, 0.07], [840, 0.14]],
      success: [[523, 0], [659, 0.09], [784, 0.18]],
      purchase: [[392, 0], [587, 0.08], [988, 0.2]],
      pet: [[220, 0], [370, 0.1]],
      sweep: [[740, 0], [260, 0.08]],
      sparkle: [[880, 0], [1320, 0.08]],
    };
    const notes = presets[cue] || presets.select;
    const startedAt = context.currentTime;

    notes.forEach(([frequency, offset], index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = cue === 'pet' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, startedAt + offset);
      gain.gain.setValueAtTime(0.0001, startedAt + offset);
      gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.075 : 0.045, startedAt + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + offset + 0.18);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startedAt + offset);
      oscillator.stop(startedAt + offset + 0.2);
    });
  }, [enabled, ensureContext]);

  const toggle = useCallback(() => {
    ensureContext();
    setEnabled((value) => !value);
  }, [ensureContext]);

  const setSoundtrack = useCallback((next) => {
    if (!CHORDS[next]) return;
    ensureContext();
    setSoundtrackState(next);
    setEnabled(true);
  }, [ensureContext]);

  return { enabled, soundtrack, toggle, setSoundtrack, playCue };
}
