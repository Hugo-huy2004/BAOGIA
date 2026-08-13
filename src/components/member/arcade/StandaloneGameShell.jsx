import React, { useState, useEffect, Suspense, useCallback } from "react";
import { localeForLanguage } from "../../../i18n/languages";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import GAME_THEMES from "./gameThemes";
import { submitScore } from "../../../services/arcadeApi";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { calcJoy } from "../../../utils/joyCalculation";
import { getBest, recordBest, nearMissGap } from "./arcadeBest";
import GameIntroScreen from "./GameIntroScreen";
import "./game-shell.css";

// ─── Per-game lazy imports ─────────────────────────────────────────
const GAME_COMPONENTS = {
  chess:     React.lazy(() => import("./GameChess3D")),
  survivor:  React.lazy(() => import("./GameSpaceSurvivor")),
  "2048":    React.lazy(() => import("./Game2048")),
  caro:      React.lazy(() => import("./GameCaro")),
  snake:     React.lazy(() => import("./GameSnake")),
};

// Icon đơn sắc: hình dạng mang nghĩa, không phải màu. Ba mã hex trước đây
// (xanh/hồng/cam) là thứ duy nhất trong màn chơi không theo bảng màu của game,
// nên chúng đập vào mắt như dán nhãn từ app khác.
//
// Bỏ màu không làm mất thông tin: cúp / mũi tên lặp / bắt tay đã khác nhau rõ,
// và ngay dưới icon còn có dòng chữ "Thắng"/"Thua". Nghĩa chưa bao giờ nằm ở
// riêng màu — nếu có thì màn này đã không đọc được với người mù màu.
const RESULT_CONFIG = {
  win:  { icon: "emoji_events" },
  lose: { icon: "refresh" },
  draw: { icon: "handshake" },
};

