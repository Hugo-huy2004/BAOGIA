import { Link } from "react-router-dom";
import { BookOpen, Home, TrendingUp, UserRound } from "lucide-react";
import { COURSE_CATALOG, completedInCourse } from "../../../shared/courseCatalog";
import { logoutAuth } from "../../services/authSession";

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

/** Tài khoản: thông tin, trạng thái quyền truy cập, đăng xuất. */
export function LearningAccount({ learner, onSignOut }) {
  // Email trường được duyệt mở quyền dài hạn; email thường dùng thử 30 ngày cho
  // tới khi hồ sơ xác minh được duyệt. Đây là cùng một luật với Hugo Studio.
  const eduVerified = Boolean(learner?.isEduVerified);
  const pending = learner?.verificationRequest?.submitted && !eduVerified;

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
      </div>

      <dl className="learning-account-facts">
        <dt>Quyền truy cập</dt>
        <dd>
          {eduVerified
            ? "Đã xác thực email trường học — quyền truy cập dài hạn."
            : pending
              ? "Hồ sơ xác minh đã gửi, đang chờ duyệt. Trong lúc chờ bạn dùng bản 30 ngày."
              : "Đang dùng bản 30 ngày. Gửi hồ sơ xác minh học sinh – sinh viên để mở quyền dài hạn."}
        </dd>
        <dt>Tài khoản</dt>
        <dd>Dùng chung với Hugo Studio. Đổi thông tin ở một nơi là áp dụng cho cả hai.</dd>
        <dt>Dữ liệu học</dt>
        <dd>Tiến độ, điểm thi và chứng nhận lưu theo tài khoản này.</dd>
      </dl>

      <div className="landing-cta">
        <Link className="landing-btn landing-btn--primary" to="/member/account">Quản lý tài khoản</Link>
        <button
          type="button"
          className="landing-btn"
          onClick={onSignOut}
        >
          Đăng xuất
        </button>
      </div>
    </section>
  );
}
