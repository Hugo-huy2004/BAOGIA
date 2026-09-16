"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Câu thần chú cho cảnh trợ lý vừa thành hình: người xem nói "Thả tim" thì một
 * nùi trái tim nổ ra từ lõi quả cầu, kèm một tiếng chuông ngắn.
 *
 * Cố ý KHÔNG phải trợ lý hỏi đáp — nó không trả lời gì, chỉ nhận đúng mấy câu
 * lệnh có sẵn rồi làm hiệu ứng. Nghe không ra thì im lặng nhắc lại danh sách.
 *
 * Nghe bằng SpeechRecognition của trình duyệt, vẽ bằng một thẻ <canvas> duy
 * nhất, kêu bằng OscillatorNode: không thư viện, không gọi server, không tệp
 * âm thanh nào phải tải. Vòng vẽ chỉ chạy khi còn hạt trên màn.
 */

type Kind = "heart" | "spark" | "drop";
type Spell = { say: string; keys: string; kind: Kind };

const COLORS: Record<Kind, [string, string]> = {
  heart: ["#ff6b9d", "#e0335f"],
  spark: ["#17EAD9", "#6078EA"],
  drop: ["#7CF4E8", "#498FE8"],
};
/** Nốt gốc của tiếng chuông, mỗi câu lệnh một màu âm. */
const NOTE: Record<Kind, number> = { heart: 622, spark: 784, drop: 523 };

type Particle = {
  x: number; y: number; vx: number; vy: number;
  size: number; spin: number; turn: number; life: number; kind: Kind; hue: 0 | 1;
};

const SPEECH_LANG: Record<string, string> = { vi: "vi-VN", en: "en-US", zh: "zh-CN" };

/** Bỏ dấu để "tha tim" bắt được "thả tim"; đ không tự tách nên xử riêng. */
const plain = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

/**
 * Từ khoá có trong câu vừa nói hay không. Từ khoá latin phải khớp trọn tiếng:
 * bỏ dấu xong thì "thiết" thành "thiet" — chứa "hi" — nên khớp kiểu chuỗi con
 * sẽ bắt nhầm gần hết mọi câu. Chữ Hán không có dấu cách nên vẫn khớp chuỗi con.
 */
