import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { clearMemberSession, getMemberSession, logoutAuth } from "../services/api/core/authSession";
import { hugoCoderApi } from "../services/api/modules/hugoCoderApi";
import { useCoderLessons } from "../hooks/useCoderLessons";
import { useJoyStore } from "../stores/joyStore";
import { useEduHead } from "./eduHead";
import EduLanding from "./EduLanding";
import EduLogin from "./EduLogin";
import EduShell, { EduProfile, EduStore } from "./EduShell";
import EduSettings from "./EduSettings";
import { useEduPrefs } from "./useEduPrefs";
import "./education.css";

const HugoCoderHub = lazy(() => import("../components/member/hugoCoder/HugoCoderHub"));
const CoderProgress = lazy(() => import("../components/member/hugoCoder/HugoCoderHub").then((mod) => ({ default: mod.ManageTab })));

const Loading = () => <div className="edu-loading" aria-label="Đang tải"><img src="/edu/buddy-learn.svg" alt="" /></div>;

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
 *   /progress /store /profile /settings   cần đăng nhập
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
  const shell = (view, children) => <EduShell view={view} learner={me} signedIn={signedIn}>{children}</EduShell>;
  const needsLogin = <Navigate to="/login" replace />;

  return (
    <div className={`edu${textSize === "lg" ? " edu-text-lg" : ""}`}>
      <Routes>
        <Route path="/" element={signedIn ? <Navigate to="/learn" replace /> : <EduLanding />} />
        {/* Tải lại cả trang sau đăng nhập: bộ nhớ đệm bài học (401 lúc còn là khách) và phiên mới cùng sạch. */}
        <Route path="/login" element={signedIn ? <Navigate to="/learn" replace /> : <EduLogin onSignedIn={() => window.location.assign("/learn")} />} />
        <Route path="/learn" element={shell("learn", <LearnMap learner={me} onLearnerUpdate={mergeLearner} />)} />
        <Route path="/learn/:lessonId" element={<LessonView learner={me} onLearnerUpdate={mergeLearner} />} />
        <Route path="/progress" element={signedIn ? shell("progress", <ProgressView learner={me} />) : needsLogin} />
        <Route path="/store" element={signedIn ? shell("store", <EduStore learner={me} onLearnerUpdate={mergeLearner} />) : needsLogin} />
        <Route path="/settings" element={signedIn ? shell("settings", <EduSettings learner={me} onLearnerUpdate={mergeLearner} />) : needsLogin} />
        <Route path="/profile" element={signedIn ? shell("profile", <EduProfile learner={me} onSignOut={signOut} />) : needsLogin} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function LearnMap({ learner, onLearnerUpdate }) {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<Loading />}>
      <HugoCoderHub framed bio={learner} onBioUpdate={onLearnerUpdate} onLessonChange={(id) => navigate(id ? `/learn/${id}` : "/learn")} />
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
  const { courses, stages } = useCoderLessons(null);
  return (
    <section className="edu-page">
      <h1 className="edu-page-title">Tiến độ</h1>
      <Suspense fallback={<Loading />}>
        <CoderProgress bio={learner} courses={courses} stages={stages} />
      </Suspense>
    </section>
  );
}
