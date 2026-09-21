import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "../os/AppFrame";
import { passedLessons, recordExam, resetAll, PASS_MARK } from "./nomProgress";
import { notify } from "../../../lib/notify";

/**
 * 𡨸喃 — DẠY CHỮ NÔM THEO LỐI GHÉP CHỮ.
 *
 * ── VÌ SAO KHÔNG DẠY THUỘC MẶT CHỮ ──────────────────────────────────────────
 * Học thuộc từng chữ thì học bao nhiêu đọc được bấy nhiêu; gặp chữ lạ là chịu.
 * Nhưng phần lớn chữ Nôm là chữ HÌNH-THANH: một nửa báo NGHĨA (bộ thủ), một
 * nửa báo ÂM. Nắm được luật ấy thì gặp 𢷮 (⿰扌對) đoán ra ngay — bộ 扌 nói đây
 * là việc làm bằng tay, 對 (đối) nói âm gần "đối", ra "đổi".
 *
 * Nên mỗi bài dạy MỘT BỘ THỦ, và bài thi cho chữ CHƯA TỪNG DẠY mang bộ ấy.
 * Trả lời đúng một chữ chưa thấy bao giờ chỉ có thể nhờ hiểu quy luật — đó
 * mới là thứ đáng đo, và là thứ mang người học đi xa khỏi ứng dụng này.
 *
 * Học liệu lấy từ chính giao diện họ đang dùng, nên mỗi câu ví dụ là câu có
 * thật, không phải câu mẫu dựng riêng cho bài học.
 */

const NOM_FONT = { fontFamily: "'Nom Na Tong', serif" };