function hasWord(said: string, word: string) {
  if (!word) return false;
  if (!/[a-z0-9]/.test(word)) return said.includes(word);
  const safe = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${safe}([^a-z0-9]|$)`).test(said);
}

function findSpell(said: string, spells: Spell[]) {
  const text = plain(said);
  return spells.find((spell) => spell.keys.split(",").some((key) => hasWord(text, plain(key.trim())))) || null;
}

/** Chuông ngắn bằng ba nốt — không tải tệp âm thanh nào. */
function chime(kind: Kind) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const context = new Ctx();
    const start = context.currentTime;
    [1, 1.26, 1.5].forEach((ratio, index) => {
      const at = start + index * 0.075;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = NOTE[kind] * ratio;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
      osc.connect(gain).connect(context.destination);
      osc.start(at);
      osc.stop(at + 0.6);
    });
    window.setTimeout(() => context.close().catch(() => {}), 1400);
  } catch {
    /* máy chặn tiếng thì hiệu ứng hình vẫn chạy */
  }
}

function drawHeart(context: CanvasRenderingContext2D, size: number) {
  const s = size / 16;
  context.beginPath();
  context.moveTo(0, 5 * s);
  context.bezierCurveTo(-9 * s, -3 * s, -5 * s, -11 * s, 0, -5 * s);
  context.bezierCurveTo(5 * s, -11 * s, 9 * s, -3 * s, 0, 5 * s);
  context.closePath();
  context.fill();
}

export default function VoiceSpell({ prompt }: { prompt: boolean }) {
  const { t, i18n } = useTranslation();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const clearHeard = useRef(0);
  /* còn ở trong cảnh hay không */
  const keepRef = useRef(false);
  /* người xem đã từ chối quyền micro */
  const blockedRef = useRef(false);
  const lastCastRef = useRef(0);

  const spells = useMemo(() => {
    const raw = t("intro.spell.spells", { returnObjects: true });
    return Array.isArray(raw) ? (raw as Spell[]) : [];
  }, [t]);

  /* ── vẽ ───────────────────────────────────────────────────────────── */

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const alive = particlesRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let index = alive.length - 1; index >= 0; index -= 1) {
      const p = alive[index];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16;        // rơi xuống
      p.vx *= 0.992;       // cản không khí
      p.vy *= 0.992;
      p.spin += p.turn;
      p.life -= 0.0085;
      if (p.life <= 0) {
        alive.splice(index, 1);
        continue;
      }
      context.save();
      context.globalAlpha = Math.min(1, p.life * 1.8);
      context.translate(p.x, p.y);
      context.rotate(p.spin);
      context.fillStyle = COLORS[p.kind][p.hue];
      context.shadowColor = COLORS[p.kind][p.hue];
      context.shadowBlur = 14;
      if (p.kind === "heart") {
        drawHeart(context, p.size);
      } else if (p.kind === "spark") {
        context.fillRect(-p.size * 0.1, -p.size * 0.5, p.size * 0.2, p.size);
      } else {
        context.beginPath();
        context.arc(0, 0, p.size * 0.42, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    // Hết hạt là dừng hẳn vòng vẽ — cảnh này còn ba cuốn phim khác đang chạy.
    frameRef.current = alive.length ? window.requestAnimationFrame(tick) : 0;
  }, []);

  const cast = useCallback(
    (kind: Kind) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = canvas.getBoundingClientRect();
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      const context = canvas.getContext("2d");
      context?.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Nổ ra từ lõi quả cầu: cùng chỗ với tâm quả cầu trong WorkStory (55svh).
      const cx = box.width / 2;
      const cy = box.height * 0.55;
      for (let index = 0; index < 34; index += 1) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7;
        const speed = 5 + Math.random() * 9;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 30,
          y: cy + (Math.random() - 0.5) * 30,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          size: 14 + Math.random() * 18,
          spin: (Math.random() - 0.5) * 0.8,
          turn: (Math.random() - 0.5) * 0.09,
          life: 0.85 + Math.random() * 0.5,
          kind,
          hue: Math.random() > 0.5 ? 1 : 0,
        });
      }
      chime(kind);
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(tick);
    },
    [tick],
  );

  /* ── nghe ─────────────────────────────────────────────────────────── */

  const stop = useCallback(() => {
    keepRef.current = false;
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const listen = useCallback(() => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition || recognitionRef.current || blockedRef.current) return;

    const recognition = new Recognition();
    recognition.lang = SPEECH_LANG[i18n.language.slice(0, 2)] || "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      let text = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        text += event.results[index][0].transcript;
      }
      setHeard(text);
      const spell = findSpell(text, spells);
      // Bắn ngay khi nghe ra chứ không đợi chốt câu — đợi thêm một nhịp là mất
      // cảm giác "nói xong nổ liền". Khoá 1,5 giây để một câu không nổ hai lần:
      // kết quả tạm và kết quả chốt cùng chứa từ khoá đó.
      if (spell && Date.now() - lastCastRef.current > 1500) {
        lastCastRef.current = Date.now();
        cast(spell.kind);
      }
    };
    recognition.onerror = (event: any) => {
      // Bị từ chối quyền thì thôi hẳn, đừng mở lại — mở lại chỉ làm trình duyệt
      // hỏi quyền liên tục. Mấy câu lệnh vẫn bấm được.
      if (event.error === "not-allowed" || event.error === "service-not-allowed") blockedRef.current = true;
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      // Chrome tự ngắt sau một quãng im lặng; còn ở trong cảnh thì mở lại.
      if (keepRef.current && !blockedRef.current) window.setTimeout(listen, 400);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }
  }, [cast, i18n.language, spells]);

  // Vào cảnh là tự nghe, không phải bấm gì; rời cảnh thì tắt micro.
  useEffect(() => {
    if (!prompt) {
      stop();
      setHeard("");
      return;
    }
    keepRef.current = true;
    listen();
    return stop;
  }, [listen, prompt, stop]);

  useEffect(
    () => () => {
      window.clearTimeout(clearHeard.current);
      window.cancelAnimationFrame(frameRef.current);
      recognitionRef.current?.abort?.();
    },
    [],
  );

  // Câu nghe được xoá sau vài giây, để lần sau không hiện câu cũ.
  useEffect(() => {
    if (!heard) return;
    window.clearTimeout(clearHeard.current);
    clearHeard.current = window.setTimeout(() => setHeard(""), 4000);
  }, [heard]);

  return (
    <>
      <canvas ref={canvasRef} className="hw-spell-canvas" aria-hidden />
      <div className="hw-spell" hidden={!prompt}>
        {heard && <p className="hw-spell-heard">{heard}</p>}
        <p className="hw-spell-line" data-ear={listening || undefined}>
          <span className="hw-spell-dot" aria-label={t("intro.spell.listening")} hidden={!listening} />
          {/* Ba câu lệnh nằm GIỮA câu thoại và vẫn bấm được, nên tách câu tại
              chỗ chèn thay vì nhét thẻ HTML vào tệp dịch — cùng cách làm với
              câu mở đầu ở IntroductionPage. */}
          {t("intro.spell.line", { a: "\u0000", b: "\u0000", c: "\u0000" })
            .split("\u0000")
            .flatMap((chunk, index) =>
              index === 0
                ? [chunk]
                : [
                    <button
                      key={spells[index - 1]?.say || index}
                      type="button"
                      className="hw-spell-word"
                      onClick={() => spells[index - 1] && cast(spells[index - 1].kind)}
                    >
                      {spells[index - 1]?.say}
                    </button>,
                    chunk,
                  ],
            )}
        </p>
      </div>
    </>
  );
}
