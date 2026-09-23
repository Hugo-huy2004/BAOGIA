import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { renderQuestion, surveyUi, SURVEY_ANSWERS } from "../../../shared/surveyQuestions";
import { fetchDueSurvey, submitSurvey } from "../../services/api/modules/surveyApi";

/**
 * Khảo sát định kỳ — một câu mỗi màn, ba nút Có / Không / Không chắc.
 *
 * ── VÌ SAO MỘT CÂU MỘT MÀN ──────────────────────────────────────────────────
 * Ba câu xếp chồng thành một biểu mẫu thì người ta nhìn thấy "một cái form" và
 * bấm cho xong. Một câu chiếm trọn màn, chạm một nút là sang câu kế — đó là
 * nhịp của một cuộc hỏi chuyện, và mỗi câu trả lời được đọc thật.
 *
 * ── VÌ SAO KHÔNG CÓ NÚT "QUAY LẠI" ──────────────────────────────────────────
 * Sửa lại câu đã trả lời nghe như một tiện ích, nhưng nó mời người ta cân nhắc
 * xem câu trả lời "nên" là gì. Ấn tượng đầu tiên chính là thứ cần đo.
 *
 * Không ép: "Để sau" luôn hiện, và đóng đi thì tháng này thôi không hỏi nữa.
 */

const DISMISS_KEY = "hugo_survey_dismissed";

const dismissedMonth = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) || "";
  } catch {
    return "";
  }
};

const dismiss = (month) => {
  try {
    localStorage.setItem(DISMISS_KEY, month);
  } catch {
    /* chế độ riêng tư: không nhớ được thì tháng sau hỏi lại, không sao */
  }
};

export default function SurveySheet() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || "vi").slice(0, 2);
  const ui = surveyUi(language);

  const [survey, setSurvey] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    // Đợi portal vẽ xong rồi mới hỏi: bật lên ngay lúc vừa đăng nhập thì tấm
    // khảo sát là thứ đầu tiên người ta thấy, và câu trả lời sẽ về việc họ đang
    // bực vì bị chặn đường.
    const timer = setTimeout(async () => {
      const due = await fetchDueSurvey();
      if (!alive || !due || dismissedMonth() === due.month) return;
      setSurvey(due);
      setOpen(true);
    }, 4000);
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    if (survey) dismiss(survey.month);
  }, [survey]);

  const answer = useCallback((value) => {
    const question = survey.questions[index];
    const next = [...answers, { questionId: question.id, answer: value }];
    setAnswers(next);

    if (index + 1 < survey.questions.length) {
      setIndex(index + 1);
      return;
    }
    // Gửi rồi mới báo cảm ơn — nhưng không chờ mạng: câu trả lời đã nằm trong
    // tay, và bắt người ta nhìn vòng xoay để nói lời cảm ơn là vô nghĩa.
    submitSurvey(survey.month, next);
    dismiss(survey.month);
    setDone(true);
  }, [answers, index, survey]);

  if (!survey) return null;

  // Tên ứng dụng lấy từ đúng nguồn mà Trang chủ và Cửa hàng đang dùng, nên câu
  // hỏi gọi app bằng cái tên người dùng nhìn thấy hằng ngày.
  const current = survey.questions[index];
  const appName = current?.appId ? t(`utilities.catalog.${current.appId}.title`, current.appId) : "";
  const question = done ? null : renderQuestion(current.id, language, appName);

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label={ui.skip}
        onClick={close}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ui.title}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-[520px] flex-col rounded-t-[20px] bg-card px-5 pt-5 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-muted" />

        {done ? (
          <div className="pb-4 text-center">
            <span className="material-symbols-rounded mb-2 block text-[32px] text-foreground">
              check_circle
            </span>
            <h2 className="text-[19px] font-semibold text-foreground">{ui.thanks}</h2>
            <p className="mt-1 text-[15px] text-muted-foreground">{ui.thanksBody}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 h-11 w-full rounded-xl bg-muted text-[16px] font-medium text-foreground"
            >
              {ui.skip}
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
              {ui.progress
                .replace("{{current}}", String(index + 1))
                .replace("{{total}}", String(survey.questions.length))}
            </p>
            <h2 className="mt-2 text-[20px] font-semibold leading-snug text-foreground">
              {question?.text}
            </h2>
            {index === 0 && (
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{ui.intro}</p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              {SURVEY_ANSWERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => answer(key)}
                  className="h-12 w-full rounded-xl bg-muted text-[16px] font-medium text-foreground transition-transform active:scale-[0.98]"
                >
                  {question?.labels?.[key]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={close}
              className="mx-auto mt-3 h-11 px-4 text-[15px] text-muted-foreground"
            >
              {ui.skip}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
