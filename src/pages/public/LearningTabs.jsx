import { Link } from "react-router-dom";
import { BookOpen, Home, TrendingUp, UserRound } from "lucide-react";
import { COURSE_CATALOG, completedInCourse } from "../../../shared/courseCatalog";
import { detectInstallTarget, isStandalone } from "../../config/platform";

/**
 * Bốn tab của Hugo Learning, cùng phần "Tiến độ" và "Tài khoản".
 *
 * Ba tab sau cần đăng nhập. Đăng nhập dùng CHUNG tài khoản Hugo Studio — dữ liệu
 * tài khoản là một, chỉ vỏ dịch vụ tách riêng.
 *
 * Slug của tab là TỪ DÀNH RIÊNG trong địa chỉ: `/study/tien-do` là tab, còn
 * `/study/calendar` là một khoá. `check-course-catalog.mjs` canh để không bao
 * giờ có khoá nào trùng slug tab — trùng thì khoá đó vĩnh viễn không mở được.
 */
export const LEARNING_TABS = Object.freeze([
  { slug: "", label: "Giới thiệu", auth: false, Icon: Home },
  { slug: "khoa-hoc", label: "Khoá học", auth: true, Icon: BookOpen },
  { slug: "tien-do", label: "Tiến độ", auth: true, Icon: TrendingUp },
  { slug: "tai-khoan", label: "Tài khoản", auth: true, Icon: UserRound },
]);

/** Màn có địa chỉ riêng nhưng KHÔNG hiện trên tab-bar. */
export const LEARNING_HIDDEN_SLUGS = Object.freeze(["login"]);

export const RESERVED_TAB_SLUGS = Object.freeze([
  ...LEARNING_TABS.map((tab) => tab.slug).filter(Boolean),
  ...LEARNING_HIDDEN_SLUGS,
]);

/**
 * Một khai báo tab, hai chỗ hiển thị:
 *   desktop  → nằm trong thanh đầu, cạnh logo
 *   PWA/điện thoại → thanh cố định dưới đáy, đúng tầm ngón cái
 *
 * Cùng một component render cả hai; CSS quyết định cái nào hiện. Viết hai
 * component riêng thì sớm muộn hai bên lệch nhau về số tab hoặc trạng thái.
 */
