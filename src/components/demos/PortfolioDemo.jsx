import React, { useState, useEffect, useRef } from "react";
import { HugoNoticeToast } from "../shared/HugoNotice";

export default function PortfolioDemo({ isMobile = false }) {
  const [dark, setDark] = useState(true);
  const [copied, setCopied] = useState(false);
  const [command, setCommand] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState("bio");
  const [terminalLogs, setTerminalLogs] = useState([
    { type: "system", text: "Hugo Dev Shell v2.1.0 - Type 'help' for commands" },
    { type: "input", text: "visitor@hugo.dev:~$ welcome" },
    { type: "output", text: "Chào mừng! Gõ 'skills' để xem xếp hạng kỹ năng, hoặc 'clear' để xóa màn hình." }
  ]);
  const [guestMessages, setGuestMessages] = useState([
    { id: 1, name: "Jason Dev", text: "Thiết kế Bento Grid rất thời thượng và chuyên nghiệp!", date: "Vừa xong" },
    { id: 2, name: "Mình Ơi Media", text: "Tối ưu hóa SEO chuẩn, tải trang trong chớp mắt.", date: "1h trước" },
    { id: 3, name: "Minh Khôi", text: "Hiệu ứng co giãn tỷ lệ thật rất sáng tạo.", date: "Hôm qua" }
  ]);
  const [visitorName, setVisitorName] = useState("");
  const [visitorMsg, setVisitorMsg] = useState("");
  const [projectSlide, setProjectSlide] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "" });

  const terminalEndRef = useRef(null);

  const triggerToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // 5 Project Slides for the Bento Carousel
  const projects = [
    { title: "Mình Ơi Media", category: "Web Báo Chí Số", tech: "HTML5 / CSS3 / Vercel", desc: "Cổng báo chí số tải trang siêu tốc 99đ Lighthouse, hỗ trợ thiết kế tin tức độc bản.", image: "/image/avt1.png" },
    { title: "Hugo Gold E-Store", category: "Thương Mại Trang Sức", tech: "React / Canvas / VietQR", desc: "Tích hợp tính giá vàng tự động SJC thời gian thực và khắc tên laser lên thỏi vàng.", image: "/image/avt3.png" },
    { title: "Hugo Cafe & Bistro", category: "E-Menu Gọi Món", tech: "Tailwind / Audio / Printing", desc: "Giao diện quán nước ấm cúng, gọi món tại bàn và in biên lai hóa đơn hoạt họa.", image: "/image/avt2.png" },
    { title: "Dashboard Admin Portal", category: "Quản Lý Hệ Thống", tech: "Chart.js / Node.js / Websockets", desc: "Giao diện quản lý doanh nghiệp tích hợp biểu đồ SVG, chuyển đổi chủ đề sáng tối.", image: "/image/avt6.png" },
    { title: "Hugo Personal Bio", category: "Hồ Sơ Năng Lực", tech: "React / Bento Grid / Terminal", desc: "Thiết kế Bento Box trực quan tích hợp giả lập Terminal command prompt.", image: "/image/avt4.png" }
  ];

  // Auto advance project slider every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setProjectSlide((prev) => (prev + 1) % projects.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  const handleCopy = () => {
    navigator.clipboard.writeText("contact@hugo.dev");
    setCopied(true);
    triggerToast("Đã sao chép địa chỉ Email!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.trim().toLowerCase();
    const newLogs = [...terminalLogs, { type: "input", text: `visitor@hugo.dev:~$ ${command}` }];

    switch (cmd) {
      case "help":
        newLogs.push({
          type: "output",
          text: "Lệnh hỗ trợ:\n  - skills : Thang điểm chuyên môn kỹ năng\n  - about  : Thông tin tóm tắt về Hugo\n  - clear  : Xóa nhật ký dòng lệnh\n  - help   : Trợ giúp này"
        });
        break;
      case "skills":
        newLogs.push({
          type: "output",
          text: "Xếp hạng chuyên môn:\n  - Front-end (React/Next) : ■■■■■■■■■■ 95%\n  - UI/UX Design (Figma)  : ■■■■■■■■■□ 90%\n  - Back-end (Node/API)    : ■■■■■■■■□□ 80%\n  - SEO & Performance     : ■■■■■■■■■□ 90%"
        });
        break;
      case "about":
        newLogs.push({
          type: "output",
          text: "Lê Hugo Wishpax - Kỹ sư Fullstack. Chuyên môn thiết kế các giao diện web mượt mà, cấu trúc SEO chuẩn chỉnh và trải nghiệm chuyển động tinh xảo."
        });
        break;
      case "clear":
        setTerminalLogs([]);
        setCommand("");
        return;
      default:
        newLogs.push({ type: "error", text: `Lệnh '${cmd}' không tồn tại. Gõ 'help' để xem hỗ trợ.` });
    }

    setTerminalLogs(newLogs);
    setCommand("");
  };

  const handleAddMessage = (e) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorMsg.trim()) return;
    const newMessage = {
      id: Date.now(),
      name: visitorName.trim(),
      text: visitorMsg.trim(),
      date: "Vừa xong"
    };
    setGuestMessages([newMessage, ...guestMessages]);
    setVisitorName("");
    setVisitorMsg("");
    triggerToast("Gửi lưu bút live thành công!");
  };

  const textPrimary = dark ? "text-white" : "text-slate-900";
  const textSecondary = dark ? "text-slate-400" : "text-slate-600";
  const bgCard = dark ? "bg-[#111726]/40 border-white/5" : "bg-white border-slate-200 shadow-sm";
  const borderSubtle = dark ? "border-white/5" : "border-slate-100";

  return (
    <div className={`w-full h-full relative overflow-hidden transition-colors duration-300 font-sans ${
      dark ? "bg-[#0B0F19] text-[#E2E8F0]" : "bg-[#F8FAFC] text-slate-800"
    }`}>
      
      {/* Scrollable Container */}
      <div className="w-full h-full overflow-y-auto scrollbar-hide p-4 md:p-8 flex flex-col justify-between">
        
        {/* Mini Header */}
        <header className={`sticky top-0 z-30 backdrop-blur-md px-4 pb-3 flex justify-between items-center border-b rounded-t-2xl mb-6 transition-all ${
          isMobile ? "pt-12" : "pt-4"
        } ${
          dark ? "bg-[#0B0F19]/90 border-white/5" : "bg-[#F8FAFC]/90 border-slate-200"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-indigo-400" : "bg-indigo-650"} animate-pulse`}></span>
            <span className="font-extrabold text-xs uppercase tracking-widest font-mono">hugo.portfolio_bento</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className={`p-2 rounded-lg flex items-center justify-center transition-all border ${
                dark ? "bg-white/5 text-yellow-400 border border-white/5" : "bg-slate-100 text-slate-600 border border-slate-300"
              }`}
              title={dark ? "Chế độ Sáng" : "Chế độ Tối"}
            >
              <span className="material-symbols-outlined text-sm">{dark ? "light_mode" : "dark_mode"}</span>
            </button>
          </div>
        </header>

        {/* Bento Box Grid - adapts to tab views on mobile */}
        <main className={`flex-grow w-full max-w-5xl mx-auto ${isMobile ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-3 gap-6"} items-start`}>
          
          {/* COLUMN 1: Bio Info & Tech Tags */}
          {(!isMobile || activeMobileTab === "bio") && (
            <div className="flex flex-col gap-6 w-full">
              {/* Bio Card */}
              <section className={`p-6 rounded-3xl border flex flex-col items-center text-center relative ${bgCard}`}>
                <div className="space-y-4 flex flex-col items-center">
                  <div className="relative">
                    <img
                      src="/image/avt4.png"
                      alt="Peter Hugo Avatar"
                      className="w-20 h-20 rounded-full object-cover border-4 border-indigo-500 shadow-md hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-4 border-zinc-900"></span>
                  </div>

                  <div className="space-y-1">
                    <h2 className={`font-serif text-base font-black ${textPrimary}`}>
                      Lê Hugo Wishpax
                    </h2>
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono font-bold uppercase tracking-wider">
                      Fullstack Engineer & UI/UX
                    </p>
                  </div>

                  <p className={`text-xs leading-relaxed font-light ${textSecondary}`}>
                    Kỹ sư lập trình với tư duy thiết kế mỹ thuật cao. Đồng hành cùng các thương hiệu xây dựng các giải pháp website độc bản, mượt mà và tối ưu hóa SEO tốc độ cao.
                  </p>
                </div>

                <div className="w-full space-y-2 mt-6">
                  <button
                    onClick={handleCopy}
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    {copied ? "Copied Email ✓" : "Copy Email"}
                  </button>
                  <button
                    onClick={() => triggerToast("Bắt đầu tải xuống CV PDF...")}
                    className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      dark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Tải Xuống CV
                  </button>
                </div>
              </section>

              {/* Tech Tags */}
              <section className={`p-5 rounded-3xl border text-left space-y-3 ${bgCard}`}>
                <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b pb-1 ${borderSubtle}`}>
                  ./Công_nghệ
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["HTML5", "CSS3", "JavaScript", "React", "Next.js", "TailwindCSS", "Node.js", "Express", "PostgreSQL", "Git", "RESTful API", "SEO Tuning", "Vercel"].map((tag, idx) => (
                    <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/15">
                      {tag}
                    </span>
                  ))}
                </div>
              </section>

              {/* Skills Chart - Displayed here in Bio tab on mobile */}
              {isMobile && (
                <section className={`p-5 rounded-3xl border text-left space-y-3 ${bgCard}`}>
                  <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b pb-1 ${borderSubtle}`}>
                    ./Chuyên_môn
                  </h4>
                  <div className="space-y-3 text-[10px] font-mono">
                    {[
                      { name: "React / Next.js", val: 95 },
                      { name: "CSS / Tailwind", val: 95 },
                      { name: "Node.js / API", val: 80 },
                      { name: "SEO & Performance", val: 90 }
                    ].map((s, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>{s.name}</span>
                          <span className="text-indigo-500">{s.val}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${s.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* COLUMN 2: Projects Carousel & Interactive Terminal */}
          {(!isMobile || activeMobileTab === "projects") && (
            <div className="flex flex-col gap-6 w-full">
              {/* Featured Project Slide Carousel */}
              <section className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between min-h-[180px] ${
                dark ? "bg-gradient-to-r from-[#131B2E] to-[#1D2B4D] border-white/5 text-white" : "bg-gradient-to-r from-indigo-50 to-indigo-100 border-slate-200 text-slate-800 shadow-sm"
              }`}>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest bg-indigo-650 text-white px-2 py-0.5 rounded-full">
                      {projects[projectSlide].category}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">Dự án ({projectSlide + 1}/5)</span>
                  </div>
                  <h3 className="font-serif text-sm font-black uppercase mt-2">{projects[projectSlide].title}</h3>
                  <p className={`text-xs font-light leading-relaxed mt-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>{projects[projectSlide].desc}</p>
                  <p className="text-[9px] font-mono text-indigo-500 font-bold mt-2">{projects[projectSlide].tech}</p>
                </div>

                {/* Slider control dots */}
                <div className="flex gap-1.5 mt-4 justify-end">
                  {projects.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setProjectSlide(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        projectSlide === idx ? "bg-indigo-500 w-3" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </section>

              {/* Interactive Bash Terminal Console */}
              <section className="bg-[#05070c] border border-white/10 rounded-3xl overflow-hidden shadow-xl flex flex-col font-mono text-[11px] text-green-400 min-h-[220px]">
                <div className="bg-[#0e121b] border-b border-white/5 px-4 py-2 flex justify-between items-center select-none">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ff5f56]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#ffbd2e]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#27c93f]"></span>
                  </div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Terminal Shell</span>
                  <span className="w-8"></span>
                </div>
                
                <div className="p-4 flex-grow overflow-y-auto space-y-1.5 max-h-[140px] text-left scrollbar-hide">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className={log.type === "error" ? "text-red-400" : log.type === "input" ? "text-indigo-300" : "text-green-300"}>
                      {log.text}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>

                <form onSubmit={handleCommandSubmit} className="border-t border-white/5 px-4 py-2 flex items-center bg-[#070a11]/80 select-text">
                  <span className="text-indigo-400 select-none mr-1.5">visitor@hugo.dev:~$</span>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Gõ 'skills' hoặc 'help'..."
                    className="flex-grow bg-transparent border-none outline-none focus:ring-0 p-0 text-[11px] text-green-350 font-mono caret-green-400"
                    autoComplete="off"
                  />
                </form>
              </section>
            </div>
          )}

          {/* COLUMN 3: Skills Chart & Guestbook */}
          {(!isMobile || activeMobileTab === "guestbook") && (
            <div className="flex flex-col gap-6 w-full">
              {/* Skills Progress Metrics - Only show here on desktop */}
              {!isMobile && (
                <section className={`p-5 rounded-3xl border text-left space-y-3 ${bgCard}`}>
                  <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b pb-1 ${borderSubtle}`}>
                    ./Chuyên_môn
                  </h4>
                  <div className="space-y-3 text-[10px] font-mono">
                    {[
                      { name: "React / Next.js", val: 95 },
                      { name: "CSS / Tailwind", val: 95 },
                      { name: "Node.js / API", val: 80 },
                      { name: "SEO & Performance", val: 90 }
                    ].map((s, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>{s.name}</span>
                          <span className="text-indigo-500">{s.val}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${s.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Guestbook Card */}
              <section className={`p-5 rounded-3xl border text-left space-y-4 ${bgCard}`}>
                <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b pb-1 ${borderSubtle}`}>
                  ./Khách_ký_lưu_bút
                </h4>
                
                <div className="space-y-4">
                  {/* comments logs first */}
                  <div className="space-y-3 max-h-[110px] overflow-y-auto pr-1 scrollbar-hide">
                    {guestMessages.map((msg) => (
                      <div key={msg.id} className={`pb-2 border-b last:border-0 last:pb-0 text-[10px] leading-relaxed ${borderSubtle}`}>
                        <div className="flex justify-between font-bold">
                          <span className="text-indigo-500">{msg.name}</span>
                          <span className="text-[8px] text-slate-400 font-mono">{msg.date}</span>
                        </div>
                        <p className={textSecondary}>{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* input form below */}
                  <form onSubmit={handleAddMessage} className="space-y-2 pt-2 border-t border-slate-500/10">
                    <input
                      required
                      type="text"
                      placeholder="Tên của bạn *"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded-lg text-[10px] outline-none focus:border-indigo-500 ${
                        dark ? "bg-[#0B0F19] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                    <textarea
                      required
                      rows="2"
                      placeholder="Lời lưu bút..."
                      value={visitorMsg}
                      onChange={(e) => setVisitorMsg(e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded-lg text-[10px] outline-none focus:border-indigo-500 resize-none ${
                        dark ? "bg-[#0B0F19] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                    >
                      Gửi Lưu Bút Live
                    </button>
                  </form>
                </div>
              </section>
            </div>
          )}

        </main>

        {/* Footer - Hidden on mobile to save space */}
        {!isMobile && (
          <footer className={`border-t py-6 mt-8 select-none text-[10px] font-mono ${
            dark ? "border-white/5 text-slate-500" : "border-slate-200 text-slate-400"
          }`}>
            <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
              <span>© 2026 Peter Hugo. Bento Layout v2.5</span>
              <span>Built with React</span>
            </div>
          </footer>
        )}
      </div>

      {/* Custom Bottom Tab Bar for Mobile */}
      {isMobile && (
        <div className={`border-t px-6 pt-3 pb-5 flex justify-around items-center shrink-0 z-30 select-none ${
          dark ? "bg-[#0B0F19]/95 border-white/10" : "bg-[#F8FAFC]/95 border-slate-300"
        }`}>
          <button 
            onClick={() => setActiveMobileTab("bio")} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeMobileTab === "bio" 
                ? (dark ? "text-indigo-400 font-bold" : "text-indigo-650 font-bold") 
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <span className="material-symbols-outlined text-xl">account_circle</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Hồ sơ</span>
          </button>
          <button 
            onClick={() => setActiveMobileTab("projects")} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeMobileTab === "projects" 
                ? (dark ? "text-indigo-400 font-bold" : "text-indigo-650 font-bold") 
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <span className="material-symbols-outlined text-xl">terminal</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Dự án</span>
          </button>
          <button 
            onClick={() => setActiveMobileTab("guestbook")} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeMobileTab === "guestbook" 
                ? (dark ? "text-indigo-400 font-bold" : "text-indigo-650 font-bold") 
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <span className="material-symbols-outlined text-xl">rate_review</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Lưu bút</span>
          </button>
        </div>
      )}

      <HugoNoticeToast open={toast.show} type="success" message={toast.message} zIndex={80} />

    </div>
  );
}
