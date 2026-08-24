import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getMemberSession, logoutAuth } from "../../services/authSession";
import { dataApi } from "../../services/dataApi";
import { notify } from "../../lib/notify";
import { PUBLIC_TOOLS } from "../../config/publicTools";
import StudyLandingPage from "./StudyLandingPage";
import { CINE_CSS } from "../../components/public/cineKit";
import LearningLogin from "./LearningLogin";
import {
  LEARNING_TABS,
  LearningTabBar,
  LearningProgress,
  LearningAccount,
} from "./LearningTabs";
import "./hugo-learning.css";

const StudyWithHugoApp = lazy(() => import("../../components/member/study/StudyWithHugoApp"));

/**
 * Hugo Learning — trang dịch vụ ĐỨNG RIÊNG.
 *
 * Trước đây Study chạy bên trong `UtilityPublicPage`: nó bị bọc thêm navbar của
 * Hugo Studio, một thẻ "LIVE DEMO" và bảng giá gói — ba thứ không liên quan gì
 * tới việc học, và làm trang trông như một tiện ích phụ chứ không phải một dịch
 * vụ riêng.
 *
 * Ở đây Hugo Learning tự lo phiên đăng nhập và hồ sơ, nên không cần vỏ nào cả:
 *   khách + ở gốc  → trang giới thiệu
 *   còn lại        → thư viện khoá, bản đồ, hoặc bài học
 *
 * Vẫn thuộc Hugo Studio: đăng nhập bằng tài khoản Hugo Studio, bản quyền và
 * thương hiệu ghi rõ ở đầu trang và chân trang. Tách layout không phải tách
 * quyền sở hữu.
 */
