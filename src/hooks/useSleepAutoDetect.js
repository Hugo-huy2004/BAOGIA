/**
 * Automatic sleep detection using multiple real-time browser signals.
 *
 * Signal stack (priority order):
 *   1. Idle Detection API  — screen lock / unlock (Chrome 94+)
 *   2. 30-min inactivity timer — no mouse/key/touch
 *   3. Page Visibility API — tab hidden / visible
 *   4. Battery API  — plugged in at night
 *   5. Device Motion — accelerometer stillness (mobile)
 *   6. beforeunload — browser close at night
 *   7. Hourly background ticker
 *   8. PeriodicBackgroundSync — OS-level heartbeat (PWA installed)
 *
 * State machine:  monitoring → sleeping → awake → monitoring
 * Persistence:    localStorage (survives page refresh) + CacheStorage (survives tab close, feeds SW)
 */

import { useEffect, useRef, useCallback, useState } from "react";
import dataApi from "../services/dataApi";

// ── Constants ──────────────────────────────────────────────────────────────

const LS_KEY        = "hugo_sleep_v2";
const SW_CACHE_NAME = "hugo-sleep-state-v1";
const SLEEP_THRESH  = 8;   // cumulative score to declare sleep onset
const WAKE_THRESH   = 7;   // cumulative score to declare wake onset

// Positive weight = evidence for sleep; negative = evidence for wake
const WEIGHTS = {
  screen_locked:    8,   // IdleDetector: screen locked
  screen_unlocked: -9,   // IdleDetector: screen unlocked (immediate)
  page_hidden:      3,   // tab hidden in bed window
  page_visible:    -4,   // tab visible in wake window
  inactivity_30m:   5,   // 30+ min no user input in bed window
  user_activity:   -3,   // active input in wake window
  browser_close:    3,   // beforeunload in bed window
  battery_charge:   2,   // plugged in at night
  device_still:     3,   // accelerometer avg < threshold
  device_moving:   -2,   // accelerometer avg > threshold
};

// Hour sets for time windows
const BED_HOURS  = new Set([20, 21, 22, 23, 0, 1, 2, 3]);
const WAKE_HOURS = new Set([4, 5, 6, 7, 8, 9, 10, 11, 12]);

const inBed  = () => BED_HOURS.has(new Date().getHours());
const inWake = () => WAKE_HOURS.has(new Date().getHours());

function pad2(n)  { return String(n).padStart(2, "0"); }
function timeStr(d = new Date()) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function dayStr(d = new Date())  { return d.toISOString().slice(0, 10); }

/** Night date: if after midnight (00:00–03:59) it belongs to the previous calendar day. */
function nightDate(d = new Date()) {
  if (d.getHours() < 4) {
    const p = new Date(d);
    p.setDate(p.getDate() - 1);
    return dayStr(p);
  }
  return dayStr(d);
}

// ── Public hook ────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string}   opts.email        User email (used for server calls)
 * @param {function} opts.onAutoDetect Called with {date, bedtime, wakeTime} on full cycle
 * @param {boolean}  [opts.enabled]    Master switch (default true)
 */
