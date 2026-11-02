import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { playEduSound } from "./eduSound";
import { useEduCourse } from "./useEduCourse";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { clearMemberSession, getMemberSession, logoutAuth } from "../services/api/core/authSession";
import { hugoCoderApi } from "../services/api/modules/hugoCoderApi";
import { useCoderLessons } from "../hooks/useCoderLessons";
import { useJoyStore } from "../stores/joyStore";
import { useEduHead } from "./eduHead";
import EduLanding from "./EduLanding";
import EduLogin from "./EduLogin";
import EduOnboard, { rememberAccount, takePendingGoal } from "./EduOnboard";
import EduShell, { EduInstallGate, EduProfile, EduStore } from "./EduShell";
import { detectInstallTarget } from "../config/platform";
import { useStandalone } from "../hooks/usePWA";
import { useEduPrefs } from "./useEduPrefs";
import { useEduText } from "./eduText";
import { changeAppLanguage } from "../i18n/config";
import { installEduTapSounds } from "./eduSound";
import EduWelcome, { needsWelcome } from "./EduWelcome";
import { StreakCelebration, StreakView, useStreakCelebration } from "./EduStreak";
import { PersonaGate, usePersona } from "./EduPersona";
import EduStatus, { EduErrorBoundary } from "./EduStatus";
import { API_BASE } from "../config/apiBase";
import "./education.css";

const EduCourseIntro = lazy(() => import("./EduCourseIntro"));
const HugoCoderHub = lazy(() => import("../components/member/hugoCoder/HugoCoderHub"));
const EduCommunity = lazy(() => import("./EduCommunity"));
const EduFriends = lazy(() => import("./EduFriends"));
const EduFeedback = lazy(() => import("./EduFeedback"));
const EduLegal = lazy(() => import("./EduLegal.jsx"));
const EduPublicProfile = lazy(() => import("./EduFriends").then((mod) => ({ default: mod.EduPublicProfile })));
const CoderProgress = lazy(() => import("../components/member/hugoCoder/HugoCoderHub").then((mod) => ({ default: mod.ManageTab })));

const hasSavedAccounts = () => { try { return JSON.parse(localStorage.getItem("edu.accounts") || "[]").length > 0; } catch { return false; } };
/** Sau đăng nhập: về ?next= nếu là đường dẫn nội bộ, không thì /learn. */
const afterLogin = () => {
  const next = new URLSearchParams(window.location.search).get("next") || "";
  window.location.assign(/^\/(?!\/)/.test(next) ? next : "/learn");
};
const Loading = () => <EduStatus kind="loading" />;

/** /en, /zh: trang giới thiệu theo ngôn ngữ đó (link chia sẻ + trang tĩnh SEO trỏ về đây). */
function LangLanding({ lang, signedIn }) {
  useEffect(() => { changeAppLanguage(lang); }, [lang]);
  return signedIn ? <Navigate to="/learn" replace /> : <EduLanding />;
}

/**
 * Education Hugo — education.hugowishpax.studio.
 *
 * Cùng bản build, cùng backend, cùng TÀI KHOẢN với Hugo Studio; chỉ vỏ là riêng.
 * Học miễn phí (6 step đầu không cần tài khoản), còn tài khoản vẫn theo luật
 * Hugo Studio: hạn duy trì gia hạn bằng JOY trong Cửa hàng ở đây, xác minh giáo
 * dục được một năm. Qua một step lần đầu được +5 JOY mỗi câu đúng.
 *
 *   /            khách: trang giới thiệu · đã đăng nhập: vào /learn
 *   /learn       bản đồ 26 step (khách vẫn xem và học thử được)
 *   /learn/:id   trình học toàn màn
 *   /progress /store /profile /settings /community   cần đăng nhập
 */
