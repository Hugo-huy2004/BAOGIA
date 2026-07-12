import React from "react";
import { CheckCircle, Award, Sparkles } from "lucide-react";
import { notify } from "../../../lib/notify";

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
  const isCompleted = completedLessons.includes(course.id);

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
      const allCorrect = course.miniQuiz.every((q, i) => miniQuizAnswers[i] === q.a);
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
          <p className="text-xs font-bold text-success">Thực hành hoàn tất! Trả lời đúng {course.miniQuiz.length} câu dưới đây để qua bài.</p>
        </div>
        
        <div className="space-y-6">
          {course.miniQuiz.map((q, qIdx) => (
            <div key={qIdx} className="space-y-3">
              <p className="text-xs font-black text-foreground leading-relaxed">
                <span className="text-primary mr-1">{qIdx + 1}.</span> {q.q}
              </p>
              <div className="space-y-2 pl-2">
                {q.o.map((opt, oIdx) => {
                  const isSelected = miniQuizAnswers[qIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => setMiniQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all active:scale-[0.98] ${
                        isSelected
                          ? "bg-primary border-primary text-white shadow-sm font-bold"
                          : "bg-background border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmitMiniQuiz}
          disabled={Object.keys(miniQuizAnswers).length < course.miniQuiz.length}
          className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none mt-4"
        >
          Nộp bài kiểm tra
        </button>
      </div>
    );
  }
  
  if (isCompleted) {
    return (
      <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center space-y-2 font-sans">
        <span className="material-symbols-outlined text-4xl text-success animate-bounce">verified</span>
        <p className="text-sm font-black text-success uppercase tracking-wider">Bài học đã hoàn thành!</p>
        <p className="text-xs text-muted-foreground">Bạn đã vượt qua các thử thách của bài học này và nhận phần thưởng JOY.</p>
      </div>
    );
  }

  if (course.practiceType === "drag_drop_html" || course.practiceType === "drag_drop_sql") {
    const blocks = course.practiceType === "drag_drop_html" ? htmlBlocks : sqlBlocks;
    const type = course.practiceType === "drag_drop_html" ? "html" : "sql";
    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground">Nhấp vào nút di chuyển để sắp xếp các khối lệnh sau theo đúng thứ tự logic:</p>
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
          Kiểm tra thứ tự
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
          <p className="text-xs text-primary font-bold">Yêu cầu giao diện:</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{course.themePrompt}</p>
        </div>

        <div 
          className="border border-border p-5 rounded-xl text-center space-y-1 transition-all"
          style={{ backgroundColor: themeBg, color: themeText }}
        >
          <h4 className="text-sm font-black uppercase">Card Sản Phẩm</h4>
          <p className="text-[10px] opacity-75">Ví dụ hiển thị trực quan</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1.5">Màu nền:</p>
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

          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1.5">Màu chữ:</p>
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
          Xác nhận màu sắc
        </button>
      </div>
    );
  }

  if (course.practiceType === "js_button") {
    return (
      <div className="space-y-4 text-center font-sans">
        <p className="text-xs text-muted-foreground text-left">Hãy hoàn thành sự kiện click bằng cách nhấp đủ 3 lần:</p>
        
        <div className="py-6 bg-zinc-50 dark:bg-zinc-950 border border-border rounded-xl space-y-3">
          <button
            onClick={() => setClickCount(prev => Math.min(prev + 1, 3))}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-wider active:scale-90 transition-all shadow-md shadow-emerald-500/10"
          >
            Nhấp chuột (Click)
          </button>
          <p className="text-xs font-bold text-muted-foreground">Bộ đếm số lần: {clickCount} / 3</p>
        </div>

        <button
          onClick={verifyInteractivePractice}
          disabled={clickCount < 3}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
        >
          {clickCount >= 3 ? "Nộp bài thực hành" : "Hãy nhấn đủ 3 lần"}
        </button>
      </div>
    );
  }

  if (course.practiceType === "php_match") {
    const keys = ["$ (Đô-la)", "echo", "PDO", ". (Dấu chấm)"];
    const scrambledVals = ["In dữ liệu ra HTML", "Kết nối Cơ sở dữ liệu", "Khai báo biến", "Ghép hai chuỗi ký tự"];
    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground">Bấm chọn 1 từ khóa ở bên trái, sau đó bấm chọn đúng định nghĩa ở bên phải:</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Từ khóa</p>
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
            <p className="text-[10px] font-black uppercase text-muted-foreground">Định nghĩa</p>
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
          disabled={Object.keys(matchedPairs).filter(k => k !== "activeLeft").length < 4}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none mt-2"
        >
          Hoàn thành nối cặp
        </button>
      </div>
    );
  }

  if (course.practiceType === "fill_blank") {
    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground">Điền đoạn code PHP thích hợp vào các ô trống bên dưới:</p>
        
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
            <span>"Xin chào"</span>
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
          Nộp kết quả điền code
        </button>
      </div>
    );
  }

  if (course.practiceType === "screenshot_upload") {
    return (
      <div className="space-y-4 font-sans">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Viết code trên IDE Máy tính (Desktop). Sau khi chạy thành công kết quả ra trình duyệt, bạn chụp ảnh màn hình và tải lên đây để hệ thống tự kiểm tra định dạng ảnh nộp.
        </p>

        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-zinc-50 dark:bg-zinc-950/20 relative overflow-hidden flex flex-col items-center justify-center min-h-36">
          {screenshotFile ? (
            <div className="space-y-3 w-full">
              <img src={screenshotFile} alt="Preview" className="max-h-32 object-contain mx-auto rounded border border-border shadow-sm" />
              {!isScanning && (
                <p className="text-[10px] font-bold text-success">Đã tải ảnh lên thành công!</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <span className="material-symbols-outlined text-4xl text-muted-foreground animate-pulse">add_photo_alternate</span>
              <p className="text-xs font-bold text-muted-foreground">Chọn hoặc kéo ảnh chụp màn hình vào đây</p>
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
                <p className="text-xs font-black animate-pulse">Đang kiểm tra ảnh nộp...</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Kiểm tra định dạng, kích thước và độ đầy đủ của ảnh.</p>
              </div>
            </div>
          )}
        </div>

        {screenshotFile && !isScanning && scanScore > 0 && (
          <div className="bg-success/10 border border-success/20 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-success uppercase">Tự kiểm tra ảnh hoàn tất</span>
              <span className="text-sm font-black text-success">{scanScore}/100</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground leading-relaxed">
              Điểm này chỉ phản ánh độ phù hợp của ảnh nộp để mở khóa bước học tiếp theo; không thay thế việc giáo viên hoặc quản trị viên xem lại bài thật.
            </p>
          </div>
        )}

        <button
          onClick={verifyInteractivePractice}
          disabled={!screenshotFile || isScanning}
          className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none mt-2"
        >
          {screenshotFile && !isScanning ? "Nộp ảnh đã kiểm tra" : "Vui lòng chọn ảnh chụp màn hình"}
        </button>
      </div>
    );
  }

  if (course.practiceType === "quiz") {
    if (quizQuestions.length === 0) {
      return <div className="text-xs text-muted-foreground text-center py-5 font-sans">Đang nạp bộ câu hỏi trắc nghiệm...</div>;
    }

    if (quizCompleted) {
      const passed = quizScore >= 60;
      return (
        <div className="space-y-4 text-center font-sans">
          <span className={`material-symbols-outlined text-5xl ${passed ? "text-success animate-bounce" : "text-destructive"}`}>
            {passed ? "emoji_events" : "gpp_bad"}
          </span>
          <div>
            <h4 className="text-sm font-black uppercase">Kết quả kiểm tra: {quizScore}%</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {passed 
                ? "Tuyệt vời! Bạn đã vượt qua bài kiểm tra thành công." 
                : "Rất tiếc, điểm số chưa đạt yêu cầu tối thiểu (60%)."}
            </p>
          </div>
          
          {passed ? (
            <button
              onClick={verifyInteractivePractice}
              className="w-full py-2.5 bg-success text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
            >
              Nhận thưởng JOY & Hoàn thành
            </button>
          ) : (
            <button
              onClick={handleRetakeQuiz}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
            >
              Đổi đề thi khác & Làm lại
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
          <span>Câu hỏi {quizCurrentIndex + 1} / {quizQuestions.length}</span>
          <span>Đã chọn: {Object.keys(quizAnswers).length} câu</span>
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
            Câu trước
          </button>
          
          {isLast ? (
            <button
              onClick={verifyInteractivePractice}
              disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
            >
              Nộp bài thi
            </button>
          ) : (
            <button
              onClick={() => setQuizCurrentIndex(prev => Math.min(prev + 1, quizQuestions.length - 1))}
              className="flex-1 py-2 bg-background hover:bg-muted border border-border text-foreground rounded-xl text-xs font-black uppercase active:scale-95 transition-all"
            >
              Câu tiếp
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
          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Khung mã nguồn:</span>
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
          Xác nhận đáp án
        </button>
      </div>
    );
  }

  return null;
}

function GraduationSubmissionForm({ bio, onBioUpdate, handleRewardMobileLesson, course }) {
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
        <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-wider">Đồ Án Kết Khóa HugoCoder</h3>
        <p className="text-[10px] text-zinc-400">
          Nộp sản phẩm hoàn thiện nhất của bạn để hoàn tất Chặng 7 và nhận Chứng nhận hoàn thành & +4,000 JOY.
        </p>
      </div>

      {status === "approved" && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
          <p className="text-xs font-bold text-emerald-500">Chúc mừng! Bạn đã hoàn thành HugoCoder! 🎉</p>
          {certUrl ? (
            <a
              href={certUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-gradient-to-br from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-zinc-950 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-md"
            >
              Xem chứng nhận hoàn thành
            </a>
          ) : (
            <p className="text-[9px] text-zinc-400">Đang chờ admin đính kèm link chứng chỉ...</p>
          )}
        </div>
      )}

      {status !== "approved" && (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {status === "pending" && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-xs font-bold text-amber-500">Dự án đang chờ duyệt... ⏳</p>
              <p className="text-[9px] text-zinc-400 mt-1">Hugo Studio đang xem xét bài nộp của bạn.</p>
            </div>
          )}
          
          {status === "rejected" && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left space-y-1">
              <p className="text-xs font-bold text-red-500">Dự án chưa đạt yêu cầu ❌</p>
              {adminNote && <p className="text-[9px] text-zinc-300">Phản hồi của Admin: {adminNote}</p>}
              <p className="text-[9px] text-zinc-400">Bạn có thể điều chỉnh và gửi lại link dự án mới dưới đây.</p>
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
              placeholder="https://myproject.com hoặc https://github.com/..."
              className="w-full bg-zinc-950 border border-border p-2.5 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">Ghi chú cho Admin (Không bắt buộc)</label>
            <textarea
              rows={3}
              disabled={status === "pending"}
              value={projectNote}
              onChange={(e) => setProjectNote(e.target.value)}
              placeholder="Nhập ghi chú, tài khoản test, thông tin vận hành..."
              className="w-full bg-zinc-950 border border-border p-2.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || status === "pending"}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-zinc-950 font-black rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
          >
            {submitting ? "Đang gửi..." : "Gửi Đề Án Tốt Nghiệp"}
          </button>
        </form>
      )}
    </div>
  );
}
