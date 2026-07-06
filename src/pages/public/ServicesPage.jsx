import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bolt,
  Bot,
  Boxes,
  Check,
  ChevronDown,
  Code2,
  Gauge,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  MessageCircle,
  MonitorSmartphone,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useHeadMeta } from "../../hooks/useHeadMeta";

function useJsonLd(id, schema) {
  useEffect(() => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
    return () => document.getElementById(id)?.remove();
  }, [id, schema]);
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const reveal = {
  variants: fadeUp,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-72px" },
};

const brandGradient =
  "bg-gradient-to-r from-primary via-accent to-warning";
const introBadge =
  "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]";

const plans = [
  {
    id: "fix",
    icon: Wrench,
    label: "Sửa nhanh",
    name: "Sửa web có sẵn",
    price: "Từ 150.000đ",
    note: "Bug giao diện, thêm nội dung, gắn tiện ích, deploy, tên miền.",
    desc: "Dành cho website đang chạy nhưng cần chỉnh đúng một số việc nhỏ, làm nhanh và báo trước phạm vi.",
    glow: "shadow-primary/25",
    tint: "from-primary/10 via-info/10 to-accent/10",
    ring: "ring-primary/20",
    href: "#fix",
    features: ["Sửa lỗi hiển thị mobile", "Thêm form, chat, maps", "Deploy và gắn domain", "Chỉnh SEO cơ bản"],
  },
  {
    id: "seo",
    icon: Gauge,
    label: "Tối ưu",
    name: "SEO & tăng tốc",
    price: "Từ 890.000đ",
    note: "Phù hợp web React/Next.js hoặc website đang chậm, khó lên Google.",
    desc: "Dọn lại hiệu suất, metadata, trải nghiệm mobile và các điểm kỹ thuật khiến khách thoát trang.",
    glow: "shadow-info/25",
    tint: "from-info/10 via-primary/10 to-accent/10",
    ring: "ring-info/20",
    href: "#fix",
    features: ["Tối ưu tốc độ tải", "Metadata chia sẻ đẹp", "Báo cáo dễ hiểu", "Gợi ý bước tiếp theo"],
  },
  {
    id: "landing",
    icon: Rocket,
    label: "Bắt đầu",
    name: "Landing page 1 trang",
    price: "Từ 690.000đ",
    note: "Gọn, nhanh, đủ để giới thiệu sản phẩm, CV, dịch vụ hoặc chiến dịch.",
    desc: "Một trang web rõ mục tiêu, có CTA mạnh, hiển thị đẹp trên điện thoại và dễ chia sẻ.",
    glow: "shadow-accent/25",
    tint: "from-accent/10 via-primary/10 to-warning/10",
    ring: "ring-accent/20",
    href: "#build",
    featured: true,
    features: ["Thông điệp rõ ngay màn đầu", "Form hoặc nút liên hệ", "Tối ưu mobile", "Tự đổi nội dung cơ bản"],
  },
  {
    id: "website",
    icon: Layers3,
    label: "Mở rộng",
    name: "Website nhiều trang",
    price: "Từ 1.900.000đ",
    note: "Giá chốt theo số trang, nội dung, mức chỉnh sửa và độ hoàn thiện cần có.",
    desc: "Dành cho shop nhỏ, quán, thương hiệu cá nhân hoặc dịch vụ cần nơi giới thiệu đáng tin hơn mạng xã hội.",
    glow: "shadow-primary/25",
    tint: "from-primary/10 via-accent/10 to-info/10",
    ring: "ring-primary/20",
    href: "#build",
    features: ["Trang giới thiệu, dịch vụ, liên hệ", "Cấu trúc dễ tìm kiếm", "Nội dung dễ cập nhật", "Mở rộng được về sau"],
  },
  {
    id: "system",
    icon: LayoutDashboard,
    label: "Hệ thống",
    name: "Website có tính năng động",
    price: "Từ 6.900.000đ",
    note: "Dự án có thanh toán, dashboard hoặc nhiều vai trò thường từ 12-20 triệu.",
    desc: "Khi bạn cần form đặt lịch, đăng nhập thành viên, quản trị nội dung hoặc kết nối API.",
    glow: "shadow-success/25",
    tint: "from-success/10 via-info/10 to-primary/10",
    ring: "ring-success/20",
    href: "#app",
    features: ["Dashboard quản trị", "Form và luồng dữ liệu", "API hoặc Google Sheet", "Nền tảng React/Next.js"],
  },
];

