import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, GraduationCap, Heart, ShieldCheck, Sparkles } from "lucide-react";
import CodeHeroFilm from "../../components/public/CodeHeroFilm";
import {
  ACCENT,
  AboutCard,
  CineSectionHeading,
  INK,
  PillButton,
  ScrollRevealParagraph,
  useCineScrollSnap,
  WordsPullUp,
  WordsPullUpMultiStyle,
} from "../../components/public/cineKit";
import { COURSE_CATALOG } from "../../../shared/courseCatalog";
import "./study-landing.css";

/**
 * Hugo Learning — trang giới thiệu công khai.
 *
 * Dùng CHUNG bộ primitive điện ảnh với Introduction và Services (cineKit +
 * CodeHeroFilm), nên đây vẫn là một trang Hugo Studio về mặt thị giác, chỉ khác
 * ở chỗ nó là một dịch vụ đứng riêng. Không dựng ngôn ngữ hình ảnh thứ hai.
 *
 * Hai ràng buộc về nội dung:
 *
 * 1. KHÔNG tiết lộ dạy gì. Trang nói kỹ về CÁCH học và cách đánh giá, không
 *    liệt kê chủ đề hay tên bài — nội dung chỉ mở sau khi đăng nhập.
 *
 * 2. Đây là dự án PHI LỢI NHUẬN. Không tự nhận là cơ sở giáo dục được cấp phép,
 *    không gọi chứng nhận là văn bằng, không cam kết việc làm hay thu nhập, và
 *    nói rõ khoản ủng hộ là tự nguyện chứ không phải học phí.
 *
 * Số liệu lấy từ `COURSE_CATALOG` — thêm khoá mới là trang tự cập nhật.
 */
const METHOD = [
  {
    step: "01",
    title: "Một bước, một màn hình",
    body: "Bài học không đổ ra thành một trang dài. Mỗi màn chỉ có một ý và một nút đi tiếp, nên bạn luôn biết mình đang ở đâu và còn bao xa nữa.",
  },
  {
    step: "02",
    title: "Làm trên công cụ thật",
    body: "Phần thực hành yêu cầu bạn tự thao tác rồi nộp lại bằng chứng bằng chính lời của mình. Không có nút “đã hiểu” để bấm cho xong.",
  },
  {
    step: "03",
    title: "Kiểm tra ngay khi còn nhớ",
    body: "Sai ở đâu thì thấy đáp án đúng ngay tại đó, không dồn xuống cuối bài. Phương án được xáo mỗi lượt nên không đoán được theo vị trí.",
  },
  {
    step: "04",
    title: "Bài thi do máy chủ chấm",
    body: "Đề rút theo cơ cấu cố định và đáp án không gửi xuống máy bạn. Thi lại thì nhận đề khác, và điểm lần đầu luôn được ghi lại.",
  },
  {
    step: "05",
    title: "Học lại bao nhiêu lần cũng được",
    body: "Bài đã xong vẫn mở. Tiến độ lưu theo tài khoản nên đổi máy hay đóng trình duyệt giữa chừng đều không mất.",
  },
  {
    step: "06",
    title: "Góp ý gửi thẳng người soạn bài",
    body: "Mỗi bước đều có nút góp ý. Chỗ nào khó hiểu hoặc sai, bạn nói ngay lúc vấp chứ không phải nhớ để phản ánh sau.",
  },
];

const GRADES = [
  { key: "excellent", label: "Xuất sắc", from: "từ 90 điểm" },
  { key: "great", label: "Giỏi", from: "từ 80 điểm" },
  { key: "good", label: "Khá", from: "từ 70 điểm" },
  { key: "pass", label: "Đạt", from: "từ 60 điểm" },
];

