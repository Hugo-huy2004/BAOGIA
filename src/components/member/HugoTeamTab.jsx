import React, { useState, useEffect } from "react";
import SubUtilityHeader from "./SubUtilityHeader";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/authSession";

// Nội dung lợi ích thành viên HugoTeam — thuần tĩnh, sửa chữ ở đây.
const BENEFITS = [
  {
    icon: "school",
    title: "Học từ dự án thật, không phải bài tập",
    desc: "Bạn đồng hành trực tiếp cùng hệ thống đang chạy thật với người dùng thật: React, Node.js, MongoDB, AI, PWA, thanh toán trực tuyến. Mỗi dòng code bạn viết đều được deploy và có người sử dụng — thứ mà không giáo trình nào dạy được.",
  },
  {
    icon: "co_present",
    title: "Mentor 1:1 trong suốt quá trình",
    desc: "Hugo trực tiếp review từng pull request, giải thích vì sao code nên viết thế này thay vì thế kia. Bạn không bị bỏ rơi với một task khó — luôn có người đồng hành gỡ rối, từ bug đầu tiên đến feature hoàn chỉnh đầu tiên.",
  },
  {
    icon: "work_history",
    title: "Portfolio & kinh nghiệm thực chiến",
    desc: "Sau vài tháng, CV của bạn có: dự án production thật để demo, lịch sử commit công khai, và kinh nghiệm đồng hành dự án theo quy trình chuyên nghiệp (Git flow, code review, testing). Đây là lợi thế lớn khi phỏng vấn thực tập hoặc vị trí đầu tiên trong nghề.",
  },
  {
    icon: "workspace_premium",
    title: "Thư giới thiệu & xác nhận đóng góp",
    desc: "Hoàn thành tốt giai đoạn cộng tác, bạn nhận thư giới thiệu chi tiết về những gì bạn đã xây dựng — có số liệu, có sản phẩm cụ thể — do Hugo Studio xác nhận, dùng được cho hồ sơ xin việc, học bổng hoặc du học.",
  },
  {
    icon: "schedule",
    title: "Linh hoạt tuyệt đối theo lịch học",
    desc: "Đồng hành remote 100%, tự chọn khung giờ tham gia, 5–10 giờ/tuần. Mùa thi được nghỉ hẳn không cần xin phép. Nguyên tắc của Hugo Studio: việc học của bạn luôn đứng trước dự án — không deadline gắt, không áp lực OT.",
  },
  {
    icon: "diversity_3",
    title: "Cộng đồng dev sinh viên cùng chí hướng",
    desc: "Gặp gỡ những bạn sinh viên CNTT khác cùng đồng hành, cùng học. Trao đổi kỹ thuật, chia sẻ tài liệu, giúp nhau debug — một network nhỏ nhưng chất lượng sẽ theo bạn dài lâu sau khi ra trường.",
  },
];

export default function HugoTeamTab({ onBack }) {
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

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto bg-white dark:bg-background rounded-[2rem] border border-border/50 shadow-sm p-6 lg:p-8 space-y-6">
      <SubUtilityHeader title="Hugo Team" icon="groups" colorClass="text-primary" onBack={onBack} />

      <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Community Project
        </div>
        <h1 className="text-2xl font-black text-foreground">Đồng Hành Dự Án Cộng Đồng</h1>
        <p className="text-base text-muted-foreground max-w-2xl">
          Tôi đang tìm các bạn sinh viên nam/nữ năm 2-3 ngành CNTT để cùng phát triển Hugo Studio.
          Đây là cơ hội vừa học vừa đồng hành dự án cộng đồng, hoàn toàn miễn phí, phi lợi nhuận nhưng bạn sẽ xây dựng được portfolio thực tế.
        </p>
      </div>

      {/* Benefits */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground mb-2">Lợi Ích Khi Tham Gia HugoTeam</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          HugoTeam là dự án phi lợi nhuận — không ai trả lương ai, nhưng cả hai bên cùng có lợi:
          bạn nhận kiến thức, kinh nghiệm và sự đồng hành thật; Hugo Studio có thêm những người
          bạn cùng xây sản phẩm phục vụ cộng đồng học sinh sinh viên.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="p-4 rounded-2xl border border-border bg-card/50 space-y-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <span className="material-symbols-outlined text-[20px]">{b.icon}</span>
              </span>
              <p className="font-semibold text-foreground text-sm">{b.title}</p>
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
            từng giờ đóng góp đều được theo dõi minh bạch, là căn cứ cho thư giới thiệu, xác nhận
            kinh nghiệm và các mốc tri ân bên dưới.
          </p>
        </div>
      </div>

      {/* 500-hour milestone */}
      <div className="border-t border-border pt-8">
        <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
              <span className="material-symbols-outlined text-[22px]">military_tech</span>
            </span>
            <h2 className="text-lg font-bold text-foreground">Mốc 500 Giờ — Món Quà Tri Ân Đặc Biệt</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Với những thành viên đạt <span className="font-semibold text-foreground">500 giờ đồng hành</span> cùng
            Hugo Studio, chúng tôi dành tặng một <span className="font-semibold text-foreground">món quà tri ân
            đặc biệt</span> — lời cảm ơn cho chặng đường bạn đã tin tưởng và bền bỉ đồng hành. 500 giờ
            không chỉ là con số: đó là hàng trăm bug đã sửa, hàng chục feature đã xây, và một nhà phát
            triển đã thực sự trưởng thành.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Đây là cách Hugo Studio luôn chăm sóc và đồng hành cùng các nhà phát triển của mình trong
            hành trình phi lợi nhuận — không lương, nhưng chưa bao giờ là không có gì: cùng đồng hành, cùng
            học, cùng có lợi, và cùng được ghi nhận xứng đáng.
          </p>
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
            <span className="font-bold text-foreground w-24">Lương:</span>
            <span className="text-muted-foreground">Không lương, hoàn toàn miễn phí, phi lợi nhuận</span>
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
        <div className="border-t border-border pt-8 space-y-6">
          <h2 className="text-lg font-bold text-foreground">Nộp Đơn</h2>

          {userStatus === "pending" && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 text-sm">
              <p className="font-semibold text-foreground">Đơn của bạn đang được xem xét</p>
              <p className="text-muted-foreground mt-1">Tôi sẽ liên hệ qua email trong 3-5 ngày</p>
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

      {/* Approved Success State */}
      {userStatus === "approved" && (
        <div className="p-6 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-2xl text-success flex-shrink-0">check_circle</span>
            <div>
              <p className="font-semibold text-foreground">Chúc mừng bạn! ✅</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bạn đã được phê duyệt. Tôi sẽ liên hệ qua email để hướng dẫn các bước tiếp theo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Developers List */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground mb-4">Nhà Phát Triển ({developers.length})</h2>
        {developers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Chưa có ai tham gia</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {developers.map((dev) => (
              <div key={dev.id} className="p-4 rounded-lg border border-border bg-card/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{dev.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{dev.email}</p>
                  </div>
                  <span className="material-symbols-outlined text-base text-success flex-shrink-0">check_circle</span>
                </div>
                {dev.school && <p className="text-xs text-muted-foreground">📍 {dev.school}</p>}
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
