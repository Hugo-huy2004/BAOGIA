/**
 * HUMANTALITY SENSORY ENGINE (ÂM THANH + RUNG + CẢM BIẾN TƯƠNG TÁC)
 * 
 * Triết lý Humantality Design:
 * - Phản hồi đa giác quan (Haptic + Synthetic Acoustics) cho mọi tương tác quan trọng.
 * - 100% Web Audio API nội tại: Không tải file MP3/WAV bên ngoài, 0ms độ trễ, 0 byte băng thông.
 * - Tương thích hoàn hảo: Kết hợp @capacitor/haptics trên iOS/Android và navigator.vibrate trên Web.
 */
import { triggerHaptic } from '../utils/haptics';

class HumantalitySensory {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.hapticsEnabled = true;

    if (typeof window !== 'undefined') {
      try {
        const storedSound = localStorage.getItem('hugo_sensory_sound');
        const storedHaptics = localStorage.getItem('hugo_sensory_haptics');
        if (storedSound !== null) this.soundEnabled = storedSound === 'true';
        if (storedHaptics !== null) this.hapticsEnabled = storedHaptics === 'true';
      } catch {
        // localStorage có thể bị chặn trong private browsing
      }
    }
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // ── RUNG PHẢN HỒI (HAPTICS) ────────────────────────────────────────────────
  vibrate(type = 'light') {
    if (!this.hapticsEnabled || typeof window === 'undefined') return;

    const patterns = {
      light: 10,
      medium: 25,
      heavy: 45,
      success: [15, 40, 20],
      warning: [30, 50, 30],
      error: [40, 60, 40, 60, 50],
    };
    try {
      triggerHaptic(patterns[type] || 10);
    } catch {
      // Fallback
    }
  }

  // ── ÂM THANH TỔNG HỢP (SYNTHETIC ACOUSTICS) ──────────────────────────────
  playTone(freq, type = 'sine', duration = 0.05, startVol = 0.06) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(startVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext có thể bị chặn trước tương tác đầu tiên của người dùng
    }
  }

  /**
   * Click / Tap nhẹ (Chạm nút, chuyển tab, chọn mục)
   */
  tap() {
    this.vibrate('light');
    this.playTone(1200, 'sine', 0.035, 0.05);
  }

  /**
   * Bật / Tắt công tắc (Toggle switch)
   */
  toggle(on = true) {
    this.vibrate('medium');
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(on ? 480 : 720, now);
      osc.frequency.exponentialRampToValueAtTime(on ? 720 : 480, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.09);
    } catch {}
  }

  /**
   * Thành công / Hoàn thành (Nộp bài, lưu thành công, thanh toán)
   */
  success() {
    this.vibrate('success');
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99]; // Hợp âm Đô trưởng (C5 - E5 - G5)
      notes.forEach((freq, idx) => {
        const time = ctx.currentTime + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.22);
      });
    } catch {}
  }

  /**
   * Cảnh báo / Nhắc nhở (Hạn ngạch, cảnh báo nhẹ)
   */
  warning() {
    this.vibrate('warning');
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [440, 392].forEach((freq, idx) => {
        const time = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.16);
      });
    } catch {}
  }

  /**
   * Lỗi / Nguy hiểm (Hành động cấm, xoá, lỗi mạng)
   */
  error() {
    this.vibrate('error');
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [240, 180].forEach((freq, idx) => {
        const time = now + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.18);
      });
    } catch {}
  }

  /**
   * Mở rộng / Nổi lên (Modal, Drawer, Menu popup)
   */
  pop() {
    this.vibrate('light');
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.06);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.07);
    } catch {}
  }

  /**
   * Còi báo động khẩn cấp (Emergency Siren / Crisis Escalation)
   */
  siren() {
    this.vibrate('heavy');
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.25);
      osc.frequency.linearRampToValueAtTime(600, now + 0.5);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.45);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.5);
    } catch {}
  }

  setSoundEnabled(val) {
    this.soundEnabled = Boolean(val);
    try {
      localStorage.setItem('hugo_sensory_sound', String(this.soundEnabled));
    } catch {}
  }

  setHapticsEnabled(val) {
    this.hapticsEnabled = Boolean(val);
    try {
      localStorage.setItem('hugo_sensory_haptics', String(this.hapticsEnabled));
    } catch {}
  }
}

export const sensory = new HumantalitySensory();
export default sensory;