const FAQ = [
  {
    q: "Học có mất phí không?",
    a: "Có phần học được ngay không cần tài khoản. Phần còn lại cần đăng nhập, và một số học phần cần mở khoá bằng JOY — đơn vị quy đổi trong nội bộ nền tảng. Trang này không bán khoá học và không thu học phí.",
  },
  {
    q: "Vì sao không nói rõ nội dung dạy gì ở ngoài này?",
    a: "Giáo trình do Hugo Studio biên soạn và chỉ mở cho người học đã đăng nhập. Ở ngoài, chúng tôi nói kỹ về cách học và cách đánh giá để bạn quyết định có hợp với mình không.",
  },
  {
    q: "Cần chuẩn bị gì?",
    a: "Một thiết bị vào được Internet và một tài khoản Hugo Studio. Một số phần thực hành cần bạn thao tác trên công cụ miễn phí sẵn có; bạn tự đăng ký và tự chịu trách nhiệm với tài khoản của mình ở các dịch vụ đó.",
  },
  {
    q: "Ai được tham gia?",
    a: "Nền tảng dành cho người từ 14 tuổi. Người dưới 18 tuổi cần có sự đồng ý và giám sát của cha mẹ hoặc người giám hộ.",
  },
  {
    q: "Dữ liệu của tôi được dùng thế nào?",
    a: "Chỉ để vận hành việc học: lưu tiến độ, chấm bài và cấp chứng nhận. Chi tiết nằm trong Chính sách bảo mật.",
  },
  {
    q: "Tôi muốn góp nội dung hoặc báo lỗi bài học?",
    a: "Mỗi bước học đều có nút góp ý gửi thẳng tới người soạn bài. Ngoài ra bạn có thể liên hệ qua trang Hỗ trợ.",
  },
];

const LEGAL = [
  {
    title: "Không phải cơ sở giáo dục được cấp phép",
    body: "Hugo Learning là một dự án cá nhân, phi lợi nhuận thuộc Hugo Studio. Đây không phải trường học, trung tâm ngoại ngữ – tin học hay cơ sở đào tạo được cơ quan quản lý cấp phép, và không tuyển sinh theo bất kỳ chương trình chính quy nào.",
  },
  {
    title: "Không cam kết kết quả",
    body: "Chúng tôi không hứa hẹn việc làm, mức thu nhập hay tỷ lệ đỗ. Kết quả phụ thuộc vào thời gian và nỗ lực của từng người học.",
  },
  {
    title: "Nội dung do Hugo Studio biên soạn",
    body: "Giáo trình là nội dung độc quyền của Hugo Studio, có trích dẫn nguồn theo chuẩn Harvard. Vui lòng không sao chép, phát tán lại khi chưa được đồng ý.",
  },
  {
    title: "Thương hiệu của bên thứ ba",
    body: "Một số phần thực hành hướng dẫn thao tác trên công cụ của các nhà cung cấp khác. Tên và thương hiệu của họ thuộc về họ; việc nhắc tới chỉ nhằm mô tả, không hàm ý liên kết hay được bảo trợ.",
  },
  {
    title: "Độ tuổi",
    body: "Nền tảng dành cho người từ 14 tuổi. Người dưới 18 tuổi cần có sự đồng ý của cha mẹ hoặc người giám hộ khi tạo tài khoản.",
  },
  {
    title: "Dữ liệu cá nhân",
    body: "Chúng tôi chỉ thu thập dữ liệu cần cho việc học và không bán dữ liệu cho bên thứ ba.",
  },
];

const DONATE_TERMS = [
  ["Hoàn toàn tự nguyện.", "Không ủng hộ vẫn dùng đầy đủ như mọi người."],
  ["Không phải học phí.", "Ủng hộ không mở thêm bài, không nâng điểm, không đổi được chứng nhận."],
  ["Không hoàn lại.", "Đây là khoản tặng cho, không phải giao dịch mua bán hàng hoá hay dịch vụ."],
  ["Không được khấu trừ thuế.", "Hugo Studio không phải quỹ từ thiện đã đăng ký nên không cấp chứng từ thuế."],
  ["Dùng cho vận hành.", "Tiền ủng hộ chi cho máy chủ, tên miền và các dịch vụ giữ nền tảng hoạt động."],
];