const microServices = [
  [Code2, "Sửa bug giao diện", "Từ 150.000đ", "Nút không bấm, layout vỡ, lỗi hiển thị nhỏ."],
  [Palette, "Chỉnh màu và nội dung", "Từ 200.000đ", "Đổi chữ, ảnh, section hoặc style theo brand."],
  [MonitorSmartphone, "Làm đẹp mobile", "Từ 250.000đ", "Canh lại khoảng cách, chữ, CTA trên điện thoại."],
  [Boxes, "Gắn tiện ích web", "Từ 150.000đ", "Form, Zalo, Messenger, Maps, nút gọi nhanh."],
  [Bolt, "Deploy và tên miền", "Từ 250.000đ", "Đưa web lên mạng, gắn domain, kiểm tra SSL."],
  [Search, "SEO nhanh 1 trang", "Từ 200.000đ", "Title, description, ảnh chia sẻ, sitemap cơ bản."],
  [Gauge, "Tăng tốc web", "Từ 300.000đ", "Giảm tải nặng, tối ưu ảnh, cải thiện PageSpeed."],
  [ShieldCheck, "Bảo trì tháng", "Từ 300.000đ/tháng", "Sao lưu, sửa lỗi nhỏ và cập nhật nội dung."],
];

const freeServices = [
  [BadgeCheck, "Bio cá nhân", "Một trang giới thiệu bản thân, link mạng xã hội, học tập và portfolio nhỏ."],
  [GraduationCap, "Tiện ích học tập", "Công cụ ghi chú, hỏi đáp, tài nguyên và tiện ích phục vụ tự học."],
  [Bot, "Bot hỗ trợ cá nhân", "Hỏi nhanh, gợi ý cách học, nhắc việc và hỗ trợ nhu cầu cơ bản."],
  [MessageCircle, "Cộng đồng hỏi đáp", "Không gian hỏi bài, hỏi dự án và nhận định hướng trong khả năng hỗ trợ."],
];

const workSteps = [
  "Bạn gửi nhu cầu, web hiện tại hoặc ý tưởng.",
  "Mình tư vấn hướng làm và báo giá rõ trước.",
  "Chốt phạm vi, thời gian, tiến hành theo từng mốc.",
  "Bàn giao, hướng dẫn dùng và hỗ trợ chỉnh sửa nhỏ.",
];

const faqs = [
  ["Chi phí làm website là bao nhiêu?", "Landing page bắt đầu từ 690.000đ, website nhiều trang từ 1.900.000đ, web có tính năng động từ 6.900.000đ. Giá cuối tùy phạm vi và luôn được chốt trước khi làm."],
  ["Chưa có thiết kế thì có làm được không?", "Được. Bạn chỉ cần mô tả lĩnh vực, mục tiêu và vài trang tham khảo. Mình sẽ đề xuất cấu trúc nội dung, bố cục và hướng triển khai phù hợp."],
  ["Website có được tối ưu SEO không?", "Có. Các gói xây mới đều có metadata, cấu trúc nội dung, tốc độ và hiển thị chia sẻ cơ bản. Nếu cần xử lý sâu hơn, mình tách thành hạng mục tối ưu riêng."],
  ["Có hỗ trợ domain và hosting không?", "Có. Mình có thể tư vấn hoặc triển khai domain, hosting, SSL và deploy nếu bạn chưa có hạ tầng."],
  ["Sau bàn giao có hỗ trợ không?", "Có. Mình hướng dẫn sử dụng, giải đáp thắc mắc và xử lý lỗi phát sinh trong phạm vi đã chốt."],
];

