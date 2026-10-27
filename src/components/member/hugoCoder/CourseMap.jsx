import { useEffect, useMemo, useRef, useState } from "react";
import { Bug, Check, Code2, Database, Flag, Lock, Rocket, ShieldCheck, Sparkles, Trophy, Users, X } from "lucide-react";
import { gradeStage } from "../../../../shared/stageGrading";

/**
 * Bản đồ khoá Coding — một con đường lục giác đi qua sáu vùng phong cảnh.
 *
 * Mỗi chặng một vùng đất riêng (đồng cỏ, hồ, rừng tím, hoàng hôn, đêm sao, sa
 * mạc) để người học thấy mình đã đi xa tới đâu. Chi tiết của chặng giấu trong
 * nút tròn "!" — bản đồ chỉ còn đường đi, không đổ chữ ra màn.
 *
 * ponytail: phong cảnh vẽ bằng gradient CSS + vài SVG nội tuyến, nhân vật là ảnh
 * WebP ~15 KB — không WebGL, không thư viện hoạt hình.
 */
// Mỗi chặng MỘT nhân vật riêng, không lặp: ba ảnh chibi Hugo cho ba chặng hợp
// vai (chào, gõ laptop, lên đường triển khai) và ba nhân vật vẽ SVG cho phần còn lại.
const STAGE_LOOK = {
  basic: { icon: Code2, mascot: "/image/coding/hugo-1.webp" },
  intermediate: { icon: Database, mascot: "/image/coding/hugo-5.webp" },
  advanced: { icon: Users, Mascot: RobotMascot },
  security: { icon: ShieldCheck, Mascot: OwlMascot },
  project: { icon: Sparkles, Mascot: AstronautMascot },
  devops: { icon: Rocket, mascot: "/image/coding/hugo-6.webp" },
};

// Màu đất cuối mỗi vùng — vùng sau bắt đầu từ đúng màu này để hai vùng hoà
// vào nhau thay vì cắt ngang một đường thẳng. Khớp --ground trong CSS.
const GROUND = { blue: "#58c13d", green: "#2fb5c9", purple: "#a3d977", pink: "#ffc861", indigo: "#262a63", orange: "#ffa94d" };

// Đường lượn: lệch trái–phải theo hình sin, mỗi chặng lượn ngược chiều chặng trước.
const offsetOf = (index, flip) => Math.round(Math.sin(index * 0.9) * 70) * (flip ? -1 : 1);

/** Robot CRUD — chặng 3: tay cầm thẻ bài đăng, mắt chớp. */
function RobotMascot() {
  return (
    <svg viewBox="0 0 100 110" role="img" aria-label="Robot CRUD đang chờ">
      <ellipse cx="50" cy="104" rx="28" ry="5" fill="#000" opacity=".15" />
      <line x1="50" y1="8" x2="50" y2="20" stroke="#5c6ac4" strokeWidth="3" />
      <circle cx="50" cy="7" r="5" fill="#ff6b9d" />
      <rect x="22" y="20" width="56" height="40" rx="14" fill="#e7e9ff" stroke="#5c6ac4" strokeWidth="3" />
      <rect x="31" y="31" width="38" height="18" rx="9" fill="#262a63" />
      <g className="cmap-blink"><circle cx="42" cy="40" r="4" fill="#7fffd4" /><circle cx="58" cy="40" r="4" fill="#7fffd4" /></g>
      <rect x="28" y="62" width="44" height="32" rx="10" fill="#b197fc" stroke="#5c6ac4" strokeWidth="3" />
      <text x="50" y="83" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">CRUD</text>
      <rect x="10" y="64" width="16" height="9" rx="4.5" fill="#b197fc" stroke="#5c6ac4" strokeWidth="2.5" />
      <g className="cmap-wave-arm"><rect x="74" y="50" width="9" height="20" rx="4.5" fill="#b197fc" stroke="#5c6ac4" strokeWidth="2.5" /></g>
      <rect x="34" y="94" width="10" height="9" rx="3" fill="#5c6ac4" /><rect x="56" y="94" width="10" height="9" rx="3" fill="#5c6ac4" />
    </svg>
  );
}

