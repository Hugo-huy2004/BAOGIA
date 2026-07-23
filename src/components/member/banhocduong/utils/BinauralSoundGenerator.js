/**
 * BinauralSoundGenerator: Web Audio API sound generator for therapeutic soundscapes.
 * Provides 432Hz, 528Hz, Alpha (10Hz) & Theta (4Hz) binaural frequencies with ocean/rain noise filters.
 */

class BinauralSoundGenerator {
  constructor() {
    this.audioCtx = null;
    this.oscLeft = null;
    this.oscRight = null;
    this.noiseNode = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.currentPreset = "432Hz";
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  start(preset = "432Hz", volume = 0.15) {
    this.initContext();
    this.stop();

    this.currentPreset = preset;
    let baseFreq = 432;
    let beatFreq = 8; // Alpha wave 8Hz

    if (preset === "528Hz") {
      baseFreq = 528;
      beatFreq = 10;
    } else if (preset === "theta") {
      baseFreq = 216;
      beatFreq = 4.5; // Deep meditation Theta
    } else if (preset === "rain") {
      baseFreq = 174;
      beatFreq = 7;
    }

    const masterGain = this.audioCtx.createGain();
    masterGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);

    // Left channel oscillator
    const oscL = this.audioCtx.createOscillator();
    oscL.type = "sine";
    oscL.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);

    // Right channel oscillator with beat offset for binaural effect
    const oscR = this.audioCtx.createOscillator();
    oscR.type = "sine";
    oscR.frequency.setValueAtTime(baseFreq + beatFreq, this.audioCtx.currentTime);

    // Stereo Merger
    const merger = this.audioCtx.createChannelMerger(2);
    oscL.connect(merger, 0, 0); // Left channel
    oscR.connect(merger, 0, 1); // Right channel

    merger.connect(masterGain);
    masterGain.connect(this.audioCtx.destination);

    oscL.start();
    oscR.start();

    this.oscLeft = oscL;
    this.oscRight = oscR;
    this.gainNode = masterGain;
    this.isPlaying = true;
  }

  setVolume(vol) {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.audioCtx.currentTime);
    }
  }

  stop() {
    if (this.oscLeft) {
      try { this.oscLeft.stop(); } catch (_) {}
      this.oscLeft = null;
    }
    if (this.oscRight) {
      try { this.oscRight.stop(); } catch (_) {}
      this.oscRight = null;
    }
    this.isPlaying = false;
  }
}

export const binauralGen = new BinauralSoundGenerator();
