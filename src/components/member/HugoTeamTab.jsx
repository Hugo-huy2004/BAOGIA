import React, { useState, useEffect } from "react";
import SubUtilityHeader from "./SubUtilityHeader";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/authSession";

// Nội dung lợi ích thành viên HugoTeam — thuần tĩnh, sửa chữ ở đây.
const BENEFITS = [
  {
    icon: "school",
    title: "Cùng làm sản phẩm chạy thật",
    desc: "Tụi mình cùng phát triển hệ thống phục vụ các bạn HSSV mỗi ngày (React, Node.js, MongoDB, AI). Có cơ hội thử sức với các tính năng thực tế thay vì chỉ làm bài tập lớn rồi bỏ.",
  },
  {
    icon: "co_present",
    title: "Không lo cô đơn khi gỡ bug",
    desc: "Tụi mình sẽ cùng review code và trao đổi. Gặp bug khó hay chưa hiểu kiến trúc cứ thoải mái hỏi, tụi mình cùng tìm cách giải quyết trên tinh thần học hỏi lẫn nhau.",
  },
  {
    icon: "work_history",
    title: "Tích lũy kinh nghiệm thực tế",
    desc: "Cùng trải qua quy trình làm việc thực tế (Git, code review, debug). Đây là những câu chuyện thực chất giúp bạn tự tin chia sẻ khi đi phỏng vấn thực tập.",
  },
  {
    icon: "workspace_premium",
    title: "Ghi nhận qua commit Github",
    desc: "Vì là dự án phi lợi nhuận của sinh viên nên việc xác nhận bằng văn bản/đóng dấu khá khó. Thay vào đó, mọi đóng góp của bạn sẽ hiển thị công khai qua lịch sử commit Github - bằng chứng năng lực thực tế nhất.",
  },
  {
    icon: "schedule",
    title: "Việc học luôn được ưu tiên",
    desc: "Hoàn toàn tự chọn thời gian làm việc (tầm 5-10h/tuần). Mùa thi cử có thể tạm nghỉ để tập trung học tập, không áp lực tiến độ hay KPI gò bó.",
  },
  {
    icon: "diversity_3",
    title: "Kết nối bạn bè cùng ngành",
    desc: "Gặp gỡ những bạn sinh viên IT cùng chí hướng để chia sẻ tài liệu, kinh nghiệm học tập và hỗ trợ nhau trên con đường phát triển sự nghiệp sau này.",
  },
];

