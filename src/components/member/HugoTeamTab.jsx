import React, { useState, useEffect } from "react";
import { motion, useSpring } from "framer-motion";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/authSession";

export default function HugoTeamTab() {
  const [developers, setDevelopers] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userStatus, setUserStatus] = useState(null); // null, pending, approved

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
    <div className="space-y-8 pb-20 relative">
      {/* Ambient orbs — Introduction page style */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 15, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[8%] right-[5%] w-32 h-32 bg-gradient-to-br from-primary/30 to-accent/20 rounded-full blur-[60px] pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -25, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-20 left-[10%] w-40 h-40 bg-gradient-to-br from-warning/20 to-primary/15 rounded-full blur-[80px] pointer-events-none"
      />

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/8 via-accent/5 to-warning/8 p-8 md:p-12 text-center backdrop-blur-sm"
      >
        <span className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-warning" />

        {/* Dust particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.span
            key={`dust-${i}`}
            animate={{ y: [0, -25, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            style={{ left: `${(i * 60) % 100}%`, top: `${(i * 40) % 60}%` }}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/40 pointer-events-none"
          />
        ))}

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-gradient-to-r from-primary/20 to-accent/20 text-foreground uppercase border border-primary/30 mb-4"
          >
            <span className="material-symbols-outlined text-[14px]">groups</span>
            Cộng Đồng Phát Triển
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-foreground mt-3 bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent"
          >
            Hugo Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Dự án giáo dục phi lợi nhuận — Các sinh viên nam năm 2-3 ngành CNTT học vừa làm, xây dựng portfolio thực tế
          </motion.p>
        </div>
      </motion.div>

      {/* Mission & Rules */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tại sao */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:p-8"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">lightbulb</span>
            Tại sao Hugo Team
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-base text-primary flex-shrink-0">school</span>
              <span><strong className="text-foreground">Học vừa làm</strong> — Thực hành kiến thức từ lớp học</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-base text-primary flex-shrink-0">work</span>
              <span><strong className="text-foreground">Xây dựng portfolio</strong> — Có project thực tế để show</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-base text-primary flex-shrink-0">favorite</span>
              <span><strong className="text-foreground">Cộng đồng mã mở</strong> — Đóng góp vào dự án công khai</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-base text-primary flex-shrink-0">groups</span>
              <span><strong className="text-foreground">Cùng phát triển</strong> — Hợp tác học hỏi lẫn nhau</span>
            </li>
          </ul>
        </motion.div>

        {/* Qui định */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
          className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-warning/5 p-6 sm:p-8"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">rule</span>
            Yêu Cầu & Qui Định
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">Đối Tượng</p>
              <p className="text-muted-foreground mt-1">Sinh viên nam, năm 2-3, ngành Công Nghệ Thông Tin</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="font-semibold text-foreground">Công Việc</p>
              <p className="text-muted-foreground mt-1">Học code, đóng góp feature, fix bug, viết test</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="font-semibold text-foreground">Thời Gian</p>
              <p className="text-muted-foreground mt-1">5-10 giờ/tuần, tự do, linh hoạt theo lịch học</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="font-semibold text-foreground">Lương</p>
              <p className="text-primary font-semibold mt-1">Phi Lợi Nhuận (Miễn Phí)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Learning Roadmap — 2-3 months onboarding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 p-6 sm:p-8"
      >
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">school</span>
          Giai Đoạn Học Tập (2-3 Tháng)
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Để đảm bảo bạn làm chắc và có thể đóng góp hiệu quả, chúng tôi yêu cầu <strong className="text-foreground">2-3 tháng tìm hiểu & học</strong> trước khi nhận các task chính thức.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">import_contacts</span>
              Tháng 1: Làm Quen
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>✓ Hiểu kiến trúc Hugo Studio (frontend/backend/database)</li>
              <li>✓ Làm quen Git workflow & PR review process</li>
              <li>✓ Setup dev environment, chạy project local</li>
              <li>✓ Đọc documentation & architecture docs</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-accent">code</span>
              Tháng 2: Thực Hành
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>✓ Làm các bài tập nhỏ (fix typo, add feature nhỏ)</li>
              <li>✓ Viết unit test cho các hàm</li>
              <li>✓ Tham gia code review (xem & comment PR người khác)</li>
              <li>✓ Học best practice thông qua PR feedback</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-warning">rocket_launch</span>
              Tháng 3+: Phát Triển
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>✓ Nhận feature request thực tế để build</li>
              <li>✓ Độc lập hoàn thành task end-to-end</li>
              <li>✓ Mentoring từ team & peer learning</li>
              <li>✓ Đóng góp liên tục vào Hugo Studio</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Application Section */}
      {userStatus !== "approved" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 p-6 sm:p-8"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">upload_file</span>
            Nộp Đơn Đăng Ký
          </h2>

          {userStatus === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl bg-warning/10 border border-warning/30 p-4 text-sm text-warning-foreground flex gap-3"
            >
              <span className="material-symbols-outlined flex-shrink-0">schedule</span>
              <span>Đơn của bạn đang được xem xét. Admin sẽ liên hệ trong 3-5 ngày.</span>
            </motion.div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Upload CV (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCvUpload}
                disabled={isSubmitting || userStatus === "pending"}
                className="block w-full px-4 py-3 border border-border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary file:to-accent file:text-white hover:file:opacity-90"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {cvFile ? `✅ ${cvFile.name}` : "Tối đa 5MB, định dạng PDF"}
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground text-sm mb-3">Yêu Cầu Hồ Sơ</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>CV tiếng Anh hoặc Việt (1-2 trang)</li>
                <li>Liệt kê kỹ năng: HTML, CSS, JS, React hoặc Node.js</li>
                <li>Dự án cá nhân (GitHub link hoặc mô tả)</li>
                <li>Lý do muốn tham gia Hugo Team</li>
                <li>Khả năng: 5-10 giờ/tuần</li>
              </ul>
            </div>

            <Magnetic>
              <button
                onClick={handleSubmitCV}
                disabled={!cvFile || isSubmitting || userStatus === "pending"}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-primary to-accent hover:shadow-lg disabled:bg-muted disabled:text-muted-foreground text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">send</span>
                {isSubmitting ? "Đang gửi..." : userStatus === "pending" ? "Đơn đã gửi" : "Gửi Đơn Đăng Ký"}
              </button>
            </Magnetic>
          </div>
        </motion.div>
      )}

      {userStatus === "approved" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 to-success/8 p-6 sm:p-8 relative overflow-hidden"
        >
          <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-success to-accent" />
          <div className="flex items-center gap-3 text-primary mb-4">
            <motion.span
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="material-symbols-outlined text-2xl"
            >
              check_circle
            </motion.span>
            <h2 className="text-xl font-bold">Chào mừng bạn! 🎉</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Bạn đã được phê duyệt! Admin sẽ liên hệ qua email để bật đầu: setup codebase, issue đầu tiên, và tham gia Slack team.
          </p>
        </motion.div>
      )}

      {/* Developers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">people</span>
          Nhà Phát Triển Hiện Tại ({developers.length})
        </h2>

        {developers.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground text-center py-8"
          >
            Chưa có ai tham gia. Hãy trở thành người đầu tiên! 🚀
          </motion.p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((dev, i) => (
              <motion.div
                key={dev.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, borderColor: "var(--color-primary)" }}
                className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-4 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{dev.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-1">{dev.email}</p>
                    {dev.school && (
                      <p className="text-xs text-primary mt-2">🎓 {dev.school}</p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-base text-primary flex-shrink-0">verified</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Footer Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, amount: 0.5 }}
        className="rounded-2xl border border-dashed border-border bg-gradient-to-r from-primary/5 to-accent/5 p-6 text-center text-sm text-muted-foreground"
      >
        <p><strong className="text-foreground">Câu hỏi?</strong> Liên hệ: hugowishpax@gmail.com</p>
        <p className="mt-2">Hoặc nhắn tin qua Hugo Studio Chat</p>
      </motion.div>
    </div>
  );
}
