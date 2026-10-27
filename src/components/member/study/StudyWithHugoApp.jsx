import { lazy, Suspense, useState } from "react";
import { Award } from "lucide-react";
import AppFrame from "../os/AppFrame";
import LazyBoundary from "../os/LazyBoundary";
import { useLocation, useNavigate } from "react-router-dom";
import { COURSE_MAP_ROUTE, resolveStudyRoute } from "./studyCurriculum";

const CodingApp = lazy(() => import("../hugoCoder/HugoCoderHub"));

const Loading = () => <div className="coder-journey-loading" aria-label="Đang tải Coding"><span /></div>;

/**
 * App Coding: mở ra là BẢN ĐỒ khoá học trong khung chung AppFrame — khoá chỉ
 * còn một, bên trong là các step. Mở một step thì trình học chiếm trọn màn.
 * Màn đang mở suy ra từ địa chỉ, xem studyCurriculum.js.
 *
 * Tiến độ, giấy chứng nhận và gói đã sở hữu nằm sau nút "Tiến độ" trên khung.
 */
export default function StudyWithHugoApp({
  bio,
  onBioUpdate,
  onBack,
  // Đoạn thứ ba và thứ tư của địa chỉ — xem studyCurriculum.js.
  studyRoute = null,
  studySub = null,
  // Gốc của khoá học khi nó KHÁC địa chỉ đang đứng (trang công khai /study).
  studyBasePath = null,
}) {
  const navigate = useNavigate();
  const [progressOpen, setProgressOpen] = useState(false);
  const { lessonId, basePath: routeBasePath } = resolveStudyRoute(useLocation().pathname, studyRoute, studySub);
  const basePath = studyBasePath || routeBasePath;
  const leave = onBack || (() => navigate("/"));
  const appProps = { bio, onBioUpdate, onBack: leave, basePath: `${basePath}/${COURSE_MAP_ROUTE}` };

  if (lessonId) {
    return (
      <LazyBoundary onBack={leave} backLabel="Coding">
        <Suspense fallback={<Loading />}>
          <CodingApp {...appProps} urlLessonId={lessonId} />
        </Suspense>
      </LazyBoundary>
    );
  }

  return (
    <AppFrame
      appId="study"
      onBack={leave}
      wide
      // Bản đồ tràn sát hai mép màn, không chừa viền.
      contentClassName="px-0"
      paletteVars={{
        "--ios-bg": "hsl(var(--background))",
        "--ios-elevated": "hsl(var(--card))",
        "--ios-surface": "hsl(var(--card))",
        "--ios-label": "hsl(var(--foreground))",
        "--ios-label-2": "hsl(var(--muted-foreground))",
        "--ios-sep": "hsl(var(--border))",
        "--ios-chrome": "hsl(var(--background) / .82)",
      }}
      actions={(
        <button type="button" className="coder-hub-progress" onClick={() => setProgressOpen(true)} aria-label="Tiến độ và giấy chứng nhận">
          <Award aria-hidden="true" />
          <span>Tiến độ</span>
        </button>
      )}
    >
      <LazyBoundary onBack={leave} backLabel="Coding">
        <Suspense fallback={<Loading />}>
          <CodingApp {...appProps} framed progressOpen={progressOpen} onProgressChange={setProgressOpen} />
        </Suspense>
      </LazyBoundary>
    </AppFrame>
  );
}