function GlowIcon({ icon: Icon, className = "" }) {
  return (
    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg ${className}`}>
      <Icon size={20} strokeWidth={2.25} />
    </span>
  );
}

function SectionHeading({ eyebrow, title, desc }) {
  return (
    <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
      <span className={`inline-flex rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] ${introBadge}`}>
        {eyebrow}
      </span>
      <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{desc}</p>}
    </motion.div>
  );
}

function PlanCard({ plan }) {
  const Icon = plan.icon;
  return (
    <motion.article
      {...reveal}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-xl shadow-primary/5 ring-1 ${plan.ring} transition duration-300 hover:-translate-y-1 sm:p-6 ${plan.featured ? "md:-translate-y-3" : ""}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${plan.tint}`} />
      <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />
      {plan.featured && (
        <span className={`absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${introBadge}`}>
          Dễ bắt đầu
        </span>
      )}
      <div className="relative flex flex-1 flex-col">
        <GlowIcon icon={Icon} className={plan.glow} />
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{plan.label}</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-foreground">{plan.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.desc}</p>
        <p className="mt-5 text-3xl font-black tracking-tight text-foreground">{plan.price}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.note}</p>
        <ul className="mt-6 grid gap-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm font-medium leading-relaxed text-foreground/80">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                <Check size={13} strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
        <Link
          to="/booking"
          className="group relative mt-7 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground px-5 py-3 text-xs font-black uppercase tracking-wide text-background shadow-xl transition active:scale-95 hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)]"
        >
          <span className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${brandGradient}`} />
          <span className="relative">Trao đổi gói này</span>
          <ArrowRight className="relative" size={15} />
        </Link>
      </div>
    </motion.article>
  );
}

function MicroServiceGrid() {
  return (
    <motion.div {...reveal} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {microServices.map(([Icon, title, price, desc], index) => (
        <div key={title} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${plans[index % plans.length].tint}`} />
          <div className="relative">
            <GlowIcon icon={Icon} className={plans[index % plans.length].glow} />
            <h3 className="mt-4 text-sm font-black text-foreground">{title}</h3>
            <p className="mt-2 inline-flex rounded-full bg-background/80 px-3 py-1 text-xs font-black text-foreground ring-1 ring-border">{price}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function FreeStudentSection() {
  return (
    <motion.section {...reveal} id="student-free" className="mx-auto mt-10 max-w-7xl scroll-mt-24 px-4 sm:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-success/10 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-info/10 to-primary/10" />
        <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-success/30 bg-success/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-success shadow-[0_0_15px_hsl(var(--success)/0.16)]">
              Khác biệt Hugo Studio
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-5xl">Học sinh & Sinh viên được hỗ trợ miễn phí 100%.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Khu cộng đồng riêng dành cho người học: xác minh xong có thể dùng Bio cá nhân, tiện ích học tập, bot hỗ trợ và cộng đồng hỏi đáp.
            </p>
            <Link to="/student-benefits" className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-black uppercase tracking-wide text-background">
              Xem quyền lợi miễn phí
              <BadgeCheck size={16} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {freeServices.map(([Icon, title, desc]) => (
              <div key={title} className="rounded-3xl border border-border bg-background/55 p-4 backdrop-blur">
                <GlowIcon icon={Icon} className="shadow-success/25" />
                <h3 className="mt-4 text-sm font-black text-foreground">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function FaqSection() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section id="faq" className="mx-auto mt-20 max-w-5xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
      <SectionHeading eyebrow="FAQ" title="Hỏi nhanh - đáp thật" desc="Các câu hỏi phổ biến trước khi bắt đầu một dự án web với Hugo Studio." />
      <motion.div {...reveal} className="mt-10 space-y-3">
        {faqs.map(([title, content], index) => (
          <div key={title} className="overflow-hidden rounded-3xl border border-border bg-card">
            <button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center gap-4 p-5 text-left">
              <GlowIcon icon={MessageCircle} className={plans[index % plans.length].glow} />
              <span className="flex-1 text-sm font-black text-foreground sm:text-base">{title}</span>
              <ChevronDown size={18} className={`text-muted-foreground transition ${openFaq === index ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-all duration-300 ${openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:pl-20">{content}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

export default function ServicesPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const timer = setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timer);
  }, [hash]);

  useHeadMeta({
    title: "Bảng giá dịch vụ website đa sắc màu | Hugo Studio",
    description:
      "Bảng giá thiết kế website, landing page, sửa web, SEO, tăng tốc và web có tính năng động tại Hugo Studio. Báo giá rõ ràng, đa màu sắc, tối ưu mobile.",
    keywords:
      "bảng giá thiết kế website, dịch vụ website Hugo Studio, làm landing page, sửa web, tối ưu SEO, tăng tốc website, web động",
    canonicalUrl: "https://www.hugowishpax.studio/services",
  });

  const offerSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Dịch vụ thiết kế website Hugo Studio",
      provider: {
        "@type": "Person",
        name: "Peter Hugo Wishpax Lê",
        alternateName: "Hugo Studio",
      },
      areaServed: "VN",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Bảng giá dịch vụ website",
        itemListElement: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          description: plan.desc,
          url: `https://www.hugowishpax.studio/services${plan.href}`,
          priceCurrency: "VND",
        })),
      },
    }),
    []
  );

  useJsonLd("services-schema", offerSchema);
  useJsonLd("services-faq-schema", {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([title, content]) => ({
      "@type": "Question",
      name: title,
      acceptedAnswer: { "@type": "Answer", text: content },
    })),
  });

  return (
    <div className="relative w-full overflow-x-hidden pb-20 text-foreground">
      <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_8%_10%,hsl(var(--primary)/0.16),transparent_28%),radial-gradient(circle_at_92%_7%,hsl(var(--accent)/0.14),transparent_25%),radial-gradient(circle_at_48%_32%,hsl(var(--warning)/0.12),transparent_28%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-16">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mx-auto max-w-5xl text-center">
          <span className={`inline-flex rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] ${introBadge}`}>
            Hugo Studio pricing system
          </span>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Bảng giá dịch vụ web mới, đa sắc và dễ chọn hơn.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Mỗi gói được trình bày như một lộ trình rõ ràng: sửa nhỏ, tối ưu, landing page, website nhiều trang hoặc web có hệ thống. Icon đơn sắc phát quang, màu sắc đúng tinh thần Hugo Studio.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/booking" className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-foreground px-7 py-3.5 text-xs font-black uppercase tracking-wide text-background shadow-xl transition hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
              <span className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${brandGradient}`} />
              <span className="relative flex items-center gap-2">
                Nhắn nhu cầu hiện tại
                <ArrowRight size={16} />
              </span>
            </Link>
            <a href="#pricing" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border/50 bg-card/70 px-7 py-3.5 text-xs font-black uppercase tracking-wide text-foreground backdrop-blur transition hover:border-primary hover:text-primary">
              Xem bảng giá
              <ChevronDown size={16} />
            </a>
          </div>
        </motion.div>
      </section>

      <FreeStudentSection />

      <section id="pricing" className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
        <SectionHeading
          eyebrow="Bảng giá"
          title="Chọn theo đúng tình trạng hiện tại của web"
          desc="Giá hiển thị là mức bắt đầu. Khi có phạm vi cụ thể, mình chốt rõ hạng mục, thời gian và phần bàn giao trước khi triển khai."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      <section id="fix" className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
        <SectionHeading
          eyebrow="Việc nhỏ"
          title="Các hạng mục nhanh cho website đã có"
          desc="Phần này giúp khách không phải mua gói lớn khi chỉ cần sửa đúng vài điểm."
        />
        <div className="mt-10">
          <MicroServiceGrid />
        </div>
      </section>

      <section id="build" className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch">
          <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:p-8">
            <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />
            <GlowIcon icon={Rocket} className="shadow-accent/25" />
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Xây mới từ một màn hình đầu tiên thật rõ.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Landing page và website nhiều trang được thiết kế để khách hiểu nhanh bạn làm gì, vì sao nên tin, và liên hệ bằng một hành động rõ.
            </p>
            <Link to="/booking" className="group relative mt-7 inline-flex items-center gap-2 overflow-hidden rounded-full bg-foreground px-6 py-3 text-xs font-black uppercase tracking-wide text-background shadow-xl transition hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
              <span className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${brandGradient}`} />
              <span className="relative flex items-center gap-2">
                Bắt đầu làm web
                <ArrowRight size={16} />
              </span>
            </Link>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-2">
            {plans.filter((plan) => ["landing", "website"].includes(plan.id)).map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <section id="app" className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
        <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-success/10 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-info/10 to-primary/10" />
          <div className="relative grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-success/30 bg-success/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-success shadow-[0_0_15px_hsl(var(--success)/0.16)]">Web có hệ thống</span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-5xl">{plans[4].name}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{plans[4].desc}</p>
              <p className="mt-5 text-4xl font-black text-foreground">{plans[4].price}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plans[4].note}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {plans[4].features.map((feature, index) => (
                <div key={feature} className="rounded-3xl border border-border bg-background/55 p-4">
                  <GlowIcon icon={[LayoutDashboard, MessageCircle, Boxes, Code2][index]} className="shadow-success/25" />
                  <p className="mt-4 text-sm font-bold leading-relaxed text-foreground/80">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:mt-28 sm:px-8">
        <SectionHeading eyebrow="Quy trình" title="Làm việc rõ từng bước" />
        <motion.ol {...reveal} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workSteps.map((step, index) => (
            <li key={step} className="relative overflow-hidden rounded-3xl border border-border bg-card p-5">
              <div className={`absolute inset-x-0 top-0 h-1 ${brandGradient}`} />
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-sm font-black text-background">{index + 1}</span>
              <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">{step}</p>
            </li>
          ))}
        </motion.ol>
      </section>

      <FaqSection />

      <section className="mx-auto mt-20 max-w-4xl px-4 text-center sm:mt-28 sm:px-8">
        <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-xl sm:p-12">
          <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />
          <Sparkles className="mx-auto text-primary drop-shadow-[0_0_14px_hsl(var(--primary)/0.55)]" size={30} />
          <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-4xl">Gửi mình tình trạng hiện tại, mình gợi ý hướng làm gọn nhất.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Bạn có thể gửi website đang có, ảnh chụp lỗi hoặc mô tả ý tưởng. Mình sẽ nói rõ nên sửa nhỏ, làm landing, làm nhiều trang hay cần web động.
          </p>
          <Link to="/booking" className="group relative mt-7 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground px-7 py-3.5 text-xs font-black uppercase tracking-wide text-background shadow-xl transition hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
            <span className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${brandGradient}`} />
            <span className="relative flex items-center gap-2">
              Nhắn mình để được tư vấn miễn phí
              <ArrowRight size={16} />
            </span>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