export default function EducationApp() {
  useEduHead();
  const [session, setSession] = useState(() => getMemberSession());
  const [learner, setLearner] = useState(null);
  const signedIn = Boolean(session?.email);

  const refresh = useCallback(() => {
    if (!getMemberSession()?.email) return Promise.resolve();
    return hugoCoderApi.getAccessSnapshot()
      .then(({ bio, edu }) => setLearner((current) => ({ ...bio, edu: edu || current?.edu })))
      .catch((error) => {
        // Phiên ở máy đã chết phía máy chủ: về trạng thái khách cho khớp.
        if (error?.status === 401) { clearMemberSession(); setSession(null); }
      });
  }, []);

  useEffect(() => { if (signedIn) refresh(); }, [signedIn, refresh]);

  // Tự đồng bộ: cùng một tài khoản có thể đang học ở máy khác, tiêu JOY ở
  // www, hay đăng nhập/đăng xuất ở tab khác — không bắt người học tải lại trang.
  useEffect(() => {
    if (!signedIn) return undefined;
    let last = Date.now();
    // ponytail: kéo lại khi quay về tab (tối đa 1 lần/30 giây), không thăm dò định kỳ — Render free tính băng thông.
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 30_000) return;
      last = Date.now();
      refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("hugo:bio-update", refresh);
    // Số dư JOY đổi tức thì qua WebSocket (PWARealtimeBridge) — chỉ nghe thay đổi, không lấy giá trị đầu.
    const stopJoy = useJoyStore.subscribe((state, prev) => {
      if (state.balance !== prev.balance) setLearner((current) => (current ? { ...current, joyBalance: state.balance } : current));
    });
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("hugo:bio-update", refresh);
      stopJoy();
    };
  }, [signedIn, refresh]);

  // Đăng nhập/đăng xuất ở tab khác của Edu.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== null && event.key !== "price-doc-member-session") return;
      const next = getMemberSession();
      setSession(next);
      if (!next) setLearner(null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mergeLearner = useCallback((next) => setLearner((current) => {
    const merged = { ...(current || {}), ...(next || {}) };
    // Vừa qua step mới: mục tiêu hôm nay nhích ngay, không chờ lần đồng bộ sau.
    const gained = (next?.completedLessons?.length || 0) - (current?.completedLessons?.length || 0);
    const today = merged.edu?.today;
    if (gained > 0 && next?.completedLessons && today) merged.edu = { ...merged.edu, today: { ...today, done: today.done + gained } };
    return merged;
  }), []);
  const signOut = async () => {
    await logoutAuth();
    setSession(null);
    setLearner(null);
  };

  const me = learner || (signedIn ? { email: session.email, displayName: session.displayName, avatarUrl: session.avatarUrl } : null);
  const textSize = useEduPrefs(signedIn ? learner?.edu?.prefs : null);
  const shell = (view, children) => <EduShell view={view} learner={me} signedIn={signedIn} onLearnerUpdate={mergeLearner}>{children}</EduShell>;
  // Lần đầu vào: chọn ngôn ngữ → đồng ý điều khoản (xem EduWelcome). Âm thanh chạm cho cả site.
  const [welcome, setWelcome] = useState(needsWelcome);
  useEffect(() => installEduTapSounds(), []);
  const celebration = useStreakCelebration();
  // Biệt danh + nhân vật bắt buộc (sau bước chào/điều khoản): chưa xong thì không vào học được.
  const [persona, setPersona] = usePersona(signedIn);

  // Điện thoại chưa cài app: chỉ trang giới thiệu, mọi trang học → video cài đặt.
  const standalone = useStandalone();
  // PWA: nhớ tài khoản trên máy (màn "Đăng nhập lại") + lưu mục tiêu đã chọn lúc onboarding.
  useEffect(() => {
    if (!signedIn || !persona) return;
    rememberAccount({ email: session.email, name: persona.nickname || session.displayName, avatar: persona.avatar });
    const goal = takePendingGoal();
    if (goal) {
      fetch(`${API_BASE}/joy/edu-settings`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefs: { dailyGoal: goal } }) })
        .then(() => refresh()).catch(() => {});
    }
  }, [signedIn, persona, session, refresh]);

  const location = useLocation();
  // Giữ trang đang mở (vd. /feedback từ thư) để đăng nhập xong quay lại đúng chỗ.
  const needsLogin = <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  const device = detectInstallTarget();
  const phoneWeb = (device.iOS || device.android) && !standalone;
  // Trang công khai (chia sẻ, Google đọc) mở được cả trên trình duyệt điện thoại; còn lại mời cài app.
  const publicPage = ["/", "/en", "/zh", "/terms", "/privacy", "/guidelines"].includes(location.pathname) || location.pathname.startsWith("/courses/");
  const gated = phoneWeb && !publicPage;
  // Quét QR thẻ bạn bè bằng camera điện thoại luôn mở trình duyệt, không mở PWA (iOS cấm, Android mở tab nhúng).
  const qrCode = /^\/u\/([A-Za-z0-9]{4,12})$/.exec(location.pathname)?.[1];

  return (
    <div className={`edu${textSize === "lg" ? " edu-text-lg" : ""}`}>
      {gated && (qrCode ? <EduQrHandoff code={qrCode} android={device.android} /> : <EduInstallGate />)}
      {welcome && <EduWelcome onDone={() => setWelcome(false)} />}
      {!welcome && !gated && persona && !persona.complete && <PersonaGate email={session.email} current={persona} onDone={setPersona} />}
      {celebration.event && <StreakCelebration key={`${celebration.event.count}-${celebration.event.joy || 0}`} {...celebration.event} onClose={celebration.close} />}
      {!gated && <EduErrorBoundary><Routes>
        <Route path="/" element={signedIn ? <Navigate to="/learn" replace /> : standalone ? <EduOnboard /> : <EduLanding />} />
        {/* Tải lại cả trang sau đăng nhập: bộ nhớ đệm bài học (401 lúc còn là khách) và phiên mới cùng sạch. */}
        <Route path="/en" element={<LangLanding lang="en" signedIn={signedIn} />} />
        <Route path="/zh" element={<LangLanding lang="zh" signedIn={signedIn} />} />
        <Route path="/install" element={<EduInstallGate />} />
        <Route path="/login" element={signedIn ? <Navigate to="/learn" replace /> : (standalone ? <EduOnboard start={hasSavedAccounts() ? "signin" : "signinAs"} /> : <EduLogin onSignedIn={afterLogin} />)} />
        <Route path="/learn" element={shell("learn", <LearnMap learner={me} onLearnerUpdate={mergeLearner} />)} />
        <Route path="/learn/:lessonId" element={<LessonView learner={me} onLearnerUpdate={mergeLearner} />} />
        <Route path="/courses/:id" element={shell("learn", <Suspense fallback={<Loading />}><EduCourseIntro /></Suspense>)} />
        <Route path="/streak" element={signedIn ? <StreakView learner={me} onLearnerUpdate={mergeLearner} /> : needsLogin} />
        {/* Văn bản pháp lý: công khai, không cần đăng nhập. */}
        {["terms", "privacy", "guidelines"].map((doc) => (
          <Route key={doc} path={`/${doc}`} element={shell("legal", <Suspense fallback={<Loading />}><EduLegal doc={doc} /></Suspense>)} />
        ))}
        <Route path="/feedback" element={signedIn ? shell("profile", <Suspense fallback={<Loading />}><EduFeedback /></Suspense>) : needsLogin} />
        <Route path="/friends" element={signedIn ? shell("friends", <Suspense fallback={<Loading />}><EduFriends /></Suspense>) : needsLogin} />
        <Route path="/u/:code" element={signedIn ? shell("friends", <Suspense fallback={<Loading />}><EduPublicProfile /></Suspense>) : needsLogin} />
        <Route path="/community" element={signedIn ? shell("community", <Suspense fallback={<Loading />}><EduCommunity /></Suspense>) : needsLogin} />
        <Route path="/community/:postKey" element={signedIn ? shell("community", <Suspense fallback={<Loading />}><EduCommunity /></Suspense>) : needsLogin} />
        <Route path="/progress" element={signedIn ? shell("progress", <ProgressView learner={me} />) : needsLogin} />
        <Route path="/store" element={signedIn ? shell("store", <EduStore learner={me} onLearnerUpdate={mergeLearner} />) : needsLogin} />
        {/* Cài đặt đã gộp vào Hồ sơ; giữ địa chỉ cũ cho push/link cũ. */}
        <Route path="/settings" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={signedIn ? shell("profile", <EduProfile learner={me} persona={persona} onPersona={setPersona} onSignOut={signOut} onLearnerUpdate={mergeLearner} />) : needsLogin} />
        {/* PWA cài lúc manifest của www còn hiệu lực sẽ mở /member/today — ở Edu không có trang đó.
            Đường dẫn kiểu www về /learn (giữ query, vd. ?source=pwa); trong app đã cài, đường lạ cũng về /learn thay vì 404. */}
        {["/member/*", "/study/*", "/today", "/utilities/*"].map((path) => (
          <Route key={path} path={path} element={<Navigate to={`/learn${location.search}`} replace />} />
        ))}
        <Route path="*" element={standalone ? <Navigate to="/learn" replace /> : <EduStatus kind="notFound" />} />
      </Routes></EduErrorBoundary>}
    </div>
  );
}

