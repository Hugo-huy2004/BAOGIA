import { useEffect, useRef, useState } from "react";
import { IosApp, AppShell, SectionTitle, ListGroup, ListRow, Card, Button, Sheet, Toast, useToast, Chip, ProgressBar, Segmented } from "./iosKit";
import { Art, HeroArt, Avatar } from "./demoArt";

const ACCENT = "#0A84FF";

const PROJECTS = [
  { id: "mediaviet", art: "news", title: "Mình Ơi Media", category: "Web báo chí số", tech: ["HTML5", "CSS3", "Vercel"], year: "2026", desc: "Cổng báo chí số tải trang siêu tốc, hỗ trợ dựng tin tức độc bản.", metrics: [["Lighthouse", "99"], ["LCP", "0.9s"], ["Bài/tháng", "120"]] },
  { id: "gold", art: "cart", title: "Hugo Gold E-Store", category: "Thương mại trang sức", tech: ["React", "Canvas", "VietQR"], year: "2026", desc: "Tính giá vàng SJC thời gian thực và khắc tên laser lên thỏi vàng.", metrics: [["Đơn/tháng", "310"], ["Tỉ lệ chốt", "7.4%"], ["Uptime", "99.9%"]] },
  { id: "cafe", art: "espresso", title: "Hugo Cafe & Bistro", category: "E-menu gọi món", tech: ["Tailwind", "Audio", "Printing"], year: "2025", desc: "Gọi món tại bàn, in biên lai và theo dõi tiến trình pha chế.", metrics: [["Bàn phục vụ", "24"], ["Ra món", "6 phút"], ["Đánh giá", "4.8★"]] },
  { id: "dashboard", art: "chart", title: "Dashboard Admin Portal", category: "Quản lý hệ thống", tech: ["Chart.js", "Node.js", "WebSocket"], year: "2025", desc: "Biểu đồ doanh thu realtime, chuyển đổi chủ đề sáng tối.", metrics: [["Sự kiện/ngày", "12k"], ["Độ trễ", "80ms"], ["Người dùng", "36"]] },
  { id: "bio", art: "screen", title: "Hugo Personal Bio", category: "Hồ sơ năng lực", tech: ["React", "Bento", "Terminal"], year: "2026", desc: "Bento box trực quan tích hợp giả lập terminal command prompt.", metrics: [["Lượt xem", "8.2k"], ["Ở lại", "2:40"], ["Bounce", "22%"]] },
  { id: "studio", art: "studio", title: "Hugo Photo Studio", category: "Đặt lịch chụp", tech: ["React", "Calendar", "Cloud"], year: "2026", desc: "Thư viện tác phẩm, bộ lọc màu và luồng đặt lịch có đặt cọc.", metrics: [["Lịch/tháng", "48"], ["Huỷ lịch", "4%"], ["Đánh giá", "4.9★"]] },
];

const SKILLS = [
  { name: "React / Next.js", value: 95 },
  { name: "CSS / Tailwind", value: 95 },
  { name: "SEO & Performance", value: 90 },
  { name: "Node.js / API", value: 80 },
];

const STACK = ["HTML5", "CSS3", "JavaScript", "React", "Next.js", "TailwindCSS", "Node.js", "Express", "PostgreSQL", "Git", "RESTful API", "SEO Tuning", "Vercel"];

const TIMELINE = [
  { year: "2026", title: "Freelance fullstack", desc: "Nhận dự án web trọn gói cho cửa hàng nhỏ và cá nhân." },
  { year: "2025", title: "Dev nội bộ hệ thống bán hàng", desc: "Xây dashboard quản trị và cổng thanh toán." },
  { year: "2024", title: "Bắt đầu với front-end", desc: "Học React, Tailwind và tối ưu hiệu năng web." },
];

const COMMANDS = {
  help: "Lệnh hỗ trợ:\n  skills  — thang điểm chuyên môn\n  about   — thông tin tóm tắt\n  stack   — công nghệ đang dùng\n  clear   — xoá màn hình",
  skills: SKILLS.map((s) => `  ${s.name.padEnd(20)} ${"█".repeat(Math.round(s.value / 10))}${"░".repeat(10 - Math.round(s.value / 10))} ${s.value}%`).join("\n"),
  about: "Lê Hugo Wishpax — kỹ sư fullstack. Thiết kế giao diện mượt, cấu trúc SEO chuẩn và chuyển động tinh gọn.",
  stack: STACK.join(", "),
};

