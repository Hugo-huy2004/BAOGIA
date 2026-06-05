import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square } from "lucide-react";

export default function ReadingTherapy({ onBack, onCompleteActivity, showToast }) {
  const [timerDuration, setTimerDuration] = useState(1800); 
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  const [selectedMusicChannel, setSelectedMusicChannel] = useState(1); 
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef([]);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            stopMusic();
            clearInterval(timerIntervalRef.current);
            onCompleteActivity(
              "Đọc sách trị liệu",
              `Hoàn thành liệu pháp thời lượng ${Math.round(timerDuration / 60)} phút.`
            );
            if (showToast) {
              showToast("Chúc mừng cậu đã hoàn tất thời gian trị liệu! Cậu hãy nghỉ ngơi một chút nhé.", "success");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerDuration]);

  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, []);

  const startMusic = (channel) => {
    stopMusic();
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.12, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(mainGain.gain);
      lfo.start();

      const nodes = [lfo, lfoGain];

      if (channel === 1) {
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(140, ctx.currentTime);

        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(150, ctx.currentTime);

        const pan1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pan2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        if (pan1 && pan2) {
          pan1.pan.setValueAtTime(-1, ctx.currentTime);
          pan2.pan.setValueAtTime(1, ctx.currentTime);
          osc1.connect(pan1).connect(mainGain);
          osc2.connect(pan2).connect(mainGain);
          nodes.push(pan1, pan2);
        } else {
          osc1.connect(mainGain);
          osc2.connect(mainGain);
        }
        osc1.start();
        osc2.start();
        nodes.push(osc1, osc2);
      } else if (channel === 2) {
        const frequencies = [110, 137.5, 165, 220]; 
        frequencies.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f + (idx * 0.2), ctx.currentTime);

          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
          
          osc.connect(gainNode).connect(filter);
          osc.start();
          nodes.push(osc, gainNode);
        });
        filter.connect(mainGain);
        nodes.push(filter);
      } else {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const waveLfo = ctx.createOscillator();
        waveLfo.frequency.setValueAtTime(0.1, ctx.currentTime); 
        const waveLfoGain = ctx.createGain();
        waveLfoGain.gain.setValueAtTime(140, ctx.currentTime);

        waveLfo.connect(waveLfoGain);
        waveLfoGain.connect(filter.frequency);
        
        filter.frequency.setValueAtTime(220, ctx.currentTime);
        whiteNoise.connect(filter).connect(mainGain);
        
        waveLfo.start();
        whiteNoise.start();
        nodes.push(whiteNoise, waveLfo, waveLfoGain, filter);
      }

      mainGain.connect(ctx.destination);
      nodes.push(mainGain);
      synthNodesRef.current = nodes;
      setIsMusicPlaying(true);
    } catch (err) {
      console.error("Audio Synthesis initialization failed", err);
    }
  };

  const stopMusic = () => {
    try {
      synthNodesRef.current.forEach(node => {
        if (node.stop) node.stop();
      });
      synthNodesRef.current = [];
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
      setIsMusicPlaying(false);
    } catch (e) {
      // ignore
    }
  };

  const startTimer = (dur) => {
    setTimerDuration(dur);
    setTimerSecondsLeft(dur);
    setIsTimerRunning(true);
    startMusic(selectedMusicChannel);
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      stopMusic();
    } else {
      setIsTimerRunning(true);
      startMusic(selectedMusicChannel);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    stopMusic();
    setTimerSecondsLeft(timerDuration);
  };

  const formatTimerTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-5 text-center max-w-md mx-auto animate-scaleUp">
      <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50">
        <button type="button" onClick={onBack} className="text-zinc-450 text-[10px] font-black uppercase tracking-wider hover:text-zinc-700">
          Quay lại thẻ
        </button>
        <span className="text-[9.5px] font-black uppercase text-indigo-500">Đọc sách Trị liệu</span>
      </div>

      <div className="py-6 space-y-4">
        <div className="text-6xl font-mono font-black text-indigo-500 animate-pulse">
          {formatTimerTime(timerSecondsLeft)}
        </div>

        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => { resetTimer(); startTimer(1800); }}
            className="px-3 py-1.5 rounded-xl border border-zinc-350 dark:border-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-650 hover:bg-zinc-55"
          >
            30 phút
          </button>
          <button
            type="button"
            onClick={() => { resetTimer(); startTimer(2700); }}
            className="px-3 py-1.5 rounded-xl border border-zinc-350 dark:border-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-650 hover:bg-zinc-55"
          >
            45 phút
          </button>
          <button
            type="button"
            onClick={() => { resetTimer(); startTimer(3600); }}
            className="px-3 py-1.5 rounded-xl border border-zinc-350 dark:border-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-650 hover:bg-zinc-55"
          >
            60 phút
          </button>
        </div>

        {/* Music selector channel */}
        <div className="space-y-2 max-w-xs mx-auto">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Chọn nhạc trị liệu (Web Audio Synth)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { ch: 1, name: "Binaural Alpha" },
              { ch: 2, name: "Ambient Zen" },
              { ch: 3, name: "Sóng Biển Pink" }
            ].map(item => (
              <button
                key={item.ch}
                type="button"
                onClick={() => {
                  setSelectedMusicChannel(item.ch);
                  if (isMusicPlaying) startMusic(item.ch);
                }}
                className={`py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${
                  selectedMusicChannel === item.ch
                    ? "bg-indigo-500 border-zinc-950 dark:border-zinc-800 text-white"
                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-550"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 pt-3">
          <button
            type="button"
            onClick={toggleTimer}
            className="w-12 h-12 rounded-full border-2 border-zinc-950 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-800 dark:text-zinc-150 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] active:scale-95 transition-all"
          >
            {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
          </button>
          <button
            type="button"
            onClick={resetTimer}
            className="w-12 h-12 rounded-full border-2 border-zinc-950 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-800 dark:text-zinc-150 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] active:scale-95 transition-all"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-zinc-400 italic max-w-xs mx-auto leading-relaxed font-semibold">
          Mẹo: Cậu hãy ngồi ở một không gian yên tĩnh, bật cuốn sách yêu thích lên và để tần số nhạc dẫn dắt tâm hồn giảm lo âu nhé.
        </p>
      </div>
    </div>
  );
}