export default function HugoTeamTab({ onBack }) {
  const [developers, setDevelopers] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [me, setMe] = useState(null); // GET /me payload — status + dashboard data
  const userStatus = me?.status ?? null;

  useEffect(() => {
    loadDevelopers();
    loadMe();
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

  const loadMe = async () => {
    try {
      const session = await getMemberSession();
      if (!session?.email) return;
      const res = await fetch("/api/hugoteam/me");
      if (res.ok) setMe(await res.json());
    } catch (error) {
      console.error("Failed to load hugoteam profile:", error);
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
        setMe((m) => ({ ...(m || {}), status: "pending" }));
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

  // Dev đã được duyệt → HugoTeam trở thành workspace: task, giờ đồng hành, trao đổi.
  if (userStatus === "approved") {
    const membershipEnd = me?.membershipEnd ? new Date(me.membershipEnd) : null;
    const daysRemaining = membershipEnd ? Math.ceil((membershipEnd - new Date()) / (24 * 60 * 60 * 1000)) : null;
    return (
      <div className="animate-fadeIn max-w-4xl mx-auto bg-white dark:bg-background rounded-[2rem] border border-border/50 shadow-sm p-6 lg:p-8 space-y-6">
        <SubUtilityHeader title="Hugo Team" icon="groups" colorClass="text-primary" onBack={onBack} />
        {/* Dev Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-amber-500">verified_user</span>
            <div>
              <p className="font-black text-foreground">Developer Member</p>
              <p className="text-xs text-muted-foreground">
                Membership hết hạn: {membershipEnd?.toLocaleDateString("vi-VN")} ({daysRemaining} ngày)
              </p>
            </div>
          </div>
          <span className="text-3xl font-black bg-gradient-to-r from-amber-400 to-pink-500 bg-clip-text text-transparent">VVIP</span>
        </div>
        <DevWorkspace me={me} reload={loadMe} membershipEnd={membershipEnd} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto bg-white dark:bg-background rounded-[2rem] border border-border/50 shadow-sm p-6 lg:p-8 space-y-8">
      <SubUtilityHeader title="Hugo Team — Đồng Hành Dự Án Cộng Đồng" icon="groups" colorClass="text-primary" onBack={onBack} />

      <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">rocket</span>
          Cơ hội tham gia dự án thực tế
        </div>
        <h1 className="text-3xl lg:text-4xl font-black text-foreground">Đồng Hành Dự Án Cộng Đồng</h1>
        <div className="space-y-3 max-w-3xl">
          <p className="text-base text-muted-foreground">
            Bạn học CNTT năm 2–3, code đã hòm hòm nhưng muốn cọ xát với dự án thực tế chạy thật?
            Tụi mình hiểu cảm giác muốn học hỏi thêm ngoài giờ lên lớp nhưng chưa biết bắt đầu từ đâu.
          </p>
          <p className="text-base text-muted-foreground">
            HugoTeam là nhóm nhỏ sinh viên IT cùng nhau xây dựng các sản phẩm thực tế phục vụ cộng đồng HSSV.
            Hoạt động hoàn toàn <span className="font-semibold text-foreground">phi lợi nhuận</span>, hỗ trợ và chia sẻ kinh nghiệm lẫn nhau.
            Mọi đóng góp của bạn được ghi nhận trên Github, làm việc <span className="font-semibold text-foreground">5–10 giờ/tuần</span> tự do theo lịch học.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="border-t border-border pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">🎁 Những thứ tụi mình có thể làm cho nhau</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Dự án cộng đồng phi lợi nhuận hoạt động trên tinh thần tự nguyện. Không có tiền lương, nhưng có giá trị thực chất:
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="group p-5 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-primary/30 hover:shadow-lg transition-all space-y-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">{b.icon}</span>
              </span>
              <p className="font-bold text-foreground text-sm leading-snug">{b.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How Hugo Studio takes care of members */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground mb-4">Cách Hugo Studio Đồng Hành Cùng Bạn</h2>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground max-w-2xl">
          <p>
            <span className="font-semibold text-foreground">Tuần đầu tiên</span> — bạn được hướng dẫn
            setup môi trường, đọc hiểu kiến trúc hệ thống và nhận task đầu tiên vừa sức (thường là một
            bug nhỏ có hướng dẫn). Mục tiêu duy nhất của tuần này: bạn merge được dòng code đầu tiên
            vào sản phẩm thật.
          </p>
          <p>
            <span className="font-semibold text-foreground">Hàng tuần</span> — trao đổi tiến độ ngắn
            gọn qua chat, không họp hành rườm rà. Task giao theo năng lực và tăng dần độ khó: từ fix
            bug, viết test, đến tự thiết kế và xây feature hoàn chỉnh. Mọi pull request đều được
            review kỹ kèm giải thích — review chính là buổi học.
          </p>
          <p>
            <span className="font-semibold text-foreground">Khi bạn gặp khó</span> — hỏi bất cứ lúc
            nào, không có câu hỏi nào là ngớ ngẩn. Kẹt quá 2 tiếng thì dừng lại và hỏi ngay; văn hóa
            của HugoTeam là gỡ rối cùng nhau thay vì để một người tự vật lộn.
          </p>
          <p>
            <span className="font-semibold text-foreground">Số giờ đồng hành của bạn được ghi nhận</span> —
            từng giờ đóng góp đều được cập nhật minh bạch trong workspace này, làm cơ sở cho việc vinh danh đóng góp và các mốc tri ân bên dưới.
          </p>
        </div>
      </div>

      {/* Membership & 500-hour milestone */}
      <div className="border-t border-border pt-8">
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-pink-500/30 text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-[24px]">military_tech</span>
            </span>
            <h2 className="text-lg font-bold text-foreground">Sự Bền Bỉ Và Tri Ân Nhẹ Nhàng</h2>
          </div>

          {/* Membership info */}
          <div className="bg-white/40 dark:bg-black/20 rounded-xl p-3 border border-border/50 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base text-primary">verified</span>
              <span className="font-semibold text-foreground">Membership: 3 năm (1095 ngày)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Khi được chấp thuận tham gia, bạn nhận membership 3 năm (không phải 365 ngày) với quyền lợi VVIP Developer.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Đồng hành cùng nhau lâu dài là điều rất đáng quý. Hành trình phi lợi nhuận này hoạt động
            dựa trên sự tự nguyện, không ràng buộc nhưng tụi mình luôn trân trọng sự kiên trì của bạn.
          </p>
          <div className="bg-white/40 dark:bg-black/20 rounded-xl p-3 border border-success/30 space-y-2">
            <p className="text-sm font-bold text-foreground">🎁 Khi chạm mốc 500 giờ đồng hành:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Vinh danh trong mục đóng góp trên hệ thống</li>
              <li>• Hỗ trợ review CV chuyên sâu từ kinh nghiệm thực tế</li>
              <li>• Buổi cafe trò chuyện định hướng nghề nghiệp</li>
              <li>• Phần quà kỷ niệm để cảm ơn sự kiên trì của bạn</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground mb-4">Yêu Cầu & Điều Kiện</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">Đối tượng:</span>
            <span className="text-muted-foreground">Sinh viên nam/nữ, năm 2-3, ngành Công Nghệ Thông Tin</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">Đồng hành:</span>
            <span className="text-muted-foreground">Học lập trình, fix bug, phát triển feature nhỏ, viết test</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">Thời gian:</span>
            <span className="text-muted-foreground">5-10 giờ/tuần, tự do, linh hoạt theo lịch học của bạn</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">Tính chất:</span>
            <span className="text-muted-foreground">Dự án phi lợi nhuận, tự nguyện hỗ trợ học tập và tích lũy kinh nghiệm</span>
          </div>
        </div>
      </div>

      {/* Info about process */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground mb-4">Quy Trình Tham Gia</h2>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-4">
            <span className="font-bold text-foreground flex-shrink-0">1.</span>
            <span className="text-muted-foreground">Bạn nộp CV dưới đây (PDF, tối đa 5MB)</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-foreground flex-shrink-0">2.</span>
            <span className="text-muted-foreground">Tôi sẽ xem xét và liên hệ qua email trong 3-5 ngày</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-foreground flex-shrink-0">3.</span>
            <span className="text-muted-foreground">Sau khi phê duyệt, tôi sẽ hướng dẫn chi tiết qua email</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-foreground flex-shrink-0">4.</span>
            <span className="text-muted-foreground">Bạn bắt đầu học và đồng hành dự án theo lộ trình</span>
          </li>
        </ol>
      </div>

      {/* Application Section */}
      {userStatus !== "approved" && (
        <div className="border-t border-border pt-8 space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">🚀 Sẵn Sàng Bắt Đầu?</h2>
            <p className="text-sm text-muted-foreground max-w-3xl">
              CV không cần hoàn hảo — chúng tôi tìm sự <span className="font-semibold text-foreground">nghiêm túc</span> và
              <span className="font-semibold text-foreground"> ham học</span>, không tìm người đã giỏi sẵn.
              Kể cả khi bạn mới chỉ có đồ án môn học, cứ mạnh dạn gửi: dòng code production đầu tiên
              của bạn có thể được merge ngay trong tuần tới.
            </p>
          </div>

          {userStatus === "pending" && (
            <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">hourglass_top</span>
                <p className="font-semibold text-foreground">Đơn của bạn đang được xem xét</p>
              </div>
              <p className="text-sm text-muted-foreground">Tôi sẽ liên hệ qua email trong 3-5 ngày, cảm ơn sự kiên nhẫn!</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-foreground mb-2 block">Upload CV (PDF)</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCvUpload}
                disabled={isSubmitting || userStatus === "pending"}
                className="block w-full px-4 py-3 border border-border rounded-lg text-sm file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 transition-all cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {cvFile ? `✅ ${cvFile.name}` : "Tối đa 5MB, định dạng PDF"}
              </p>
            </label>

            <button
              onClick={handleSubmitCV}
              disabled={!cvFile || isSubmitting || userStatus === "pending"}
              className="w-full px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold rounded-lg transition-all disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? "Đang gửi..." : userStatus === "pending" ? "Đơn đã gửi" : "Nộp Đơn"}
            </button>
          </div>
        </div>
      )}

      {/* Developers List — nâng cấp */}
      <div className="border-t border-border pt-8">
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-bold text-foreground">Tim Phát Triển ({developers.length})</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Những bạn sinh viên đã được chấp nhận tham gia HugoTeam. Mỗi người mang theo ghi chú cam kết 3 năm đồng hành dự án cộng đồng.
          </p>
        </div>
        {developers.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border/50 text-center">
            <span className="material-symbols-outlined text-3xl text-muted-foreground block mb-2">groups</span>
            <p className="text-sm text-muted-foreground">Tim sẽ bắt đầu từ thành viên đầu tiên</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((dev) => (
              <div
                key={dev.id}
                className="group relative p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-purple-500/5 to-pink-500/5 hover:border-amber-500/50 hover:shadow-lg transition-all duration-300 space-y-3"
              >
                {/* VVIP Badge */}
                <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 text-white text-[10px] font-black shadow-md">
                  DEVELOPER
                </div>

                {/* Avatar + Name */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                    {dev.name[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm leading-tight">{dev.name}</p>
                    {dev.school && <p className="text-xs text-muted-foreground mt-0.5 truncate">{dev.school}</p>}
                  </div>
                </div>

                {/* Membership Status */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>Membership: 3 năm</span>
                </div>

                {/* Verified Check */}
                <div className="flex items-center justify-center pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-bold">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    Đã phê duyệt
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="border-t border-border pt-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">Có câu hỏi? Liên hệ tôi</p>
        <a href="mailto:hugowishpax@gmail.com" className="text-primary font-semibold hover:underline">
          hugowishpax@gmail.com
        </a>
      </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Dev Workspace (đã được duyệt) ───────────────────────── */

const TASK_STATUS_META = {
  assigned:  { label: "Mới giao",    cls: "bg-info/10 text-info" },
  doing:     { label: "Đang thực hiện", cls: "bg-warning/10 text-warning" },
  submitted: { label: "Chờ nghiệm thu", cls: "bg-primary/10 text-primary" },
  done:      { label: "Hoàn thành",  cls: "bg-success/10 text-success" },
  cancelled: { label: "Đã hủy",      cls: "bg-muted text-muted-foreground" },
};

const LOG_STATUS_META = {
  pending:  { label: "Chờ duyệt", cls: "bg-warning/10 text-warning" },
  approved: { label: "Đã duyệt",  cls: "bg-success/10 text-success" },
  rejected: { label: "Từ chối",   cls: "bg-destructive/10 text-destructive" },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

function StatusChip({ meta }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function DevWorkspace({ me, reload, membershipEnd }) {
  const [section, setSection] = useState("tasks");
  const stats = me?.stats || {};
  const goal = 500;
  const progress = Math.min(100, ((stats.approvedHours || 0) / goal) * 100);
  const isMilestone = (stats.approvedHours || 0) >= goal;

  const SECTIONS = [
    { id: "tasks", label: "Nhiệm vụ", icon: "checklist", badge: stats.openTasks },
    { id: "hours", label: "Giờ đồng hành", icon: "schedule", badge: 0 },
    { id: "chat", label: "Trao đổi", icon: "forum", badge: stats.unreadMessages },
  ];

  return (
    <div className="space-y-6">
      {/* Chào + membership info + tiến độ 500h */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-base">verified_user</span>
            Dev Workspace
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Chào {me.name}! 🎉</h1>
        </div>

        {/* Membership Card */}
        {membershipEnd && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-amber-500/20 space-y-2">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">3-Year Developer Membership</p>
            <p className="text-sm text-muted-foreground">
              Hết hạn: <span className="font-semibold text-foreground">{membershipEnd.toLocaleDateString("vi-VN")}</span>
            </p>
          </div>
        )}

        {/* Hours Milestone */}
        <div className={`p-5 rounded-2xl space-y-3 border transition-all ${
          isMilestone
            ? "bg-gradient-to-br from-success/10 via-emerald-500/10 to-success/10 border-success/30"
            : "bg-gradient-to-br from-primary/10 via-blue-500/10 to-primary/10 border-primary/30"
        }`}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">{isMilestone ? "military_tech" : "schedule"}</span>
              <span className="font-semibold text-foreground">Hành trình {goal} giờ đồng hành</span>
            </div>
            <span className={`font-black ${isMilestone ? "text-success" : "text-primary"}`}>
              {stats.approvedHours || 0}h / {goal}h
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden border border-border/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isMilestone ? "bg-gradient-to-r from-success to-emerald-500" : "bg-gradient-to-r from-primary to-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {isMilestone && (
            <p className="text-xs font-bold text-success">
              🎁 Bạn đã đạt mốc! Liên hệ Hugo để nhận những phần quà tri ân đặc biệt từ Hugo Studio.
            </p>
          )}
          {!isMilestone && (
            <p className="text-xs text-muted-foreground">
              {stats.pendingHours > 0 && `${stats.pendingHours}h đang chờ duyệt · `}
              Còn {goal - (stats.approvedHours || 0)}h nữa!
            </p>
          )}
        </div>
      </div>

      {/* Stats nhanh — nâng cấp visual */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "pending_actions", value: stats.openTasks || 0, label: "Task đang mở", color: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400" },
          { icon: "task_alt", value: stats.doneTasks || 0, label: "Task hoàn thành", color: "from-success/10 to-emerald-500/5 border-success/20 text-success" },
          { icon: "verified", value: `${stats.approvedHours || 0}h`, label: "Giờ đã duyệt", color: "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400" },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-2xl bg-gradient-to-br ${s.color} border text-center space-y-2 transition-transform hover:scale-105`}>
            <span className="material-symbols-outlined text-[22px] block">{s.icon}</span>
            <p className="text-xl font-black leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section switcher — nâng cấp */}
      <div className="flex gap-2 bg-muted/50 p-1 rounded-2xl border border-border/50">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
              section === s.id
                ? "bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-md"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
            {s.badge > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-destructive text-white text-[10px] font-black flex items-center justify-center shadow-md">
                {s.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {section === "tasks" && <DevTasks tasks={me.tasks || []} reload={reload} />}
      {section === "hours" && <DevHours hourLogs={me.hourLogs || []} tasks={me.tasks || []} reload={reload} />}
      {section === "chat" && <DevChat messages={me.messages || []} reload={reload} />}
    </div>
  );
}

function DevTasks({ tasks, reload }) {
  const [noteFor, setNoteFor] = useState(null); // taskId đang nộp
  const [note, setNote] = useState("");

  const updateTask = async (taskId, body) => {
    try {
      const res = await fetch(`/api/hugoteam/me/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật task");
      notify.success(body.status === "submitted" ? "Đã nộp task — chờ nghiệm thu!" : "Đã cập nhật task");
      setNoteFor(null);
      setNote("");
      reload();
    } catch (e) {
      notify.error(e.message);
    }
  };

  if (!tasks.length) {
    return (
      <div className="p-8 rounded-2xl border border-dashed border-border bg-muted/30 text-center space-y-3">
        <span className="material-symbols-outlined text-[36px] text-muted-foreground block">inbox</span>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Chưa có nhiệm vụ nào</p>
          <p className="text-xs text-muted-foreground mt-1">Admin sẽ giao task qua đây và gửi thông báo qua email</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <div key={t._id} className="p-4 rounded-2xl border border-border/50 bg-gradient-to-r from-card via-card/50 to-card hover:border-border transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm">{t.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Giao {fmtDate(t.assignedAt)}
                {t.deadline && <> · Hạn <span className="font-semibold text-foreground">{fmtDate(t.deadline)}</span></>}
              </p>
            </div>
            <StatusChip meta={TASK_STATUS_META[t.status] || TASK_STATUS_META.assigned} />
          </div>

          {t.guide && (
            <div className="p-3 rounded-xl bg-muted/60 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              <p className="font-bold text-foreground mb-1">Hướng dẫn từ admin</p>
              {t.guide}
            </div>
          )}
          {t.adminNote && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              <p className="font-bold text-foreground mb-1">Nhận xét nghiệm thu</p>
              {t.adminNote}
            </div>
          )}
          {t.devNote && t.status !== "doing" && (
            <p className="text-xs text-muted-foreground italic">Ghi chú của bạn: {t.devNote}</p>
          )}

          {t.status === "assigned" && (
            <button
              onClick={() => updateTask(t._id, { status: "doing" })}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform"
            >
              Bắt đầu thực hiện
            </button>
          )}
          {t.status === "doing" && (
            noteFor === t._id ? (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Mô tả ngắn những gì bạn đã hoàn thành (link PR, kết quả...)"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateTask(t._id, { status: "submitted", devNote: note })}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform"
                  >
                    Xác nhận nộp
                  </button>
                  <button
                    onClick={() => { setNoteFor(null); setNote(""); }}
                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setNoteFor(t._id); setNote(t.devNote || ""); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform"
              >
                Nộp task
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}

function DevHours({ hourLogs, tasks, reload }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, hours: "", note: "", taskId: "" });
  const [saving, setSaving] = useState(false);
  const openTasks = tasks.filter((t) => ["doing", "submitted", "done"].includes(t.status));

  const submit = async () => {
    const h = Number(form.hours);
    if (!form.date || !Number.isFinite(h) || h <= 0) {
      notify.error("Nhập ngày và số giờ hợp lệ");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hugoteam/me/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hours: h, taskId: form.taskId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi ghi giờ");
      notify.success("Đã ghi giờ đồng hành — chờ admin duyệt");
      setForm({ date: today, hours: "", note: "", taskId: "" });
      reload();
    } catch (e) {
      notify.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (logId) => {
    const ok = await notify.confirm({ title: "Rút lại giờ đã ghi?", message: "Chỉ rút được khi chưa duyệt.", danger: true });
    if (!ok) return;
    try {
      const res = await fetch(`/api/hugoteam/me/hours/${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi");
      notify.success("Đã rút lại");
      reload();
    } catch (e) {
      notify.error(e.message);
    }
  };

  const taskTitle = (id) => tasks.find((t) => t._id === id)?.title;

  return (
    <div className="space-y-4">
      {/* Form ghi giờ */}
      <div className="p-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/0 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">schedule</span>
          <p className="font-bold text-foreground text-sm">Ghi giờ đồng hành</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs space-y-1">
            <span className="font-semibold text-muted-foreground">Ngày</span>
            <input type="date" max={today} value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
          </label>
          <label className="text-xs space-y-1">
            <span className="font-semibold text-muted-foreground">Số giờ (0.25–24)</span>
            <input type="number" min="0.25" max="24" step="0.25" value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              placeholder="VD: 2.5"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
          </label>
        </div>
        {openTasks.length > 0 && (
          <label className="text-xs space-y-1 block">
            <span className="font-semibold text-muted-foreground">Gắn với task (tùy chọn)</span>
            <select value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background">
              <option value="">— Không gắn task —</option>
              {openTasks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          </label>
        )}
        <label className="text-xs space-y-1 block">
          <span className="font-semibold text-muted-foreground">Bạn đã đồng hành việc gì?</span>
          <input value={form.note} maxLength={500}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="VD: Fix bug thanh toán, review tài liệu onboarding..."
            className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
        </label>
        <button onClick={submit} disabled={saving}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 active:scale-95 transition-transform">
          {saving ? "Đang lưu..." : "Ghi giờ"}
        </button>
      </div>

      {/* Lịch sử */}
      {hourLogs.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-border/50 text-center">
          <p className="text-sm text-muted-foreground">Chưa có giờ nào được ghi. Bắt đầu ghi giờ đồng hành của bạn!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">Lịch sử ghi giờ</p>
          {hourLogs.map((l) => (
            <div key={l._id} className="p-3.5 rounded-2xl border border-border/50 bg-gradient-to-r from-card via-card/50 to-card hover:border-border transition-all flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {l.hours}h · {fmtDate(l.date)}
                </p>
                {(l.note || l.taskId) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {taskTitle(l.taskId) ? `[${taskTitle(l.taskId)}] ` : ""}{l.note}
                  </p>
                )}
              </div>
              <StatusChip meta={LOG_STATUS_META[l.status] || LOG_STATUS_META.pending} />
              {l.status === "pending" && (
                <button onClick={() => withdraw(l._id)} aria-label="Rút lại"
                  className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DevChat({ messages, reload }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Mở tab Trao đổi = đã đọc tin admin
  useEffect(() => {
    if (messages.some((m) => m.from === "admin" && !m.readByDev)) {
      fetch("/api/hugoteam/me/messages/read", { method: "POST" }).then(reload).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const res = await fetch("/api/hugoteam/me/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi gửi tin");
      setText("");
      reload();
    } catch (e) {
      notify.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3 flex flex-col h-[500px]">
      <div className="flex-1 max-h-[60vh] overflow-y-auto space-y-2 p-2 border border-border/50 rounded-xl bg-muted/30">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-muted-foreground block">mail</span>
              <p className="text-sm text-muted-foreground">
                Chưa có trao đổi nào. Nhắn admin tại đây — tin quan trọng cũng sẽ được gửi qua email cho bạn.
              </p>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m._id} className={`flex ${m.from === "dev" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.from === "dev" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              {m.text}
              <p className={`mt-1 text-[9px] ${m.from === "dev" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {new Date(m.at).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        <input value={text} maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Viết tin nhắn..."
          className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-background text-xs focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all" />
        <button onClick={send} disabled={sending || !text.trim()}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-primary-foreground text-xs font-bold disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground active:scale-95 transition-all">
          {sending ? "..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}