export default function PortfolioDemo({ isMobile = false }) {
  const [tab, setTab] = useState("home");
  const [scheme, setScheme] = useState("dark");
  const [detail, setDetail] = useState(null);
  const [projectView, setProjectView] = useState("list");
  const [toast, showToast] = useToast();

  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState([
    { type: "system", text: "Hugo Dev Shell v2.1.0 — gõ 'help' để xem lệnh" },
    { type: "output", text: "Chào mừng! Gõ 'skills' để xem xếp hạng kỹ năng." },
  ]);
  const logEndRef = useRef(null);

  const [guest, setGuest] = useState({ name: "", text: "" });
  const [messages, setMessages] = useState([
    { id: 1, name: "Jason Dev", text: "Thiết kế bento grid rất thời thượng và chuyên nghiệp!", date: "Vừa xong" },
    { id: 2, name: "Mình Ơi Media", text: "Tối ưu SEO chuẩn, tải trang trong chớp mắt.", date: "1 giờ trước" },
    { id: 3, name: "Minh Khôi", text: "Hiệu ứng co giãn tỷ lệ thật rất sáng tạo.", date: "Hôm qua" },
  ]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [logs]);

  const runCommand = (event) => {
    event.preventDefault();
    const raw = command.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    setCommand("");
    if (cmd === "clear") {
      setLogs([]);
      return;
    }
    const output = COMMANDS[cmd];
    setLogs((prev) => [
      ...prev,
      { type: "input", text: `visitor@hugo.dev:~$ ${raw}` },
      output ? { type: "output", text: output } : { type: "error", text: `Lệnh '${cmd}' không tồn tại. Gõ 'help'.` },
    ]);
  };

  const submitGuest = (event) => {
    event.preventDefault();
    if (!guest.name.trim() || !guest.text.trim()) return;
    setMessages((prev) => [{ id: Date.now(), name: guest.name.trim(), text: guest.text.trim(), date: "Vừa xong" }, ...prev]);
    setGuest({ name: "", text: "" });
    showToast("Đã gửi lưu bút");
  };

  const copyEmail = () => {
    navigator.clipboard?.writeText("contact@hugo.dev");
    showToast("Đã sao chép contact@hugo.dev");
  };

  const inputClass = "w-full rounded-[10px] border-0 px-3 py-2.5 text-[17px] outline-none focus:ring-0";
  const inputStyle = { background: "var(--ios-fill)", color: "var(--ios-label)" };
  const gridCols = isMobile ? "grid-cols-1" : "grid-cols-3";
  const title = { home: "Hugo Lê", work: "Dự án", about: "Giới thiệu", contact: "Liên hệ" }[tab];

  const ProjectCard = ({ project }) => (
    <Card padded={false} onClick={() => setDetail(project)} className="h-full">
      <span className="block h-28 w-full overflow-hidden"><Art kind={project.art} ratio="wide" /></span>
      <span className="block p-4">
        <span className="block text-[17px] font-semibold">{project.title}</span>
        <span className="mt-0.5 block text-[15px]" style={{ color: "var(--ios-label-2)" }}>{project.category} · {project.year}</span>
      </span>
    </Card>
  );

  return (
    <IosApp scheme={scheme} accent={ACCENT}>
      <AppShell
        isMobile={isMobile}
        title={title}
        subtitle={tab === "home" ? "Fullstack Engineer & UI/UX" : undefined}
        brand={{ name: "Lê Hugo Wishpax", icon: "code", note: "Fullstack Engineer" }}
        sidebarNote="Đang nhận dự án · phản hồi trong 2 giờ."
        tabs={[
          { id: "home", label: "Trang chủ", icon: "home" },
          { id: "work", label: "Dự án", icon: "grid_view" },
          { id: "about", label: "Giới thiệu", icon: "account_circle" },
          { id: "contact", label: "Liên hệ", icon: "forum" },
        ]}
        value={tab}
        onChange={setTab}
        actions={
          <button type="button" onClick={() => setScheme(scheme === "dark" ? "light" : "dark")} aria-label="Đổi giao diện sáng tối" className="flex h-9 w-9 items-center justify-center">
            <span className="material-symbols-outlined text-[22px]" style={{ color: ACCENT }}>{scheme === "dark" ? "light_mode" : "dark_mode"}</span>
          </button>
        }
      >
        {tab === "home" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[18px]">
              <span className="absolute inset-0"><HeroArt from="#0B2E63" to="#0A84FF" /></span>
              <div className={`relative ${isMobile ? "p-5" : "p-8"}`}>
                <Chip tint="#fff" filled><span style={{ color: "#0B2E63" }}>Đang nhận dự án</span></Chip>
                <p className={`mt-2 font-bold leading-tight text-white ${isMobile ? "text-[26px]" : "text-[34px]"}`}>Website gọn, nhanh<br />và đúng nhu cầu</p>
                <p className="mt-1.5 max-w-md text-[15px] text-white/80">Fullstack engineer với tư duy thiết kế — làm web cho cửa hàng nhỏ, cá nhân và người học.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => setTab("contact")} style={{ background: "#fff", color: "#0B2E63" }}>Liên hệ</Button>
                  <Button variant="gray" onClick={() => setTab("work")} style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>Xem dự án</Button>
                </div>
              </div>
            </div>

            <div className={`grid gap-3 ${isMobile ? "grid-cols-3" : "grid-cols-3"}`}>
              {[["28", "Dự án bàn giao"], ["97", "Điểm Lighthouse TB"], ["2 giờ", "Phản hồi TB"]].map(([value, label]) => (
                <Card key={label} className="text-center">
                  <p className="text-[24px] font-bold leading-tight">{value}</p>
                  <p className="mt-0.5 text-[13px]" style={{ color: "var(--ios-label-2)" }}>{label}</p>
                </Card>
              ))}
            </div>

            <section>
              <SectionTitle action={<Button variant="plain" size="sm" onClick={() => setTab("work")}>Xem tất cả</Button>}>Dự án tiêu biểu</SectionTitle>
              <div className={`grid gap-3 ${gridCols}`}>
                {PROJECTS.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            </section>

            <section>
              <SectionTitle>Dịch vụ</SectionTitle>
              <div className={`grid gap-3 ${gridCols}`}>
                {[
                  { icon: "web", title: "Landing page", desc: "Một trang, tối ưu chuyển đổi" },
                  { icon: "storefront", title: "Web bán hàng", desc: "Giỏ hàng, thanh toán, quản trị" },
                  { icon: "dashboard", title: "Dashboard", desc: "Báo cáo và quản lý nội bộ" },
                ].map((item) => (
                  <Card key={item.title} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]" style={{ background: ACCENT }}>
                      <span className="material-symbols-outlined text-[22px] text-white">{item.icon}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold">{item.title}</span>
                      <span className="block truncate text-[13px]" style={{ color: "var(--ios-label-2)" }}>{item.desc}</span>
                    </span>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "work" && (
          <div className="space-y-4">
            <div className={isMobile ? "" : "w-[280px]"}>
              <Segmented value={projectView} onChange={setProjectView} items={[{ id: "list", label: "Dự án" }, { id: "terminal", label: "Terminal" }]} />
            </div>

            {projectView === "list" ? (
              <div className={`grid gap-3 ${gridCols}`}>
                {PROJECTS.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            ) : (
              <Card padded={false} className={isMobile ? "" : "max-w-[680px]"}>
                <div className="flex items-center gap-2 border-b-[0.5px] px-3 py-2" style={{ borderColor: "var(--ios-sep)" }}>
                  <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                  <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                  <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                  <span className="ml-auto text-[13px]" style={{ color: "var(--ios-label-2)" }}>zsh — hugo.dev</span>
                </div>
                <div className="scrollbar-hide max-h-[240px] space-y-1.5 overflow-y-auto px-3 py-3 font-mono text-[13px] leading-relaxed">
                  {logs.map((log, index) => (
                    <pre key={index} className="whitespace-pre-wrap break-words" style={{ color: log.type === "error" ? "#FF453A" : log.type === "input" ? ACCENT : "#30D158" }}>
                      {log.text}
                    </pre>
                  ))}
                  <div ref={logEndRef} />
                </div>
                <form onSubmit={runCommand} className="flex items-center gap-2 border-t-[0.5px] px-3 py-2" style={{ borderColor: "var(--ios-sep)" }}>
                  <span className="shrink-0 font-mono text-[13px]" style={{ color: ACCENT }}>$</span>
                  <input
                    value={command}
                    onChange={(event) => setCommand(event.target.value)}
                    placeholder="help, skills, about, stack, clear"
                    autoComplete="off"
                    aria-label="Nhập lệnh"
                    className="w-full border-0 bg-transparent p-0 font-mono text-[15px] outline-none placeholder:text-[var(--ios-label-3)] focus:ring-0"
                  />
                </form>
              </Card>
            )}
          </div>
        )}

        {tab === "about" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-5"}>
            <Card className="flex items-center gap-4">
              <Avatar name="Lê Hugo Wishpax" size={64} tint={ACCENT} />
              <span className="min-w-0">
                <span className="block text-[22px] font-bold leading-tight">Lê Hugo Wishpax</span>
                <span className="mt-0.5 block text-[15px]" style={{ color: "var(--ios-label-2)" }}>Fullstack Engineer · TP.HCM</span>
                <span className="mt-2 flex gap-2">
                  <Chip tint="#34C759">Đang nhận dự án</Chip>
                  <Chip tint="#8E8E93">5 năm</Chip>
                </span>
              </span>
            </Card>

            <Card>
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
                Kỹ sư lập trình với tư duy thiết kế. Đồng hành cùng thương hiệu xây dựng website độc bản, mượt mà và tối ưu SEO tốc độ cao.
              </p>
            </Card>

            <ListGroup header="Chuyên môn">
              {SKILLS.map((skill, index) => (
                <ListRow key={skill.name} last={index === SKILLS.length - 1} title={skill.name} value={`${skill.value}%`} subtitle={<ProgressBar value={skill.value} />} />
              ))}
            </ListGroup>

            <ListGroup header="Công nghệ" footer={`${STACK.length} công nghệ đang sử dụng hằng ngày.`}>
              <div className="flex flex-wrap gap-1.5 p-3">
                {STACK.map((item) => (
                  <span key={item} className="rounded-[8px] px-2.5 py-1 text-[13px] font-medium" style={{ background: "var(--ios-fill)", color: "var(--ios-label-2)" }}>{item}</span>
                ))}
              </div>
            </ListGroup>

            <ListGroup header="Chặng đường">
              {TIMELINE.map((item, index) => (
                <ListRow key={item.year} icon="calendar_today" iconBg="#8E8E93" title={`${item.year} · ${item.title}`} subtitle={item.desc} last={index === TIMELINE.length - 1} />
              ))}
            </ListGroup>
          </div>
        )}

        {tab === "contact" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-5"}>
            <div className="space-y-4">
              <ListGroup header="Kênh liên hệ">
                <ListRow icon="mail" title="Email" value="contact@hugo.dev" chevron onClick={copyEmail} />
                <ListRow icon="call" iconBg="#34C759" title="Điện thoại" value="083 990 9399" chevron onClick={() => showToast("Đang gọi 083 990 9399")} />
                <ListRow icon="chat_bubble" iconBg="#0A84FF" title="Zalo" subtitle="Phản hồi trong giờ hành chính" chevron onClick={() => showToast("Mở Zalo")} last />
              </ListGroup>

              <form onSubmit={submitGuest} className="space-y-2.5">
                <input required value={guest.name} onChange={(event) => setGuest({ ...guest, name: event.target.value })} placeholder="Tên của bạn" className={inputClass} style={inputStyle} />
                <textarea required rows={3} value={guest.text} onChange={(event) => setGuest({ ...guest, text: event.target.value })} placeholder="Lời nhắn…" className={`${inputClass} resize-none`} style={inputStyle} />
                <Button full size="lg" type="submit">Gửi lưu bút</Button>
              </form>
            </div>

            <ListGroup header={`Lưu bút (${messages.length})`}>
              {messages.slice(0, 6).map((message, index) => (
                <ListRow key={message.id} title={message.name} subtitle={message.text} value={message.date} last={index === Math.min(messages.length, 6) - 1} />
              ))}
            </ListGroup>
          </div>
        )}
      </AppShell>

      <Sheet
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title}
        action={<Button full size="lg" onClick={() => showToast("Mở bản demo trực tiếp")}>Xem bản chạy thật</Button>}
      >
        {detail && (
          <div className="space-y-4 pb-2">
            <span className="block h-40 w-full overflow-hidden rounded-[14px]"><Art kind={detail.art} ratio="wide" /></span>
            <div className="flex flex-wrap gap-2">
              <Chip>{detail.category}</Chip>
              <Chip tint="#8E8E93">{detail.year}</Chip>
            </div>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>{detail.desc}</p>

            <div className="grid grid-cols-3 gap-2">
              {detail.metrics.map(([label, value]) => (
                <div key={label} className="rounded-[12px] p-3 text-center" style={{ background: "var(--ios-surface)" }}>
                  <p className="text-[20px] font-bold leading-tight">{value}</p>
                  <p className="mt-0.5 text-[12px] leading-tight" style={{ color: "var(--ios-label-2)" }}>{label}</p>
                </div>
              ))}
            </div>

            <ListGroup header="Công nghệ">
              {detail.tech.map((tech, index) => <ListRow key={tech} title={tech} last={index === detail.tech.length - 1} />)}
            </ListGroup>
          </div>
        )}
      </Sheet>

      <Toast message={toast} />
    </IosApp>
  );
}