/** Cú gác cổng — chặng 4 bảo mật: ôm khiên, mắt tròn canh chừng. */
function OwlMascot() {
  return (
    <svg viewBox="0 0 100 110" role="img" aria-label="Cú gác cổng bảo mật đang chờ">
      <ellipse cx="50" cy="104" rx="28" ry="5" fill="#000" opacity=".15" />
      <path d="M22 30 L30 12 L40 26 M78 30 L70 12 L60 26" fill="#8d5a2b" stroke="#6b4220" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="50" cy="62" rx="32" ry="40" fill="#a86b35" />
      <ellipse cx="50" cy="72" rx="20" ry="26" fill="#f3d9b1" />
      <circle cx="37" cy="40" r="12" fill="#fff" /><circle cx="63" cy="40" r="12" fill="#fff" />
      <g className="cmap-blink"><circle cx="38" cy="41" r="6" fill="#262a63" /><circle cx="62" cy="41" r="6" fill="#262a63" /></g>
      <path d="M46 50 L50 58 L54 50 Z" fill="#ffb347" />
      <path d="M38 66 h24 v12 c0 10 -12 16 -12 16 s-12 -6 -12 -16 Z" fill="#ff4b4b" stroke="#c92a2a" strokeWidth="2.5" />
      <path d="M45 78 l4 4 l7 -9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 101 h8 M54 101 h8" stroke="#ffb347" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Phi hành gia — chặng 5 hoàn thiện sản phẩm: vẫy tay dưới bầu trời sao. */
function AstronautMascot() {
  return (
    <svg viewBox="0 0 100 110" role="img" aria-label="Phi hành gia đang chờ">
      <ellipse cx="50" cy="104" rx="28" ry="5" fill="#000" opacity=".2" />
      <rect x="28" y="56" width="44" height="40" rx="14" fill="#f8f9fa" stroke="#adb5bd" strokeWidth="3" />
      <rect x="40" y="66" width="20" height="12" rx="3" fill="#5865f2" />
      <circle cx="45" cy="72" r="2" fill="#ffc800" /><circle cx="55" cy="72" r="2" fill="#69db7c" />
      <circle cx="50" cy="34" r="26" fill="#f8f9fa" stroke="#adb5bd" strokeWidth="3" />
      <rect x="31" y="22" width="38" height="26" rx="13" fill="#262a63" />
      <path d="M38 30 q4 -5 10 -4" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".7" />
      <g className="cmap-blink"><circle cx="43" cy="36" r="3" fill="#ffe066" /><circle cx="57" cy="36" r="3" fill="#ffe066" /></g>
      <g className="cmap-wave-arm"><rect x="72" y="44" width="11" height="24" rx="5.5" fill="#f8f9fa" stroke="#adb5bd" strokeWidth="2.5" /></g>
      <rect x="16" y="62" width="14" height="10" rx="5" fill="#f8f9fa" stroke="#adb5bd" strokeWidth="2.5" />
      <rect x="34" y="94" width="11" height="9" rx="3" fill="#adb5bd" /><rect x="55" y="94" width="11" height="9" rx="3" fill="#adb5bd" />
    </svg>
  );
}

/** Cây, bụi, hoa trang trí — đặt hai bên đường, không bấm được. */
function Scenery({ seed }) {
  const items = [
    ["tree", 6, 8], ["bush", 84, 22], ["flower", 12, 46], ["tree", 88, 58], ["flower", 80, 84], ["bush", 4, 80],
  ];
  return (
    <div className="cmap-scenery" aria-hidden="true">
      {items.map(([kind, left, top], i) => (
        <svg key={i} className={`cmap-deco is-${kind}`} style={{ left: `${left}%`, top: `${(top + seed * 7) % 92}%` }} viewBox="0 0 40 40">
          {kind === "tree" && (<><rect x="18" y="24" width="4" height="12" rx="2" fill="#7a4b2a" /><circle cx="20" cy="18" r="13" fill="var(--deco-a)" /><circle cx="14" cy="14" r="5" fill="#fff" opacity=".18" /></>)}
          {kind === "bush" && (<><circle cx="13" cy="26" r="9" fill="var(--deco-a)" /><circle cx="25" cy="24" r="11" fill="var(--deco-b)" /></>)}
          {kind === "flower" && (<><rect x="19" y="20" width="2" height="14" fill="#2f7a3a" />{[0, 72, 144, 216, 288].map((r) => <circle key={r} cx="20" cy="13" r="5" fill="var(--deco-c)" transform={`rotate(${r} 20 18)`} />)}<circle cx="20" cy="18" r="3.5" fill="#ffd23f" /></>)}
        </svg>
      ))}
    </div>
  );
}

/** Bảng chi tiết chặng — mở từ nút tròn "!". */
function StageSheet({ unit, assessment, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="cmap-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className={`cmap-sheet cmap-tone-${unit.tone}`} role="dialog" aria-modal="true" aria-labelledby="cmap-sheet-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="cmap-sheet-close" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button>
        <small>Chặng {unit.phaseNumber} · {unit.rangeText}</small>
        <h2 id="cmap-sheet-title">{unit.title.replace(/^CODE \d+ · /, "")}</h2>
        <p className="cmap-sheet-tagline">{unit.intro?.tagline}</p>
        <h3>Bạn sẽ học</h3>
        <ul>{(unit.intro?.learn || []).map((item) => <li key={item}>{item}</li>)}</ul>
        {unit.intro?.challenge && (<><h3>Thử thách</h3><p>{unit.intro.challenge}</p></>)}
        {unit.intro?.promise && <p className="cmap-sheet-promise">{unit.intro.promise}</p>}
        {assessment.breakdown.attempts > 0 && (
          <p className="cmap-sheet-grade">Xếp loại hiện tại: <b>{assessment.score}/100 · {assessment.gradeLabel}</b></p>
        )}
      </div>
    </div>
  );
}

function Unit({ unit, lessons, currentIndex, completedSet, onOpenLesson, focusId, focusRef, examScores, serverCompleted, flip, prevTone }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const look = STAGE_LOOK[unit.id] || STAGE_LOOK.basic;
  const doneCount = lessons.filter(({ course }) => completedSet.has(course.id)).length;
  const percent = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const assessment = useMemo(() => gradeStage({
    lessonIds: lessons.map(({ course }) => course.id),
    examIds: lessons.map(({ course }) => course.id),
    completedLessons: serverCompleted,
    examScores,
  }), [lessons, serverCompleted, examScores]);
  // Nhân vật đứng chờ cạnh step giữa chặng, ở phía đường không lượn tới.
  const mascotAt = Math.floor(lessons.length / 2);

  return (
    <section
      className={`cmap-zone cmap-tone-${unit.tone}`}
      aria-labelledby={`cmap-${unit.id}`}
      style={prevTone ? { "--prev": GROUND[prevTone] } : undefined}
    >
      <Scenery seed={unit.phaseNumber} />

      <header className="cmap-banner">
        <div>
          <small>Chặng {unit.phaseNumber} · {doneCount}/{lessons.length} step</small>
          <h2 id={`cmap-${unit.id}`}>{unit.title.replace(/^CODE \d+ · /, "")}</h2>
        </div>
        <button type="button" className="cmap-info" onClick={() => setSheetOpen(true)} aria-label={`Chặng ${unit.phaseNumber} học gì`}>!</button>
        <span className="cmap-ring" style={{ "--p": `${percent * 3.6}deg` }} aria-label={`Hoàn thành ${percent}%`}>
          <b>{percent}%</b>
        </span>
      </header>

      <ol className="cmap-path">
        {lessons.map(({ course, globalIndex }, index) => {
          const done = completedSet.has(course.id);
          const current = globalIndex === currentIndex;
          const locked = !done && globalIndex > currentIndex;
          const last = index === lessons.length - 1;
          const Icon = done ? Check : locked ? Lock : last ? Flag : index === 1 ? Bug : look.icon;
          const offset = offsetOf(index, flip);
          const name = course.title.replace(/^\d+\.\s*/, "");
          return (
            <li
              key={course.id}
              ref={course.id === focusId ? focusRef : undefined}
              className={`cmap-node ${done ? "is-done" : current ? "is-current" : locked ? "is-locked" : "is-open"}`}
              style={{ "--x": `${offset}px` }}
            >
              {current && <span className="cmap-bubble">{course.draft ? "Sắp ra mắt" : "Bắt đầu"} · Step {globalIndex + 1}</span>}
              <button
                type="button"
                className="cmap-hex"
                onClick={() => !locked && onOpenLesson(course.id)}
                disabled={locked}
                aria-label={`Step ${globalIndex + 1}: ${name}${done ? " — đã xong" : locked ? " — chưa mở" : ""}`}
                title={name}
              >
                <span className="cmap-hex-face"><Icon aria-hidden="true" /></span>
              </button>
              {index === mascotAt && (look.Mascot ? (
                <span className="cmap-mascot" style={{ "--side": offset > 0 ? -1 : 1 }} aria-hidden="true">
                  <look.Mascot />
                </span>
              ) : (
                <img
                  className="cmap-mascot"
                  src={look.mascot}
                  alt=""
                  width="96"
                  height="110"
                  loading="lazy"
                  decoding="async"
                  style={{ "--side": offset > 0 ? -1 : 1 }}
                />
              ))}
            </li>
          );
        })}
      </ol>

      {sheetOpen && <StageSheet unit={unit} assessment={assessment} onClose={() => setSheetOpen(false)} />}
    </section>
  );
}

export default function CourseMap({ courses, stages, completedSet, currentIndex, focusId, onOpenLesson, examScores = {}, serverCompleted = [] }) {
  const focusRef = useRef(null);
  const units = useMemo(
    () => stages.map((stage) => ({
      stage,
      lessons: courses.slice(stage.from, stage.to).map((course, index) => ({ course, globalIndex: stage.from + index })),
    })),
    [courses, stages],
  );
  const allDone = courses.length > 0 && courses.every((course) => completedSet.has(course.id));

  // Mở bản đồ là thấy ngay step đang học, không phải cuộn đi tìm.
  useEffect(() => {
    const node = focusRef.current;
    if (!node) return undefined;
    const frame = requestAnimationFrame(() => node.scrollIntoView({ block: "center", behavior: "auto" }));
    return () => cancelAnimationFrame(frame);
  }, [focusId]);

  return (
    <div className="cmap">
      {units.map(({ stage, lessons }, index) => (
        <Unit
          key={stage.id}
          unit={stage}
          lessons={lessons}
          currentIndex={currentIndex}
          completedSet={completedSet}
          onOpenLesson={onOpenLesson}
          focusId={focusId}
          focusRef={focusRef}
          examScores={examScores}
          serverCompleted={serverCompleted}
          flip={index % 2 === 1}
          prevTone={units[index - 1]?.stage.tone}
        />
      ))}

      <footer className={`cmap-finish ${allDone ? "is-done" : ""}`}>
        <span className="cmap-trophy"><Trophy aria-hidden="true" /></span>
        <strong>{allDone ? "Dự án hoàn tất" : "Đích: dự án hoàn tất"}</strong>
        <small>Độc quyền bởi Hugo Studio</small>
      </footer>
    </div>
  );
}