/** Màn trung chuyển khi quét QR bạn bè trên trình duyệt điện thoại: chép mã để dán trong app. */
function EduQrHandoff({ code, android }) {
  const { t } = useEduText();
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); playEduSound("coin"); }).catch(() => {});
  // Android: intent mở bằng Chrome; WebAPK đã cài sẽ nhận đường dẫn trong phạm vi của nó.
  const intent = `intent://${window.location.host}/u/${code}#Intent;scheme=https;package=com.android.chrome;end`;
  return (
    <div className="edu-gate edu-qr">
      <main className="edu-ob-main">
        <img className="edu-ob-hero is-wave" src="/edu/cast-1.svg" alt="" width="130" height="130" />
        <h1 className="edu-ob-title">{t("friends.qrTitle")}</h1>
        <p className="edu-ob-lead">{t("friends.qrBody")}</p>
        <button type="button" className="edu-qr-code" onClick={copy} aria-label={t("friends.qrCopy")}>{code}</button>
        <button type="button" className="edu-btn edu-btn--wide edu-ob-go" onClick={copy}>{t(copied ? "friends.qrCopied" : "friends.qrCopy")}</button>
        {android && <a className="edu-btn edu-btn--ghost edu-btn--wide" href={intent}>{t("friends.qrOpen")}</a>}
        <Link className="edu-ob-later" to="/install">{t("friends.qrInstall")}</Link>
      </main>
    </div>
  );
}

