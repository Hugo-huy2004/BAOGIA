import React, { useState, useEffect, useCallback } from "react";
import { Check, X, FileText, Mail, Calendar } from "lucide-react";
import { notify } from "../../lib/notify";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

const TASK_STATUS_META = {
  assigned:  { label: "Mới giao",       cls: "bg-info/10 text-info" },
  doing:     { label: "Đang thực hiện", cls: "bg-warning/10 text-warning" },
  submitted: { label: "Chờ nghiệm thu", cls: "bg-primary/10 text-primary" },
  done:      { label: "Hoàn thành",     cls: "bg-success/10 text-success" },
  cancelled: { label: "Đã hủy",         cls: "bg-muted text-muted-foreground" },
};

const LOG_STATUS_META = {
  pending:  { label: "Chờ duyệt", cls: "bg-warning/10 text-warning" },
  approved: { label: "Đã duyệt",  cls: "bg-success/10 text-success" },
  rejected: { label: "Từ chối",   cls: "bg-destructive/10 text-destructive" },
};

function Chip({ meta }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export default function AdminHugoTeamTab() {
  const [view, setView] = useState("team"); // team | applicants
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    fetch("/api/hugoteam/admin/applicants", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { applicants: [] }))
      .then((d) => setApplicants(d.applicants || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-foreground">Hugo Team</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView("team")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              view === "team" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Quản lý team
          </button>
          <button
            onClick={() => setView("applicants")}
            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              view === "applicants" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Đơn đăng ký
            {applicants.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-black flex items-center justify-center">
                {applicants.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {view === "applicants" ? (
        <ApplicantsView applicants={applicants} setApplicants={setApplicants} />
      ) : (
        <TeamView />
      )}
    </div>
  );
}

/* ───────────────────────── Đơn đăng ký (giữ nguyên luồng cũ) ───────────────────────── */

function ApplicantsView({ applicants, setApplicants }) {
  const [selectedCv, setSelectedCv] = useState(null);

  const decide = async (action, email, name) => {
    if (action === "reject") {
      const ok = await notify.confirm({ title: `Từ chối ${name}?`, danger: true });
      if (!ok) return;
    }
    try {
      const res = await fetch(`/api/hugoteam/admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      notify.success(action === "approve" ? `${name} đã được phê duyệt!` : `Đã từ chối ${name}`);
      setApplicants((list) => list.filter((a) => a.email !== email));
      setSelectedCv(null);
    } catch {
      notify.error("Thao tác thất bại");
    }
  };

  if (applicants.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Không có đơn đăng ký nào chờ duyệt</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        {applicants.map((app) => (
          <div
            key={app.email}
            onClick={() => setSelectedCv(app)}
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              selectedCv?.email === app.email
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-foreground">{app.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4" />{app.email}</p>
                  {app.school && <p>{app.school}</p>}
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {fmtDate(app.createdAt)}
                  </p>
                </div>
              </div>
              <FileText className="w-5 h-5 text-accent flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {selectedCv && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 self-start">
          <h3 className="font-bold text-foreground">Xem Xét Đơn</h3>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-foreground">{selectedCv.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{selectedCv.email}</p>
          </div>
          <a
            href={selectedCv.cvPath}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-all"
          >
            <FileText className="w-4 h-4" />
            Xem CV (PDF)
          </a>
          <div className="space-y-2 border-t border-border pt-4">
            <button
              onClick={() => decide("approve", selectedCv.email, selectedCv.name)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-success/20 text-success font-bold rounded-lg hover:bg-success/30 transition-all"
            >
              <Check className="w-4 h-4" />
              Phê Duyệt
            </button>
            <button
              onClick={() => decide("reject", selectedCv.email, selectedCv.name)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/20 text-destructive font-bold rounded-lg hover:bg-destructive/30 transition-all"
            >
              <X className="w-4 h-4" />
              Từ Chối
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Quản lý team ───────────────────────── */

function TeamView() {
  const [devs, setDevs] = useState([]);
  const [selected, setSelected] = useState(null); // email
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDevs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hugoteam/admin/devs", { credentials: "include" });
      if (res.ok) setDevs((await res.json()).devs || []);
    } catch {
      notify.error("Lỗi tải danh sách dev");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (email) => {
    try {
      const res = await fetch(`/api/hugoteam/admin/devs/${encodeURIComponent(email)}`, { credentials: "include" });
      if (res.ok) setDetail((await res.json()).dev);
    } catch {
      notify.error("Lỗi tải chi tiết dev");
    }
  }, []);

  useEffect(() => { loadDevs(); }, [loadDevs]);
  useEffect(() => { if (selected) loadDetail(selected); else setDetail(null); }, [selected, loadDetail]);

  const refresh = () => { loadDevs(); if (selected) loadDetail(selected); };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Đang tải...</div>;

  if (devs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Chưa có dev nào được phê duyệt</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Danh sách dev + stats */}
      <div className="space-y-3">
        {devs.map((d) => (
          <div
            key={d.email}
            onClick={() => setSelected(d.email)}
            className={`rounded-xl border p-4 cursor-pointer transition-all space-y-2 ${
              selected === d.email ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm">{d.name}</p>
                <p className="text-xs text-muted-foreground truncate">{d.email}</p>
              </div>
              {(d.unreadMessages > 0 || d.submittedTasks > 0 || d.pendingLogs > 0) && (
                <span className="h-2.5 w-2.5 rounded-full bg-destructive flex-shrink-0 mt-1" />
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{d.approvedHours}h duyệt</span>
              {d.pendingHours > 0 && <span>{d.pendingHours}h chờ</span>}
              <span>{d.openTasks} task mở</span>
              {d.submittedTasks > 0 && <span className="text-primary font-semibold">{d.submittedTasks} chờ nghiệm thu</span>}
              {d.unreadMessages > 0 && <span className="text-destructive font-semibold">{d.unreadMessages} tin mới</span>}
            </div>
            {/* Tiến độ 500h */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (d.approvedHours / 500) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Chi tiết dev */}
      <div className="lg:col-span-2">
        {!detail ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Chọn một dev để quản lý task, giờ và trao đổi</p>
          </div>
        ) : (
          <DevDetail dev={detail} refresh={refresh} />
        )}
      </div>
    </div>
  );
}

/* ── Mẫu thư văn phòng (tự sinh, sửa được trước khi gửi) ──
   {name} = tên dev; phần [...] là chỗ admin điền thêm nếu muốn. */
const todayVN = () => new Date().toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });

const MAIL_TEMPLATES = {
  welcome: {
    label: "Chào mừng thành viên",
    icon: "waving_hand",
    subject: () => `[Hugo Studio] Thư chào mừng thành viên chính thức HugoTeam`,
    body: (name) =>
`Kính gửi bạn ${name},

Thay mặt Hugo Studio, tôi trân trọng chào mừng bạn chính thức trở thành thành viên của HugoTeam — nhóm phát triển dự án cộng đồng phục vụ học sinh, sinh viên.

Sự tin tưởng và nhiệt huyết bạn dành cho dự án là điều chúng tôi hết sức trân quý. Trong thời gian tới, chúng ta sẽ cùng nhau xây dựng những sản phẩm mang lại giá trị thiết thực cho cộng đồng, đồng thời bồi đắp kinh nghiệm chuyên môn cho chính bạn.

Để bắt đầu, bạn vui lòng:
1. Đăng nhập Member Portal và mở tab Hugo Team — đây là không gian nhận nhiệm vụ, ghi nhận giờ đồng hành và trao đổi chính thức giữa chúng ta.
2. Kiểm tra email thường xuyên — các nhiệm vụ và tài liệu hướng dẫn sẽ được gửi qua kênh này.
3. Chủ động đặt câu hỏi bất cứ khi nào cần — tinh thần của HugoTeam là cùng gỡ rối, không ai phải tự vật lộn.

Nhiệm vụ đầu tiên sẽ được gửi đến bạn trong thời gian sớm nhất. Một lần nữa, chào mừng bạn gia nhập đội ngũ.

Trân trọng,
Hugo Studio — HugoTeam`,
  },
  task: {
    label: "Giao nhiệm vụ",
    icon: "assignment",
    subject: () => `[Hugo Studio] Giao nhiệm vụ ngày ${todayVN()}`,
    body: (name) =>
`Kính gửi bạn ${name},

Hugo Studio trân trọng gửi đến bạn nhiệm vụ mới trong khuôn khổ dự án cộng đồng HugoTeam. Nội dung chi tiết, phạm vi công việc và tiêu chí hoàn thành được trình bày đầy đủ trong văn bản PDF đính kèm thư này.

[Tóm tắt ngắn về nhiệm vụ — bạn điền tại đây]

Một số lưu ý khi thực hiện:
1. Vui lòng đọc kỹ toàn bộ tài liệu đính kèm trước khi bắt đầu.
2. Cập nhật trạng thái nhiệm vụ trên tab Hugo Team (Bắt đầu thực hiện → Nộp task) để hệ thống ghi nhận tiến độ.
3. Ghi lại giờ đồng hành tương ứng trên hệ thống sau mỗi buổi thực hiện.
4. Nếu có bất kỳ điểm nào chưa rõ, bạn phản hồi email này hoặc nhắn trực tiếp trên tab Trao đổi — tôi sẽ giải đáp trong thời gian sớm nhất.

Chúc bạn thực hiện nhiệm vụ thuận lợi.

Trân trọng,
Hugo Studio — HugoTeam`,
  },
  feedback: {
    label: "Phản hồi / góp ý",
    icon: "rate_review",
    subject: () => `[Hugo Studio] Phản hồi về nhiệm vụ bạn đã nộp`,
    body: (name) =>
`Kính gửi bạn ${name},

Hugo Studio đã xem xét phần nhiệm vụ bạn nộp và trân trọng gửi đến bạn một số nhận xét, góp ý nhằm hoàn thiện kết quả công việc. Nội dung nhận xét chi tiết được trình bày trong văn bản đính kèm (nếu có) và tóm lược dưới đây:

[Nội dung nhận xét chính — bạn điền tại đây]

Đề nghị bạn rà soát các điểm nêu trên và cập nhật lại phần việc trong thời gian phù hợp. Xin lưu ý rằng mọi góp ý đều hướng đến mục tiêu chung là nâng cao chất lượng sản phẩm và kinh nghiệm chuyên môn của chính bạn — đây chính là giá trị cốt lõi của hành trình đồng hành.

Nếu có điểm nào cần trao đổi thêm, bạn vui lòng phản hồi email này.

Trân trọng,
Hugo Studio — HugoTeam`,
  },
  done: {
    label: "Xác nhận hoàn thành",
    icon: "verified",
    subject: () => `[Hugo Studio] Xác nhận hoàn thành nhiệm vụ — ${todayVN()}`,
    body: (name) =>
`Kính gửi bạn ${name},

Hugo Studio xác nhận bạn đã hoàn thành nhiệm vụ được giao với kết quả đạt yêu cầu nghiệm thu. Chúng tôi ghi nhận và đánh giá cao tinh thần trách nhiệm cùng chất lượng công việc bạn đã thể hiện.

[Nhận xét thêm về kết quả — bạn điền tại đây, hoặc xóa dòng này]

Giờ đồng hành tương ứng của nhiệm vụ đã được duyệt và cập nhật vào hồ sơ của bạn trên hệ thống — bạn có thể theo dõi tiến độ hành trình 500 giờ trên tab Hugo Team.

Nhiệm vụ kế tiếp đang được chuẩn bị và sẽ được gửi đến bạn trong thời gian sớm nhất. Trong thời gian chờ, bạn có thể nghỉ ngơi hoặc chủ động đề xuất phần việc bạn muốn thử sức qua tab Trao đổi.

Cảm ơn sự đồng hành bền bỉ của bạn.

Trân trọng,
Hugo Studio — HugoTeam`,
  },
};

function DevDetail({ dev, refresh }) {
  const [tab, setTab] = useState("tasks");

  const pendingLogs = dev.hourLogs.filter((l) => l.status === "pending").length;
  const unread = dev.messages.filter((m) => m.from === "dev" && !m.readByAdmin).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-foreground text-lg">{dev.name}</h3>
          <p className="text-xs text-muted-foreground">{dev.email}{dev.school ? ` · ${dev.school}` : ""} · tham gia {fmtDate(dev.approvedAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-primary leading-none">{dev.approvedHours}h</p>
          <p className="text-[10px] text-muted-foreground">/{500}h tri ân{dev.pendingHours > 0 ? ` · ${dev.pendingHours}h chờ duyệt` : ""}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { id: "tasks", label: "Task" },
          { id: "hours", label: `Giờ${pendingLogs ? ` (${pendingLogs})` : ""}` },
          { id: "chat", label: `Trao đổi${unread ? ` (${unread})` : ""}` },
          { id: "mail", label: "Gửi email" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tasks" && <AdminTasks dev={dev} refresh={refresh} />}
      {tab === "hours" && <AdminHours dev={dev} refresh={refresh} />}
      {tab === "chat" && <AdminChat dev={dev} refresh={refresh} />}
      {tab === "mail" && <AdminMail dev={dev} refresh={refresh} />}
    </div>
  );
}

function AdminMail({ dev, refresh }) {
  const [template, setTemplate] = useState("task");
  const [subject, setSubject] = useState(MAIL_TEMPLATES.task.subject());
  const [body, setBody] = useState(MAIL_TEMPLATES.task.body(dev.name));
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  const pickTemplate = (key) => {
    setTemplate(key);
    setSubject(MAIL_TEMPLATES[key].subject());
    setBody(MAIL_TEMPLATES[key].body(dev.name));
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) { notify.error("Chỉ đính kèm file PDF"); return; }
    if (f.size > 10 * 1024 * 1024) { notify.error("File tối đa 10MB"); return; }
    setFile(f);
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { notify.error("Thiếu tiêu đề hoặc nội dung"); return; }
    if (body.includes("[") && body.includes("— bạn điền tại đây")) {
      const ok = await notify.confirm({
        title: "Nội dung còn chỗ chưa điền",
        message: "Thư vẫn còn đoạn [...] mẫu chưa được thay. Gửi nguyên như vậy?",
        danger: true,
      });
      if (!ok) return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("subject", subject.trim());
      fd.append("body", body);
      if (file) fd.append("attachment", file);
      const res = await fetch(`/api/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/send-mail`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gửi thất bại");
      notify.success(`Đã gửi email đến ${dev.name}`);
      setFile(null);
      refresh();
    } catch (e) {
      notify.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Chọn mẫu thư */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(MAIL_TEMPLATES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => pickTemplate(key)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
              template === key ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-foreground">{t.icon}</span>
            <span className="text-[11px] font-bold text-foreground leading-tight">{t.label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Nội dung dưới đây được tự sinh theo mẫu — sửa trực tiếp trước khi gửi. Đoạn trong ngoặc vuông là chỗ cần điền.
      </p>

      <label className="text-xs space-y-1 block">
        <span className="font-semibold text-muted-foreground">Tiêu đề</span>
        <input
          value={subject}
          maxLength={200}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
        />
      </label>

      <textarea
        value={body}
        maxLength={10000}
        onChange={(e) => setBody(e.target.value)}
        rows={16}
        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm leading-relaxed font-mono"
      />

      {/* Đính kèm PDF — chỉ gửi đi, không lưu hệ thống */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-muted text-xs font-bold text-foreground cursor-pointer hover:bg-muted/70">
          <span className="material-symbols-outlined text-[16px]">attach_file</span>
          {file ? "Đổi file khác" : "Đính kèm PDF"}
          <input type="file" accept=".pdf" onChange={pickFile} className="hidden" />
        </label>
        {file && (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className="material-symbols-outlined text-[15px]">description</span>
            {file.name} ({(file.size / 1024).toFixed(0)} KB)
            <button onClick={() => setFile(null)} aria-label="Bỏ file"
              className="grid h-5 w-5 place-items-center rounded-full hover:bg-muted">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </span>
        )}
        <span className="text-[11px] text-muted-foreground">File chỉ gửi kèm email, không lưu trên hệ thống.</span>
      </div>

      <button
        onClick={send}
        disabled={sending}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 active:scale-95 transition-transform"
      >
        {sending ? "Đang gửi..." : `Gửi email đến ${dev.email}`}
      </button>
    </div>
  );
}

function AdminTasks({ dev, refresh }) {
  const [form, setForm] = useState({ title: "", guide: "", deadline: "" });
  const [creating, setCreating] = useState(false);
  const [reviewing, setReviewing] = useState(null); // taskId
  const [adminNote, setAdminNote] = useState("");

  const createTask = async () => {
    if (!form.title.trim()) { notify.error("Nhập tiêu đề task"); return; }
    setCreating(true);
    try {
      const res = await fetch(`/api/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi giao task");
      notify.success("Đã giao task — dev sẽ nhận email thông báo");
      setForm({ title: "", guide: "", deadline: "" });
      refresh();
    } catch (e) {
      notify.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const updateTask = async (taskId, body, successMsg) => {
    try {
      const res = await fetch(`/api/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi cập nhật");
      notify.success(successMsg);
      setReviewing(null);
      setAdminNote("");
      refresh();
    } catch (e) {
      notify.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Giao task mới */}
      <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
        <p className="font-bold text-foreground text-sm">Giao task mới</p>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Tiêu đề task (VD: Fix bug hiển thị avatar trang Bio)"
          maxLength={200}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
        />
        <textarea
          value={form.guide}
          onChange={(e) => setForm({ ...form, guide: e.target.value })}
          placeholder="Hướng dẫn chi tiết: mô tả, file liên quan, cách test, tiêu chí hoàn thành..."
          rows={4}
          maxLength={5000}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            Hạn:
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="px-3 py-2 rounded-xl border border-border bg-background"
            />
          </label>
          <button
            onClick={createTask}
            disabled={creating}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
          >
            {creating ? "Đang giao..." : "Giao task + gửi email"}
          </button>
        </div>
      </div>

      {/* Danh sách task */}
      {dev.tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Chưa giao task nào.</p>
      ) : (
        <div className="space-y-2">
          {dev.tasks.map((t) => (
            <div key={t._id} className="p-3 rounded-xl border border-border bg-card/50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Giao {fmtDate(t.assignedAt)}{t.deadline ? ` · hạn ${fmtDate(t.deadline)}` : ""}
                  </p>
                </div>
                <Chip meta={TASK_STATUS_META[t.status] || TASK_STATUS_META.assigned} />
              </div>
              {t.devNote && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 whitespace-pre-wrap">
                  <span className="font-bold text-foreground">Dev nộp:</span> {t.devNote}
                </p>
              )}
              {t.status === "submitted" && (
                reviewing === t._id ? (
                  <div className="space-y-2">
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Nhận xét nghiệm thu (tùy chọn)"
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTask(t._id, { status: "done", adminNote }, "Đã nghiệm thu task")}
                        className="px-3 py-1.5 rounded-lg bg-success/20 text-success text-xs font-bold"
                      >
                        Nghiệm thu
                      </button>
                      <button
                        onClick={() => updateTask(t._id, { status: "doing", adminNote }, "Đã trả task về để làm tiếp")}
                        className="px-3 py-1.5 rounded-lg bg-warning/20 text-warning text-xs font-bold"
                      >
                        Yêu cầu sửa
                      </button>
                      <button
                        onClick={() => { setReviewing(null); setAdminNote(""); }}
                        className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-bold"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewing(t._id)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                  >
                    Nghiệm thu / trả lại
                  </button>
                )
              )}
              {["assigned", "doing"].includes(t.status) && (
                <button
                  onClick={async () => {
                    const ok = await notify.confirm({ title: "Hủy task này?", danger: true });
                    if (ok) updateTask(t._id, { status: "cancelled" }, "Đã hủy task");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-bold"
                >
                  Hủy task
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminHours({ dev, refresh }) {
  const review = async (logId, status) => {
    try {
      const res = await fetch(`/api/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/hours/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi duyệt giờ");
      notify.success(status === "approved" ? "Đã duyệt giờ" : "Đã từ chối giờ");
      refresh();
    } catch (e) {
      notify.error(e.message);
    }
  };

  const taskTitle = (id) => dev.tasks.find((t) => t._id === id)?.title;

  if (dev.hourLogs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Dev chưa ghi giờ nào.</p>;
  }

  return (
    <div className="space-y-2">
      {dev.hourLogs.map((l) => (
        <div key={l._id} className="p-3 rounded-xl border border-border bg-card/50 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{l.hours}h · {fmtDate(l.date)}</p>
            {(l.note || l.taskId) && (
              <p className="text-xs text-muted-foreground truncate">
                {taskTitle(l.taskId) ? `[${taskTitle(l.taskId)}] ` : ""}{l.note}
              </p>
            )}
          </div>
          <Chip meta={LOG_STATUS_META[l.status] || LOG_STATUS_META.pending} />
          {l.status === "pending" && (
            <div className="flex gap-1.5">
              <button
                onClick={() => review(l._id, "approved")}
                className="grid h-8 w-8 place-items-center rounded-lg bg-success/20 text-success"
                aria-label="Duyệt"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => review(l._id, "rejected")}
                className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/20 text-destructive"
                aria-label="Từ chối"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminChat({ dev, refresh }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (dev.messages.some((m) => m.from === "dev" && !m.readByAdmin)) {
      fetch(`/api/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/messages/read`, {
        method: "POST",
        credentials: "include",
      }).then(refresh).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dev.email]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const res = await fetch(`/api/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: t }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi gửi tin");
      setText("");
      refresh();
    } catch (e) {
      notify.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="max-h-[45vh] overflow-y-auto space-y-2 p-1">
        {dev.messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Chưa có trao đổi nào với {dev.name}.</p>
        )}
        {dev.messages.map((m) => (
          <div key={m._id} className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.from === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              {m.text}
              <p className={`mt-1 text-[9px] ${m.from === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {new Date(m.at).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={`Nhắn ${dev.name}... (dev cũng nhận email)`}
          className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-background text-xs"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
