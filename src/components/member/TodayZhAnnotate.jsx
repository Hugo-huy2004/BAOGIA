// ĐẶC QUYỀN CHẾ ĐỘ TIẾNG TRUNG cho trang Today: biến bài báo tiếng Trung thành
// mặt học. Các từ CÓ trong giáo trình (HSK/TOCFL) được gạch chân; chạm vào hiện
// pinyin (tô màu thanh điệu) + nghĩa + phát âm + nút "học" (thêm vào hàng ôn).
//
// Chỉ chú thích từ có trong giáo trình để mỗi gạch chân đều bấm ra được nội dung
// — vừa học từ đang theo, vừa đọc báo thật.
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

const apiBase = () => (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const api = (path, opts = {}) =>
  fetch(`${apiBase()}${path}`, { credentials: "include", ...opts }).then((r) => r.json());

// Tách từ tiếng Trung: ưu tiên Intl.Segmenter (chuẩn), fallback tách theo ký tự.
function segment(text) {
  const s = String(text || "");
  try {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const seg = new Intl.Segmenter("zh", { granularity: "word" });
      return [...seg.segment(s)].map((x) => x.segment);
    }
  } catch { /* noop */ }
  // Fallback: cụm Hán → từng ký tự; phần khác giữ nguyên.
  return s.split(/([一-鿿]+)/).flatMap((p) => (/[一-鿿]/.test(p) ? [...p] : [p]));
}
const isHanWord = (w) => /^[一-鿿]+$/.test(w);

// Tô màu pinyin theo thanh điệu (giống app Hoa Ngữ).
const TONE_COLOR = { 1: "#ef4444", 2: "#f59e0b", 3: "#16a34a", 4: "#3b82f6", 0: "#94a3b8" };
const TONE_MARK = { "ā":1,"ē":1,"ī":1,"ō":1,"ū":1,"ǖ":1,"á":2,"é":2,"í":2,"ó":2,"ú":2,"ǘ":2,"ǎ":3,"ě":3,"ǐ":3,"ǒ":3,"ǔ":3,"ǚ":3,"à":4,"è":4,"ì":4,"ò":4,"ù":4,"ǜ":4 };
const toneOf = (syl) => { for (const ch of String(syl)) if (TONE_MARK[ch]) return TONE_MARK[ch]; return 0; };
function Pinyin({ text }) {
  return <>{String(text || "").split(/(\s+)/).map((tok, i) => (tok.trim() === "" ? tok : <span key={i} style={{ color: TONE_COLOR[toneOf(tok)] }}>{tok}</span>))}</>;
}

let primed = false;
function speak(text) {
  try {
    const synth = window.speechSynthesis; if (!synth) return;
    synth.cancel(); synth.resume();
    const go = () => {
      const u = new SpeechSynthesisUtterance(text); u.lang = "zh-CN"; u.rate = 0.7;
      const v = (synth.getVoices() || []).find((x) => /zh|Chinese|Tingting|Meijia|普通话/i.test(x.name) || /zh/i.test(x.lang));
      if (v) u.voice = v;
      synth.speak(u);
    };
    if (!synth.getVoices().length) { synth.onvoiceschanged = go; setTimeout(go, 250); } else go();
  } catch { /* noop */ }
}
export function primeZhSpeech() { if (primed) return; primed = true; try { const s = window.speechSynthesis; if (s) { s.resume(); const u = new SpeechSynthesisUtterance(" "); u.volume = 0; s.speak(u); } } catch { /* noop */ } }

// Tra 1 lần toàn bộ từ Hán trong các đoạn văn → map từ→thông tin (chỉ từ giáo trình).
export function useZhVocab(texts) {
  const [known, setKnown] = useState({});
  const key = useMemo(() => (texts || []).filter(Boolean).join(""), [texts]);
  useEffect(() => {
    const words = new Set();
    for (const t of texts || []) for (const w of segment(t)) if (isHanWord(w) && w.length <= 4) words.add(w);
    if (!words.size) { setKnown({}); return undefined; }
    let alive = true;
    api("/vocab/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ words: [...words] }) })
      .then((d) => { if (alive) setKnown(d?.found || {}); })
      .catch(() => { if (alive) setKnown({}); });
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return known;
}

// Render một đoạn text: từ có trong giáo trình → nút gạch chân bấm được.
export function ZhText({ text, known, onTap }) {
  if (!text) return null;
  if (!known || !Object.keys(known).length) return <>{text}</>;
  return (
    <>
      {segment(text).map((w, i) => {
        const info = isHanWord(w) && known[w];
        if (!info) return <span key={i}>{w}</span>;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onTap(info)}
            className="today-zh-word"
            style={{ display: "inline", padding: 0, margin: 0, border: 0, borderRadius: 0, background: "none", font: "inherit", color: "inherit", cursor: "pointer", WebkitAppearance: "none", appearance: "none", verticalAlign: "baseline", borderBottom: "2px dotted #e11d48", textUnderlinePosition: "under" }}
          >{w}</button>
        );
      })}
    </>
  );
}

// Popup: 词 + pinyin + nghĩa + phát âm + "học".
export function ZhWordPopup({ word, lang = "vi", onClose }) {
  const [added, setAdded] = useState(false);
  useEffect(() => { speak(word.hanzi); }, [word.hanzi]);
  const meaning = (lang === "en" && word.meaningEn) ? word.meaningEn : (word.meaning || word.meaningEn || "");
  const add = async () => {
    try { await api("/vocab/queue-card", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId: word.cardId }) }); setAdded(true); } catch { /* noop */ }
  };
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ width: "100%", maxWidth: 460, background: "#fffdf8", color: "#2b2620", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: "22px 20px calc(24px + env(safe-area-inset-bottom,0px))", boxShadow: "0 -12px 40px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div lang="zh" style={{ fontSize: 46, fontWeight: 800, lineHeight: 1 }}>{word.hanzi}</div>
          <button type="button" onClick={() => speak(word.hanzi)} aria-label="Phát âm"
            style={{ marginLeft: "auto", width: 44, height: 44, borderRadius: 999, border: 0, background: "rgba(225,29,72,.1)", color: "#e11d48", cursor: "pointer" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, verticalAlign: "middle" }}>volume_up</span>
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800 }}><Pinyin text={word.pinyin} /></div>
        <div style={{ marginTop: 6, fontSize: 17, fontWeight: 700 }}>{meaning}</div>
        {word.hanViet && <div style={{ marginTop: 6, fontSize: 13, color: "#8a8175" }}>汉越：{word.hanViet}</div>}
        <button type="button" onClick={add} disabled={added}
          style={{ marginTop: 16, width: "100%", padding: "13px 0", borderRadius: 16, border: 0, cursor: added ? "default" : "pointer", fontSize: 15, fontWeight: 800, color: "#fff", background: added ? "#16a34a" : "linear-gradient(135deg,#fb7185,#e11d48)" }}>
          {added ? "已加入学习 ✓" : "加入学习"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
