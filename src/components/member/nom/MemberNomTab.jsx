import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "../os/AppFrame";
import { knownChars, record, MASTER_AT, progress, resetAll } from "./nomProgress";
import { notify } from "../../../lib/notify";

/**
 * 𡨸喃 — ỨNG DỤNG DẠY CHỮ NÔM.
 *
 * ── HỌC LIỆU LÀ CHÍNH ỨNG DỤNG NÀY ──────────────────────────────────────────
 * Chữ đem dạy không phải một danh sách soạn sẵn để học thuộc, mà là ĐÚNG những
 * chữ đang hiện trên giao diện người học dùng mỗi ngày (data/nom-lessons.json,
 * sinh từ bản dịch Nôm của chính hệ thống). Học xong một bài là đọc được thêm
 * một phần ứng dụng của mình — và mỗi câu ví dụ là một câu có thật, không phải
 * câu mẫu dựng lên cho bài học.
 *
 * ── BA MÀN, KHÔNG HƠN ───────────────────────────────────────────────────────
 * Danh sách bài · học chữ · kiểm tra. Một ứng dụng dạy chữ mà có bảng xếp hạng,
 * chuỗi ngày, huy hiệu thì người ta học vì những thứ đó, không vì chữ.
 *
 * Bộ chữ tải theo yêu cầu: tệp học liệu nặng hơn hẳn phần còn lại của ứng dụng
 * và không ai cần nó cho tới khi thật sự mở bài học.
 */
