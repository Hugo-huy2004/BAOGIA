import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { hapticMove, hapticMerge, hapticLose } from "../../../utils/haptics";
import { readGamePalette, shade, withAlpha } from "./arcadePalette";
import { createCombo, pushPopup, updatePopups, drawPopups } from "./arcadeProgression";
import { createFrameGate } from "./arcadeLoop";
import ArcadeHud from "./ArcadeHud";
import { playExplosion, playBossWarning, playWaveClear, playHurt } from "./survivorAudio";
import {
  chooseSurvivorDrop,
  SURVIVOR_MAX_HP,
  SURVIVOR_POWERUPS,
  survivorDropChance,
} from "./survivorBalance";

// ── Luật chơi ─────────────────────────────────────────────────────
// · ĐỢT (wave) = cấp độ. Địch không rơi lẻ tẻ nữa mà vào theo ĐỘI HÌNH
//   (hàng ngang / mũi tên / vòng cung), đợt càng cao đội hình càng dày.
// · LƯỚT SÁT (graze): bay sát địch/đạn mà không trúng thì nạp thanh XUNG PHÁ.
//   Đầy thanh → bấm nút để quét sạch đạn, nổ dàn địch và bất tử 3 giây.
//   Đây là chỗ duy nhất người chơi CHỦ ĐỘNG tấn công — trước đây game chỉ có né.
// · CẤP SÚNG 1→5: nhặt lõi vàng để lên cấp; trúng đạn mất 1 máu và tụt 1 cấp.
// · Trùm mỗi 3 đợt, luân phiên 4 mẫu tàu với 3 pha và kiểu đạn riêng.
// · Chuỗi hạ gục 2.2s nhân điểm tối đa x3.
const GAME_ID = "survivor";
const W = 360;   // toạ độ "thiết kế" — canvas thật được nhân theo devicePixelRatio
const H = 540;
const MAX_HP = SURVIVOR_MAX_HP;
const MAX_WEAPON = 5;
const BOSS_EVERY = 3;
const MAX_PARTICLES = 260;

const GRAZE_RADIUS = 34;
const GRAZE_FULL = 100;
const OVERDRIVE_FRAMES = 120;

const CORE = "#ffc73a";
const SHIELD_C = "#38bdf8";
const ENEMY_SHOT = "#ff3b30";
const OD_COLOR = "#c084fc";

const TYPES = {
  drone:  { color: "#ef4444", w: 24, hp: 1, speed: 2.4 },
  seeker: { color: "#f97316", w: 24, hp: 1, speed: 3.0 },
  heavy:  { color: "#a855f7", w: 36, hp: 4, speed: 1.6 },
};

const BOSS_TYPES = [
  {
    id: "titan",
    name: "Crimson Titan",
    color: "#ef4444",
    color2: "#fb923c",
    w: 112,
    h: 66,
    hpScale: 1,
  },
  {
    id: "vortex",
    name: "Vortex Prime",
    color: "#8b5cf6",
    color2: "#22d3ee",
    w: 104,
    h: 72,
    hpScale: 1.12,
  },
  {
    id: "twins",
    name: "Omega Twins",
    color: "#06b6d4",
    color2: "#f472b6",
    w: 124,
    h: 58,
    hpScale: 1.2,
  },
  {
    id: "reaper",
    name: "Blackstar Reaper",
    color: "#f43f5e",
    color2: "#a3e635",
    w: 118,
    h: 76,
    hpScale: 1.34,
  },
];

const bossTypeForWave = (wave) =>
  BOSS_TYPES[(Math.max(BOSS_EVERY, wave) / BOSS_EVERY - 1) % BOSS_TYPES.length | 0];

// Đội hình: trả về danh sách lệch (dx, delay) quanh một điểm neo.
const FORMATIONS = {
  line: (n) => Array.from({ length: n }, (_, i) => ({ dx: (i - (n - 1) / 2) * 38, dy: 0 })),
  vee:  (n) => Array.from({ length: n }, (_, i) => {
    const k = i - (n - 1) / 2;
    return { dx: k * 32, dy: Math.abs(k) * 26 };
  }),
  arc:  (n) => Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : (i / (n - 1)) * Math.PI;
    return { dx: -Math.cos(t) * 110, dy: -Math.sin(t) * 40 };
  }),
};
const FORMATION_KEYS = Object.keys(FORMATIONS);

