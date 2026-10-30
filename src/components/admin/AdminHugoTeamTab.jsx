import { useState, useEffect, useCallback } from "react";
import { Check, X } from "lucide-react";
import { notify } from "../../lib/notify";
import { API_BASE } from "../../config/apiBase";
import AdminCoderResourcesTab from "./AdminCoderResourcesTab";
import AdminCoderSubmissionsTab from "./AdminCoderSubmissionsTab";
import AdminLearnersTab from "./AdminLearnersTab";
import "../../styles/adminHugoTeam.css";
import { CODER_TOTAL_STEPS } from "../../../shared/coderProgression";

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
  const [area, setArea] = useState("team");
  const areas = [
    ["team", "Thành viên & Team"],
    ["learners", "Người học"],
    ["submissions", "Bài nộp"],
    ["resources", "Học liệu"],
  ];
  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2" aria-label="Quản trị Hugo Team">
        {areas.map(([id, label]) => <button key={id} type="button" onClick={() => setArea(id)} className={`rounded-xl px-4 py-2 text-xs font-bold ${area === id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{label}</button>)}
      </nav>
      {area === "team" && <TeamView />}
      {area === "learners" && <AdminLearnersTab />}
      {area === "submissions" && <AdminCoderSubmissionsTab />}
      {area === "resources" && <AdminCoderResourcesTab />}
    </div>
  );
}

/* ───────────────────────── Quản lý team ───────────────────────── */

function TeamView() {
  const [devs, setDevs] = useState([]);
  const [selected, setSelected] = useState(null); // email
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("overview");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [mentorForm, setMentorForm] = useState({ name: "", email: "" });
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [teamSelection, setTeamSelection] = useState([]);
  const [teamId, setTeamId] = useState("");

  const loadDevs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/hugoteam/admin/devs`, { credentials: "include" });
      if (res.ok) setDevs((await res.json()).devs || []);
    } catch {
      notify.error("Lỗi tải danh sách dev");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (email) => {
    try {
      const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(email)}`, { credentials: "include" });
      if (res.ok) setDetail((await res.json()).dev);
      else setDetail(null);
    } catch {
      notify.error("Lỗi tải chi tiết dev");
    }
  }, []);

  useEffect(() => { loadDevs(); }, [loadDevs]);
  useEffect(() => { if (selected) loadDetail(selected); else setDetail(null); }, [selected, loadDetail]);

  const refresh = () => { loadDevs(); if (selected) loadDetail(selected); };

  const addMentor = async () => {
    if (!mentorForm.name.trim() || !mentorForm.email.trim()) return notify.error("Nhập tên và email Mentor");
    const res = await fetch(`${API_BASE}/hugoteam/admin/mentors`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(mentorForm) });
    const data = await res.json();
    if (!res.ok) return notify.error(data.error || "Không thể thêm Mentor");
    notify.success("Đã thêm tài khoản Mentor"); setMentorForm({ name: "", email: "" }); setShowMentorForm(false); refresh();
  };
  const adminAction = async (path, body = {}) => {
    const res = await fetch(`${API_BASE}/hugoteam/admin/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Thao tác thất bại");
    notify.success("Đã cập nhật HugoTeam"); refresh();
  };

  const toggleTeamMember = (email) => setTeamSelection((current) => current.includes(email)
    ? current.filter((item) => item !== email)
    : current.length < 10 ? [...current, email] : current);

  const assignTeam = async () => {
    if (!teamSelection.length) return notify.error("Chọn ít nhất một thành viên đủ điều kiện");
    try {
      await adminAction("teams/assign", { emails: teamSelection, teamId: teamId.trim() || undefined });
      setTeamSelection([]);
      setTeamId("");
    } catch (error) { notify.error(error.message); }
  };

  const mentors = devs.filter((dev) => dev.role === "mentor");
  const teams = Object.entries(devs.reduce((result, dev) => {
    if (dev.teamId) (result[dev.teamId] ||= []).push(dev);
    return result;
  }, {}));
  const needsAttention = devs.filter((dev) => dev.submittedTasks || dev.pendingLogs || dev.unreadMessages);
  const eligibleForTeam = devs.filter((dev) => dev.assessmentStage === "mentor" && dev.mentorEndsAt && new Date(dev.mentorEndsAt) <= new Date());
  const filtered = devs.filter((dev) => {
    const matchesQuery = `${dev.name} ${dev.email} ${dev.teamId}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (stage === "all" || dev.assessmentStage === stage || dev.status === stage);
  });
  const pipeline = [
    ["Đang học", devs.filter((dev) => ["none", "in_progress", "coding"].includes(dev.assessmentStage)).length, "school"],
    ["Đã mời", devs.filter((dev) => dev.assessmentStage === "passed").length, "mark_email_read"],
    ["Mentor", devs.filter((dev) => dev.assessmentStage === "mentor").length, "supervisor_account"],
    ["Team", devs.filter((dev) => dev.assessmentStage === "team").length, "groups"],
    ["Chính thức", devs.filter((dev) => dev.assessmentStage === "official").length, "verified"],
  ];

  if (loading) return <div className="ht-admin-loading"><span className="material-symbols-outlined animate-spin">progress_activity</span><p>Đang tải trung tâm điều hành HugoTeam…</p></div>;

  return (
    <div className="ht-admin">
      <header className="ht-admin-hero">
        <div>
          <p className="ht-admin-kicker">HugoTeam Control Center</p>
          <h2>Điều hành toàn bộ hành trình thành viên.</h2>
          <p>Một nơi để theo dõi học tập, lời mời, Mentor, team, nhiệm vụ và mọi trạng thái cần xử lý.</p>
        </div>
        <button type="button" onClick={refresh} className="ht-admin-refresh"><span className="material-symbols-outlined">refresh</span>Làm mới</button>
      </header>

      <div className="ht-admin-metrics">
        <div><span>Tổng hồ sơ</span><strong>{devs.length}</strong></div>
        <div><span>Mentor</span><strong>{mentors.length}</strong></div>
        <div><span>Team hoạt động</span><strong>{teams.length}</strong></div>
        <div className={needsAttention.length ? "is-alert" : ""}><span>Cần xử lý</span><strong>{needsAttention.length}</strong></div>
      </div>

      <nav className="ht-admin-nav" aria-label="Khu vực quản trị HugoTeam">
        {[["overview", "Tổng quan", "dashboard"], ["members", "Thành viên", "group"], ["mentors", "Mentor", "supervisor_account"], ["teams", "Phân bổ team", "account_tree"]].map(([id, label, icon]) => (
          <button type="button" key={id} onClick={() => setSection(id)} className={section === id ? "is-active" : ""}><span className="material-symbols-outlined">{icon}</span>{label}</button>
        ))}
      </nav>

      {devs.length === 0 ? (
        <div className="ht-admin-empty"><span className="material-symbols-outlined">group_off</span><h3>Chưa có hồ sơ Hugo Team</h3><p>Hồ sơ sẽ xuất hiện ngay khi thành viên mở bài học đầu tiên.</p></div>
      ) : section === "overview" ? (
        <div className="ht-admin-overview">
          <section className="ht-admin-panel ht-admin-panel-wide">
            <div className="ht-admin-panel-head"><div><p>Pipeline</p><h3>Tiến độ toàn hệ thống</h3></div><button type="button" onClick={() => setSection("members")}>Xem thành viên</button></div>
            <div className="ht-admin-pipeline">{pipeline.map(([label, count, icon]) => <div key={label}><span className="material-symbols-outlined">{icon}</span><strong>{count}</strong><p>{label}</p></div>)}</div>
          </section>
          <section className="ht-admin-panel">
            <div className="ht-admin-panel-head"><div><p>Hàng đợi</p><h3>Cần admin xử lý</h3></div><span>{needsAttention.length}</span></div>
            <div className="ht-admin-queue">{needsAttention.slice(0, 6).map((dev) => <button type="button" key={dev.email} onClick={() => { setSelected(dev.email); setSection("members"); }}><span>{dev.name}</span><small>{dev.submittedTasks ? `${dev.submittedTasks} task` : ""}{dev.pendingLogs ? ` · ${dev.pendingLogs} giờ` : ""}{dev.unreadMessages ? ` · ${dev.unreadMessages} tin` : ""}</small></button>)}{!needsAttention.length && <p>Không có việc tồn đọng.</p>}</div>
          </section>
          <section className="ht-admin-panel">
            <div className="ht-admin-panel-head"><div><p>Tự động hóa</p><h3>Phân bổ nhanh</h3></div></div>
            <div className="ht-admin-actions"><button type="button" onClick={() => adminAction("assign-next-mentor").catch((error) => notify.error(error.message))}><span className="material-symbols-outlined">person_add</span><b>Phân Mentor kế tiếp</b><small>Ưu tiên Mentor còn ít mentee nhất</small></button><button type="button" onClick={() => adminAction("auto-build-teams").catch((error) => notify.error(error.message))}><span className="material-symbols-outlined">hub</span><b>Tự xây team</b><small>Tối đa 10 thành viên mỗi team</small></button></div>
          </section>
        </div>
      ) : section === "members" ? (
        <div className="ht-admin-members">
          <aside className="ht-admin-roster">
            <div className="ht-admin-filters"><label><span className="material-symbols-outlined">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, email hoặc team" /></label><select value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">Mọi giai đoạn</option><option value="coding">Đang học</option><option value="passed">Đã mời</option><option value="mentor">Mentor</option><option value="team">Team</option><option value="official">Chính thức</option><option value="rejected">Đình chỉ</option></select></div>
            <div className="ht-admin-roster-list">{filtered.map((dev) => <button type="button" key={dev.email} onClick={() => setSelected(dev.email)} className={selected === dev.email ? "is-active" : ""}><span className="ht-admin-avatar">{dev.name?.[0]?.toUpperCase() || "?"}</span><span className="min-w-0"><b>{dev.name}</b><small>{dev.email}</small><em>{dev.assessmentStage || dev.status}{dev.teamId ? ` · ${dev.teamId}` : ""}</em></span>{(dev.unreadMessages || dev.submittedTasks || dev.pendingLogs) ? <i /> : null}</button>)}{!filtered.length && <p className="ht-admin-no-result">Không có hồ sơ phù hợp.</p>}</div>
          </aside>
          <main>{detail ? <DevDetail dev={detail} refresh={refresh} /> : <div className="ht-admin-empty"><span className="material-symbols-outlined">person_search</span><h3>Chọn một thành viên</h3><p>Chi tiết hồ sơ, quyền, nhiệm vụ, giờ công và trao đổi sẽ hiển thị tại đây.</p></div>}</main>
        </div>
      ) : section === "mentors" ? (
        <div className="space-y-4">
          <div className="ht-admin-toolbar"><div><h3>Đội ngũ Mentor</h3><p>Mỗi Mentor hỗ trợ tối đa 100 thành viên trong một chu kỳ.</p></div><button type="button" onClick={() => setShowMentorForm((value) => !value)}><span className="material-symbols-outlined">person_add</span>Thêm Mentor</button></div>
          {showMentorForm && <div className="ht-admin-inline-form"><input value={mentorForm.name} onChange={(event) => setMentorForm({ ...mentorForm, name: event.target.value })} placeholder="Tên Mentor" /><input value={mentorForm.email} onChange={(event) => setMentorForm({ ...mentorForm, email: event.target.value })} placeholder="Email Mentor" type="email" /><button type="button" onClick={addMentor}>Tạo tài khoản</button></div>}
          <div className="ht-admin-card-grid">{mentors.map((mentor) => { const load = devs.filter((dev) => dev.mentor?.email === mentor.email && dev.mentorEndsAt && new Date(dev.mentorEndsAt) > new Date()).length; return <button type="button" key={mentor.email} className="ht-admin-person-card" onClick={() => { setSelected(mentor.email); setSection("members"); }}><span className="ht-admin-avatar">{mentor.name?.[0]?.toUpperCase() || "M"}</span><div><h4>{mentor.name}</h4><p>{mentor.email}</p><div><span style={{ width: `${load}%` }} /></div><small>{load}/100 mentee đang đồng hành</small></div></button>; })}{!mentors.length && <div className="ht-admin-empty"><h3>Chưa có Mentor</h3><p>Thêm tài khoản Mentor để bắt đầu phân công.</p></div>}</div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="ht-admin-toolbar"><div><h3>Phân bổ team</h3><p>Chỉ thành viên đã hoàn tất 30 ngày Mentor mới xuất hiện trong danh sách chờ.</p></div><button type="button" onClick={() => adminAction("auto-build-teams").catch((error) => notify.error(error.message))}><span className="material-symbols-outlined">auto_awesome</span>Tự động xây team</button></div>
          <section className="ht-admin-allocation"><div><h4>Danh sách đủ điều kiện</h4><p>Chọn tối đa 10 thành viên.</p><div className="ht-admin-checklist">{eligibleForTeam.map((dev) => <label key={dev.email}><input type="checkbox" checked={teamSelection.includes(dev.email)} onChange={() => toggleTeamMember(dev.email)} /><span>{dev.name}<small>{dev.contributionScore}/100 đóng góp</small></span></label>)}{!eligibleForTeam.length && <p>Chưa có thành viên đủ điều kiện phân team.</p>}</div></div><div><h4>Tạo team thủ công</h4><p>{teamSelection.length}/10 thành viên đã chọn</p><input value={teamId} onChange={(event) => setTeamId(event.target.value)} placeholder="Tên team (để trống sẽ tự sinh)" /><button type="button" onClick={assignTeam} disabled={!teamSelection.length}>Phân vào team</button></div></section>
          <div className="ht-admin-card-grid">{teams.map(([id, members]) => <article key={id} className="ht-admin-team-card"><div><span className="material-symbols-outlined">groups</span><small>{members.length}/10</small></div><h4>{id}</h4><p>{members.map((member) => member.name).join(" · ")}</p><button type="button" onClick={() => { setQuery(id); setSection("members"); }}>Quản lý thành viên</button></article>)}</div>
        </div>
      )}
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
  const [mentorEmail, setMentorEmail] = useState(dev.mentor?.email || "");
  const [mentorName, setMentorName] = useState(dev.mentor?.name || "");

  useEffect(() => {
    setMentorEmail(dev.mentor?.email || "");
    setMentorName(dev.mentor?.name || "");
  }, [dev.email, dev.mentor?.email, dev.mentor?.name]);

  const pendingLogs = dev.hourLogs.filter((l) => l.status === "pending").length;
  const unread = dev.messages.filter((m) => m.from === "dev" && !m.readByAdmin).length;

  const update = async (body) => {
    const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return notify.error(data.error || "Cập nhật thất bại");
    notify.success("Đã cập nhật hồ sơ"); refresh();
  };

  const postAction = async (suffix, success, confirmation) => {
    if (confirmation && !(await notify.confirm(confirmation))) return;
    try {
      const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/${suffix}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mentorEmail, mentorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thao tác thất bại");
      notify.success(success);
      refresh();
    } catch (error) {
      notify.error(error.message);
    }
  };

  const removeTeam = async () => {
    const ok = await notify.confirm({ title: `Xoá ${dev.name} khỏi team?`, message: "Hồ sơ HugoTeam vẫn được giữ lại, chỉ xoá phân công team hiện tại.", danger: true });
    if (!ok) return;
    const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/remove-team`, { method: "POST", credentials: "include" });
    if (res.ok) { notify.success("Đã xoá khỏi team"); refresh(); } else notify.error("Không thể xoá khỏi team");
  };
  const deleteAccount = async () => {
    const ok = await notify.confirm({ title: `Xoá vĩnh viễn ${dev.name}?`, message: "Toàn bộ hồ sơ, task, giờ và tin nhắn HugoTeam sẽ bị xoá. Không có bồi hoàn tự động.", danger: true });
    if (!ok) return;
    const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}`, { method: "DELETE", credentials: "include" });
    if (res.ok) { notify.success("Đã xoá tài khoản HugoTeam"); refresh(); } else notify.error("Không thể xoá tài khoản");
  };

  return (
    <div className="ht-admin-profile">
      <div className="ht-admin-profile-head">
        <div>
          <p>Hồ sơ thành viên</p>
          <h3>{dev.name}</h3>
          <span>{dev.email}{dev.school ? ` · ${dev.school}` : ""} · tham gia {fmtDate(dev.approvedAt)}</span>
        </div>
        <div className="ht-admin-hours">
          <strong>{dev.approvedHours}h</strong>
          <span>/500h đã duyệt{dev.pendingHours > 0 ? ` · ${dev.pendingHours}h chờ` : ""}</span>
        </div>
      </div>

      <div className="ht-admin-progress-grid">
        <article><span className="material-symbols-outlined">school</span><small>Giai đoạn</small><strong>{dev.assessmentStage === "passed" ? "Đã mời" : dev.assessmentStage === "coding" ? "Đang học" : dev.assessmentStage}</strong><p>Không có bài kiểm tra đầu vào</p></article>
        <article><span className="material-symbols-outlined">code</span><small>Tiến độ Coding (chung)</small><strong>{dev.codingCompletedSteps?.length || 0}/{CODER_TOTAL_STEPS} step</strong><p>{dev.codingDeadline ? `Hạn ${fmtDate(dev.codingDeadline)} · tự đồng bộ Coding` : "Chưa bắt đầu"}</p></article>
        <article><span className="material-symbols-outlined">supervisor_account</span><small>Mentor</small><strong>{dev.mentor?.name || "Chưa phân"}</strong><p>{dev.mentorEndsAt ? `Kết thúc ${fmtDate(dev.mentorEndsAt)}` : "Chu kỳ 30 ngày"}</p></article>
        <article><span className="material-symbols-outlined">groups</span><small>Team</small><strong>{dev.teamId || "Chưa có team"}</strong><p>{dev.teamId ? `${dev.teamRole} · ${dev.contributionScore}/100 đóng góp` : "Chờ đủ điều kiện"}</p></article>
      </div>

      <section className="ht-admin-controls">
        <div className="ht-admin-panel-head"><div><p>Quyền quản trị</p><h3>Trạng thái và phân công</h3></div><span className={`ht-admin-status ${dev.status === "approved" ? "is-approved" : ""}`}>{dev.status === "approved" ? "Đang hoạt động" : dev.status === "rejected" ? "Đã đình chỉ" : "Chờ xử lý"}</span></div>
        <div className="ht-admin-control-grid">
          <label><span>Trạng thái tài khoản</span><select value={dev.status} onChange={(event) => update({ status: event.target.value })}><option value="pending">Chờ xử lý</option><option value="approved">Đang hoạt động</option><option value="rejected">Đình chỉ</option></select></label>
          <label><span>Giai đoạn</span><select value={dev.assessmentStage || "none"} onChange={(event) => update({ assessmentStage: event.target.value })}><option value="coding">Đang học</option><option value="passed">Đã mời vào Team</option><option value="mentor">Mentor 30 ngày</option><option value="team">Team</option><option value="official">Chính thức</option></select></label>
          <label><span>Team</span><input defaultValue={dev.teamId || ""} onBlur={(event) => { if (event.target.value !== (dev.teamId || "")) update({ teamId: event.target.value }); }} placeholder="Chưa có team" /></label>
          <label><span>Điểm đóng góp</span><input type="number" min="0" max="100" defaultValue={dev.contributionScore || 0} onBlur={(event) => update({ contributionScore: event.target.value })} /></label>
        </div>
        <div className="ht-admin-mentor-form"><input value={mentorName} onChange={(event) => setMentorName(event.target.value)} placeholder="Tên Mentor" /><input value={mentorEmail} onChange={(event) => setMentorEmail(event.target.value)} placeholder="Email Mentor" type="email" /><button type="button" onClick={() => postAction("mentor", "Đã phân công Mentor")}>Phân Mentor</button></div>
        <div className="ht-admin-command-bar">
          {dev.assessmentStage === "team" && <button type="button" className="is-success" onClick={() => postAction("officialize", "Đã công nhận thành viên chính thức", { title: `Công nhận ${dev.name}?`, message: "Hệ thống sẽ tặng 10.000 JOY và 365 ngày duy trì tài khoản." })}><span className="material-symbols-outlined">verified</span>Công nhận chính thức</button>}
          <button type="button" onClick={() => postAction("reset-assessment", "Đã đặt lại toàn bộ lộ trình", { title: "Đặt lại toàn bộ lộ trình?", message: "Tiến độ học, Mentor, team và điểm đóng góp sẽ bị xoá.", danger: true })}><span className="material-symbols-outlined">restart_alt</span>Reset lộ trình</button>
          <button type="button" onClick={() => postAction("reset-coding", "Đã đặt lại Coding HugoTeam", { title: "Đặt lại Coding HugoTeam?", message: "Chỉ tiến độ Coding HugoTeam, Mentor và team bị đặt lại.", danger: true })}><span className="material-symbols-outlined">history</span>Reset Coding</button>
          <button type="button" onClick={removeTeam} disabled={!dev.teamId}><span className="material-symbols-outlined">group_remove</span>Xoá khỏi team</button>
          <button type="button" onClick={() => update({ role: dev.role === "mentor" ? "member" : "mentor" })}><span className="material-symbols-outlined">manage_accounts</span>{dev.role === "mentor" ? "Gỡ quyền Mentor" : "Cấp quyền Mentor"}</button>
          <button type="button" onClick={() => postAction("block", dev.status === "approved" ? "Đã đình chỉ tài khoản" : "Đã khôi phục tài khoản")}><span className="material-symbols-outlined">block</span>{dev.status === "approved" ? "Đình chỉ" : "Khôi phục"}</button>
          <button type="button" className="is-danger" onClick={deleteAccount}><span className="material-symbols-outlined">delete_forever</span>Xoá tài khoản</button>
        </div>
      </section>

      <div className="ht-admin-work-tabs">
        {[
          { id: "tasks", label: "Task" },
          { id: "hours", label: `Giờ${pendingLogs ? ` (${pendingLogs})` : ""}` },
          { id: "chat", label: `Trao đổi${unread ? ` (${unread})` : ""}` },
          { id: "mail", label: "Gửi email" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? "is-active" : ""}
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
      const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/send-mail`, {
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
      const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/tasks`, {
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
      const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/tasks/${taskId}`, {
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

  const deleteTask = async (task) => {
    const ok = await notify.confirm({ title: `Xoá task "${task.title}"?`, message: "Thao tác này không thể hoàn tác.", danger: true });
    if (!ok) return;
    const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/tasks/${task._id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) return notify.error((await res.json()).error || "Không thể xoá task");
    notify.success("Đã xoá task");
    refresh();
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
              {["done", "cancelled"].includes(t.status) && <button type="button" onClick={() => updateTask(t._id, { status: "doing" }, "Đã trả task về để làm tiếp")} className="px-3 py-1.5 rounded-lg bg-warning/20 text-warning text-xs font-bold">Trả lại làm tiếp</button>}
              <button type="button" onClick={() => deleteTask(t)} className="ml-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold">Xoá</button>
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
      const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/hours/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Lỗi duyệt giờ");
      notify.success(status === "approved" ? "Đã duyệt giờ" : status === "rejected" ? "Đã từ chối giờ" : "Đã trả lại hàng chờ duyệt");
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
          {l.status !== "pending" && <button type="button" onClick={() => review(l._id, "pending")} className="grid h-8 w-8 place-items-center rounded-lg bg-warning/20 text-warning" aria-label="Trả lại chờ duyệt" title="Trả lại chờ duyệt"><span className="material-symbols-outlined text-[17px]">undo</span></button>}
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
      fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/messages/read`, {
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
      const res = await fetch(`${API_BASE}/hugoteam/admin/devs/${encodeURIComponent(dev.email)}/messages`, {
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