const ECOSYSTEM = [
  {
    Icon: Sparkles,
    title: "Một tài khoản",
    body: "Đăng nhập Hugo Studio một lần là dùng được cả Hugo Learning và các sản phẩm khác trong hệ sinh thái.",
  },
  {
    Icon: ShieldCheck,
    title: "Một chuẩn dữ liệu",
    body: "Hồ sơ, quyền truy cập và chính sách bảo mật áp dụng thống nhất, không có bộ luật riêng cho từng sản phẩm.",
  },
  {
    Icon: GraduationCap,
    title: "Một nơi chịu trách nhiệm",
    body: "Nội dung, chứng nhận và vận hành đều do Hugo Studio đứng tên và chịu trách nhiệm.",
  },
];

export default function StudyLandingPage() {
  const { t } = useTranslation();

  const stats = useMemo(() => ([
    { label: "Khoá học", value: COURSE_CATALOG.length },
    { label: "Bài học", value: COURSE_CATALOG.reduce((sum, c) => sum + c.lessonIds.length, 0) },
    { label: "Chặng", value: COURSE_CATALOG.reduce((sum, c) => sum + c.stages.length, 0) },
  ]), []);

  // Trượt từng màn — dùng lại đúng cơ chế của Introduction/Services thay vì
  // tự viết: mỗi mục chiếm một màn, cuộn là bám vào mục kế tiếp.
  useCineScrollSnap(true);

  const donate = () => window.dispatchEvent(new CustomEvent("open-donation"));

  return (
    <div className="cine-root learning-landing relative min-h-screen overflow-x-hidden">
      {/* Mở đầu — dùng chung phim nền dựng bằng code với Introduction/Services,
          nên Hugo Learning vẫn trông là một trang Hugo Studio. */}
      <section className="ios-hero studio-cover studio-cover--intro" id="gioi-thieu">
        <div className="studio-cover-film-shell">
          <CodeHeroFilm variant="code" />
        </div>

        <div className="code-film-content studio-cover-grid grid items-center gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div className="studio-cover-copy max-w-3xl">
            <p className="ios-kicker mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Dự án phi lợi nhuận · Hugo Studio
            </p>

            <h1
              className="text-[clamp(2.2rem,5.4vw,4.8rem)] font-extrabold leading-[1.05] tracking-[-0.04em]"
              style={{ color: INK, fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}
            >
              <WordsPullUp text="Học theo lộ trình." />
              <span className="block cine-grad">
                <WordsPullUp text="Đánh giá bằng bài làm." />
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm sm:text-base leading-relaxed" style={{ color: INK }}>
              Hugo Learning là nơi tự học có hướng dẫn: bài đi từng bước, thực hành trên công cụ
              thật, và kết quả được đánh giá bằng bài làm chứ không bằng thời gian ngồi xem.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PillButton to="/study/login" Icon={ArrowRight}>Tạo tài khoản / Đăng nhập</PillButton>
              <button type="button" className="learning-ghost-pill" onClick={donate}>
                <Heart className="h-4 w-4" aria-hidden="true" />
                Ủng hộ máy chủ
              </button>
            </div>

            <dl className="learning-stats mt-9">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="learning-slide px-4 md:px-6" id="cach-hoc">
        <div className="mx-auto w-full max-w-6xl">
          <CineSectionHeading
          eyebrow="Cách học"
          title="Sáu điều làm nên"
          highlight="một buổi học ở đây"
          desc="Chúng tôi không nói trước bạn sẽ học chủ đề gì — phần đó mở ra sau khi đăng nhập. Nhưng cách học thì nói rõ ngay từ đầu, để bạn biết mình sắp bước vào việc gì."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METHOD.map((item) => (
            <article key={item.step} className="cine-card-bg cine-border-c learning-card border">
              <span className="learning-step">{item.step}</span>
              <h3 style={{ color: INK }}>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        </div>
      </section>

      <section className="learning-slide px-4 md:px-6" id="chung-nhan">
        <AboutCard className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 py-12 sm:py-16 space-y-6">
          <p className="ios-kicker"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Chứng nhận</p>
          <h2
            className="max-w-3xl text-2xl font-extrabold leading-[1.12] tracking-[-0.03em] sm:text-3xl md:text-4xl"
            style={{ color: INK }}
          >
            <WordsPullUpMultiStyle
              segments={[
                { text: "Một tờ giấy", className: "font-normal" },
                { text: "nói đúng năng lực.", className: "cine-serif cine-grad" },
              ]}
            />
          </h2>
          <ScrollRevealParagraph
            text="Hoàn thành một chặng thì nhận giấy chứng nhận có điểm số và xếp loại, kèm phần phân tích cho biết điểm đến từ đâu: bài thi, mức hoàn thành, và bạn có đỗ ngay lần đầu hay không. Mỗi giấy có một địa chỉ công khai để người khác tự kiểm."
            className="max-w-3xl text-xs sm:text-sm md:text-base leading-relaxed"
            style={{ color: INK }}
          />

          <div className="flex flex-wrap gap-2.5">
            {GRADES.map((grade) => (
              <span key={grade.key} className={`learning-grade is-${grade.key}`}>
                <b>{grade.label}</b>
                <small>{grade.from}</small>
              </span>
            ))}
          </div>

          {/* Ranh giới pháp lý quan trọng nhất — đứng ngay cạnh phần chứng nhận,
              không giấu xuống cuối trang. */}
          <p className="learning-note">
            Giấy chứng nhận do Hugo Studio cấp để ghi nhận kết quả học trên nền tảng. Đây
            <strong> không phải văn bằng, chứng chỉ quốc gia</strong> và không thay thế bằng cấp do
            cơ sở giáo dục được cấp phép cấp.
          </p>
        </AboutCard>
      </section>

      {/* Về mình — dùng ĐÚNG nội dung của trang Introduction (cùng khoá i18n),
          nên sửa một nơi là hai trang cùng đổi. */}
      <section className="learning-slide px-4 md:px-6" id="ve-minh">
        <AboutCard className="mx-auto max-w-6xl px-6 sm:px-10 md:px-16 py-14 sm:py-20 text-center space-y-8">
          <p className="ios-kicker mx-auto">{t("intro.cine.aboutLabel")}</p>
          <h2
            className="mx-auto max-w-3xl text-2xl font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-3xl md:text-4xl"
            style={{ color: INK }}
          >
            <WordsPullUpMultiStyle
              segments={[
                { text: t("intro.cine.aboutH1"), className: "font-normal" },
                { text: t("intro.cine.aboutH2"), className: "cine-serif cine-grad" },
                { text: t("intro.cine.aboutH3"), className: "font-normal" },
              ]}
            />
          </h2>
          <ScrollRevealParagraph
            text={t("intro.partners.desc")}
            className="mx-auto max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed"
            style={{ color: INK }}
          />
          <div className="flex justify-center">
            <PillButton to="/introduction" Icon={ArrowRight}>Xem hồ sơ đầy đủ</PillButton>
          </div>
        </AboutCard>
      </section>

      <section className="learning-slide px-4 md:px-6" id="he-sinh-thai">
        <div className="mx-auto w-full max-w-6xl">
          <CineSectionHeading
          eyebrow="Hệ sinh thái"
          title="Hugo Learning trực thuộc"
          highlight="Hugo Studio"
          desc="Hugo Studio là nơi mình xây và vận hành các sản phẩm số của riêng mình — từ trang cá nhân, tiện ích, trò chơi cho tới nền tảng học tập này. Hugo Learning là mảng giáo dục của hệ sinh thái đó."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {ECOSYSTEM.map(({ Icon, title, body }) => (
            <article key={title} className="cine-card-bg cine-border-c learning-card border">
              <span className="learning-eco-icon"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <h3 style={{ color: INK }}>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        </div>
      </section>

      <section className="learning-slide px-4 md:px-6" id="cau-hoi">
        <div className="mx-auto w-full max-w-6xl">
          <CineSectionHeading
          eyebrow="Câu hỏi thường gặp"
          title="Những điều nên biết"
          highlight="trước khi bắt đầu"
        />
        <div className="mt-8 grid max-w-4xl gap-2.5">
          {FAQ.map((item) => (
            <details key={item.q} className="cine-card-bg cine-border-c learning-faq border">
              <summary style={{ color: INK }}>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        </div>
      </section>

      <section className="learning-slide px-4 md:px-6" id="ung-ho">
        <AboutCard className="mx-auto max-w-4xl px-6 sm:px-10 md:px-14 py-12 sm:py-16 space-y-6">
          <p className="ios-kicker"><Heart className="h-3.5 w-3.5" aria-hidden="true" /> Ủng hộ</p>
          <h2 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl" style={{ color: INK }}>
            Giữ máy chủ chạy
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed" style={{ color: INK }}>
            Nền tảng này không bán khoá học và không chạy quảng cáo. Chi phí máy chủ, tên miền và
            dịch vụ gửi thư do người vận hành tự chi trả. Nếu thấy có ích, bạn có thể ủng hộ.
          </p>
          <ul className="learning-terms">
            {DONATE_TERMS.map(([head, rest]) => (
              <li key={head}><strong style={{ color: INK }}>{head}</strong> {rest}</li>
            ))}
          </ul>
          <button type="button" className="learning-ghost-pill" onClick={donate}>
            <Heart className="h-4 w-4" aria-hidden="true" />
            Ủng hộ máy chủ
          </button>
        </AboutCard>
      </section>

      <section className="learning-slide px-4 md:px-6" id="phap-ly">
        <div className="mx-auto w-full max-w-6xl">
          <CineSectionHeading
          eyebrow="Minh bạch & pháp lý"
          title="Chúng tôi là gì"
          highlight="và không là gì"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEGAL.map((item) => (
            <article key={item.title} className="cine-card-bg cine-border-c learning-card border">
              <h3 style={{ color: INK }}>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <p className="learning-note mx-auto mt-6 max-w-4xl">
          Mục này mô tả cách dự án vận hành, không phải tư vấn pháp lý. Nếu bạn định mở rộng thành
          hoạt động có thu, hãy hỏi ý kiến luật sư trước. Xem thêm{" "}
          <Link to="/privacy-policy" style={{ color: ACCENT }}>Chính sách bảo mật</Link> và{" "}
          <Link to="/terms" style={{ color: ACCENT }}>Điều khoản sử dụng</Link>.
        </p>
        </div>
      </section>

      <section className="learning-slide px-4 md:px-6">
        <AboutCard className="mx-auto max-w-4xl px-6 py-14 text-center space-y-5">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl" style={{ color: INK }}>
            Sẵn sàng bắt đầu?
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed" style={{ color: INK }}>
            Tạo tài khoản Hugo Studio để mở nội dung từng khoá và theo dõi tiến độ. Email trường học
            được duyệt sẽ mở quyền dài hạn; email thường dùng thử 30 ngày.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <PillButton to="/study/login" Icon={ArrowRight}>Tạo tài khoản / Đăng nhập</PillButton>
            <Link className="learning-ghost-pill" to="/support-request">Liên hệ hỗ trợ</Link>
          </div>
        </AboutCard>
      </section>

      <footer className="learning-footer">
        <div>
          <strong style={{ color: INK }}>Hugo Learning</strong>
          <p>Dự án học tập phi lợi nhuận thuộc Hugo Studio. Không bán khoá học, không chạy quảng cáo.</p>
        </div>
        <nav aria-label="Liên kết chân trang">
          <Link to="/study/login">Đăng nhập bằng Hugo Studio</Link>
          <Link to="/introduction">Về Hugo Studio</Link>
          <Link to="/privacy-policy">Chính sách bảo mật</Link>
          <Link to="/terms">Điều khoản sử dụng</Link>
          <Link to="/support-request">Hỗ trợ</Link>
        </nav>
        <p className="learning-copyright">
          © {new Date().getFullYear()} Hugo Studio. Giáo trình và nội dung trên trang này thuộc bản
          quyền của Hugo Studio.
        </p>
      </footer>
    </div>
  );
}