export default function MemberNomTab({ onBack, route, onRouteChange }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [passed, setPassed] = useState(() => passedLessons());
  const [lesson, setLesson] = useState(null);
  const [exam, setExam] = useState(null);

  useEffect(() => {
    let alive = true;
    // Tải theo yêu cầu: tệp học liệu nặng hơn phần còn lại của ứng dụng và
    // không ai cần nó cho tới khi thật sự mở bài học.
    import("../../../../data/nom-lessons.json")
      .then((mod) => { if (alive) setData(mod.default || mod); })
      .catch(() => notify.error(t("nom.loadFailed")));
    return () => { alive = false; };
  }, [t]);

  const refresh = useCallback(() => setPassed(passedLessons()), []);

  const startExam = useCallback((item) => {
    const pool = item.quiz.filter((c) => c.readings?.length);
    if (pool.length < 3) return;
    // Mồi nhử lấy từ âm của chữ KHÁC trong cùng bài: sai một cách hợp lý mới
    // buộc người học soi phần biểu âm, thay vì loại trừ bằng cảm tính.
    const allReadings = [...item.teach, ...item.quiz].map((c) => c.readings[0]).filter(Boolean);
    const questions = pool.map((entry) => {
      const right = entry.readings[0];
      const wrong = [...new Set(allReadings)].filter((r) => r !== right)
        .sort(() => Math.random() - 0.5).slice(0, 3);
      return { ...entry, right, options: [right, ...wrong].sort(() => Math.random() - 0.5) };
    }).sort(() => Math.random() - 0.5);
    setExam({ lesson: item, questions, index: 0, correct: 0, answered: null });
  }, []);

  const answer = useCallback((choice) => {
    setExam((current) => {
      if (!current || current.answered) return current;
      const q = current.questions[current.index];
      return { ...current, answered: choice, correct: current.correct + (choice === q.right ? 1 : 0) };
    });
  }, []);

  const next = useCallback(() => {
    setExam((current) => {
      if (!current) return current;
      if (current.index + 1 >= current.questions.length) {
        recordExam(current.lesson.id, current.correct, current.questions.length);
        refresh();
        return { ...current, done: true };
      }
      return { ...current, index: current.index + 1, answered: null };
    });
  }, [refresh]);

  const total = data?.lessons?.length || 0;
  const done = useMemo(
    () => (data?.lessons || []).filter((l) => passed.has(String(l.id))).length,
    [data, passed],
  );

  /** Một chữ, bày rõ CÁCH GHÉP: bộ thủ + phần âm. */
  const CharCard = ({ entry, reveal = true }) => (
    <article className="rounded-2xl bg-muted p-4">
      <div className="flex items-start gap-4">
        <span lang="nom" style={NOM_FONT} className="shrink-0 text-[56px] leading-none text-foreground">
          {entry.char}
        </span>
        <div className="min-w-0 flex-1">
          {reveal && (
            <p className="text-[19px] font-semibold text-foreground">{entry.readings.join(" · ")}</p>
          )}
          {/* Phép cộng làm nên chữ — trái tim của cả bài học. */}
          {entry.radical && entry.phonetic && (
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] text-muted-foreground">
              <span lang="nom" style={NOM_FONT} className="text-[19px] text-foreground">{entry.radical}</span>
              <span>{t("nom.plus")}</span>
              <span lang="nom" style={NOM_FONT} className="text-[19px] text-foreground">{entry.phonetic}</span>
              {entry.phoneticReadings?.length > 0 && (
                <span>{t("nom.soundsLike", { sound: entry.phoneticReadings.join("/") })}</span>
              )}
            </p>
          )}
          {reveal && entry.words?.length > 0 && (
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
              {entry.words.slice(0, 3).map((w) => (
                <span key={w.nom} className="mr-3 inline-block">
                  <span lang="nom" style={NOM_FONT}>{w.nom}</span> {w.vi}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
      {reveal && entry.example && (
        <div className="mt-3 border-t border-border pt-3">
          <p lang="nom" style={NOM_FONT} className="text-[17px] leading-relaxed text-foreground">{entry.example[0]}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{entry.example[1]}</p>
        </div>
      )}
    </article>
  );

  // ── Màn THI ───────────────────────────────────────────────────────────────
  if (exam) {
    const q = exam.questions[exam.index];
    const score = exam.correct / exam.questions.length;
    const ok = score >= PASS_MARK;
    return (
      <AppFrame appId="nom" onBack={() => { setExam(null); refresh(); }} title={`${t("nom.examOf")} ${exam.lesson.radical}`}>
        <div className="mx-auto max-w-[520px] px-4 pb-8">
          {exam.done ? (
            <section className="mt-6 rounded-2xl bg-muted p-6 text-center">
              <span className="material-symbols-outlined text-[34px] text-foreground" aria-hidden="true">
                {ok ? "workspace_premium" : "replay"}
              </span>
              <p className="mt-2 text-[34px] font-bold tabular-nums text-foreground">
                {exam.correct}/{exam.questions.length}
              </p>
              <p className="mt-1 text-[15px] font-medium text-foreground">
                {ok ? t("nom.passed") : t("nom.failed", { mark: Math.round(PASS_MARK * 100) })}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {t("nom.examNote")}
              </p>
              <div className="mt-5 grid gap-2">
                <button type="button" onClick={() => startExam(exam.lesson)}
                  className="h-12 rounded-xl bg-muted text-[16px] font-semibold text-foreground">
                  {t("nom.retry")}
                </button>
                <button type="button" onClick={() => { setExam(null); setLesson(null); refresh(); }}
                  className="h-12 rounded-xl bg-foreground text-[16px] font-semibold text-background">
                  {t("nom.backToLessons")}
                </button>
              </div>
            </section>
          ) : (
            <>
              <p className="mt-5 text-center text-[13px] tabular-nums text-muted-foreground">
                {exam.index + 1} / {exam.questions.length}
              </p>
              <p className="mt-1 text-center text-[13px] text-muted-foreground">{t("nom.unseenChar")}</p>
              <p lang="nom" style={NOM_FONT} className="mt-4 text-center text-[96px] leading-none text-foreground">
                {q.char}
              </p>
              {/* Gợi ý cấu tạo hiện NGAY TỪ ĐẦU: bài thi này đo việc dùng quy
                  luật, không đo trí nhớ — giấu phép ghép đi là đổi sang đo thứ
                  khác hẳn. */}
              {q.radical && q.phonetic && (
                <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[14px] text-muted-foreground">
                  <span lang="nom" style={NOM_FONT} className="text-[20px] text-foreground">{q.radical}</span>
                  <span>{t("nom.plus")}</span>
                  <span lang="nom" style={NOM_FONT} className="text-[20px] text-foreground">{q.phonetic}</span>
                  {q.phoneticReadings?.length > 0 && (
                    <span>{t("nom.soundsLike", { sound: q.phoneticReadings.join("/") })}</span>
                  )}
                </p>
              )}
              <div className="mt-5 grid gap-2">
                {q.options.map((option) => {
                  const reveal = Boolean(exam.answered);
                  const isRight = option === q.right;
                  const chosen = exam.answered === option;
                  return (
                    <button key={option} type="button" disabled={reveal} onClick={() => answer(option)}
                      className={`h-12 rounded-xl text-[17px] font-medium transition-colors ${
                        reveal && isRight ? "bg-foreground text-background"
                          : chosen ? "bg-muted text-muted-foreground line-through"
                            : "bg-muted text-foreground"}`}>
                      {option}
                    </button>
                  );
                })}
              </div>
              {exam.answered && (
                <button type="button" onClick={next}
                  className="mt-5 h-12 w-full rounded-xl bg-muted text-[16px] font-semibold text-foreground">
                  {t("nom.next")}
                </button>
              )}
            </>
          )}
        </div>
      </AppFrame>
    );
  }

  // ── Màn HỌC MỘT BỘ THỦ ────────────────────────────────────────────────────
  if (lesson) {
    return (
      <AppFrame appId="nom" onBack={() => setLesson(null)} title={t("nom.lessonN", { n: lesson.id })}>
        <div className="mx-auto max-w-[560px] px-4 pb-8">
          <section className="mt-4 rounded-2xl bg-muted p-5 text-center">
            <p lang="nom" style={NOM_FONT} className="text-[68px] leading-none text-foreground">{lesson.radical}</p>
            <p className="mt-2 text-[19px] font-semibold text-foreground">
              {t("nom.radicalIs", { name: lesson.name, meaning: lesson.meaning })}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{lesson.hint}</p>
          </section>

          <p className="mt-5 px-1 text-[13px] leading-relaxed text-muted-foreground">{t("nom.howItWorks")}</p>

          <div className="mt-3 grid gap-3">
            {lesson.teach.map((entry) => <CharCard key={entry.char} entry={entry} />)}
          </div>

          <button type="button" onClick={() => startExam(lesson)}
            className="mt-5 h-12 w-full rounded-xl bg-foreground text-[16px] font-semibold text-background">
            {t("nom.startExam", { count: lesson.quiz.length })}
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
          <p lang="nom" style={NOM_FONT} className="text-[40px] leading-none text-foreground">𡨸喃</p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t("nom.intro")}</p>
          {total > 0 && (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-card">
                <div className="h-full rounded-full bg-foreground transition-[width] duration-500"
                  style={{ width: `${Math.round((done / total) * 100)}%` }} />
              </div>
              <p className="mt-1.5 text-[13px] tabular-nums text-muted-foreground">
                {t("nom.passedOf", { done, total })}
              </p>
            </>
          )}
        </section>

        {!data ? (
          <p className="mt-6 text-center text-[14px] text-muted-foreground">{t("nom.loading")}</p>
        ) : (
          <div className="mt-4 grid gap-2">
            {data.lessons.map((item) => (
              <button key={item.id} type="button" onClick={() => setLesson(item)}
                className="flex items-center gap-3 rounded-xl bg-muted p-3 text-left">
                <span lang="nom" style={NOM_FONT}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card text-[26px] text-foreground">
                  {item.radical}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold text-foreground">
                    {t("nom.radicalIs", { name: item.name, meaning: item.meaning })}
                  </span>
                  <span className="mt-0.5 block text-[12px] tabular-nums text-muted-foreground">
                    {t("nom.lessonMeta", { teach: item.teach.length, quiz: item.quiz.length })}
                  </span>
                </span>
                {passed.has(String(item.id)) ? (
                  <span className="material-symbols-outlined shrink-0 text-[20px] text-foreground" aria-hidden="true">
                    workspace_premium
                  </span>
                ) : (
                  <span className="material-symbols-outlined shrink-0 text-[20px] text-muted-foreground" aria-hidden="true">
                    chevron_right
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {done > 0 && (
          <button type="button"
            onClick={() => notify.confirm({
              title: t("nom.resetTitle"),
              message: t("nom.resetBody"),
              onConfirm: () => { resetAll(); refresh(); },
            })}
            className="mx-auto mt-6 block h-11 px-4 text-[14px] text-muted-foreground">
            {t("nom.reset")}
          </button>
        )}
      </div>
    </AppFrame>
  );
}
