import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { notify } from "../../../lib/notify";
import QuizQuestion from "./QuizQuestion";
import { isQuizAnswerCorrect } from "../../../../shared/quizKinds";

export default function InteractivePuzzles({
  course,
  completedLessons,
  interactivePassed,
  miniQuizAnswers,
  setMiniQuizAnswers,
  setMiniQuizPassed,
  handleRewardMobileLesson,
  htmlBlocks,
  sqlBlocks,
  moveBlock,
  themeBg,
  setThemeBg,
  themeText,
  setThemeText,
  clickCount,
  setClickCount,
  matchedPairs,
  handlePairMatch,
  blankAnswers,
  setBlankAnswers,
  screenshotFile,
  handleScreenshotSelect,
  isScanning,
  scanProgress,
  scanScore,
  quizQuestions,
  quizCompleted,
  quizScore,
  quizReview,
  quizCurrentIndex,
  setQuizCurrentIndex,
  quizAnswers,
  setQuizAnswers,
  handleRetakeQuiz,
  mobilePuzzleAnswer,
  setMobilePuzzleAnswer,
  verifyInteractivePractice,
  bio,
  onBioUpdate
}) {
  const { t } = useTranslation();
  const isCompleted = completedLessons.includes(course.id);
  const [miniQuizReviewed, setMiniQuizReviewed] = useState(false);

  useEffect(() => {
    setMiniQuizReviewed(false);
  }, [course.id]);

  if (course.practiceType === "graduation_submission") {
    return (
      <GraduationSubmissionForm
        bio={bio}
        onBioUpdate={onBioUpdate}
        handleRewardMobileLesson={handleRewardMobileLesson}
        course={course}
      />
    );
  }

  if (course.miniQuiz && interactivePassed && !isCompleted) {
    const handleSubmitMiniQuiz = () => {
      setMiniQuizReviewed(true);
      const allCorrect = course.miniQuiz.every((q, i) => isQuizAnswerCorrect(q, miniQuizAnswers[i]));
      if (allCorrect) {
        setMiniQuizPassed(true);
        handleRewardMobileLesson(course);
      } else {
        notify.error("Một số câu chưa đúng, hãy kiểm tra lại nhé!");
      }
    };

    return (
      <div className="space-y-6 font-sans">
        <div className="bg-success/10 border border-success/20 p-3 rounded-xl text-center">
          <p className="text-xs font-bold text-success">{t("hugoCoderLearning.puzzles.thucHanhHoanTat")} {course.miniQuiz.length} {t("hugoCoderLearning.puzzles.cauDuoiDayDe")}</p>
        </div>
        
        <div className="space-y-6">
          {course.miniQuiz.map((q, qIdx) => (
            <QuizQuestion
              key={qIdx}
              question={q}
              index={qIdx}
              value={miniQuizAnswers[qIdx]}
              onChange={(answer) => setMiniQuizAnswers((prev) => ({ ...prev, [qIdx]: answer }))}
              reviewed={miniQuizReviewed && !isQuizAnswerCorrect(q, miniQuizAnswers[qIdx])}
            />
          ))}
        </div>

        <button
          onClick={handleSubmitMiniQuiz}
          disabled={Object.keys(miniQuizAnswers).length < course.miniQuiz.length}
          className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none mt-4"
        >
          {t("hugoCoderLearning.puzzles.nopBaiKiemTra")}
        </button>
      </div>
    );
  }
  
  if (isCompleted) {
    return (
      <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center space-y-2 font-sans">
        <span className="material-symbols-outlined text-4xl text-success animate-bounce">verified</span>
        <p className="text-sm font-black text-success uppercase tracking-wider">{t("hugoCoderLearning.puzzles.baiHocDaHoan")}</p>
        <p className="text-xs text-muted-foreground">{t("hugoCoderLearning.puzzles.banDaVuotQua")}</p>
      </div>
    );
  }

  if (course.practiceType === "drag_drop_html" || course.practiceType === "drag_drop_sql") {
    const blocks = course.practiceType === "drag_drop_html" ? htmlBlocks : sqlBlocks;
    const type = course.practiceType === "drag_drop_html" ? "html" : "sql";
    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground">{t("hugoCoderLearning.puzzles.nhapVaoNutDi")}</p>
        <div className="space-y-2.5">
          {blocks.map((block, idx) => (
            <div key={block.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border border-border p-3 rounded-xl text-xs font-mono select-none">
              <span className="text-primary font-bold">{block.text}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => moveBlock(idx, "up", type)}
                  disabled={idx === 0}
                  className="w-8 h-8 bg-white dark:bg-zinc-900 hover:bg-muted border border-border rounded-lg flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none text-xs font-bold active:scale-90 transition-all shadow-sm"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveBlock(idx, "down", type)}
                  disabled={idx === blocks.length - 1}
                  className="w-8 h-8 bg-white dark:bg-zinc-900 hover:bg-muted border border-border rounded-lg flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none text-xs font-bold active:scale-90 transition-all shadow-sm"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={verifyInteractivePractice}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md mt-2"
        >
          {t("hugoCoderLearning.puzzles.kiemTraThuTu")}
        </button>
      </div>
    );
  }

  if (course.practiceType === "theme_match") {
    const bgColors = [
      { name: "Đỏ", hex: "#ff3b30" },
      { name: "Xanh Dương", hex: "#0056b3" },
      { name: "Xanh Lá", hex: "#34c759" }
    ];
    const textColors = [
      { name: "Trắng", hex: "#ffffff" },
      { name: "Đen", hex: "#000000" },
      { name: "Vàng", hex: "#facc15" }
    ];
    return (
      <div className="space-y-4 font-sans">
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-xs text-primary font-bold">{t("hugoCoderLearning.puzzles.yeuCauGiaoDien")}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{course.themePrompt}</p>
        </div>

        <div 
          className="border border-border p-5 rounded-xl text-center space-y-1 transition-all"
          style={{ backgroundColor: themeBg, color: themeText }}
        >
          <h4 className="text-sm font-black uppercase">{t("hugoCoderLearning.puzzles.cardSanPham")}</h4>
          <p className="text-[10px] opacity-75">{t("hugoCoderLearning.puzzles.viDuHienThi")}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1.5">{t("hugoCoderLearning.puzzles.mauNen")}</p>
            <div className="flex gap-2">
              {bgColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setThemeBg(color.hex)}
                  className={`flex-1 py-1.5 px-2 text-[10px] font-bold border rounded-lg transition-all active:scale-95 ${
                    themeBg === color.hex ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {Array.isArray(quizReview) && quizReview.length > 0 && (
            <div className="space-y-2 text-left">
              {quizReview.map((item) => (
                <div
                  key={item.questionIndex}
                  className={`rounded-lg border p-2.5 text-[11px] ${item.correct ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}
                >
                  <span className="font-black">Câu {item.questionIndex + 1}: </span>
                  <span>{item.correct ? "Đúng" : `Sai — đáp án đúng: ${item.correctText}`}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1.5">{t("hugoCoderLearning.puzzles.mauChu")}</p>
            <div className="flex gap-2">
              {textColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setThemeText(color.hex)}
                  className={`flex-1 py-1.5 px-2 text-[10px] font-bold border rounded-lg transition-all active:scale-95 ${
                    themeText === color.hex ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={verifyInteractivePractice}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md mt-2"
        >
          {t("hugoCoderLearning.puzzles.xacNhanMauSac")}
        </button>
      </div>
    );
  }

  if (course.practiceType === "js_button") {
    return (
      <div className="space-y-4 text-center font-sans">
        <p className="text-xs text-muted-foreground text-left">{t("hugoCoderLearning.puzzles.hayHoanThanhSu")}</p>
        
        <div className="py-6 bg-zinc-50 dark:bg-zinc-950 border border-border rounded-xl space-y-3">
          <button
            onClick={() => setClickCount(prev => Math.min(prev + 1, 3))}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-wider active:scale-90 transition-all shadow-md shadow-emerald-500/10"
          >
            {t("hugoCoderLearning.puzzles.nhapChuotClick")}
          </button>
          <p className="text-xs font-bold text-muted-foreground">{t("hugoCoderLearning.puzzles.boDemSoLan")} {clickCount} / 3</p>
        </div>

        <button
          onClick={verifyInteractivePractice}
          disabled={clickCount < 3}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
        >
          {clickCount >= 3 ? t("hugoCoderLearning.puzzles.nopBaiThucHanh") : t("hugoCoderLearning.puzzles.hayNhanDu3")}
        </button>
      </div>
    );
  }

  if (course.practiceType === "php_match") {
    const pairs = Array.isArray(course.matchPairs) ? course.matchPairs : [];
    const keys = pairs.map((pair) => pair.key);
    const values = pairs.map((pair) => pair.val);
    // Lấy trực tiếp từ dữ liệu bài học để UI và bộ chấm không thể lệch nhau.
    // Xoay một vị trí giữ thứ tự ổn định qua mỗi render nhưng không đặt đáp án
    // ngay cùng hàng với từ khóa tương ứng.
    const scrambledVals = values.length > 1
      ? [...values.slice(1), values[0]]
      : values;
    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground">{t("hugoCoderLearning.puzzles.bamChon1Tu")}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground">{t("hugoCoderLearning.puzzles.tuKhoa")}</p>
            {keys.map((k) => {
              const isMatched = matchedPairs[k] !== undefined;
              const isActive = matchedPairs.activeLeft === k;
              return (
                <button
                  key={k}
                  onClick={() => !isMatched && handlePairMatch("left", k)}
                  disabled={isMatched}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all active:scale-95 ${
                    isMatched
                      ? "bg-success/15 border-success/30 text-success line-through"
                      : isActive
                        ? "bg-primary border-primary text-white"
                        : "bg-background border-border text-foreground"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground">{t("hugoCoderLearning.puzzles.dinhNghia")}</p>
            {scrambledVals.map((v) => {
              const isMatched = Object.values(matchedPairs).includes(v);
              return (
                <button
                  key={v}
                  onClick={() => !isMatched && handlePairMatch("right", v)}
                  disabled={isMatched || !matchedPairs.activeLeft}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all active:scale-95 ${
                    isMatched
                      ? "bg-success/15 border-success/30 text-success"
                      : "bg-background border-border text-foreground hover:bg-muted/50 disabled:opacity-50"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={verifyInteractivePractice}
          disabled={Object.keys(matchedPairs).filter(k => k !== "activeLeft").length < pairs.length}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none mt-2"
        >
          {t("hugoCoderLearning.puzzles.hoanThanhNoiCap")}
        </button>
      </div>
    );
  }

  if (course.practiceType === "fill_blank") {
    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground">{t("hugoCoderLearning.puzzles.dienDoanCodePhp")}</p>
        
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-xs space-y-4 leading-6">
          <div>{`<h1><?php`}</div>
          <div className="flex items-center flex-wrap gap-2 pl-4">
            <input
              type="text"
              placeholder="[blank1]"
              value={blankAnswers.blank1}
              onChange={(e) => setBlankAnswers(prev => ({ ...prev, blank1: e.target.value }))}
              className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-center text-primary font-bold outline-none focus:border-primary"
            />
            <span>{t("hugoCoderLearning.puzzles.xinChao")}</span>
            <input
              type="text"
              placeholder="[blank2]"
              value={blankAnswers.blank2}
              onChange={(e) => setBlankAnswers(prev => ({ ...prev, blank2: e.target.value }))}
              className="w-12 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-center text-primary font-bold outline-none focus:border-primary"
            />
            <span>$name; ?&gt; &lt;/h1&gt;</span>
          </div>
        </div>

        <button
          onClick={verifyInteractivePractice}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
        >
          {t("hugoCoderLearning.puzzles.nopKetQuaDien")}
        </button>
      </div>
    );
  }

  if (course.practiceType === "screenshot_upload") {
    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("hugoCoderLearning.puzzles.vietCodeTrenIde")}
        </p>

        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-zinc-50 dark:bg-zinc-950/20 relative overflow-hidden flex flex-col items-center justify-center min-h-36">
          {screenshotFile ? (
            <div className="space-y-3 w-full">
              <img src={screenshotFile} alt="Preview" className="max-h-32 object-contain mx-auto rounded border border-border shadow-sm" />
              {!isScanning && (
                <p className="text-[10px] font-bold text-success">{t("hugoCoderLearning.puzzles.daTaiAnhLen")}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <span className="material-symbols-outlined text-4xl text-muted-foreground animate-pulse">add_photo_alternate</span>
              <p className="text-xs font-bold text-muted-foreground">{t("hugoCoderLearning.puzzles.chonHoacKeoAnh")}</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center p-4 space-y-2.5 z-10">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-muted border-t-primary animate-spin" />
                <span className="text-[9px] font-black">{scanProgress}%</span>
              </div>
              <div>
                <p className="text-xs font-black animate-pulse">{t("hugoCoderLearning.puzzles.dangKiemTraAnh")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("hugoCoderLearning.puzzles.kiemTraDinhDang")}</p>
              </div>
            </div>
          )}
        </div>

        {screenshotFile && !isScanning && scanScore > 0 && (
          <div className="bg-success/10 border border-success/20 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-success uppercase">{t("hugoCoderLearning.puzzles.tuKiemTraAnh")}</span>
              <span className="text-sm font-black text-success">{scanScore}/100</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground leading-relaxed">
              {t("hugoCoderLearning.puzzles.diemNayChiPhan")}
            </p>
          </div>
        )}

        <button
          onClick={verifyInteractivePractice}
          disabled={!screenshotFile || isScanning}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none mt-2"
        >
          {screenshotFile && !isScanning ? t("hugoCoderLearning.puzzles.nopAnhDaKiem") : t("hugoCoderLearning.puzzles.vuiLongChonAnh")}
        </button>
      </div>
    );
  }

  if (course.practiceType === "quiz") {
    if (quizQuestions.length === 0) {
      return <div className="text-xs text-muted-foreground text-center py-5 font-sans">{t("hugoCoderLearning.puzzles.dangNapBoCau")}</div>;
    }

    if (quizCompleted) {
      const passed = quizScore >= 60;
      return (
        <div className="space-y-4 text-center font-sans">
          <span className={`material-symbols-outlined text-5xl ${passed ? "text-success animate-bounce" : "text-destructive"}`}>
            {passed ? "emoji_events" : "gpp_bad"}
          </span>
          <div>
            <h4 className="text-sm font-black uppercase">{t("hugoCoderLearning.puzzles.ketQuaKiemTra")} {quizScore}%</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {passed 
                ? t("hugoCoderLearning.puzzles.tuyetVoiBanDa") 
                : t("hugoCoderLearning.puzzles.ratTiecDiemSo")}
            </p>
          </div>
          
          {passed ? (
            <button
              onClick={verifyInteractivePractice}
              className="w-full py-2.5 bg-success text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
            >
              {t("hugoCoderLearning.puzzles.nhanThuongJoyHoan")}
            </button>
          ) : (
            <button
              onClick={handleRetakeQuiz}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
            >
              {t("hugoCoderLearning.puzzles.doiDeThiKhac")}
            </button>
          )}
        </div>
      );
    }

    const currentQ = quizQuestions[quizCurrentIndex];
    const isLast = quizCurrentIndex === quizQuestions.length - 1;

    return (
      <div className="space-y-4 font-sans">
        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-black uppercase">
          <span>{t("hugoCoderLearning.puzzles.cauHoi")} {quizCurrentIndex + 1} / {quizQuestions.length}</span>
          <span>{t("hugoCoderLearning.puzzles.daChon")} {Object.keys(quizAnswers).length} {t("hugoCoderLearning.puzzles.cau")}</span>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-border rounded-xl">
          <p className="text-xs font-bold text-foreground leading-relaxed">{currentQ.q}</p>
        </div>

        <div className="space-y-2">
          {currentQ.o.map((opt, oIdx) => {
            const isSelected = quizAnswers[quizCurrentIndex] === oIdx;
            return (
              <button
                key={opt}
                onClick={() => setQuizAnswers(prev => ({ ...prev, [quizCurrentIndex]: oIdx }))}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-primary border-primary text-white shadow-sm"
                    : "bg-background border-border text-foreground hover:bg-muted/50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2.5 mt-2">
          <button
            onClick={() => setQuizCurrentIndex(prev => Math.max(prev - 1, 0))}
            disabled={quizCurrentIndex === 0}
            className="flex-1 py-2 bg-background hover:bg-muted border border-border text-muted-foreground rounded-xl text-xs font-black uppercase active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            {t("hugoCoderLearning.puzzles.cauTruoc")}
          </button>
          
          {isLast ? (
            <button
              onClick={verifyInteractivePractice}
              disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
            >
              {t("hugoCoderLearning.puzzles.nopBaiThi")}
            </button>
          ) : (
            <button
              onClick={() => setQuizCurrentIndex(prev => Math.min(prev + 1, quizQuestions.length - 1))}
              className="flex-1 py-2 bg-background hover:bg-muted border border-border text-foreground rounded-xl text-xs font-black uppercase active:scale-95 transition-all"
            >
              {t("hugoCoderLearning.puzzles.cauTiep")}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (course.practiceType === "code_challenge" || course.practiceType === "capstone") {
    // Câu đố thực hành gắn liền từng bài học (khai báo trong lessons/*.js)
    const puzzle = course.mobilePuzzle || {
      prompt: "Hoàn thành yêu cầu thực hành của bài học trong trình soạn thảo:",
      snippet: "// Sửa mã nguồn theo phần Thực hành & Code mẫu",
      options: [
        { text: "Tôi đã hoàn thành yêu cầu thực hành", correct: true },
        { text: "Bỏ qua bài này", correct: false }
      ],
      correctIdx: 0
    };

    const handleVerifyPuzzle = () => {
      if (mobilePuzzleAnswer === puzzle.correctIdx) {
        notify.success("Chính xác! Lựa chọn của bạn đã vá lỗi thành công.");
        verifyInteractivePractice();
      } else {
        notify.error("Lựa chọn chưa chính xác, hãy suy nghĩ lại nhé!");
      }
    };

    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground">{puzzle.prompt}</p>
        
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-xs text-center space-y-2 select-none">
          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">{t("hugoCoderLearning.puzzles.khungMaNguon")}</span>
          <span className="text-amber-400 font-bold block">{puzzle.snippet}</span>
        </div>

        <div className="space-y-2">
          {puzzle.options.map((opt, idx) => {
            const isSelected = mobilePuzzleAnswer === idx;
            return (
              <button
                key={idx}
                onClick={() => setMobilePuzzleAnswer(idx)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-primary border-primary text-white shadow-sm font-bold"
                    : "bg-background border-border text-foreground hover:bg-muted/50"
                }`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleVerifyPuzzle}
          disabled={mobilePuzzleAnswer === null}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none mt-2"
        >
          {t("hugoCoderLearning.puzzles.xacNhanDapAn")}
        </button>
      </div>
    );
  }

  return null;
}

function GraduationSubmissionForm({ bio, onBioUpdate, handleRewardMobileLesson, course }) {
  const { t } = useTranslation();
  const [projectUrl, setProjectUrl] = React.useState(bio?.hugoCoderProjectUrl || "");
  const [projectNote, setProjectNote] = React.useState(bio?.hugoCoderProjectNote || "");
  const [submitting, setSubmitting] = React.useState(false);

  const status = bio?.hugoCoderProjectStatus || "idle";
  const certUrl = bio?.hugoCoderCertificateUrl || "";
  const adminNote = bio?.hugoCoderProjectAdminNote || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectUrl.trim()) {
      notify.error("Vui lòng nhập Link dự án Live URL!");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiBase}/joy/submit-graduation-project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ projectUrl, projectNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Giao dịch nộp dự án thất bại.");
      
      notify.success("Đã nộp đồ án kết khóa thành công! Đang chờ kiểm duyệt.");
      if (onBioUpdate) {
        onBioUpdate(data.bio);
      }
      
      // Mark lesson 100 completed as well to grant completed status
      await handleRewardMobileLesson(course, 100);
    } catch (err) {
      notify.error(err.message || "Lỗi khi nộp bài.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-sans bg-zinc-900/50 p-4 border border-border/60 rounded-2xl">
      <div className="text-center space-y-1">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
        <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-wider">{t("hugoCoderLearning.puzzles.doAnKetKhoa")}</h3>
        <p className="text-[10px] text-zinc-400">
          {t("hugoCoderLearning.puzzles.nopSanPhamHoan")}
        </p>
      </div>

      {status === "approved" && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
          <p className="text-xs font-bold text-emerald-500">{t("hugoCoderLearning.puzzles.chucMungBanDa")}</p>
          {certUrl ? (
            <a
              href={certUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-gradient-to-br from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-zinc-950 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-md"
            >
              {t("hugoCoderLearning.puzzles.xemChungNhanHoan")}
            </a>
          ) : (
            <p className="text-[9px] text-zinc-400">{t("hugoCoderLearning.puzzles.dangChoAdminDinh")}</p>
          )}
        </div>
      )}

      {status !== "approved" && (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {status === "pending" && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-xs font-bold text-amber-500">{t("hugoCoderLearning.puzzles.duAnDangCho")}</p>
              <p className="text-[9px] text-zinc-400 mt-1">{t("hugoCoderLearning.puzzles.hugoStudioDangXem")}</p>
            </div>
          )}
          
          {status === "rejected" && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left space-y-1">
              <p className="text-xs font-bold text-red-500">{t("hugoCoderLearning.puzzles.duAnChuaDat")}</p>
              {adminNote && <p className="text-[9px] text-zinc-300">{t("hugoCoderLearning.puzzles.phanHoiCuaAdmin")} {adminNote}</p>}
              <p className="text-[9px] text-zinc-400">{t("hugoCoderLearning.puzzles.banCoTheDieu")}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">Live URL / Repository *</label>
            <input
              type="url"
              required
              disabled={status === "pending"}
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder={t("hugoCoderLearning.puzzles.httpsMyprojectComHoac")}
              className="w-full bg-zinc-950 border border-border p-2.5 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">{t("hugoCoderLearning.puzzles.ghiChuChoAdmin")}</label>
            <textarea
              rows={3}
              disabled={status === "pending"}
              value={projectNote}
              onChange={(e) => setProjectNote(e.target.value)}
              placeholder={t("hugoCoderLearning.puzzles.nhapGhiChuTai")}
              className="w-full bg-zinc-950 border border-border p-2.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || status === "pending"}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-zinc-950 font-black rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
          >
            {submitting ? t("hugoCoderLearning.puzzles.dangGui") : t("hugoCoderLearning.puzzles.guiDeAnTot")}
          </button>
        </form>
      )}
    </div>
  );
}
