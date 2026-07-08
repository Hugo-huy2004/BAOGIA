import React, { useState, useEffect } from "react";
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

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-teal-500/20 via-success/20 to-teal-400/20 p-8 md:p-12 text-center">
        <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-success to-teal-400" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-success/20 text-foreground uppercase border border-success/30 mb-4">
            <span className="material-symbols-outlined text-[14px]">groups</span>
            Cộng Đồng Phát Triển
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mt-3">
            Hugo Team
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Dự án giáo dục phi lợi nhuận — Các sinh viên nam năm 2-3 ngành CNTT cùng xây dựng nên Hugo Studio
          </p>
        </div>
      </div>

      {/* Mission & Rules */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tại sao */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">lightbulb</span>
            Tại sao Hugo Team
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-base text-success flex-shrink-0">school</span>
              <span><strong className="text-foreground">Học vừa làm</strong> — Thực hành kiến thức từ lớp học</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-base text-success flex-shrink-0">work</span>
              <span><strong className="text-foreground">Xây dựng portfolio</strong> — Có project thực tế để show</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-base text-success flex-shrink-0">favorite</span>
              <span><strong className="text-foreground">Cộng đồng mã mở</strong> — Đóng góp vào dự án công khai</span>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-base text-success flex-shrink-0">groups</span>
              <span><strong className="text-foreground">Cùng phát triển</strong> — Hợp tác học hỏi lẫn nhau</span>
            </li>
          </ul>
        </div>

        {/* Qui định */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
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
              <p className="text-muted-foreground mt-1">Phát triển feature, fix bug, viết test, tối ưu performance</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="font-semibold text-foreground">Thời Gian</p>
              <p className="text-muted-foreground mt-1">5-10 giờ/tuần, tự do, linh hoạt theo lịch học</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="font-semibold text-foreground">Lương</p>
              <p className="text-success font-semibold mt-1">💰 Phi Lợi Nhuận (Miễn Phí)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scope of Work */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">assignment</span>
          Nội Dung Công Việc
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Frontend</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• React + Vite, Tailwind CSS</li>
              <li>• Xây dựng UI component, page</li>
              <li>• Responsive design, animation</li>
              <li>• Tối ưu performance, UX</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Backend</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Node.js + Express</li>
              <li>• Thiết kế API REST</li>
              <li>• MongoDB database</li>
              <li>• Xử lý business logic</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Full Stack</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Tạo feature end-to-end</li>
              <li>• Đăng ký → Quản lý → Thống kê</li>
              <li>• Realtime sync, WebSocket</li>
              <li>• Đóng góp code + review PR</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Process</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Code review qua GitHub PR</li>
              <li>• Commit message: clear & atomic</li>
              <li>• Viết test cho feature mới</li>
              <li>• Tham gia standup/discussions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Application Section */}
      {userStatus !== "approved" && (
        <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">upload_file</span>
            Nộp Đơn Đăng Ký
          </h2>

          {userStatus === "pending" && (
            <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-900 dark:text-amber-200 flex gap-3">
              <span className="material-symbols-outlined flex-shrink-0">schedule</span>
              <span>Đơn của bạn đang được xem xét. Admin sẽ liên hệ trong 3-5 ngày.</span>
            </div>
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
                className="block w-full px-4 py-3 border border-border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600"
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

            <button
              onClick={handleSubmitCV}
              disabled={!cvFile || isSubmitting || userStatus === "pending"}
              className="w-full px-6 py-3.5 bg-teal-500 hover:bg-teal-600 disabled:bg-muted disabled:text-muted-foreground text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">send</span>
              {isSubmitting ? "Đang gửi..." : userStatus === "pending" ? "Đơn đã gửi" : "Gửi Đơn Đăng Ký"}
            </button>
          </div>
        </div>
      )}

      {userStatus === "approved" && (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-6 sm:p-8">
          <div className="flex items-center gap-3 text-success mb-4">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <h2 className="text-xl font-bold">Chào mừng! 👋</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Bạn đã được phê duyệt. Admin sẽ liên hệ với bạn qua email để bước tiếp theo: làm quen với codebase, issue đầu tiên, và Slack team.
          </p>
        </div>
      )}

      {/* Developers List */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">people</span>
          Nhà Phát Triển Hiện Tại ({developers.length})
        </h2>

        {developers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa có ai tham gia. Hãy trở thành người đầu tiên! 🚀
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((dev) => (
              <div key={dev.id} className="rounded-xl border border-border bg-muted/50 p-4 hover:border-teal-500/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{dev.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-1">{dev.email}</p>
                    {dev.school && (
                      <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">🎓 {dev.school}</p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-base text-success flex-shrink-0">verified</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Contact */}
      <div className="rounded-2xl border border-dashed border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
        <p><strong className="text-foreground">Câu hỏi?</strong> Liên hệ: hugowishpax@gmail.com</p>
        <p className="mt-2">Hoặc nhắn tin qua Hugo Studio Chat</p>
      </div>
    </div>
  );
}