export default function GameSpaceSurvivor({ paused = false, onGameOver }) {
  const { t } = useTranslation();
  // Vòng lặp game chạy trong requestAnimationFrame, ngoài chu kỳ render của
  // React. Giữ `t` trong ref để popup lấy được bản dịch mới nhất mà không phải
  // dựng lại cả vòng lặp mỗi lần đổi ngôn ngữ.
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const canvasRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [hud, setHud] = useState({
    score: 0, hp: MAX_HP, weapon: 1, wave: 1, waveLeft: 0, phase: "combat", combo: 0, mult: 1,
    notice: "", boss: null, bossName: "", bossMode: 1, graze: 0, overdrive: false,
    shield: false, rapid: false,
  });

  const { playBeep, playLose } = useArcadeSound();

  const state = useRef({
    player: { x: W / 2, y: H - 100, speed: 6, hp: MAX_HP, weapon: 1, shield: false, invuln: 0, roll: 0, vx: 0, prevX: W / 2 },
    bullets: [],
    foeShots: [],
    enemies: [],
    powerUps: [],
    particles: [],
    shocks: [],
    popups: [],
    boss: null,
    bossClearedAt: 0,
    // Máy trạng thái của đợt: "combat" (đang dọn địch) -> "boss" -> "rest".
    // Trước đây đợt suy ra từ ĐIỂM (wave = 1 + score/900) nên địch cứ chảy vô
    // tận, không có lúc nào "hết đợt", và điểm tự bơm: điểm cao -> đợt cao ->
    // thưởng nhân cao -> điểm cao hơn nữa.
    phase: "combat",
    waveQuota: 0,
    waveSpawned: 0,
    restTimer: 0,
    score: 0,
    wave: 1,
    graze: 0,
    overdrive: 0,
    rapidFire: 0,
    hitStop: 0,
    combo: createCombo({ windowMs: 2200, step: 0.25, max: 2.25 }),
    keys: {},
    lastShot: 0,
    spawnTimer: 60,
    supplyTimer: 360,
    killsSinceDrop: 0,
    isGameOver: false,
    shakeX: 0, shakeY: 0, shakeMag: 0,
    flashAlpha: 0,
    flashColor: "255,255,255",
    starLayers: [
      Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, size: 0.5, speed: 0.5, alpha: 0.3 })),
      Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * H, size: 1, speed: 1.2, alpha: 0.5 })),
      Array.from({ length: 15 }, () => ({ x: Math.random() * W, y: Math.random() * H, size: 2, speed: 2.5, alpha: 0.85 })),
    ],
    nebulaPhase: 0,
  });

  const overdriveRef = useRef(() => {});

  const syncHud = useCallback((notice) => {
    const s = state.current;
    setHud((prev) => ({
      score: s.score,
      hp: s.player.hp,
      weapon: s.player.weapon,
      wave: s.wave,
      waveLeft: Math.max(0, s.waveQuota - s.waveSpawned) + s.enemies.length,
      phase: s.phase,
      combo: s.combo.chain + (s.combo.chain > 0 ? 1 : 0),
      mult: s.combo.mult,
      boss: s.boss ? Math.max(0, Math.round((s.boss.hp / s.boss.maxHp) * 100)) : null,
      bossName: s.boss?.name || "",
      bossMode: s.boss?.mode || 1,
      graze: Math.round((s.graze / GRAZE_FULL) * 100),
      overdrive: s.overdrive > 0,
      shield: s.player.shield,
      rapid: s.rapidFire > 0,
      notice: notice !== undefined ? notice : prev.notice,
    }));
  }, []);

  const notify = useCallback((text) => {
    syncHud(text);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(
      () => setHud((h) => (h.notice === text ? { ...h, notice: "" } : h)),
      2000,
    );
  }, [syncHud]);

  useEffect(() => () => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    let timer;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLayoutRevision((revision) => revision + 1), 160);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused) return;
    const ctx = canvas.getContext("2d");

    // Canvas sắc nét: trước đây vẽ 360×540 rồi bị CSS ép xuống 280×420 nên
    // mọi cạnh đều nhoè. Giờ backing store theo devicePixelRatio, còn toạ độ
    // game vẫn giữ nguyên hệ 360×540 nhờ setTransform.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || 280;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssW * (H / W) * dpr);
    const scale = canvas.width / W;

    const pal = readGamePalette(canvas);
    const shipBody = pal.isLight ? shade(pal.ink, 0.15) : "#ffffff";

    let stopped = false;
    let rafId;

    // ── Tiện ích vẽ ────────────────────────────────────────────────
    // Quầng neon thật sự sáng phải cộng màu (additive), không phải đè lên.
    const additive = (fn) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      fn();
      ctx.restore();
    };

    // Vụ nổ dựng bằng ba lớp chồng lên nhau: sóng xung kích lan ra, mảnh vỡ bay
    // theo quán tính, và tàn lửa sáng ở lõi. Một nắm chấm tròn cùng màu như
    // trước trông rất "phẳng".
    const boom = (x, y, color, count = 12, power = 1) => {
      const s = state.current;
      const available = Math.max(0, MAX_PARTICLES - s.particles.length);

      // Lớp 1 — sóng xung kích (vòng sáng giãn ra rồi mờ dần).
      if (power >= 0.9) {
        s.shocks.push({ x, y, r: 3 + power * 4, max: 26 * power + count * 0.7, life: 1, color });
      }

      for (let i = 0; i < Math.min(count, available); i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = (Math.random() * 4 + 1) * power;
        // Lớp 2 — lõi trắng nóng ở giữa, mảnh vỡ mang màu của mục tiêu ở ngoài.
        const hot = i < count * 0.28;
        s.particles.push({
          x, y,
          vx: Math.cos(angle) * spd * (hot ? 0.55 : 1),
          vy: Math.sin(angle) * spd * (hot ? 0.55 : 1),
          life: 1,
          decay: hot ? 0.055 : 0.03 + Math.random() * 0.015,
          size: (hot ? 3 : 2) + Math.random() * 3 * power,
          color: hot ? "#ffffff" : color,
          spark: !hot && Math.random() < 0.35,   // vệt dài thay vì chấm tròn
        });
      }

      // Lớp 3 — tiếng nổ đi kèm, to nhỏ theo quy mô.
      playExplosion(Math.min(1, (count / 44) * power));
    };

    const ring = (x, y, r, color, width = 2) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    };

    // ── Độ khó: nhân lũy tiến, không có trần ────────────────────────────
    //
    // POWER là hệ số khó, mỗi đợt nhân thêm 11% và KHÔNG bao giờ dừng:
    //   đợt 10 ≈ ×2.6 · đợt 20 ≈ ×7.3 · đợt 40 ≈ ×58 · đợt 60 ≈ ×467
    //
    // Nhưng không phải thứ gì cũng được phép nhân vô hạn. Phải chia làm hai loại:
    //
    //  · Thứ TAY NGƯỜI phải phản ứng — tốc độ địch, tốc độ đạn, mật độ trên một
    //    màn 360×540 — dùng hàm TIỆM CẬN `1 - 1/(1+w/k)`: tăng mãi, mỗi đợt một
    //    ít, tiến gần giá trị trần mà không bao giờ chạm. Cho đạn nhanh vô hạn
    //    thì đến một đợt nào đó không ai né được nữa, game hỏng chứ không khó.
    //  · Thứ chỉ là KHỐI LƯỢNG CÔNG VIỆC — máu địch, chỉ tiêu mỗi đợt, máu trùm,
    //    tỉ lệ địch nặng — nhân thẳng theo POWER, vô hạn thật.
    //
    // Nhờ vậy đợt 100 vẫn khó hơn đợt 99, mà vẫn là thứ chơi được.
    const POWER_PER_WAVE = 1.14;
    const power = (wave) => POWER_PER_WAVE ** Math.max(0, wave - 1);
    // Tiệm cận: trả về 0 ở đợt 1 và tiến dần tới 1 khi đợt tăng.
    const approach = (wave, half) => 1 - 1 / (1 + Math.max(0, wave - 1) / half);

    const tuning = (wave) => {
      const p = power(wave);
      return {
        // Bão hoà — giữ cho màn chơi còn luồn lách được.
        squad: Math.round(2 + 7 * approach(wave, 7)),
        minAlive: Math.round(3 + 12 * approach(wave, 6)),
        interval: Math.round(62 - 42 * approach(wave, 5)),
        shotCooldown: Math.round(150 - 104 * approach(wave, 6)),
        foeSpeed: 0.9 + 1.35 * approach(wave, 9),
        // Đạn địch: nhanh dần và loạt dày dần, nhưng tốc độ vẫn tiệm cận —
        // đạn nhanh vô hạn thì không né được nữa chứ không phải khó hơn.
        shotSpeed: 3.0 + 1.7 * approach(wave, 10),
        volley: 1 + Math.floor(3.2 * approach(wave, 9)),      // 1 -> 4 viên mỗi loạt
        spread: 0.16 + 0.30 * approach(wave, 11),             // loạt xoè rộng dần
        lead: approach(wave, 14),                             // đón đầu hướng bay của người chơi
        droneFires: wave >= 3,                                // từ đợt 3 drone cũng bắn
        // Vô hạn — càng về sau càng dày máu và càng nhiều địch nặng.
        hpScale: 1 + 0.7 * (p - 1),
        eliteRatio: approach(wave, 12),
        // Vật phẩm hiếm dần: rơi thưa hơn theo đợt nhưng không bao giờ tắt hẳn.
        dropDecay: 1 / (1 + wave / 6),
        dropStreak: 6 + Math.round(9 * approach(wave, 8)),
      };
    };

    // Mỗi đợt có một CHỈ TIÊU địch phải diệt. Dọn hết chỉ tiêu (và sạch màn)
    // mới sang chặng kế: đợt chia hết cho BOSS_EVERY thì gọi trùm, còn lại nghỉ
    // ngắn rồi vào đợt mới khó hơn.
    // Chỉ tiêu mỗi đợt cũng vô hạn, nhưng mọc chậm hơn hệ số khó (mũ 0.6) để
    // một đợt không dài lê thê tới mức chán.
    const quotaFor = (wave) => Math.round(18 * power(wave) ** 0.6);

    const beginWave = (wave) => {
      const s = state.current;
      s.wave = wave;
      s.phase = "combat";
      s.waveQuota = quotaFor(wave);
      s.waveSpawned = 0;
      s.spawnTimer = 24;
      s.flashColor = "255,255,255";
      s.flashAlpha = 0.22;
      notify(t("arcadeGame.survivor.wave", { wave }));
    };

    const finishWave = () => {
      const s = state.current;
      // Cố ý KHÔNG cộng điểm ở đây: cách tính điểm và JOY giữ nguyên như cũ,
      // đợt chỉ đổi cách vận hành chứ không đổi phần thưởng.
      pushPopup(s.popups, W / 2, H / 2 - 40, tRef.current("arcadeGame.survivorWaveClear", { wave: s.wave }), CORE, 18);
      playWaveClear();
      if (s.wave % BOSS_EVERY === 0) {
        s.phase = "boss";
        spawnBoss(s.wave);
      } else {
        s.phase = "rest";
        s.restTimer = 70;
      }
    };

    const addEnemy = (type, x, y, cfg) => {
      const t = TYPES[type];
      // Nhân liên tục: đợt nào cũng dày thêm một chút, không phải tới đợt 5 mới
      // nhảy một bậc như kiểu cộng số nguyên trước đây.
      const hp = Math.max(1, Math.ceil(t.hp * cfg.hpScale));
      state.current.enemies.push({
        x, y, type,
        w: t.w,
        hp,
        maxHp: hp,
        speed: t.speed * cfg.foeSpeed,
        color: t.color,
        phase: Math.random() * Math.PI * 2,
        angle: Math.PI / 2,
        flash: 0,
        shotCooldown: cfg.shotCooldown + Math.round(Math.random() * 75),
      });
    };

    // Đội hình thay cho việc rơi ngẫu nhiên — đợt chơi có nhịp, đọc được.
    const spawnSquad = (cfg) => {
      const key = FORMATION_KEYS[Math.floor(Math.random() * FORMATION_KEYS.length)];
      const n = cfg.squad;
      const offsets = FORMATIONS[key](n);
      const spread = Math.max(...offsets.map((o) => Math.abs(o.dx))) + 26;
      const anchor = spread + Math.random() * Math.max(1, W - spread * 2);
      // Đội hình dày thì đa số là drone; heavy/seeker rải vào cho khác nhịp.
      const room = Math.max(0, state.current.waveQuota - state.current.waveSpawned);
      const chosen = offsets.slice(0, Math.max(1, Math.min(offsets.length, room)));
      // Đợt càng cao, tỉ lệ tàu nặng/truy đuổi càng lấn át drone thường.
      const elite = cfg.eliteRatio;
      chosen.forEach((o, i) => {
        const roll = Math.random();
        const heavyChance = 0.30 + 0.45 * elite;
        const seekerChance = 0.22 + 0.40 * elite;
        const type = i === Math.floor(chosen.length / 2) && roll < heavyChance
          ? "heavy"
          : roll < seekerChance ? "seeker" : "drone";
        addEnemy(type, Math.max(20, Math.min(W - 20, anchor + o.dx)), -34 - o.dy, cfg);
      });
      return chosen.length;
    };

    const spawnBoss = (wave) => {
      const s = state.current;
      const type = bossTypeForWave(wave);
      // Trùm cũng nhân theo hệ số khó — đợt 30 không thể chỉ dày gấp đôi đợt 15.
      const hp = Math.round(60 * power(wave) ** 0.9 * type.hpScale);
      s.boss = {
        ...type,
        x: W / 2,
        y: 82,
        hp,
        maxHp: hp,
        dirX: 1.8 + wave * 0.12,
        phase: 0,
        turret: 0,
        mode: 1,
        attackState: "rest",
        attackTimer: 96,
        attackKind: "fan",
        attackIndex: 0,
        telegraphTotal: 48,
        minionAt: 0,
        beam: null,
      };
      s.enemies = [];
      s.foeShots = [];
      s.flashAlpha = 0.6;
      s.shakeMag = 10;
      playBossWarning();
      notify(t("arcadeGame.survivor.bossIncoming", { boss: type.name }));
    };

    const bossShot = (s, x, y, angle, speed, color, size = 7) => {
      if (s.foeShots.length >= 72) return;
      s.foeShots.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size,
        phase: Math.random() * Math.PI * 2,
      });
    };

    // ── Bắn ────────────────────────────────────────────────────────
    const fire = (s, ts) => {
      const od = s.overdrive > 0;
      const tier = od ? MAX_WEAPON : s.player.weapon;
      const cadence = (165 - tier * 12) * (od ? 0.55 : s.rapidFire > 0 ? 0.62 : 1);
      if (ts - s.lastShot < cadence) return;
      s.lastShot = ts;
      playBeep();
      const shot = (dx, vx, vy, pierce = false) =>
        s.bullets.push({
          x: s.player.x + dx, y: s.player.y - 16, vx, vy, pierce,
          color: od ? OD_COLOR : pierce ? CORE : "#38bdf8", trail: [],
        });

      shot(0, 0, -11);
      if (tier >= 2) { shot(-9, 0, -11); shot(9, 0, -11); }
      if (tier >= 3) { shot(-14, -1.9, -10); shot(14, 1.9, -10); }
      if (tier >= 4) { shot(-18, -3.4, -8.5); shot(18, 3.4, -8.5); }
      if (tier >= 5) shot(0, 0, -13, true);
    };

    const spawnPowerUp = (s, x, y, forcedType) => {
      const type = forcedType || chooseSurvivorDrop({
        hp: s.player.hp,
        maxHp: MAX_HP,
        weapon: s.player.weapon,
      });
      const def = SURVIVOR_POWERUPS[type];
      s.powerUps.push({
        x: Math.max(24, Math.min(W - 24, x)),
        y,
        phase: Math.random() * Math.PI * 2,
        spin: Math.random() * Math.PI * 2,
        type,
        label: def.label,
        symbol: def.symbol,
        color: def.color,
      });
      s.killsSinceDrop = 0;
    };

    const reward = (s, x, y, base) => {
      const mult = s.combo.hit();
      const gained = Math.round(base * (1 + (s.wave - 1) * 0.06) * mult);
      s.score += gained;
      pushPopup(s.popups, x, y, `+${gained}`, s.combo.chain >= 3 ? CORE : "#ffffff", s.combo.chain >= 3 ? 17 : 14);
      return gained;
    };

    // ── XUNG PHÁ ───────────────────────────────────────────────────
    // Phần thưởng cho việc dám bay sát: dọn sạch màn hình và cho 3 giây bất tử.
    const triggerOverdrive = () => {
      const s = state.current;
      if (s.isGameOver || s.overdrive > 0 || s.graze < GRAZE_FULL) return;
      s.graze = 0;
      s.overdrive = OVERDRIVE_FRAMES;
      s.player.invuln = Math.max(s.player.invuln, OVERDRIVE_FRAMES);
      s.shakeMag = 16;
      s.flashColor = "192,132,252";
      s.flashAlpha = 0.75;
      s.hitStop = 6;

      // Đạn địch biến thành điểm — thưởng đúng cho tình huống càng nguy càng lời.
      let bonus = 0;
      s.foeShots.forEach((f) => {
        boom(f.x, f.y, OD_COLOR, 5);
        bonus += 25;
      });
      s.foeShots = [];
      s.enemies.forEach((e) => { e.hp -= 1; e.flash = 8; boom(e.x, e.y, OD_COLOR, 6); });
      if (s.boss) { s.boss.hp -= 6; boom(s.boss.x, s.boss.y, OD_COLOR, 20); }
      if (bonus > 0) {
        s.score += bonus;
        pushPopup(s.popups, W / 2, H / 2, `+${bonus}`, OD_COLOR, 20);
      }
      pushPopup(s.popups, W / 2, H / 2 - 26, tRef.current("arcadeGame.survivorSurge"), OD_COLOR, 15);
      playBeep();
      hapticMerge();
      notify(t("arcadeGame.survivor.overdriveActive"));
    };
    overdriveRef.current = triggerOverdrive;

    // Một cửa duy nhất cho mọi sát thương lên người chơi.
    const damage = (s, x, y) => {
      if (s.player.invuln > 0) return;
      if (s.player.shield) {
        s.player.shield = false;
        s.player.invuln = 50;
        s.hitStop = 5;
        boom(x, y, SHIELD_C, 22);
        s.shakeMag = 9;
        notify(t("arcadeGame.survivor.shieldBlocked"));
        return;
      }
      s.player.hp -= 1;
      playHurt();
      s.player.weapon = Math.max(1, s.player.weapon - 1);
      s.player.invuln = 100;
      s.combo.reset();
      s.shakeMag = 14;
      s.flashColor = "255,80,80";
      s.flashAlpha = 0.5;
      s.hitStop = 8;
      boom(x, y, "#ef4444", 24);
      hapticLose();

      if (s.player.hp <= 0) {
        s.isGameOver = true;
        stopped = true;
        boom(s.player.x, s.player.y, "#ef4444", 34, 1.4);
        boom(s.player.x, s.player.y, "#ffffff", 12, 1.2);
        s.shakeMag = 20;
        s.flashAlpha = 0.75;
        playLose();
        const deathRender = () => {
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          ctx.fillStyle = pal.bg;
          ctx.fillRect(0, 0, W, H);
          s.particles.forEach((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.05; pt.life -= 0.015; });
          s.particles = s.particles.filter((pt) => pt.life > 0);
          additive(() => s.particles.forEach((pt) => {
            ctx.globalAlpha = pt.life;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
            ctx.fill();
          }));
          ctx.globalAlpha = 1;
          if (s.flashAlpha > 0.01) {
            ctx.fillStyle = `rgba(${s.flashColor},${s.flashAlpha})`;
            ctx.fillRect(0, 0, W, H);
            s.flashAlpha *= 0.9;
          }
          if (s.particles.length > 0) requestAnimationFrame(deathRender);
        };
        deathRender();
        setTimeout(() => onGameOver?.(s.score, "lose"), 600);
      } else {
        notify(t("arcadeGame.survivor.hit", { hp: s.player.hp }));
      }
    };

    // ── Vẽ địch: mỗi loại một dáng, xoay theo hướng bay ─────────────
    const drawEnemy = (e) => {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle - Math.PI / 2);
      const r = e.w / 2;
      const hit = e.flash > 0;
      const body = hit ? "#ffffff" : e.color;

      additive(() => {
        ctx.fillStyle = withAlpha(e.color, 0.22);
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowColor = e.color;
      ctx.shadowBlur = hit ? 22 : 12;

      if (e.type === "drone") {
        // Thoi có cánh — dáng nhỏ, nhanh.
        const g = ctx.createLinearGradient(0, -r, 0, r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.45, body);
        g.addColorStop(1, shade(e.color, -0.45));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.lineTo(-r * 0.75, 0);
        ctx.lineTo(0, -r);
        ctx.lineTo(r * 0.75, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = withAlpha("#ffffff", 0.35);
        ctx.fillRect(-r * 1.15, -2, r * 0.42, 4);
        ctx.fillRect(r * 0.73, -2, r * 0.42, 4);
      } else if (e.type === "seeker") {
        // Mũi tên nhọn hướng thẳng vào người chơi.
        const g = ctx.createLinearGradient(0, -r, 0, r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.4, body);
        g.addColorStop(1, shade(e.color, -0.4));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, r * 1.25);
        ctx.lineTo(-r * 0.9, -r * 0.55);
        ctx.lineTo(0, -r * 0.15);
        ctx.lineTo(r * 0.9, -r * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Lục giác bọc giáp + vạch máu, đọc được ngay là loại chịu đòn.
        const g = ctx.createLinearGradient(-r, -r, r, r);
        g.addColorStop(0, shade(e.color, 0.3));
        g.addColorStop(0.5, body);
        g.addColorStop(1, shade(e.color, -0.5));
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = withAlpha("#ffffff", 0.4);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // vạch máu còn lại
        const pct = e.hp / e.maxHp;
        ctx.fillStyle = "rgba(0,0,0,.5)";
        ctx.fillRect(-r * 0.75, -r - 7, r * 1.5, 3);
        ctx.fillStyle = pct > 0.5 ? "#4ade80" : "#fbbf24";
        ctx.fillRect(-r * 0.75, -r - 7, r * 1.5 * pct, 3);
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      // Lửa đuôi — cho cảm giác địch đang lao tới chứ không phải rơi.
      additive(() => {
        const t = Math.random() * 3;
        const g = ctx.createRadialGradient(e.x - Math.cos(e.angle) * r, e.y - Math.sin(e.angle) * r, 0,
          e.x - Math.cos(e.angle) * r, e.y - Math.sin(e.angle) * r, 6 + t);
        g.addColorStop(0, withAlpha(e.color, 0.85));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(e.x - Math.cos(e.angle) * r, e.y - Math.sin(e.angle) * r, 6 + t, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawBoss = (b) => {
      const cx = b.x;
      const cy = b.y;
      const hpPct = b.hp / b.maxHp;
      const rageColor = b.mode === 3 ? "#ffffff" : b.mode === 2 ? b.color2 : b.color;

      additive(() => {
        const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, b.w);
        g.addColorStop(0, withAlpha(rageColor, b.mode === 3 ? 0.42 : 0.3));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, b.w, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vành pháo quay — báo pha hiện tại mà không cần chữ.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(b.turret);
      ctx.strokeStyle = withAlpha(rageColor, 0.78);
      ctx.lineWidth = b.mode === 3 ? 3.2 : 2.2;
      const ringArms = b.id === "vortex" ? 6 : 4;
      for (let i = 0; i < ringArms; i++) {
        ctx.beginPath();
        const arc = (Math.PI * 2) / ringArms;
        ctx.arc(0, 0, b.w * 0.48, arc * i + 0.16, arc * i + arc * 0.68);
        ctx.stroke();
      }
      ctx.restore();

      const armorGradient = (x0, y0, x1, y1) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.12, shade(b.color, 0.32));
        g.addColorStop(0.52, b.color);
        g.addColorStop(1, shade(b.color2, -0.68));
        return g;
      };

      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = rageColor;
      ctx.shadowBlur = b.mode === 3 ? 34 : 24;
      ctx.fillStyle = armorGradient(-b.w / 2, -b.h / 2, b.w / 2, b.h / 2);
      ctx.strokeStyle = withAlpha("#ffffff", 0.38);
      ctx.lineWidth = 1.2;

      if (b.id === "vortex") {
        // A circular singularity carrier: six armored fins orbit a dark core.
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * i) / 6 + b.turret * 0.35);
          ctx.beginPath();
          ctx.moveTo(12, -9);
          ctx.lineTo(b.w * 0.5, -15);
          ctx.lineTo(b.w * 0.38, 7);
          ctx.lineTo(15, 13);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#02030b";
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = withAlpha(b.color2, 0.7);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 30 + Math.sin(b.phase) * 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (b.id === "twins") {
        // Two independently lit pods joined by an energy bridge.
        const pod = (x, color) => {
          ctx.save();
          ctx.translate(x, 0);
          ctx.fillStyle = armorGradient(-24, -24, 24, 24);
          ctx.beginPath();
          ctx.moveTo(0, 29);
          ctx.lineTo(-25, 8);
          ctx.lineTo(-20, -20);
          ctx.lineTo(0, -28);
          ctx.lineTo(20, -20);
          ctx.lineTo(25, 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(0, 1, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };
        ctx.strokeStyle = withAlpha(b.color2, 0.72);
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-38, 0);
        ctx.lineTo(38, 0);
        ctx.stroke();
        pod(-38, b.color);
        pod(38, b.color2);
      } else if (b.id === "reaper") {
        // A scythe silhouette with a raised central command spine.
        ctx.beginPath();
        ctx.moveTo(0, b.h * 0.58);
        ctx.lineTo(-15, b.h * 0.15);
        ctx.lineTo(-b.w * 0.52, b.h * 0.35);
        ctx.lineTo(-b.w * 0.36, -b.h * 0.12);
        ctx.lineTo(-18, -b.h * 0.48);
        ctx.lineTo(0, -b.h * 0.32);
        ctx.lineTo(18, -b.h * 0.48);
        ctx.lineTo(b.w * 0.36, -b.h * 0.12);
        ctx.lineTo(b.w * 0.52, b.h * 0.35);
        ctx.lineTo(15, b.h * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = shade(b.color2, -0.5);
        ctx.fillRect(-5, -b.h * 0.42, 10, b.h * 0.76);
      } else {
        // Titan: broad layered armor and a heavy central keel.
        ctx.beginPath();
        ctx.moveTo(0, b.h * 0.62);
        ctx.lineTo(-b.w * 0.34, b.h * 0.3);
        ctx.lineTo(-b.w / 2, -b.h * 0.2);
        ctx.lineTo(-b.w * 0.26, -b.h / 2);
        ctx.lineTo(b.w * 0.26, -b.h / 2);
        ctx.lineTo(b.w / 2, -b.h * 0.2);
        ctx.lineTo(b.w * 0.34, b.h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * b.w * 0.2, -b.h * 0.42);
          ctx.lineTo(i * b.w * 0.26, b.h * 0.28);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Vết nứt theo lượng máu đã mất — thấy được là sắp hạ được nó.
      const cracks = Math.round((1 - hpPct) * 6);
      ctx.strokeStyle = withAlpha(b.color2, 0.78);
      ctx.lineWidth = 1.4;
      for (let i = 0; i < cracks; i++) {
        const a = (i / 6) * Math.PI * 2 + b.phase * 0.15;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * b.w * 0.36, cy + Math.sin(a) * b.h * 0.36);
        ctx.stroke();
      }

      // Lõi
      additive(() => {
        const pulse = (b.id === "vortex" ? 18 : 13) + Math.sin(b.phase * 2) * 3;
        const cg = ctx.createRadialGradient(cx, cy, 1, cx, cy, pulse);
        cg.addColorStop(0, "#ffffff");
        cg.addColorStop(0.45, rageColor);
        cg.addColorStop(1, "transparent");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const attackKindsFor = (bossId) => ({
      titan: ["fan", "aimed", "sweep"],
      vortex: ["radial", "aimed", "spiral"],
      twins: ["crossfire", "fan", "aimed"],
      reaper: ["blades", "radial", "aimed"],
    }[bossId] || ["fan", "aimed"]);

    const fireBossAttack = (s, b) => {
      const aimed = Math.atan2((b.targetY ?? s.player.y) - b.y, (b.targetX ?? s.player.x) - b.x);
      const speed = 2.65 + b.mode * 0.34;

      if (b.attackKind === "aimed") {
        const shots = b.mode === 3 ? 5 : 3;
        for (let i = 0; i < shots; i++) {
          const delta = (i - (shots - 1) / 2) * 0.11;
          bossShot(s, b.x, b.y + 18, aimed + delta, speed + 1.1, b.color2, 7);
        }
      } else if (b.attackKind === "crossfire") {
        [-38, 38].forEach((offset, podIndex) => {
          const podAngle = Math.atan2(
            (b.targetY ?? s.player.y) - (b.y + 10),
            (b.targetX ?? s.player.x) - (b.x + offset),
          );
          [-0.13, 0, 0.13].slice(b.mode === 1 ? 1 : 0).forEach((delta) => {
            bossShot(s, b.x + offset, b.y + 12, podAngle + delta, speed + 0.8, podIndex ? b.color2 : b.color, 6.5);
          });
        });
      } else if (b.attackKind === "radial" || b.attackKind === "spiral") {
        const arms = 8 + b.mode * 2;
        const safeGap = (b.attackIndex * 3) % arms;
        for (let i = 0; i < arms; i++) {
          // Mỗi vòng luôn có một hành lang hai viên để người chơi thoát.
          if (i === safeGap || i === (safeGap + 1) % arms) continue;
          const offset = b.attackKind === "spiral" ? b.turret : 0;
          bossShot(s, b.x, b.y, offset + (Math.PI * 2 * i) / arms, speed, i % 2 ? b.color : b.color2, 6.5);
        }
      } else {
        const arms = b.attackKind === "blades" ? 3 + b.mode * 2 : 4 + b.mode * 2;
        const spread = b.attackKind === "sweep" ? 0.2 : 0.24;
        for (let i = 0; i < arms; i++) {
          const angle = Math.PI / 2 + (i - (arms - 1) / 2) * spread;
          bossShot(s, b.x, b.y + b.h * 0.38, angle, speed, i % 2 ? b.color2 : b.color, b.attackKind === "blades" ? 7.5 : 6.5);
        }
      }
      s.shakeMag = Math.max(s.shakeMag, 4 + b.mode);
    };

    const updateBossAttack = (s, b) => {
      b.attackTimer -= 1;
      if (b.attackTimer > 0) return;

      if (b.attackState === "rest") {
        const kinds = attackKindsFor(b.id);
        b.attackKind = kinds[b.attackIndex % kinds.length];
        b.attackIndex += 1;
        b.attackState = "telegraph";
        b.telegraphTotal = Math.max(38, 58 - b.mode * 5);
        b.attackTimer = b.telegraphTotal;
        b.targetX = s.player.x;
        b.targetY = s.player.y;
        return;
      }

      if (b.attackState === "telegraph") {
        fireBossAttack(s, b);
        b.attackState = "recovery";
        b.attackTimer = Math.max(42, 78 - b.mode * 9);
        return;
      }

      b.attackState = "rest";
      b.attackTimer = Math.max(42, 68 - b.mode * 7);
    };

    const drawBossTelegraph = (b) => {
      if (b.attackState !== "telegraph") return;
      const progress = 1 - b.attackTimer / b.telegraphTotal;
      const color = b.mode === 3 ? "#ffffff" : b.color2;

      ctx.save();
      ctx.globalAlpha = 0.38 + progress * 0.48;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 + progress * 1.8;
      ctx.setLineDash([6, 7]);

      if (b.attackKind === "aimed" || b.attackKind === "crossfire") {
        const sources = b.attackKind === "crossfire" ? [-38, 38] : [0];
        sources.forEach((offset) => {
          ctx.beginPath();
          ctx.moveTo(b.x + offset, b.y + 12);
          ctx.lineTo(b.targetX, b.targetY);
          ctx.stroke();
        });
      } else {
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(b.x, b.y, 24 + progress * 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x, b.y, 12 + progress * 24, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawPowerUp = (p) => {
      const bob = Math.sin(p.phase * 1.6) * 2.5;
      const x = p.x;
      const y = p.y + bob;
      const radius = 13;

      additive(() => {
        const glow = ctx.createRadialGradient(x, y, 2, x, y, 27);
        glow.addColorStop(0, withAlpha(p.color, 0.55));
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 27, 0, Math.PI * 2);
        ctx.fill();
        ring(x, y, 18 + Math.sin(p.phase) * 2, withAlpha(p.color, 0.66), 1.2);
      });

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.spin);
      const shell = ctx.createLinearGradient(-radius, -radius, radius, radius);
      shell.addColorStop(0, "#ffffff");
      shell.addColorStop(0.24, p.color);
      shell.addColorStop(1, shade(p.color, -0.58));
      ctx.fillStyle = shell;
      ctx.strokeStyle = withAlpha("#ffffff", 0.72);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = withAlpha("#ffffff", 0.34);
      ctx.beginPath();
      ctx.moveTo(0, -radius + 2);
      ctx.lineTo(radius * 0.82, -radius * 0.35);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#061019";
      ctx.font = "950 12px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.symbol, x, y + 0.5);
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = withAlpha("#ffffff", 0.86);
      ctx.font = "900 7px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(p.label, x, y + 24);
    };

    const drawPlayer = (s) => {
      const px = s.player.x;
      const py = s.player.y;
      const od = s.overdrive > 0;
      const blink = s.player.invuln > 0 && !od && Math.floor(s.player.invuln / 5) % 2 === 0;
      ctx.globalAlpha = blink ? 0.4 : 1;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(s.player.roll * 0.22); // nghiêng theo hướng bẻ lái

      if (s.player.shield) {
        additive(() => {
          ring(0, 0, 28, SHIELD_C, 2.5);
          ctx.fillStyle = withAlpha(SHIELD_C, 0.1);
          ctx.beginPath();
          ctx.arc(0, 0, 28, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      if (od) {
        additive(() => {
          ring(0, 0, 34 + Math.sin(s.overdrive * 0.3) * 3, OD_COLOR, 3);
          ring(0, 0, 24, withAlpha(OD_COLOR, 0.6), 1.5);
        });
      }

      // Vòng nạp XUNG PHÁ chạy quanh phi thuyền — nhìn tàu là biết đầy chưa.
      if (s.graze > 0 && !od) {
        ctx.strokeStyle = withAlpha(OD_COLOR, 0.9);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (s.graze / GRAZE_FULL));
        ctx.stroke();
      }

      ctx.shadowColor = od ? OD_COLOR : pal.accent;
      ctx.shadowBlur = 18;
      const g = ctx.createLinearGradient(0, -20, 0, 14);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, od ? "#e9d5ff" : shipBody);
      g.addColorStop(1, shade(od ? OD_COLOR : pal.accent, -0.3));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -21);
      ctx.lineTo(-7, -4);
      ctx.lineTo(-17, 14);
      ctx.lineTo(0, 7);
      ctx.lineTo(17, 14);
      ctx.lineTo(7, -4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = withAlpha("#ffffff", 0.45);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Raised wing panels and a glass canopy add readable volume at speed.
      const wingLight = withAlpha("#ffffff", 0.3);
      ctx.fillStyle = wingLight;
      ctx.beginPath();
      ctx.moveTo(-7, -3);
      ctx.lineTo(-15, 11);
      ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.moveTo(7, -3);
      ctx.lineTo(15, 11);
      ctx.lineTo(4, 6);
      ctx.closePath();
      ctx.fill();

      const canopy = ctx.createRadialGradient(-1.2, -10, 0.5, 0, -7, 7);
      canopy.addColorStop(0, "#ffffff");
      canopy.addColorStop(0.32, od ? "#e9d5ff" : "#bae6fd");
      canopy.addColorStop(1, withAlpha(od ? OD_COLOR : pal.accent, 0.68));
      ctx.fillStyle = canopy;
      ctx.beginPath();
      ctx.ellipse(0, -7, 4.2, 7.2, 0, 0, Math.PI * 2);
      ctx.fill();

      additive(() => {
        [-8, 8].forEach((engineX) => {
          const f = 5 + Math.random() * 4;
          const tg = ctx.createRadialGradient(engineX, 13, 1, engineX, 17, f);
          tg.addColorStop(0, "#ffffff");
          tg.addColorStop(0.32, od ? OD_COLOR : "#38bdf8");
          tg.addColorStop(1, "transparent");
          ctx.fillStyle = tg;
          ctx.beginPath();
          ctx.ellipse(engineX, 17, f * 0.65, f * 1.45, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      ctx.restore();
      ctx.globalAlpha = 1;
    };

    // ── Vòng lặp ───────────────────────────────────────────────────
    // `frame()` = MỘT nhịp logic 1/60 giây. Toàn bộ vật lý bên trong tính theo
    // nhịp (`x += speed`, `timer -= 1`), nên nó phải được gọi theo thời gian
    // thực, không theo tần số quét màn hình — xem arcadeLoop.js.
    const frame = (ts) => {
      if (stopped) return;
      const s = state.current;
      if (s.isGameOver) { stopped = true; return; }

      const cfg = tuning(s.wave);
      // Hit-stop: đóng băng vài khung khi có cú đánh lớn — cảm giác "đấm có lực".
      const frozen = s.hitStop > 0;
      if (frozen) s.hitStop -= 1;

      if (!frozen) {
        s.combo.tick();
        if (s.player.invuln > 0) s.player.invuln -= 1;
        if (s.overdrive > 0) s.overdrive -= 1;
        if (s.rapidFire > 0) s.rapidFire -= 1;
        s.supplyTimer -= 1;
        if (s.supplyTimer <= 0) {
          spawnPowerUp(s, 36 + Math.random() * (W - 72), -18);
          s.supplyTimer = s.player.hp <= 2 ? 390 : 690;
        }
      }

      if (s.shakeMag > 0.2) {
        s.shakeX = (Math.random() - 0.5) * s.shakeMag;
        s.shakeY = (Math.random() - 0.5) * s.shakeMag;
        s.shakeMag *= 0.85;
      } else { s.shakeX = 0; s.shakeY = 0; s.shakeMag = 0; }
      if (s.flashAlpha > 0.01) s.flashAlpha *= 0.92;

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.save();
      ctx.translate(s.shakeX, s.shakeY);

      // ── Nền ──
      ctx.fillStyle = pal.bg;
      ctx.fillRect(-6, -6, W + 12, H + 12);

      s.nebulaPhase += 0.005;
      additive(() => {
        const neb = (cx, cy, r, color, a) => {
          const g = ctx.createRadialGradient(cx, cy, 15, cx, cy, r);
          g.addColorStop(0, withAlpha(color, a));
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        };
        neb(W * 0.3 + Math.sin(s.nebulaPhase) * 30, H * 0.4, 190, pal.accent, 0.09);
        neb(W * 0.72 + Math.cos(s.nebulaPhase * 0.7) * 25, H * 0.62, 160, "#a855f7", 0.07);
      });

      // Distant shaded planet + perspective flight grid make the playfield
      // read as a deep 3D corridor instead of a flat star texture.
      const planetX = W * 0.82 + Math.sin(s.nebulaPhase * 0.35) * 8;
      const planetY = H * 0.34;
      const planetR = 48;
      const planet = ctx.createRadialGradient(
        planetX - planetR * 0.34, planetY - planetR * 0.38, 2,
        planetX, planetY, planetR,
      );
      planet.addColorStop(0, withAlpha("#ffffff", 0.42));
      planet.addColorStop(0.18, withAlpha(pal.accent, 0.3));
      planet.addColorStop(0.68, withAlpha("#312e81", 0.22));
      planet.addColorStop(1, "transparent");
      ctx.fillStyle = planet;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(planetX, planetY);
      ctx.rotate(-0.28);
      ctx.strokeStyle = withAlpha("#c4b5fd", 0.16);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, planetR * 1.45, planetR * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const horizon = H * 0.28;
      ctx.strokeStyle = withAlpha(pal.accent, s.overdrive > 0 ? 0.2 : 0.075);
      ctx.lineWidth = 0.7;
      for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        const y = horizon + Math.pow(t, 1.72) * (H - horizon);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let i = -7; i <= 7; i++) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + i * 4, horizon);
        ctx.lineTo(W / 2 + i * 42, H);
        ctx.stroke();
      }

      s.starLayers.forEach((layer, li) => layer.forEach((star) => {
        if (!frozen) {
          star.y += star.speed * (s.overdrive > 0 ? 2.4 : 1);
          if (star.y > H) { star.y = 0; star.x = Math.random() * W; }
        }
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "#ffffff";
        // Lớp sao gần kéo vệt khi xung phá — cảm giác tăng tốc.
        if (li === 2 && s.overdrive > 0) ctx.fillRect(star.x, star.y, star.size, star.size * 7);
        else { ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill(); }
      }));
      ctx.globalAlpha = 1;

      // ── Điều khiển ──
      let dx = 0;
      if (s.keys.ArrowLeft || s.keys.a) dx -= 1;
      if (s.keys.ArrowRight || s.keys.d) dx += 1;
      if (!frozen) {
        s.player.x = Math.max(16, Math.min(W - 16, s.player.x + dx * s.player.speed));
        if (s.keys.ArrowUp || s.keys.w) s.player.y = Math.max(30, s.player.y - s.player.speed);
        if (s.keys.ArrowDown || s.keys.s) s.player.y = Math.min(H - 40, s.player.y + s.player.speed);
        s.player.roll += (dx - s.player.roll) * 0.18;
        s.player.vx = s.player.x - s.player.prevX;
        s.player.prevX = s.player.x;
        fire(s, ts);
      }

      // ── Đạn ta ──
      if (!frozen) {
        s.bullets.forEach((b) => {
          b.trail.push({ x: b.x, y: b.y, life: 1 });
          if (b.trail.length > 6) b.trail.shift();
          b.x += b.vx;
          b.y += b.vy;
        });
        s.bullets = s.bullets.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20);
      }
      additive(() => s.bullets.forEach((b) => {
        b.trail.forEach((t) => {
          t.life -= 0.18;
          if (t.life <= 0) return;
          ctx.globalAlpha = t.life * 0.45;
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2.4 * t.life, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        const len = b.pierce ? 11 : 7;
        const wide = b.pierce ? 3.4 : 2.2;
        const g = ctx.createLinearGradient(b.x, b.y - len, b.x, b.y + len);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.5, b.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, wide, len, 0, 0, Math.PI * 2);
        ctx.fill();
      }));
      ctx.globalAlpha = 1;

      // ── Sinh đội hình theo chỉ tiêu của đợt ──
      if (!frozen && s.phase === "combat" && s.waveQuota === 0) beginWave(s.wave);
      if (!frozen && s.phase === "combat") {
        s.spawnTimer -= 1;
        const thin = s.enemies.length < cfg.minAlive;   // màn đang thưa
        if (s.waveSpawned < s.waveQuota && (s.spawnTimer <= 0 || thin)) {
          // Màn thưa thì bù ngay và bù dày hơn, khỏi để người chơi ngồi không.
          s.spawnTimer = thin ? Math.round(cfg.interval * 0.55) : cfg.interval;
          s.waveSpawned += spawnSquad(cfg);
        }
        // Xong đợt khi đã sinh đủ chỉ tiêu và không còn con nào trên màn.
        if (s.waveSpawned >= s.waveQuota && s.enemies.length === 0) finishWave();
      } else if (!frozen && s.phase === "rest") {
        s.restTimer -= 1;
        if (s.restTimer <= 0) beginWave(s.wave + 1);
      }

      // ── Trùm ──
      if (s.boss) {
        const b = s.boss;
        if (!frozen) {
          b.phase += 0.05;
          b.turret += 0.025 + b.mode * 0.018;
          b.burst -= 1;

          if (b.id === "vortex") {
            b.x = W / 2 + Math.sin(b.phase * 0.72) * 112;
            b.y = 82 + Math.cos(b.phase * 0.46) * 12;
          } else if (b.id === "reaper") {
            b.x = W / 2 + Math.sin(b.phase * 0.48) * 128;
            b.y = 78 + Math.sin(b.phase * 1.15) * 15;
          } else {
            b.x += b.dirX;
            b.y = 82 + Math.sin(b.phase * (b.id === "twins" ? 1.2 : 0.6)) * 8;
            if (b.x <= b.w / 2 + 12 || b.x >= W - b.w / 2 - 12) b.dirX *= -1;
          }

          const nextMode = b.hp <= b.maxHp * 0.28 ? 3 : b.hp <= b.maxHp * 0.64 ? 2 : 1;
          if (nextMode > b.mode) {
            b.mode = nextMode;
            b.dirX *= 1.22;
            s.flashColor = "255,80,80";
            s.flashAlpha = b.mode === 3 ? 0.7 : 0.5;
            s.shakeMag = b.mode === 3 ? 17 : 12;
            s.hitStop = b.mode === 3 ? 9 : 5;
            b.attackState = "rest";
            b.attackTimer = 68;
            s.foeShots = s.foeShots.slice(-24);
            notify(t("arcadeGame.survivor.bossPhase", { boss: b.name, phase: b.mode }));
          }

          updateBossAttack(s, b);

          if (b.mode >= 2 && b.id !== "vortex" && ts - b.minionAt > (b.mode === 3 ? 2400 : 3400)) {
            b.minionAt = ts;
            addEnemy(b.id === "reaper" ? "seeker" : "drone", b.x - 46, b.y + 20, cfg);
            addEnemy(b.id === "twins" ? "heavy" : "drone", b.x + 46, b.y + 20, cfg);
          }
        }
        drawBoss(b);
        drawBossTelegraph(b);
      }

      // ── Địch ──
      s.enemies.forEach((e) => {
        if (!frozen) {
          e.phase += 0.08;
          if (e.flash > 0) e.flash -= 1;
          let vx = 0;
          const vy = e.speed;
          if (e.type === "seeker") {
            vx = Math.sign(s.player.x - e.x) * Math.min(1.8, Math.abs(s.player.x - e.x) * 0.06);
          } else if (e.type === "drone") {
            vx = Math.sin(e.phase) * 1.5;
          }

          // Trước đây CHỈ tàu heavy bắn — drone và seeker bay tới rồi thôi, nên
          // màn chơi hiền hẳn. Giờ seeker bắn từ đầu, drone tham chiến từ đợt 3.
          const canShoot = e.type === "heavy" || e.type === "seeker" || cfg.droneFires;
          if (canShoot) {
            e.shotCooldown -= 1;
            if (e.shotCooldown <= 0) {
              // Đón đầu: ngắm vào chỗ người chơi SẼ tới, không phải chỗ đang đứng.
              const leadX = s.player.x + s.player.vx * 12 * cfg.lead;
              const aimed = Math.atan2(s.player.y - e.y, leadX - e.x);
              const shots = e.type === "heavy" ? cfg.volley : Math.max(1, cfg.volley - 1);
              for (let k = 0; k < shots; k += 1) {
                const offset = (k - (shots - 1) / 2) * cfg.spread;
                bossShot(s, e.x, e.y + e.w / 2, aimed + offset, cfg.shotSpeed, ENEMY_SHOT, 5.5);
              }
              const rest = e.type === "drone" ? 1.5 : 1;   // drone bắn thưa hơn
              e.shotCooldown = Math.round((cfg.shotCooldown + Math.random() * 80) * rest);
            }
          }
          e.x += vx;
          e.y += vy;
          e.angle = Math.atan2(vy, vx);
        }
        drawEnemy(e);
      });
      if (!frozen) s.enemies = s.enemies.filter((e) => e.y < H + 44);

      // ── Đạn địch ──
      if (!frozen) {
        s.foeShots.forEach((f) => {
          f.x += f.vx;
          f.y += f.vy;
          f.phase = (f.phase || 0) + 0.14;
        });
        s.foeShots = s.foeShots.filter((f) => f.y < H + 20 && f.y > -20 && f.x > -20 && f.x < W + 20);
      }
      additive(() => s.foeShots.forEach((f) => {
        const color = f.color || ENEMY_SHOT;
        const radius = f.size || 7;
        const speed = Math.max(1, Math.hypot(f.vx, f.vy));
        const tailX = f.x - (f.vx / speed) * radius * 2.4;
        const tailY = f.y - (f.vy / speed) * radius * 2.4;
        const trail = ctx.createLinearGradient(tailX, tailY, f.x, f.y);
        trail.addColorStop(0, "transparent");
        trail.addColorStop(1, withAlpha(color, 0.72));
        ctx.strokeStyle = trail;
        ctx.lineWidth = radius * 0.7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(f.x, f.y);
        ctx.stroke();

        const g = ctx.createRadialGradient(f.x - radius * 0.25, f.y - radius * 0.25, 0.5, f.x, f.y, radius);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.34, color);
        g.addColorStop(0.72, shade(color, -0.35));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }));

      // ── Vật phẩm (có hút về phía người chơi khi tới gần) ──
      s.powerUps.forEach((p) => {
        if (!frozen) {
          const d = Math.hypot(s.player.x - p.x, s.player.y - p.y);
          if (d > 0 && d < 126) {
            p.x += ((s.player.x - p.x) / d) * 4.1;
            p.y += ((s.player.y - p.y) / d) * 4.1;
          } else {
            p.y += 1.35;
          }
          p.phase += 0.06;
          p.spin += 0.045;
        }
        drawPowerUp(p);
      });
      if (!frozen) s.powerUps = s.powerUps.filter((p) => p.y < H + 34);

      if (!frozen) {
        // ── Đạn ta ↔ trùm / địch ──
        for (let bIdx = s.bullets.length - 1; bIdx >= 0; bIdx--) {
          const b = s.bullets[bIdx];
          let consumed = false;

          if (s.boss) {
            const bo = s.boss;
            if (Math.abs(b.x - bo.x) < bo.w / 2 && Math.abs(b.y - bo.y) < bo.h / 2) {
              bo.hp -= 1;
              boom(b.x, b.y, bo.color2 || "#f87171", 4);
              hapticMove();
              if (!b.pierce) { s.bullets.splice(bIdx, 1); consumed = true; }
              if (bo.hp <= 0) {
                boom(bo.x, bo.y, CORE, 44, 1.5);
                boom(bo.x, bo.y, "#ffffff", 16, 1.2);
                reward(s, bo.x, bo.y, 600);
                s.bossClearedAt = s.wave;
                s.boss = null;
                s.phase = "rest";
                s.restTimer = 90;
                s.foeShots = [];
                s.shakeMag = 18;
                s.flashColor = "255,215,120";
                s.flashAlpha = 0.55;
                s.hitStop = 10;
                spawnPowerUp(s, bo.x - 28, bo.y, "repair");
                spawnPowerUp(s, bo.x + 28, bo.y, s.graze < 55 ? "overdrive" : "rapid");
                if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
                  import("canvas-confetti").then(({ default: confetti }) => {
                    confetti({ particleCount: 72, spread: 76, origin: { y: 0.5 }, disableForReducedMotion: true });
                  });
                }
                notify(t("arcadeGame.survivor.bossDefeated", { boss: bo.name }));
              }
            }
          }
          if (consumed) continue;

          for (let eIdx = s.enemies.length - 1; eIdx >= 0; eIdx--) {
            const e = s.enemies[eIdx];
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.w / 2 + 6) {
              e.hp -= 1;
              e.flash = 5;
              boom(b.x, b.y, e.color, 6);
              if (!b.pierce) { s.bullets.splice(bIdx, 1); consumed = true; }
              if (e.hp <= 0) {
                s.enemies.splice(eIdx, 1);
                boom(e.x, e.y, e.color, e.type === "heavy" ? 20 : 10);
                reward(s, e.x, e.y, e.type === "heavy" ? 80 : 25);
                hapticMerge();
                s.killsSinceDrop += 1;
                if (e.type === "heavy") s.shakeMag = Math.max(s.shakeMag, 5);
                if (
                  s.killsSinceDrop >= cfg.dropStreak
                  || Math.random() < survivorDropChance(s.player.hp, MAX_HP) * cfg.dropDecay
                ) {
                  spawnPowerUp(s, e.x, e.y);
                }
              }
              if (consumed) break;
            }
          }
        }

        // ── LƯỚT SÁT: bay gần mà không trúng thì nạp xung phá ──
        if (s.overdrive <= 0) {
          let near = 0;
          const count = (ox, oy, hitR) => {
            const d = Math.hypot(s.player.x - ox, s.player.y - oy);
            if (d > hitR && d < GRAZE_RADIUS + hitR) near++;
          };
          s.foeShots.forEach((f) => count(f.x, f.y, f.size || 7));
          s.enemies.forEach((e) => count(e.x, e.y, e.w / 2 + 12));
          if (near > 0) {
              s.graze = Math.min(GRAZE_FULL, s.graze + near * 0.40);
            if (Math.random() < 0.25) {
              s.particles.push({
                x: s.player.x + (Math.random() - 0.5) * 34,
                y: s.player.y + (Math.random() - 0.5) * 34,
                vx: 0, vy: -1.4, life: 1, size: 1.8, color: OD_COLOR,
              });
            }
            if (s.graze >= GRAZE_FULL && !s.grazeAnnounced) {
              s.grazeAnnounced = true;
              pushPopup(s.popups, s.player.x, s.player.y - 40, tRef.current("arcadeGame.ready"), OD_COLOR, 14);
              s.score += 50;
              notify(t("arcadeGame.survivor.overdriveReady"));
            }
          }
          if (s.graze < GRAZE_FULL) s.grazeAnnounced = false;
        }

        // ── Va chạm lên người chơi ──
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          if (Math.hypot(s.player.x - e.x, s.player.y - e.y) < e.w / 2 + 12) {
            if (s.overdrive > 0) {
              s.enemies.splice(i, 1);
              boom(e.x, e.y, OD_COLOR, 14);
              reward(s, e.x, e.y, e.type === "heavy" ? 80 : 25);
              continue;
            }
            s.enemies.splice(i, 1);
            boom(e.x, e.y, e.color, 10);
            damage(s, s.player.x, s.player.y);
            if (s.isGameOver) { ctx.restore(); return; }
          }
        }
        for (let i = s.foeShots.length - 1; i >= 0; i--) {
          const f = s.foeShots[i];
          if (Math.hypot(s.player.x - f.x, s.player.y - f.y) < (f.size || 7) + 7) {
            s.foeShots.splice(i, 1);
            damage(s, s.player.x, s.player.y);
            if (s.isGameOver) { ctx.restore(); return; }
          }
        }

        // ── Người chơi ↔ vật phẩm ──
        for (let i = s.powerUps.length - 1; i >= 0; i--) {
          const p = s.powerUps[i];
          if (Math.hypot(s.player.x - p.x, s.player.y - p.y) < 24) {
            s.powerUps.splice(i, 1);
            playBeep();
            if (p.type === "core") {
              if (s.player.weapon < MAX_WEAPON) {
                s.player.weapon += 1;
                notify(t("arcadeGame.survivor.weaponLevel", { level: s.player.weapon }));
              } else {
                reward(s, s.player.x, s.player.y - 24, 200);
                notify(t("arcadeGame.survivor.weaponMax"));
              }
            } else if (p.type === "shield") {
              if (s.player.shield) s.graze = Math.min(GRAZE_FULL, s.graze + 25);
              s.player.shield = true;
              notify(t("arcadeGame.survivor.shieldReady"));
            } else if (p.type === "repair") {
              if (s.player.hp < MAX_HP) {
                s.player.hp = Math.min(MAX_HP, s.player.hp + 1);
                notify(t("arcadeGame.survivor.repaired", { hp: s.player.hp }));
              } else {
                reward(s, s.player.x, s.player.y - 24, 250);
                notify(t("arcadeGame.survivor.repairConverted"));
              }
            } else if (p.type === "overdrive") {
              s.graze = Math.min(GRAZE_FULL, s.graze + 55);
              notify(s.graze >= GRAZE_FULL
                ? t("arcadeGame.survivor.overdriveReady")
                : t("arcadeGame.survivor.overdriveCharged"));
            } else if (p.type === "rapid") {
              s.rapidFire = Math.max(s.rapidFire, 240);
              notify(t("arcadeGame.survivor.rapidFire"));
            }
          }
        }
      }

      // ── Sóng xung kích ──
      if (!frozen) {
        s.shocks.forEach((w) => { w.r += (w.max - w.r) * 0.18; w.life -= 0.045; });
        s.shocks = s.shocks.filter((w) => w.life > 0);
      }
      additive(() => s.shocks.forEach((w) => {
        ctx.globalAlpha = w.life * 0.55;
        ring(w.x, w.y, w.r, w.color, 2 + w.life * 2.5);
        ctx.globalAlpha = w.life * 0.25;
        ring(w.x, w.y, w.r * 0.62, "#ffffff", 1.5);
      }));
      ctx.globalAlpha = 1;

      // ── Hạt ──
      if (!frozen) {
        s.particles.forEach((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vx *= 0.985;              // ma sát nhẹ: mảnh vỡ chậm dần thay vì bay đều
          pt.vy = pt.vy * 0.985 + 0.045;
          pt.life -= pt.decay || 0.025;
        });
        s.particles = s.particles.filter((pt) => pt.life > 0);
      }
      additive(() => s.particles.forEach((pt) => {
        ctx.globalAlpha = pt.life * 0.9;
        ctx.fillStyle = pt.color;
        if (pt.spark) {
          // Tàn lửa kéo vệt theo hướng bay — đứng yên nhìn là thấy chiều chuyển động.
          ctx.lineWidth = Math.max(1, (pt.size || 2) * pt.life * 0.6);
          ctx.strokeStyle = pt.color;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x - pt.vx * 2.4, pt.y - pt.vy * 2.4);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (pt.size || 2) * pt.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }));
      ctx.globalAlpha = 1;

      drawPlayer(s);

      updatePopups(s.popups);
      drawPopups(ctx, s.popups);

      // Viền đỏ khi còn 1 máu — cảnh báo ngoại vi, không che tầm nhìn.
      if (s.player.hp === 1 && !s.isGameOver) {
        const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.62);
        v.addColorStop(0, "transparent");
        v.addColorStop(1, `rgba(220,38,38,${0.28 + Math.sin(ts / 260) * 0.12})`);
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, W, H);
      }

      if (s.flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(${s.flashColor},${s.flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
    };

    // Cổng nhịp: 120Hz thì một nửa số khung không có nhịp nào để chạy (không gì
    // đổi → không cần vẽ lại), máy tụt fps thì chạy bù. Trước đây thân vòng lặp
    // chạy mỗi khung nên trên iPhone ProMotion game nhanh gấp đôi.
    const gate = createFrameGate();
    const render = (ts) => {
      if (stopped) return;
      for (let i = gate.steps(ts); i > 0 && !stopped; i -= 1) frame(ts);
      if (!stopped) rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => { stopped = true; cancelAnimationFrame(rafId); };
  }, [playBeep, playLose, onGameOver, paused, notify, syncHud, layoutRevision, t]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => syncHud(), 120);
    return () => clearInterval(id);
  }, [paused, syncHud]);

  const useOverdrive = useCallback(() => { overdriveRef.current?.(); }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      state.current.keys[e.key] = true;
      if (e.key === " " || e.key === "Shift") { e.preventDefault(); overdriveRef.current?.(); }
    };
    const onKeyUp = (e) => { state.current.keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Ngón tay không được che phi thuyền: tàu bay cao hơn điểm chạm một khoảng.
  const handleTouch = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * W;
    const y = ((touch.clientY - rect.top) / rect.height) * H - 46;
    state.current.player.x = Math.max(16, Math.min(W - 16, x));
    state.current.player.y = Math.max(30, Math.min(H - 40, y));
  };

  const odReady = hud.graze >= 100 || hud.overdrive;

  return (
    <div className="survivor-game">
      <div className="survivor-hud">
        <ArcadeHud
          gameId={GAME_ID}
          score={hud.score}
          combo={hud.combo}
          multiplier={hud.mult}
          notice={hud.notice}
          stats={[
            { label: t("arcadeGame.survivor.weapon"), value: t("arcadeGame.survivor.level", { level: hud.weapon }) },
            {
              label: t("arcadeGame.survivor.waveLabel"),
              // Đợt giờ kết thúc bằng việc dọn sạch địch, nên số địch còn lại
              // là thông tin người chơi cần nhất — không có nó thì không biết
              // bao giờ trùm mới ra.
              value: hud.phase === "boss"
                ? t("arcadeGame.survivorBoss", { wave: hud.wave })
                : hud.waveLeft > 0
                  ? t("arcadeGame.survivorLeft", { wave: hud.wave, count: hud.waveLeft })
                  : t("arcadeGame.survivorClear", { wave: hud.wave }),
            },
          ]}
        />

        <div className="svv-status">
          <div className="svv-hp" aria-label={t("arcadeGame.survivor.hpLeft", { hp: hud.hp })}>
            {Array.from({ length: MAX_HP }, (_, i) => (
              <span key={i} className={i < hud.hp ? "is-on" : ""} />
            ))}
          </div>
          <div className="svv-buffs" aria-label={t("arcadeGame.survivor.skills")}>
            <span className={hud.shield ? "is-on is-shield" : ""} title={t("arcadeGame.survivor.shield")}>
              <span className="material-symbols-outlined">shield</span>
            </span>
            <span className={hud.rapid ? "is-on is-rapid" : ""} title={t("arcadeGame.survivor.rapid")}>
              <span className="material-symbols-outlined">double_arrow</span>
            </span>
          </div>
          <div className={`svv-od${odReady ? " is-ready" : ""}`}>
            <span style={{ width: `${hud.overdrive ? 100 : hud.graze}%` }} />
          </div>
          <button
            type="button"
            className={`svv-od__btn${odReady ? " is-ready" : ""}`}
            onPointerDown={useOverdrive}
            disabled={!odReady}
            aria-label={t("arcadeGame.survivor.overdrive")}
          >
            <span className="material-symbols-outlined">bolt</span>
          </button>
        </div>
      </div>

      <div className="gpanel survivor-frame">
        {hud.boss !== null && (
          <div className="svv-boss" role="status">
            <div className="svv-boss__top">
              <span>
                <b>{hud.bossName}</b>
                <small>{t("arcadeGame.survivor.bossMeta", { phase: hud.bossMode, wave: hud.wave })}</small>
              </span>
              <span>{hud.boss}%</span>
            </div>
            <div className="svv-boss__rail"><span style={{ width: `${hud.boss}%` }} /></div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
          className="survivor-canvas"
        />
        <div className="survivor-scanline" aria-hidden="true" />
      </div>

      <p className="game-control-hint survivor-hint">
        {t("arcadeGame.survivor.touchHint")}
      </p>
    </div>
  );
}