function LearnMap({ learner, onLearnerUpdate }) {
  const navigate = useNavigate();
  // Khoá chọn ở bảng "Khoá học của bạn" trên thanh trên (useEduCourse).
  const course = useEduCourse();
  return (
    <Suspense fallback={<Loading />}>
      <HugoCoderHub key={course} framed course={course} bio={learner} onBioUpdate={onLearnerUpdate} onLessonChange={(id) => navigate(id ? `/learn/${id}` : "/learn")} />
    </Suspense>
  );
}

function LessonView({ learner, onLearnerUpdate }) {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  return (
    <Suspense fallback={<Loading />}>
      <HugoCoderHub
        bio={learner}
        onBioUpdate={onLearnerUpdate}
        urlLessonId={lessonId}
        onBack={() => navigate("/learn")}
        onLessonChange={(id) => navigate(id ? `/learn/${id}` : "/learn")}
      />
    </Suspense>
  );
}

function ProgressView({ learner }) {
  const { t } = useEduText();
  const { courses, stages } = useCoderLessons(null, { course: useEduCourse() });
  return (
    <section className="edu-page">
      <h1 className="edu-page-title">{t("progress.title")}</h1>
      <Suspense fallback={<Loading />}>
        <CoderProgress bio={learner} courses={courses} stages={stages} />
      </Suspense>
    </section>
  );
}