export default function StandaloneGameShell({ gameId, bio, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const theme = GAME_THEMES[gameId] || GAME_THEMES["2048"];
  const GameComp = GAME_COMPONENTS[gameId];
  const sound = useArcadeSound();

  const [stage, setStage] = useState("intro"); // intro | playing | result
  const [paused, setPaused] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [playKey, setPlayKey] = useState(0);

  // Số dư phải lấy từ store, không lấy từ prop `bio`. `bio` là ảnh chụp lúc mở
  // game: thắng xong, ví server đã cộng, store đã cập nhật, mà con số trên
  // thanh tiêu đề vẫn y nguyên vì prop không đổi.
  const walletBalance = useJoyStore((s) => s.balance);
  const walletLoaded = useJoyStore((s) => s.loaded);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleStartGame = useCallback(() => {
    sound.playBeep();
    setPaused(false);
    setStage("playing");
  }, [sound]);

  const handleGameOver = useCallback(async (score, result) => {
    setPaused(false);
    if (result === "win") {
      sound.playWin();
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
      });
    } else {
      sound.playLose();
    }

    // Calculate JOY immediately using shared formula (client-side prediction)
    const estimatedJoy = calcJoy(gameId, score);

    // Phải đọc kỷ lục CŨ trước khi ghi đè, nếu không thì vừa phá xong kỷ lục
    // đã bằng chính điểm này và màn kết thúc không còn gì để so sánh.
    const prevBest = getBest(gameId);
    const gap = nearMissGap(gameId, score, prevBest);
    const isRecord = recordBest(gameId, score);

    // Show result screen immediately with estimated JOY
    setResultData({ score, result, joyDelta: estimatedJoy, joyAwarded: false, prevBest, gap, isRecord });
    setStage("result");

    try {
      const res = await submitScore(gameId, { score, result }, bio);
      if (res) {
        // Server may adjust JOY — use server value if available
        setResultData((prev) => ({
          ...prev,
          score,
          result,
          joyDelta: res.joyDelta ?? estimatedJoy,
          joyAwarded: res.joyAwarded ?? false,
        }));
      }
    } catch {
      // Score submission failed — show estimated JOY
    }
    if (bio?.email) useJoyStore.getState().fetchBalance(bio.email, undefined, { force: true });
  }, [gameId, bio, sound]);

  const handleReplay = useCallback(() => {
    sound.playBeep();
    setPlayKey((k) => k + 1);
    setPaused(false);
    setStage("playing");
    setResultData(null);
  }, [sound]);

  // Leaving mid-match still records the score — pausing is the safe exit.
  const handleQuit = useCallback(() => {
    setPaused(false);
    setStage("result");
    setResultData({ score: 0, result: "lose", joyDelta: 0, joyAwarded: false });
  }, []);

  // Back button pauses instead of instantly forfeiting.
  const handleBack = useCallback(() => {
    if (stage === "playing") {
      sound.playBeep();
      setPaused(true);
      return;
    }
    onClose?.();
  }, [stage, sound, onClose]);

  // Escape pauses; a backgrounded tab pauses too.
  useEffect(() => {
    if (stage !== "playing") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); setPaused((p) => !p); }
    };
    const onHide = () => { if (document.hidden) setPaused(true); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [stage]);

  if (!GameComp) return null;

  const outcome = RESULT_CONFIG[resultData?.result] || RESULT_CONFIG.lose;
  // Dấu phải bám theo giá trị: server cũ vẫn có thể trả JOY âm (bảng phạt thua
  // cũ), và "+{-10}" in ra thành "+-10". Ký hiệu tính một lần, dùng cho cả hai chỗ.
  const joy = resultData?.joyDelta || 0;
  const signedJoy = `${joy > 0 ? "+" : ""}${joy}`;
  // Trước khi server xác nhận, con số trên màn hình chỉ là ước tính của client
  // (cùng công thức, nhưng ví chưa hề cộng). Nếu điểm gửi hỏng hoặc đang xếp
  // hàng offline, `joyAwarded` vẫn false — lúc đó khoe "+29 JOY" là nói dối,
  // và đó chính là "báo có thưởng nhưng ví không tăng".
  const joyPending = joy > 0 && !resultData?.joyAwarded;

  return createPortal(
    <div className={`arcade-game arcade-game--${gameId}`}>
      {stage !== "intro" && <div className="gshell__aurora" aria-hidden="true" />}

      {/* ── Stage: Per-game introduction ── */}
      {stage === "intro" && (
        <GameIntroScreen
          gameId={gameId}
          onStartGame={handleStartGame}
          onClose={onClose}
        />
      )}

      {stage !== "intro" && (
        <>
          <div className="gshell__status" />
          {/* Khung góc tĩnh — thứ làm màn chơi trông như một thiết bị chứ không
              phải một trang web. Không animation, nên không tốn frame nào. */}
          <div className="gshell__frame" aria-hidden="true" />

          <header className="gshell__bar">
            <button type="button" className="gshell__icon-btn" onClick={handleBack} aria-label={t("arcadeGame.back")}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="gshell__title">
              <p>{theme.name}</p>
            </div>
            {bio && (
              <div className="gshell__joy" title={t("arcadeGame.joyBalance")}>
                <span className="material-symbols-outlined">toll</span>
                <b>{(walletLoaded ? walletBalance : bio.joyBalance ?? 0).toLocaleString("vi-VN")}</b>
              </div>
            )}
            {stage === "playing" && (
              <button
                type="button"
                className="gshell__icon-btn"
                onClick={() => { sound.playBeep(); setPaused((p) => !p); }}
                aria-label={t(paused ? "arcadeGame.resume" : "arcadeGame.pause")}
              >
                <span className="material-symbols-outlined">{paused ? "play_arrow" : "pause"}</span>
              </button>
            )}
          </header>
        </>
      )}

      {/* ── Stage: Playing ── */}
      {stage === "playing" && (
        <div key={playKey} className="gshell__stage">
          <Suspense fallback={
            <div className="gshell__loading">
              <div className="gshell__spinner" />
              <p>{t("arcadeGame.loading")}</p>
            </div>
          }>
            <GameComp
              paused={paused}
              onGameOver={handleGameOver}
              sound={sound}
            />
          </Suspense>
        </div>
      )}

      {/* ── Overlay: Pause ── */}
      {stage === "playing" && paused && (
        <div className="gshell__overlay" role="dialog" aria-modal="true" aria-label={t("arcadeGame.paused")}>
          <div className="gshell__card">
            <div className="gshell__badge">
              <span className="material-symbols-outlined">pause</span>
            </div>
            <p className="gshell__eyebrow">{theme.name}</p>
            <h2>{t("arcadeGame.paused")}</h2>
            <p>{t("arcadeGame.pausedHint")}</p>
            <div className="gshell__actions" style={{ marginTop: 20 }}>
              <button type="button" className="gshell__btn gshell__btn--primary" onClick={() => { sound.playBeep(); setPaused(false); }}>
                {t("arcadeGame.resume")}
              </button>
            </div>
            <button type="button" className="gshell__btn gshell__btn--ghost" onClick={handleQuit}>
              {t("arcadeGame.quit")}
            </button>
          </div>
        </div>
      )}

      {/* ── Stage: Result ── */}
      {stage === "result" && resultData && (
        <div className="gshell__overlay">
          <div className="gshell__card">
            <div className="gshell__badge">
              <span className="material-symbols-outlined">{outcome.icon}</span>
            </div>
            <p className="gshell__eyebrow">{theme.name}</p>
            <h2>{t(`arcadeGame.result.${resultData.result}`)}</h2>

            <div className="gshell__score">
              {t("arcadeGame.scoreValue", { score: resultData.score?.toLocaleString("vi-VN") })}
            </div>

            <div className="gshell__reward">
              <span className="material-symbols-outlined">toll</span>
              <b>{signedJoy}</b>
              <span>JOY</span>
            </div>

            <p className="gshell__formula">
              {t("arcadeGame.shellFormula", { score: (resultData.score || 0).toLocaleString(locale), joy: signedJoy })}
              {joyPending && ` ${t("arcadeGame.pendingWallet")}`}
            </p>

            {/* Ván vừa rồi đứng ở đâu so với chính mình. Ba trường hợp, ba câu
                khác nhau — "thua" mà không có mốc so sánh thì chỉ là ngõ cụt. */}
            {resultData.isRecord ? (
              <p className="gshell__chase gshell__chase--record">
                <span className="material-symbols-outlined">trophy</span>
                {t("arcadeGame.shellRecord", { delta: (resultData.score - resultData.prevBest).toLocaleString(locale) })}
              </p>
            ) : resultData.gap > 0 ? (
              <p className="gshell__chase gshell__chase--near">
                <span className="material-symbols-outlined">bolt</span>
                {t("arcadeGame.shellNear", { gap: resultData.gap.toLocaleString(locale), best: resultData.prevBest.toLocaleString(locale) })}
              </p>
            ) : resultData.prevBest > 0 ? (
              <p className="gshell__chase">
                <span className="material-symbols-outlined">flag</span>
                {t("arcadeGame.shellBest", { best: resultData.prevBest.toLocaleString(locale) })}
              </p>
            ) : null}

            <div className="gshell__actions">
              <button type="button" className="gshell__btn gshell__btn--primary" onClick={handleReplay}>
                {/* Hụt gang tấc thì nút không nên chỉ là "Chơi lại": nó phải nói
                    ra việc người chơi vừa suýt làm được. */}
                {resultData.gap > 0 ? t("arcadeGame.tryAgainClose") : t("arcadeGame.replay")}
              </button>
            </div>

            <button type="button" className="gshell__btn gshell__btn--ghost" onClick={onClose}>
              {t("arcadeGame.close")}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