export function LearningTabBar({ active, signedIn, placement = "top" }) {
  return (
    <nav
      className={`learning-tabs is-${placement}`}
      aria-label="Khu vực Hugo Learning"
    >
      {LEARNING_TABS.map(({ slug, label, auth, Icon }) => {
        const to = slug ? `/study/${slug}` : "/study";
        // `active === null` nghĩa là đang ở màn không thuộc tab nào (đăng nhập,
        // bản đồ khoá) — lúc đó không tab nào được sáng.
        const isActive = active !== null && active === slug;
        return (
          <Link
            key={slug || "gioi-thieu"}
            to={to}
            className={isActive ? "is-active" : ""}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="learning-tab-icon" aria-hidden="true" />
            <span className="learning-tab-label">{label}</span>
            {/* Nói trước tab nào cần đăng nhập, thay vì để người dùng bấm vào
                rồi mới gặp tường chắn. */}
            {auth && !signedIn && <span className="learning-tab-lock" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Tiến độ của MỌI khoá — danh mục tự dựng nên khoá mới có mặt ngay. */
export function LearningProgress({ learner }) {
  const completed = learner?.completedLessons || [];

  const rows = COURSE_CATALOG.map((course) => {
    const done = completedInCourse(course, completed).length;
    return {
      course,
      done,
      total: course.lessonIds.length,
      percent: course.lessonIds.length ? Math.round((done / course.lessonIds.length) * 100) : 0,
    };
  });

  const doneAll = rows.reduce((sum, row) => sum + row.done, 0);
  const totalAll = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <section className="learning-panel">
      <p className="landing-eyebrow">Tiến độ</p>
      <h2>Bạn đang ở đâu</h2>

      <div className="learning-summary">
        <div><dt>Đã hoàn thành</dt><dd>{doneAll}</dd></div>
        <div><dt>Tổng số bài</dt><dd>{totalAll}</dd></div>
        <div><dt>Khoá đang mở</dt><dd>{rows.filter((row) => row.done > 0 && row.done < row.total).length}</dd></div>
      </div>

      <ul className="learning-progress-list">
        {rows.map(({ course, done, total, percent }) => (
          <li key={course.id}>
            <Link to={`/study/${course.id}`}>
              <span className="learning-course-code">{course.code}</span>
              <span className="learning-course-name">{course.title}</span>
              <span className="learning-course-count">{done}/{total} bài</span>
              <span className="learning-course-bar">
                <i style={{ width: `${percent}%` }} />
              </span>
              <b>{percent}%</b>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Tài khoản: hồ sơ, các liên kết của tài khoản, quyền truy cập, đăng xuất.
 *
 * Đây là màn trả lời "tài khoản này là cái gì, nối với đâu": Hugo Learning
 * không có tài khoản riêng, nó mượn tài khoản Hugo Studio, và tài khoản đó lại
 * đăng nhập bằng Google. Nói thẳng chuỗi liên kết đó ra, kèm nút gỡ (đăng
 * xuất), thay vì để người học đoán.
 */
export function LearningAccount({ learner, onSignOut }) {
  // Email trường được duyệt mở quyền dài hạn; email thường dùng thử 30 ngày cho
  // tới khi hồ sơ xác minh được duyệt. Đây là cùng một luật với Hugo Studio.
  const eduVerified = Boolean(learner?.isEduVerified);
  const pending = learner?.verificationRequest?.submitted && !eduVerified;
  const access = eduVerified
    ? { tone: "ok", label: "Dài hạn", body: "Đã xác thực email trường học — quyền truy cập dài hạn." }
    : pending
      ? { tone: "wait", label: "Chờ duyệt", body: "Hồ sơ xác minh đã gửi, đang chờ duyệt. Trong lúc chờ bạn vẫn học bằng bản 30 ngày." }
      : { tone: "trial", label: "Bản 30 ngày", body: "Gửi hồ sơ xác minh học sinh – sinh viên để mở quyền dài hạn." };

  // Trên trình duyệt điện thoại, /member/* bị thay bằng hướng dẫn cài app
  // (MobileInstallGate). Nói trước điều đó ngay trên nhãn nút, thay vì để người
  // học bấm vào rồi rơi vào một màn không liên quan tới việc học.
  const needsApp = detectInstallTarget().isMobile && !isStandalone();

  // MỘT CHIỀU, CÓ CHỦ Ý: Hugo Studio mở thẳng được Hugo Learning, nhưng chiều
  // ngược lại thì không. Từ đây là đi qua trang đăng nhập của Hugo Studio chứ
  // KHÔNG nhảy thẳng vào trang hồ sơ — máy công cộng hay máy mượn thì phiên học
  // không tự biến thành quyền vào ví và giấy tờ tuỳ thân.
  //
  // Mở TAB MỚI bằng thẻ <a>, không dùng <Link>: Hugo Studio là một app riêng,
  // rời khỏi nó không được làm mất chỗ đang học ở đây. Đừng đổi thành liên kết
  // thẳng tới /member/account.
  const profileHref = `/login?redirect=${encodeURIComponent("/member/account")}`;

  return (
    <section className="learning-panel">
      <p className="landing-eyebrow">Tài khoản</p>
      <h2>Hồ sơ học viên</h2>

      <div className="learning-account-card">
        <div className="learning-avatar" aria-hidden="true">
          {learner?.avatarUrl
            ? <img src={learner.avatarUrl} alt="" />
            : <span>{(learner?.displayName || "?").slice(0, 1).toUpperCase()}</span>}
        </div>
        <div>
          <strong>{learner?.displayName || "Học viên"}</strong>
          <span>{learner?.email}</span>
        </div>
        <span className={`learning-access learning-access--${access.tone}`}>{access.label}</span>
      </div>

      <h3 className="learning-subhead">Liên kết tài khoản</h3>
      <ul className="learning-links">
        <li>
          <span className="material-symbols-outlined" aria-hidden="true">hub</span>
          <div>
            <strong>Hugo Studio</strong>
            <span>Tài khoản chính. Hugo Learning dùng chung hồ sơ, ví và quyền truy cập với nó — đổi thông tin ở một nơi là áp dụng cho cả hai.</span>
          </div>
          <b className="learning-linked">Đã liên kết</b>
        </li>
        <li>
          <span className="material-symbols-outlined" aria-hidden="true">key</span>
          <div>
            <strong>Google</strong>
            <span>Cách bạn đăng nhập. Google chỉ chuyển tên, email và ảnh đại diện; Hugo Studio không giữ mật khẩu của bạn.</span>
          </div>
          <b className="learning-linked">{learner?.email || "Đã liên kết"}</b>
        </li>
      </ul>

      <h3 className="learning-subhead">Quyền truy cập &amp; dữ liệu</h3>
      <dl className="learning-account-facts">
        <dt>Quyền truy cập</dt>
        <dd>{access.body}</dd>
        <dt>Dữ liệu học</dt>
        <dd>Tiến độ, điểm thi và chứng nhận lưu theo tài khoản này, không theo thiết bị.</dd>
        <dt>Gỡ liên kết</dt>
        <dd>Đăng xuất chỉ gỡ liên kết trên thiết bị này. Muốn xoá hẳn tài khoản và dữ liệu học, gửi yêu cầu ở trang Hỗ trợ.</dd>
        <dt>Vào trang hồ sơ</dt>
        <dd>Hugo Studio là một app riêng và Hugo Learning KHÔNG mang phiên đăng nhập sang đó. Nút bên dưới mở Hugo Studio ở tab mới và bạn đăng nhập lại một lần nữa — cố ý như vậy để phiên học trên máy lạ không mở luôn được ví và thông tin cá nhân. Chỗ đang học ở tab này vẫn còn nguyên.</dd>
      </dl>

      <div className="landing-cta">
        <a
          className="landing-btn landing-btn--primary"
          href={profileHref}
          target="_blank"
          rel="noopener"
        >
          {needsApp ? "Mở Hugo Studio trong app" : "Mở Hugo Studio để quản lý"}
        </a>
        <Link className="landing-btn" to="/support-request">Yêu cầu hỗ trợ</Link>
        <button type="button" className="landing-btn" onClick={onSignOut}>
          Đăng xuất
        </button>
      </div>
    </section>
  );
}
