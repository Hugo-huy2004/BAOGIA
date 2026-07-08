import React, { useState, useEffect } from "react";
import { Heart, Users, FileText, CheckCircle, Clock } from "lucide-react";
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
          setUserStatus(data.status); // null, pending, approved
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
      {/* Header */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-accent/10 to-warning/10 p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <Heart className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-black text-foreground">Hugo Team</h1>
          <Heart className="w-8 h-8 text-accent" />
        </div>
        <p className="mt-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Cộng Đồng Phát Triển Mã Nguồn Mở
        </p>
      </div>

      {/* Mission */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-foreground mb-4">📢 Kêu Gọi Đồng Hành</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            🎓 <strong className="text-foreground">Hugo Studio</strong> là một dự án giáo dục phi lợi nhuận, được xây dựng bởi và cho các bạn sinh viên.
          </p>
          <p>
            Chúng tôi đang tìm kiếm <strong className="text-accent">sinh viên nam năm 2-3</strong> ngành Công Nghệ Thông Tin để:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Cùng nhau <strong>học tập & phát triển</strong> các tính năng mới</li>
            <li><strong>Thực hành</strong> kiến thức từ lớp học vào dự án thực tế</li>
            <li><strong>Xây dựng portfolio</strong> chuyên nghiệp cho sự nghiệp</li>
            <li><strong>Đóng góp</strong> cho cộng đồng mã nguồn mở</li>
          </ul>
          <p className="mt-4 border-t border-border pt-4">
            <strong className="text-foreground">💰 Mức lương:</strong> <span className="text-accent font-semibold">Phi Lợi Nhuận (Miễn Phí)</span><br/>
            <strong className="text-foreground">📍 Nơi làm việc:</strong> Tự do, trực tuyến<br/>
            <strong className="text-foreground">⏰ Thời gian:</strong> Linh hoạt theo lịch học
          </p>
        </div>
      </div>

      {/* Application Section */}
      {userStatus !== "approved" && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Nộp Đơn Đăng Ký
          </h2>

          {userStatus === "pending" && (
            <div className="mb-6 rounded-xl bg-amber-100/20 border border-amber-500/30 p-4 text-sm text-amber-900 dark:text-amber-200">
              <Clock className="w-4 h-4 inline mr-2" />
              Đơn của bạn đang được xem xét. Admin sẽ liên hệ trong 3-5 ngày.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Upload CV (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCvUpload}
                disabled={isSubmitting || userStatus === "pending"}
                className="block w-full px-4 py-3 border border-border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {cvFile ? `✅ ${cvFile.name}` : "Tối đa 5MB, định dạng PDF"}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Yêu Cầu:</h3>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Sinh viên nam năm 2-3 ngành Công Nghệ Thông Tin</li>
                <li>Có kiến thức cơ bản về lập trình (HTML, CSS, JS, PHP)</li>
                <li>Có thể làm việc 5-10 giờ/tuần</li>
                <li>Tích cực học hỏi và hợp tác</li>
              </ul>
            </div>

            <button
              onClick={handleSubmitCV}
              disabled={!cvFile || isSubmitting || userStatus === "pending"}
              className="w-full mt-4 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold rounded-xl transition-all"
            >
              {isSubmitting ? "Đang gửi..." : userStatus === "pending" ? "Đơn đã gửi" : "Gửi Đơn Đăng Ký"}
            </button>
          </div>
        </div>
      )}

      {userStatus === "approved" && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3 text-success mb-4">
            <CheckCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Chào mừng bạn đến với Hugo Team! 🎉</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Bạn đã được phê duyệt. Admin sẽ liên hệ với bạn qua email để bước tiếp theo.
          </p>
        </div>
      )}

      {/* Developers List */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          Nhà Phát Triển ({developers.length})
        </h2>

        {developers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa có nhà phát triển nào. Hãy trở thành người đầu tiên! 🚀
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((dev) => (
              <div key={dev.id} className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">{dev.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{dev.email}</p>
                    {dev.school && (
                      <p className="text-xs text-accent mt-2">🎓 {dev.school}</p>
                    )}
                  </div>
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
        <p>Có câu hỏi? Liên hệ: <strong className="text-foreground">hugowishpax@gmail.com</strong></p>
        <p className="mt-2">Hoặc nhắn tin trực tiếp qua Hugo Studio Chat</p>
      </div>
    </div>
  );
}