export default function HugoLearningPage() {
  const navigate = useNavigate();
  const { page = null, sub = null } = useParams();
  const [session, setSession] = useState(() => getMemberSession());
  const [bio, setBio] = useState(null);

  useEffect(() => {
    const current = getMemberSession();
    if (!current?.email) return undefined;

    let cancelled = false;
    dataApi.getMemberBio(current.email, current.displayName, current.avatarUrl)
      .then((res) => {
        if (!cancelled && res?.bio) setBio(res.bio);
      })
      // Hồ sơ lỗi thì vẫn cho học: tiến độ máy chủ sẽ đồng bộ ở lần tải sau.
      .catch(() => {});

    setSession(current);
    return () => { cancelled = true; };
  }, []);

  // Thẻ head cho CẢ dịch vụ, không riêng trang giới thiệu: trước đây nó nằm
  // trong StudyLandingPage nên vào /study/calendar là tiêu đề tab quay về tên
  // chung của Hugo Studio. Bản tĩnh do scripts/generate-seo.mjs sinh ra phục vụ
  // bộ thu thập; đoạn này lo cho người dùng thật.
  useEffect(() => {
    const meta = PUBLIC_TOOLS.study;
    const previous = document.title;
    document.title = meta.title;

    const tags = [
      ["name", "description", meta.description],
      ["property", "og:title", meta.title],
      ["property", "og:description", meta.description],
      ["property", "og:type", "website"],
    ].map(([attr, key, value]) => {
      let node = document.head.querySelector(`meta[${attr}="${key}"]`);
      const created = !node;
      if (created) {
        node = document.createElement("meta");
        node.setAttribute(attr, key);
        document.head.appendChild(node);
      }
      const before = node.getAttribute("content");
      node.setAttribute("content", value);
      return { node, created, before };
    });

    // Dữ liệu có cấu trúc: một dịch vụ học tập của Hugo Studio. Cố ý KHÔNG khai
    // là cơ sở giáo dục được cấp phép.
    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Hugo Learning",
      description: meta.description,
      publisher: { "@type": "Organization", name: "Hugo Studio" },
      isAccessibleForFree: true,
    });
    document.head.appendChild(jsonLd);

    return () => {
      document.title = previous;
      jsonLd.remove();
      tags.forEach(({ node, created, before }) => {
        if (created) node.remove();
        else if (before !== null) node.setAttribute("content", before);
      });
    };
  }, []);

  const learner = useMemo(() => {
    if (bio) return bio;
    if (!session?.email) return null;
    return {
      email: session.email,
      displayName: session.displayName || session.name || session.email.split("@")[0],
      avatarUrl: session.avatarUrl || "",
    };
  }, [bio, session]);

  const signedIn = Boolean(session?.email);

  // Đăng nhập ngay trong dịch vụ. Đã đăng nhập rồi thì vào thẳng thư viện —
  // đứng ở màn đăng nhập lúc đã có phiên là một ngõ cụt.
  if (page === "login") {
    if (signedIn) return <Navigate to="/study/khoa-hoc" replace />;
    return (
      <LearningShell tab={null} signedIn={false}>
        <LearningLogin
          onSignedIn={(member) => {
            // Cập nhật phiên tại chỗ rồi điều hướng bằng router — cùng một tab,
            // không nạp lại trang.
            setSession(member);
            navigate("/study/khoa-hoc", { replace: true });
          }}
        />
      </LearningShell>
    );
  }
  const tab = LEARNING_TABS.find((item) => item.slug === page);

  // Gốc /study là tab Giới thiệu — cho cả người đã đăng nhập. Trước đây đăng
  // nhập rồi thì gốc nhảy thẳng vào thư viện, nên không còn đường nào quay lại
  // trang giới thiệu của chính dịch vụ.
  if (!page) {
    return (
      <LearningShell tab="" signedIn={signedIn}>
        <StudyLandingPage />
      </LearningShell>
    );
  }

  // Ba tab cần đăng nhập.
  if (tab) {
    if (tab.auth && !signedIn) {
      return (
        <LearningShell tab={tab.slug} signedIn={signedIn}>
          <LearningLogin
            reason={tab.label}
            onSignedIn={(member) => setSession(member)}
          />
        </LearningShell>
      );
    }
    if (tab.slug === "tien-do") {
      return (
        <LearningShell tab={tab.slug} signedIn={signedIn}>
          <LearningProgress learner={learner} />
        </LearningShell>
      );
    }
    if (tab.slug === "tai-khoan") {
      return (
        <LearningShell tab={tab.slug} signedIn={signedIn}>
          <LearningAccount
            learner={learner}
            onSignOut={async () => {
              await logoutAuth();
              setSession(null);
              setBio(null);
              navigate("/study", { replace: true });
            }}
          />
        </LearningShell>
      );
    }
  }

  // Thư viện khoá, bản đồ và bài học. Bài học chiếm trọn màn nên không đội
  // tab-bar lên trên — đang học thì không cần chuyển tab.
  const learningView = (
    <Suspense fallback={<div className="hugo-learning-loading" aria-label="Đang tải" />}>
      <StudyWithHugoApp
        bio={learner}
        onBioUpdate={(updates) => setBio((current) => ({ ...(current || {}), ...(updates || {}) }))}
        showToast={(message, type) => (
          notify[type === "error" ? "error" : type === "warning" ? "warning" : "success"](message)
        )}
        previewLessons={PUBLIC_TOOLS.study.previewLessons}
        embedded
        studyRoute={tab ? null : page}
        studySub={tab ? null : sub}
        // Khoá học treo ở /study/<khoá>; thư viện đứng ở tab /study/khoa-hoc.
        // Hai địa chỉ này KHÁC nhau nên phải nói rõ, đừng để app tự suy từ
        // pathname — đứng ở tab mà suy thì gốc thành /study/khoa-hoc.
        studyBasePath="/study"
        studyHomePath="/study/khoa-hoc"
        onBack={() => navigate("/study/khoa-hoc")}
      />
    </Suspense>
  );

  if (sub) {
    return (
      <div className="cine-root hugo-learning-shell">
        <style>{CINE_CSS}</style>
        {learningView}
      </div>
    );
  }

  return (
    <LearningShell tab={tab ? tab.slug : null} signedIn={signedIn}>
      {learningView}
    </LearningShell>
  );
}

/** Vỏ chung: thanh thương hiệu + tab-bar của riêng Hugo Learning. */
function LearningShell({ tab, signedIn, children }) {
  return (
    <div className="cine-root hugo-learning-shell">
      {/* Ngôn ngữ thị giác của Hugo Studio nạp Ở ĐÂY, không trong từng màn: mọi
          màn của /study — thư viện, tiến độ, tài khoản, đăng nhập — đều nằm
          trong vỏ này, nên biến `--cine-*` có mặt ở khắp nơi thay vì chỉ ở
          trang giới thiệu. */}
      <style>{CINE_CSS}</style>
      <header className="learning-bar">
        {/* Logo là CHỮ: tên dịch vụ to, "by Hugo Studio" nhỏ nép góc phải trên
            như một chỉ số. Cùng màu với logo trang chủ — chữ dùng foreground,
            phần phụ dùng primary. */}
        <a className="learning-wordmark" href="/study" aria-label="Hugo Learning, một dịch vụ của Hugo Studio">
          <span className="learning-wordmark-name">Hugo Learning</span>
          <sup className="learning-wordmark-by">by Hugo Studio</sup>
        </a>
        <LearningTabBar active={tab} signedIn={signedIn} placement="top" />
      </header>
      {children}

      {/* Bản dưới đáy cho PWA và điện thoại — cùng dữ liệu, CSS chọn cái nào
          hiện theo bề ngang màn. */}
      <LearningTabBar active={tab} signedIn={signedIn} placement="bottom" />
    </div>
  );
}