export function useSleepAutoDetect({ email, onAutoDetect, enabled = true }) {
  const [state, setState]           = useState("monitoring"); // monitoring | sleeping | awake
  const [sleepStart, setSleepStart] = useState(null);         // { time: "22:15", date: "2026-06-12" }
  const [confidence, setConfidence] = useState(0);            // 0-100 sleep-onset progress
  const [recentSignals, setSignals] = useState([]);           // last 5 signal names (for UI)
  const [caps, setCaps]             = useState({
    pageVisibility: "hidden" in document,
    idleDetector:   false,
    battery:        false,
    deviceMotion:   false,
    periodicSync:   false,
  });

  // Mutable ref — all internal state that shouldn't cause re-renders
  const R = useRef({
    state:          "monitoring",
    sleepScore:     0,
    wakeScore:      0,
    sleepStart:     null,         // { time, date, ts }
    firstSleepTs:   null,         // earliest signal → accurate bedtime
    lastActivityAt: Date.now(),
    inactivityTid:  null,
    isSending:      false,
  });

  // ── Persistence helpers ────────────────────────────────────────────────

  const saveLS = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        state:          R.current.state,
        sleepStart:     R.current.sleepStart,
        lastActivityAt: R.current.lastActivityAt,
        savedAt:        Date.now(),
      }));
    } catch (_) {}
  }, []);

  /** Write current state to CacheStorage so the Service Worker can read it. */
  const saveSWCache = useCallback(async () => {
    if (!email || typeof caches === "undefined") return;
    try {
      const cache = await caches.open(SW_CACHE_NAME);
      await cache.put("sleep-user-state", new Response(JSON.stringify({
        email,
        state:      R.current.state,
        sleepStart: R.current.sleepStart,
        savedAt:    Date.now(),
      }), { headers: { "Content-Type": "application/json" } }));
    } catch (_) {}
  }, [email]);

  // ── Restore state on mount ─────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !email) return;
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (!saved) return;
      const ageMs = Date.now() - saved.savedAt;
      // Restore "sleeping" if stored within the last 14 hours
      if (saved.state === "sleeping" && saved.sleepStart && ageMs < 14 * 3_600_000) {
        R.current.state      = "sleeping";
        R.current.sleepStart = saved.sleepStart;
        setState("sleeping");
        setSleepStart(saved.sleepStart);
      }
      R.current.lastActivityAt = saved.lastActivityAt || Date.now();
    } catch (_) {}
  }, [enabled, email]);  

  // ── Core: process one signal ───────────────────────────────────────────

  const fire = useCallback((name) => {
    if (!enabled || !email) return;
    const w = WEIGHTS[name];
    if (w === undefined) return;

    const now = new Date();
    setSignals(prev => [name, ...prev].slice(0, 5));

    // ──────────── Sleep accumulation (bed window, positive signals) ───────
    if (w > 0 && inBed()) {
      R.current.sleepScore += w;
      if (!R.current.firstSleepTs) R.current.firstSleepTs = now;

      const progress = Math.min(100, Math.round((R.current.sleepScore / SLEEP_THRESH) * 100));
      setConfidence(progress);

      if (R.current.sleepScore >= SLEEP_THRESH && R.current.state === "monitoring") {
        // ─ Sleep onset ─
        const bedtime = timeStr(R.current.firstSleepTs);
        const date    = nightDate(R.current.firstSleepTs);
        const entry   = { time: bedtime, date, ts: R.current.firstSleepTs.toISOString() };

        R.current.state      = "sleeping";
        R.current.sleepStart = entry;
        R.current.sleepScore = 0;
        setState("sleeping");
        setSleepStart(entry);
        saveLS();
        saveSWCache();

        if (!R.current.isSending) {
          R.current.isSending = true;
          dataApi.patch("/api/sleep/passive", {
            email, event: "sleep_onset",
            bedtime, date, confidence: 85, signals: [name],
          }).catch(() => {}).finally(() => { R.current.isSending = false; });
        }
      }
    }

    // ──────────── Wake accumulation (wake window, after sleep recorded) ───
    if (w < 0 && inWake() && R.current.state === "sleeping") {
      R.current.wakeScore += Math.abs(w);

      const immediate = w <= -6; // strong single signal (screen unlock)
      if (immediate || R.current.wakeScore >= WAKE_THRESH) {
        // ─ Wake onset ─
        const wakeTime  = timeStr(now);
        const sleepData = R.current.sleepStart;

        R.current.state         = "awake";
        R.current.wakeScore     = 0;
        R.current.sleepScore    = 0;
        R.current.firstSleepTs  = null;
        R.current.sleepStart    = null;
        setState("awake");
        setConfidence(0);

        try { localStorage.removeItem(LS_KEY); } catch (_) {}
        saveSWCache();

        if (sleepData && !R.current.isSending) {
          R.current.isSending = true;
          dataApi.patch("/api/sleep/passive", {
            email, event: "wake_onset",
            wakeTime, bedtime: sleepData.time,
            date: sleepData.date, confidence: 90, signals: [name],
          }).then(() => {
            onAutoDetect?.({ date: sleepData.date, bedtime: sleepData.time, wakeTime });
          }).catch(() => {}).finally(() => { R.current.isSending = false; });
        }

        // Return to monitoring after 2 hours (avoid re-detecting same morning)
        setTimeout(() => {
          R.current.state = "monitoring";
          setState("monitoring");
        }, 2 * 3_600_000);
      }
    }

    // Strong opposite signal resets the accumulator
    if (w <= -6) { R.current.sleepScore = 0; R.current.firstSleepTs = null; setConfidence(0); }
    if (w >=  6) { R.current.wakeScore  = 0; }
  }, [enabled, email, onAutoDetect, saveLS, saveSWCache]);

  // ── Signal sources ─────────────────────────────────────────────────────

  // 1. Page Visibility
  useEffect(() => {
    if (!enabled || !email) return;
    const h = () => {
      if (document.hidden) {
        fire("page_hidden");
      } else {
        R.current.lastActivityAt = Date.now();
        fire("page_visible");
      }
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [enabled, email, fire]);

  // 2. User activity → resets sleep score + arms inactivity timer
  useEffect(() => {
    if (!enabled || !email) return;
    let lastActive = 0;
    const onActive = () => {
      const now = Date.now();
      R.current.lastActivityAt = now;
      
      if (now - lastActive < 10000) return; // Throttle state updates & timers to 10s
      lastActive = now;

      // Any activity resets sleep accumulation (user is clearly awake)
      if (R.current.state === "monitoring") {
        R.current.sleepScore   = 0;
        R.current.firstSleepTs = null;
        setConfidence(0);
      }
      if (inWake()) fire("user_activity");

      clearTimeout(R.current.inactivityTid);
      R.current.inactivityTid = setTimeout(() => {
        if (inBed()) fire("inactivity_30m");
      }, 30 * 60_000);
    };
    const evts = ["mousemove", "keydown", "touchstart", "pointerdown", "scroll"];
    evts.forEach(e => document.addEventListener(e, onActive, { passive: true }));
    return () => {
      evts.forEach(e => document.removeEventListener(e, onActive));
      clearTimeout(R.current.inactivityTid);
    };
  }, [enabled, email, fire]);

  // 3. Browser close / page unload
  useEffect(() => {
    if (!enabled || !email) return;
    const h = () => {
      if (inBed()) { fire("browser_close"); saveLS(); }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [enabled, email, fire, saveLS]);

  // 4. Idle Detection API — screen lock / unlock (Chrome 94+, requires permission)
  useEffect(() => {
    if (!enabled || !email || !("IdleDetector" in window)) return;
    let detector = null;
    (async () => {
      try {
        const perm = await IdleDetector.requestPermission();
        if (perm !== "granted") return;
        detector = new IdleDetector();
        detector.addEventListener("change", () => {
          const { screenState, userState } = detector;
          if (screenState === "locked")    fire("screen_locked");
          if (screenState === "unlocked")  fire("screen_unlocked");
          if (userState   === "idle"   && inBed())  fire("inactivity_30m");
          if (userState   === "active" && inWake()) fire("user_activity");
        });
        // 30-minute idle threshold
        await detector.start({ threshold: 30 * 60_000 });
        setCaps(c => ({ ...c, idleDetector: true }));
      } catch (_) {}
    })();
    return () => { try { detector?.abort(); } catch (_) {} };
  }, [enabled, email, fire]);

  // 5. Battery API — plugged in at night
  useEffect(() => {
    if (!enabled || !email || !navigator.getBattery) return;
    navigator.getBattery().then(bat => {
      setCaps(c => ({ ...c, battery: true }));
      const h = () => { if (bat.charging && inBed()) fire("battery_charge"); };
      bat.addEventListener("chargingchange", h);
      return () => bat.removeEventListener("chargingchange", h);
    }).catch(() => {});
  }, [enabled, email, fire]);

  // 6. Device Motion API — stillness detection on mobile
  useEffect(() => {
    if (!enabled || !email || !("DeviceMotionEvent" in window)) return;
    let buf = [];
    let lastProcessed = 0;
    const onMotion = (e) => {
      const now = Date.now();
      if (now - lastProcessed < 1000) return; // Throttle to 1Hz
      lastProcessed = now;
      const a = e.acceleration;
      if (!a) return;
      buf.push(Math.hypot(a.x || 0, a.y || 0, a.z || 0));
      if (buf.length > 30) buf.shift();
    };
    const intervalTid = setInterval(() => {
      if (!buf.length) return;
      const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
      if (avg < 0.05 && inBed())  fire("device_still");
      if (avg > 1.5  && inWake()) fire("device_moving");
    }, 10 * 60_000);
    window.addEventListener("devicemotion", onMotion);
    setCaps(c => ({ ...c, deviceMotion: true }));
    return () => {
      window.removeEventListener("devicemotion", onMotion);
      clearInterval(intervalTid);
    };
  }, [enabled, email, fire]);

  // 7. Hourly background ticker
  useEffect(() => {
    if (!enabled || !email) return;
    const tid = setInterval(() => {
      const idleMin = (Date.now() - R.current.lastActivityAt) / 60_000;
      if (inBed()  && idleMin >= 60 && R.current.state === "monitoring") fire("inactivity_30m");
      if (inWake() && idleMin < 2)                                        fire("user_activity");
    }, 30 * 60_000);
    return () => clearInterval(tid);
  }, [enabled, email, fire]);

  // 8. PeriodicBackgroundSync registration (PWA installed + Chrome)
  useEffect(() => {
    if (!enabled || !email) return;
    (async () => {
      try {
        const reg  = await navigator.serviceWorker?.ready;
        if (!reg || !("periodicSync" in reg)) return;
        const perm = await navigator.permissions?.query({ name: "periodic-background-sync" });
        if (perm?.state !== "granted") return;
        const tags = await reg.periodicSync.getTags();
        if (!tags.includes("sleep-monitor")) {
          await reg.periodicSync.register("sleep-monitor", { minInterval: 30 * 60_000 });
        }
        setCaps(c => ({ ...c, periodicSync: true }));
      } catch (_) {}
    })();
  }, [enabled, email]);  

  return { state, sleepStart, confidence, recentSignals, caps };
}