export default function MemberNomTab({ onBack, route, onRouteChange }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [known, setKnown] = useState(() => knownChars());
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    let alive = true;
    import("../../../../data/nom-lessons.json")
      .then((mod) => { if (alive) setData(mod.default || mod); })
      .catch(() => notify.error(t("nom.loadFailed", "Chưa tải được học liệu chữ Nôm.")));
    return () => { alive = false; };
  }, [t]);

  const byChar = useMemo(() => {
    const map = new Map();
    for (const c of data?.chars || []) map.set(c.char, c);
    return map;
  }, [data]);

  const refresh = useCallback(() => setKnown(knownChars()), []);

  const startQuiz = useCallback((chars) => {
    // Câu hỏi: hiện CHỮ, chọn ÂM. Chiều ngược lại (hiện âm chọn chữ) không dùng
    // được ở đây vì một âm ứng nhiều chữ — sẽ có hơn một đáp án đúng.
    const pool = chars.map((ch) => byChar.get(ch)).filter(Boolean);
    if (pool.length < 2) return;
    const questions = pool.map((entry) => {
      const right = entry.readings[0];
      const wrong = [];
      // Mồi nhử lấy từ âm của chữ KHÁC trong cùng bộ: sai một cách hợp lý mới
      // buộc người học nhìn kỹ mặt chữ.
      for (const other of [...pool].sort(() => Math.random() - 0.5)) {
        if (wrong.length >= 3) break;
        const r = other.readings[0];
        if (r && r !== right && !wrong.includes(r)) wrong.push(r);
      }
      return { char: entry.char, right, options: [right, ...wrong].sort(() => Math.random() - 0.5) };
    }).sort(() => Math.random() - 0.5);
    setQuiz({ questions, index: 0, correct: 0, answered: null });
  }, [byChar]);

  const answer = useCallback((choice) => {
    setQuiz((current) => {
      if (!current || current.answered) return current;
      const q = current.questions[current.index];
      const ok = choice === q.right;
      record(q.char, ok);
      return { ...current, answered: choice, correct: current.correct + (ok ? 1 : 0) };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setQuiz((current) => {
      if (!current) return current;
      refresh();
      if (current.index + 1 >= current.questions.length) return { ...current, done: true };
      return { ...current, index: current.index + 1, answered: null };
    });
  }, [refresh]);

  const lessonStat = useCallback((item) => {
    const done = item.chars.filter((ch) => known.has(ch)).length;
    return { done, total: item.chars.length };
  }, [known]);

  const totalKnown = known.size;
  const totalChars = data?.chars?.length || 0;

  // ── Màn KIỂM TRA ──────────────────────────────────────────────────────────
  if (quiz) {
    const q = quiz.questions[quiz.index];
    return (
      <AppFrame appId="nom" onBack={() => { setQuiz(null); refresh(); }} title="𡨸喃">
        <div className="mx-auto max-w-[520px] px-4 pb-8">
          {quiz.done ? (
            <section className="mt-6 rounded-2xl bg-muted p-6 text-center">
              <p className="text-[15px] text-muted-foreground">{t("nom.quizDone", "Đã xong")}</p>
              <p className="mt-1 text-[34px] font-bold text-foreground">
                {quiz.correct}/{quiz.questions.length}
              </p>
              <button
                type="button"
                onClick={() => { setQuiz(null); refresh(); }}
                className="mt-5 h-12 w-full rounded-xl bg-foreground text-[16px] font-semibold text-background"
              >
                {t("nom.backToLessons", "Về danh sách bài")}
              </button>
            </section>
          ) : (
            <>
              <p className="mt-5 text-center text-[13px] text-muted-foreground">
                {quiz.index + 1} / {quiz.questions.length}
              </p>
              <p
                lang="nom"
                className="mt-4 text-center text-[92px] leading-none text-foreground"
                style={{ fontFamily: "'Nom Na Tong', serif" }}
              >
                {q.char}
              </p>
              <p className="mt-5 text-center text-[15px] text-muted-foreground">
                {t("nom.pickReading", "Chữ này đọc là gì?")}
              </p>
              <div className="mt-4 grid gap-2">
                {q.options.map((option) => {
                  const chosen = quiz.answered === option;
                  const isRight = option === q.right;
                  const reveal = Boolean(quiz.answered);
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={reveal}
                      onClick={() => answer(option)}
                      className={`h-12 rounded-xl text-[17px] font-medium transition-colors ${
                        reveal && isRight ? "bg-foreground text-background"
                          : chosen ? "bg-muted text-muted-foreground line-through"
                            : "bg-muted text-foreground"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {quiz.answered && (
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="mt-5 h-12 w-full rounded-xl bg-muted text-[16px] font-semibold text-foreground"
                >
                  {t("nom.next", "Tiếp")}
                </button>
              )}
            </>
          )}
        </div>
      </AppFrame>
    );
  }

  // ── Màn HỌC CHỮ ───────────────────────────────────────────────────────────
  if (lesson) {
    const entries = lesson.chars.map((ch) => byChar.get(ch)).filter(Boolean);
    return (
      <AppFrame appId="nom" onBack={() => setLesson(null)} title={t("nom.lessonN", { n: lesson.id })}>
        <div className="mx-auto max-w-[560px] px-4 pb-8">
          <div className="mt-4 grid gap-3">
            {entries.map((entry) => (
              <article key={entry.char} className="rounded-2xl bg-muted p-4">
                <div className="flex items-start gap-4">
                  <span
                    lang="nom"
                    className="shrink-0 text-[56px] leading-none text-foreground"
                    style={{ fontFamily: "'Nom Na Tong', serif" }}
                  >
                    {entry.char}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[19px] font-semibold text-foreground">
                      {entry.readings.slice(0, 3).join(" · ")}
                    </p>
                    {entry.words.length > 0 && (
                      <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                        {entry.words.slice(0, 3).map((w) => (
                          <span key={w.nom} className="mr-3 inline-block">
                            <span lang="nom" style={{ fontFamily: "'Nom Na Tong', serif" }}>{w.nom}</span>
                            {" "}{w.vi}
                          </span>
                        ))}
                      </p>
                    )}
                    {known.has(entry.char) && (
                      <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-foreground">
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">check_circle</span>
                        {t("nom.mastered", "Đã thuộc")}
                      </p>
                    )}
                  </div>
                </div>
                {entry.examples[0] && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p lang="nom" className="text-[17px] leading-relaxed text-foreground" style={{ fontFamily: "'Nom Na Tong', serif" }}>
                      {entry.examples[0][0]}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">{entry.examples[0][1]}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
          <button
            type="button"
            onClick={() => startQuiz(lesson.chars)}
            className="mt-5 h-12 w-full rounded-xl bg-foreground text-[16px] font-semibold text-background"
          >
            {t("nom.startQuiz", "Kiểm tra bài này")}
          </button>
        </div>
      </AppFrame>
    );
  }

  // ── Màn DANH SÁCH BÀI ─────────────────────────────────────────────────────
  return (
    <AppFrame appId="nom" onBack={onBack} route={route} onRouteChange={onRouteChange} largeTitle>
      <div className="mx-auto max-w-[560px] px-4 pb-8">
        <section className="mt-4 rounded-2xl bg-muted p-5">
          <p lang="nom" className="text-[40px] leading-none text-foreground" style={{ fontFamily: "'Nom Na Tong', serif" }}>
            𡨸喃
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {t("nom.intro", "Chữ Nôm là lối viết tiếng Việt bằng chữ vuông, dùng suốt gần một nghìn năm trước khi quốc ngữ thay thế. Những chữ dưới đây lấy từ chính giao diện Quý thành viên đang dùng.")}
          </p>
          {totalChars > 0 && (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-card">
                <div
                  className="h-full rounded-full bg-foreground transition-[width] duration-500"
                  style={{ width: `${Math.round((totalKnown / totalChars) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[13px] tabular-nums text-muted-foreground">
                {t("nom.knownOf", { known: totalKnown, total: totalChars })}
              </p>
            </>
          )}
        </section>

        {!data ? (
          <p className="mt-6 text-center text-[14px] text-muted-foreground">
            {t("nom.loading", "Đang tải học liệu…")}
          </p>
        ) : (
          <div className="mt-4 grid gap-2">
            {data.lessons.map((item) => {
              const { done, total } = lessonStat(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLesson(item)}
                  className="flex items-center gap-3 rounded-xl bg-muted p-3 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-[15px] font-bold tabular-nums text-foreground">
                    {item.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span lang="nom" className="block truncate text-[19px] text-foreground" style={{ fontFamily: "'Nom Na Tong', serif" }}>
                      {item.chars.join("")}
                    </span>
                    <span className="mt-0.5 block text-[12px] tabular-nums text-muted-foreground">
                      {done}/{total} {t("nom.mastered", "Đã thuộc").toLowerCase()}
                    </span>
                  </span>
                  <span className="material-symbols-outlined shrink-0 text-[20px] text-muted-foreground" aria-hidden="true">
                    chevron_right
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {totalKnown > 0 && (
          <button
            type="button"
            onClick={() => {
              notify.confirm({
                title: t("nom.resetTitle", "Xoá toàn bộ tiến độ?"),
                message: t("nom.resetBody", "Mọi chữ đã thuộc sẽ được tính lại từ đầu."),
                onConfirm: () => { resetAll(); refresh(); },
              });
            }}
            className="mx-auto mt-6 block h-11 px-4 text-[14px] text-muted-foreground"
          >
            {t("nom.reset", "Xoá tiến độ học")}
          </button>
        )}
      </div>
    </AppFrame>
  );
}
