import React, { useState, useEffect, useRef } from "react";
import { motion, useSpring } from "framer-motion";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/authSession";

const GRADIENT_CARDS = [
  "from-primary/15 via-accent/10 to-transparent",
  "from-accent/15 via-warning/10 to-transparent",
  "from-warning/15 via-primary/10 to-transparent",
  "from-primary/10 via-warning/15 to-transparent",
];

const GRADIENT_BORDERS = [
  "from-primary to-accent",
  "from-accent to-warning",
  "from-warning to-primary",
  "from-primary via-accent to-warning",
];

export default function HugoTeamTab() {
  const [developers, setDevelopers] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    loadDevelopers();
    checkUserStatus();
  }, []);

  const loadDevelopers = async () => {
    try {
      const res = await fetch("/api/hugoteam/developers");
      if (res.ok) {
        const data = await res.json();
        setDevelopers(data.developers || []);
      }
    } catch (error) {
      console.error("Failed to load developers:", error);
    }
  };

  const checkUserStatus = async () => {
    try {
      const session = await getMemberSession();
      if (session?.email) {
        const res = await fetch(`/api/hugoteam/status/${session.email}`);
        if (res.ok) {
          const data = await res.json();
          setUserStatus(data.status);
        }
      }
    } catch (error) {
      console.error("Failed to check user status:", error);
    }
  };

  const handleCvUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify.error("CV phải nhỏ hơn 5MB");
        return;
      }
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        notify.error("Vui lòng upload file PDF");
        return;
      }
      setCvFile(file);
      notify.success(`CV được chọn: ${file.name}`);
    }
  };

  const handleSubmitCV = async () => {
    try {
      if (!cvFile) {
        notify.error("Vui lòng chọn CV");
        return;
      }

      const session = await getMemberSession();
      if (!session?.email) {
        notify.error("Vui lòng đăng nhập");
        return;
      }

      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("cv", cvFile);
      formData.append("email", session.email);
      formData.append("name", session.name || "");

      const res = await fetch("/api/hugoteam/apply", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        notify.success("Đơn đăng ký của bạn đã được gửi! Admin sẽ xem xét sớm.");
        setCvFile(null);
        setUserStatus("pending");
      } else {
        notify.error(data.error || "Lỗi khi gửi đơn");
      }
    } catch (error) {
      console.error("Submit error:", error);
      notify.error("Lỗi khi gửi đơn, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  function Magnetic({ children, strength = 14 }) {
    const x = useSpring(0, { stiffness: 220, damping: 14 });
    const y = useSpring(0, { stiffness: 220, damping: 14 });
    const onPointerMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      x.set(((e.clientX - r.left) / r.width - 0.5) * strength);
      y.set(((e.clientY - r.top) / r.height - 0.5) * strength);
    };
    const onPointerLeave = () => {
      x.set(0);
      y.set(0);
    };
    return (
      <motion.div
        style={{ x, y }}
        whileTap={{ scale: 0.93 }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className="space-y-12 pb-20 relative">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] right-[8%] w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] left-[5%] w-80 h-80 bg-gradient-to-br from-warning/25 via-primary/15 to-transparent rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, -25, 0], x: [0, 40, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 left-[15%] w-72 h-72 bg-gradient-to-br from-accent/20 to-warning/10 rounded-full blur-[90px]"
        />
      </div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="relative z-10 px-4 sm:px-0"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] p-0">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-warning opacity-10 rounded-[2.5rem]" />
          <div className="absolute inset-0 rounded-[2.5rem] border-2 bg-gradient-to-r from-primary/40 via-accent/40 to-warning/40 opacity-0 hover:opacity-100 transition-opacity duration-500" />

          {/* Content */}
          <div className="relative bg-gradient-to-br from-primary/8 via-background to-warning/8 backdrop-blur-xl rounded-[2.5rem] p-12 md:p-16 border border-white/10">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-warning/20 border border-primary/40 text-[11px] font-black tracking-[0.15em] text-foreground uppercase mb-6 shadow-lg shadow-primary/20"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="material-symbols-outlined text-sm"
              >
                groups
              </motion.span>
              Hugo Team 2024
            </motion.div>

            {/* Main title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-4"
            >
              <h1 className="text-5xl md:text-7xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-primary via-accent via-warning to-primary bg-clip-text text-transparent" style={{ backgroundSize: "300% 100%", animation: "gradientShift 4s ease infinite" }}>
                  Hugo Team
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl">
                Tham gia cộng đồng học vừa làm, xây dựng portfolio thực tế, đóng góp vào dự án mã nguồn mở phi lợi nhuận
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Mission & Benefits Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
        className="grid md:grid-cols-2 gap-6 px-4 sm:px-0"
      >
        {/* Tại sao */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="group relative overflow-hidden rounded-[2rem] border-2 border-transparent bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-8 hover:border-primary/50 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-5 transition-opacity" />
          <div className="relative z-10">
            <motion.div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40 mb-6">
              <span className="material-symbols-outlined text-2xl text-primary">lightbulb</span>
            </motion.div>
            <h2 className="text-2xl font-black text-foreground mb-6">Tại sao Hugo Team?</h2>
            <ul className="space-y-4">
              {[
                { icon: "school", title: "Học vừa làm", desc: "Thực hành kiến thức từ lớp học" },
                { icon: "work", title: "Xây dựng portfolio", desc: "Có project thực tế để show" },
                { icon: "favorite", title: "Cộng đồng mã mở", desc: "Đóng góp vào dự án công khai" },
                { icon: "groups", title: "Cùng phát triển", desc: "Hợp tác học hỏi lẫn nhau" },
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4 group/item cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/40 to-accent/30 group-hover/item:from-primary/60 group-hover/item:to-accent/50 transition-all">
                      <span className="material-symbols-outlined text-sm text-white">{item.icon}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Qui định */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="group relative overflow-hidden rounded-[2rem] border-2 border-transparent bg-gradient-to-br from-accent/15 via-warning/10 to-transparent p-8 hover:border-accent/50 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent to-warning opacity-0 group-hover:opacity-5 transition-opacity" />
          <div className="relative z-10">
            <motion.div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-accent/30 to-warning/20 border border-accent/40 mb-6">
              <span className="material-symbols-outlined text-2xl text-accent">rule</span>
            </motion.div>
            <h2 className="text-2xl font-black text-foreground mb-6">Yêu Cầu & Quy Định</h2>
            <div className="space-y-4">
              {[
                { label: "Đối Tượng", value: "Sinh viên nam, năm 2-3, ngành CNTT" },
                { label: "Công Việc", value: "Học code, đóng góp feature, fix bug, viết test" },
                { label: "Thời Gian", value: "5-10 giờ/tuần, tự do, linh hoạt" },
                { label: "Lương", value: "Phi Lợi Nhuận (Miễn Phí)" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-lg bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">{item.label}</p>
                  <p className="text-sm text-foreground font-medium">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Learning Roadmap — 2-3 months onboarding */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true, amount: 0.2 }}
        className="px-4 sm:px-0"
      >
        <div className="rounded-[2.5rem] bg-gradient-to-b from-primary/5 via-accent/5 to-warning/5 border border-white/10 p-10 md:p-14">
          <div className="mb-8">
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/30 via-accent/30 to-warning/30 border border-primary/50 text-[10px] font-black tracking-[0.15em] text-foreground uppercase">
              <span className="material-symbols-outlined text-sm">school</span>
              Học Tập 2-3 Tháng
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-4">Giai Đoạn Onboarding</h2>
            <p className="text-base text-muted-foreground mt-3 max-w-2xl">
              Để đảm bảo bạn làm chắc và có thể đóng góp hiệu quả, chúng tôi yêu cầu <span className="font-bold text-foreground">2-3 tháng tìm hiểu & học</span> trước khi nhận các task chính thức.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                month: "Tháng 1",
                title: "Làm Quen",
                icon: "import_contacts",
                color: "from-primary to-accent",
                tasks: [
                  "Hiểu kiến trúc Hugo Studio",
                  "Làm quen Git workflow & PR review",
                  "Setup dev environment",
                  "Đọc documentation & architecture",
                ],
              },
              {
                num: "02",
                month: "Tháng 2",
                title: "Thực Hành",
                icon: "code",
                color: "from-accent to-warning",
                tasks: [
                  "Làm bài tập nhỏ (fix typo, feature)",
                  "Viết unit test cho các hàm",
                  "Tham gia code review",
                  "Học best practice từ feedback",
                ],
              },
              {
                num: "03",
                month: "Tháng 3+",
                title: "Phát Triển",
                icon: "rocket_launch",
                color: "from-warning to-primary",
                tasks: [
                  "Nhận feature request thực tế",
                  "Độc lập hoàn thành task",
                  "Mentoring & peer learning",
                  "Đóng góp liên tục Hugo Studio",
                ],
              },
            ].map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${phase.color} opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl blur-xl`} />
                <div className={`relative rounded-2xl border-2 border-transparent bg-gradient-to-br ${phase.color} bg-clip-border p-0 group-hover:border-white/20 transition-all duration-500`}>
                  <div className="bg-card/95 backdrop-blur-sm rounded-[calc(1rem-2px)] p-6 h-full">
                    {/* Phase number */}
                    <div className="text-6xl font-black bg-gradient-to-br from-white/20 to-white/5 bg-clip-text text-transparent opacity-40 leading-none mb-2">
                      {phase.num}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{phase.month}</p>
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <span className={`material-symbols-outlined text-lg bg-gradient-to-br ${phase.color} bg-clip-text text-transparent`}>
                        {phase.icon}
                      </span>
                      {phase.title}
                    </h3>
                    <ul className="space-y-3">
                      {phase.tasks.map((task, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.15 + j * 0.05 }}
                          viewport={{ once: true }}
                          className="flex gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors"
                        >
                          <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">check_circle</span>
                          {task}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Application Section */}
      {userStatus !== "approved" && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
          className="px-4 sm:px-0"
        >
          <div className="rounded-[2.5rem] border-2 border-transparent bg-gradient-to-br from-primary/15 via-accent/10 to-warning/5 p-10 md:p-14 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-warning opacity-0 group-hover:opacity-5 transition-opacity rounded-[2.5rem]" />
            <div className="relative z-10">
              {/* Header */}
              <div className="mb-10">
                <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 border border-primary/50 text-[10px] font-black tracking-[0.15em] text-foreground uppercase mb-4">
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  Nộp Đơn Ngay
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-black text-foreground">Bắt Đầu Hành Trình</h2>
              </div>

              {/* Pending state */}
              {userStatus === "pending" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 rounded-xl bg-gradient-to-r from-warning/20 to-orange-500/20 border-2 border-warning/50 p-6 flex gap-4"
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="material-symbols-outlined text-2xl text-warning flex-shrink-0"
                  >
                    schedule
                  </motion.span>
                  <div>
                    <p className="font-bold text-foreground">Đơn của bạn đang được xem xét</p>
                    <p className="text-sm text-muted-foreground mt-1">Admin sẽ liên hệ trong 3-5 ngày qua email</p>
                  </div>
                </motion.div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {/* Upload section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-sm font-bold uppercase tracking-wider text-foreground mb-4">Upload CV</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCvUpload}
                    disabled={isSubmitting || userStatus === "pending"}
                    className="block w-full px-4 py-4 border-2 border-dashed border-primary/40 rounded-2xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-primary file:to-accent file:text-white hover:file:opacity-90 hover:border-primary/70 transition-all cursor-pointer"
                  />
                  <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    {cvFile ? `✅ ${cvFile.name}` : "Tối đa 5MB, định dạng PDF"}
                  </p>
                </motion.div>

                {/* Requirements section */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-bold uppercase tracking-wider text-foreground">Yêu Cầu Hồ Sơ</label>
                  <ul className="space-y-3">
                    {[
                      "CV tiếng Anh/Việt (1-2 trang)",
                      "Kỹ năng: HTML, CSS, JS, React/Node.js",
                      "Dự án cá nhân (GitHub link)",
                      "Lý do tham gia Hugo Team",
                      "Khả năng: 5-10 giờ/tuần",
                    ].map((req, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.08 }}
                        viewport={{ once: true }}
                        className="flex gap-3 text-sm text-muted-foreground"
                      >
                        <span className="material-symbols-outlined text-base text-primary flex-shrink-0">check_circle</span>
                        {req}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* Submit button */}
              <Magnetic>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                  onClick={handleSubmitCV}
                  disabled={!cvFile || isSubmitting || userStatus === "pending"}
                  className="w-full mt-10 px-8 py-4 bg-gradient-to-r from-primary via-accent to-warning hover:shadow-[0_0_40px_rgba(99,102,241,0.3)] disabled:bg-muted disabled:text-muted-foreground text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed text-lg"
                >
                  <span className="material-symbols-outlined">send</span>
                  {isSubmitting ? "Đang gửi..." : userStatus === "pending" ? "Đơn đã gửi" : "Gửi Đơn Đăng Ký"}
                </motion.button>
              </Magnetic>
            </div>
          </div>
        </motion.section>
      )}

      {/* Approved Success State */}
      {userStatus === "approved" && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 sm:px-0"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] p-12 md:p-16 bg-gradient-to-br from-primary/10 via-success/8 to-transparent border-2 border-primary/40">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-[60px]" />
            <div className="relative z-10 text-center space-y-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/40 to-success/30"
              >
                <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
              </motion.div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-foreground">Chào mừng bạn! 🎉</h2>
                <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                  Bạn đã được phê duyệt! Admin sẽ liên hệ qua email để bắt đầu: setup codebase, issue đầu tiên, và Slack team.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Developers List */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true, amount: 0.2 }}
        className="px-4 sm:px-0"
      >
        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-primary/5 via-accent/3 to-warning/5 p-10 md:p-14">
          <div className="mb-10">
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 border border-primary/50 text-[10px] font-black tracking-[0.15em] text-foreground uppercase mb-4">
              <span className="material-symbols-outlined text-sm">people</span>
              Nhà Phát Triển Hugo Studio
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">Đội Ngũ ({developers.length})</h2>
          </div>

          {developers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-16"
            >
              <span className="material-symbols-outlined text-6xl text-muted-foreground/50 block mb-4">groups</span>
              <p className="text-lg text-muted-foreground">
                Chưa có ai tham gia. Hãy trở thành người đầu tiên! 🚀
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {developers.map((dev, i) => (
                <motion.div
                  key={dev.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-card via-card/95 to-muted/50 border border-white/10 group-hover:border-primary/30 p-6 rounded-2xl transition-all">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate">{dev.name}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-1">{dev.email}</p>
                      </div>
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="material-symbols-outlined text-base text-primary flex-shrink-0"
                      >
                        verified
                      </motion.span>
                    </div>
                    {dev.school && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                        <span className="material-symbols-outlined text-sm">school</span>
                        <span className="text-xs font-medium text-primary">{dev.school}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Footer CTA */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.3 }}
        className="px-4 sm:px-0"
      >
        <div className="rounded-[2.5rem] border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-warning/5 p-10 md:p-14 text-center">
          <h3 className="text-2xl font-black text-foreground mb-4">Câu hỏi?</h3>
          <p className="text-base text-muted-foreground mb-6">
            Liên hệ tôi trực tiếp hoặc nhắn tin qua Hugo Studio Chat
          </p>
          <motion.a
            href="mailto:hugowishpax@gmail.com"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <span className="material-symbols-outlined">mail</span>
            hugowishpax@gmail.com
          </motion.a>
        </div>
      </motion.section>
    </div>
  );
}
