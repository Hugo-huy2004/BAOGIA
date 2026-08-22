import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../config/apiBase";
import { getAdminToken } from "../../services/authSession";
import { notify } from "../../lib/notify";

const EMPTY_FORM = {
  name: "",
  description: "",
  clientType: "confidential",
  redirectUris: "",
  homepageUrl: "",
  privacyUrl: "",
  logoUrl: "",
};

function authHeaders(json = false) {
  const token = getAdminToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function AppForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try { await onSubmit(form); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span>Tên ứng dụng *</span>
          <input required maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-black/30 dark:text-white" />
        </label>
        <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span>Loại ứng dụng *</span>
          <select disabled={Boolean(initial.id)} value={form.clientType} onChange={(e) => set("clientType", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none disabled:opacity-60 dark:border-white/10 dark:bg-black/30 dark:text-white">
            <option value="confidential">Web có backend (có secret)</option>
            <option value="public">Mobile / SPA (chỉ PKCE)</option>
          </select>
        </label>
      </div>
      <label className="block space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>Mô tả hiển thị ở màn hình xin quyền</span>
        <textarea rows={2} maxLength={500} value={form.description} onChange={(e) => set("description", e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-black/30 dark:text-white" />
      </label>
      <label className="block space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>Redirect URI * (mỗi dòng một URI, khớp tuyệt đối)</span>
        <textarea required rows={3} value={form.redirectUris} onChange={(e) => set("redirectUris", e.target.value)} placeholder="https://your-app.com/auth/hugo/callback"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-black/30 dark:text-white" />
        <span className="block font-normal text-slate-400">HTTPS cho production; HTTP chỉ được phép với localhost. Mobile có thể dùng custom scheme.</span>
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["homepageUrl", "Trang chủ", "https://your-app.com"],
          ["privacyUrl", "Chính sách riêng tư", "https://your-app.com/privacy"],
          ["logoUrl", "Logo URL", "https://your-app.com/logo.png"],
        ].map(([field, label, placeholder]) => (
          <label key={field} className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>{label}</span>
            <input type="url" value={form[field]} onChange={(e) => set(field, e.target.value)} placeholder={placeholder}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-black/30 dark:text-white" />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold dark:border-white/10">Huỷ</button>}
        <button disabled={saving} className="rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white disabled:opacity-50">
          {saving ? "Đang lưu…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function AdminOAuthAppsTab() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [revealedSecret, setRevealedSecret] = useState(null);
  const [guideClientId, setGuideClientId] = useState("");

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/oauth/admin/clients`, { headers: authHeaders(), credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Không thể tải ứng dụng OAuth.");
      setApps(data.clients || []);
      if (data.clients?.[0]) setGuideClientId((current) => current || data.clients[0].clientId);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  const createApp = async (form) => {
    const response = await fetch(`${API_BASE}/oauth/admin/clients`, {
      method: "POST", credentials: "include", headers: authHeaders(true),
      body: JSON.stringify({ ...form, redirectUris: form.redirectUris.split("\n").map((uri) => uri.trim()).filter(Boolean) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { notify.error(data.error || "Không thể tạo ứng dụng."); return; }
    setShowCreate(false);
    setGuideClientId(data.client.clientId);
    if (data.clientSecret) setRevealedSecret({ name: data.client.name, value: data.clientSecret });
    notify.success("Đã tạo kết nối đăng nhập.");
    await loadApps();
  };

  const updateApp = async (form) => {
    const response = await fetch(`${API_BASE}/oauth/admin/clients/${editing.id}`, {
      method: "PATCH", credentials: "include", headers: authHeaders(true),
      body: JSON.stringify({ ...form, redirectUris: form.redirectUris.split("\n").map((uri) => uri.trim()).filter(Boolean) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { notify.error(data.error || "Không thể cập nhật ứng dụng."); return; }
    setEditing(null);
    notify.success("Đã cập nhật ứng dụng.");
    await loadApps();
  };

  const setStatus = async (app, status) => {
    if (status === "revoked") {
      const ok = await notify.confirm({
        title: "Thu hồi ứng dụng?",
        message: `Mọi token đang hoạt động của ${app.name} sẽ bị vô hiệu hóa ngay.`,
        confirmText: "Thu hồi",
        danger: true,
      });
      if (!ok) return;
    }
    const response = await fetch(`${API_BASE}/oauth/admin/clients/${app.id}`, {
      method: "PATCH", credentials: "include", headers: authHeaders(true), body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return notify.error(data.error || "Không thể đổi trạng thái.");
    notify.success(status === "active" ? "Đã kích hoạt lại ứng dụng." : "Đã thu hồi ứng dụng và token.");
    await loadApps();
  };

  const rotateSecret = async (app) => {
    const ok = await notify.confirm({
      title: "Tạo client secret mới?",
      message: "Secret cũ và toàn bộ token hiện tại sẽ hết hiệu lực. Ứng dụng cần cập nhật secret mới ngay.",
      confirmText: "Luân chuyển",
      danger: true,
    });
    if (!ok) return;
    const response = await fetch(`${API_BASE}/oauth/admin/clients/${app.id}/rotate-secret`, {
      method: "POST", credentials: "include", headers: authHeaders(true),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return notify.error(data.error || "Không thể luân chuyển secret.");
    setRevealedSecret({ name: app.name, value: data.clientSecret });
    notify.success("Đã tạo secret mới và thu hồi token cũ.");
    await loadApps();
  };

  const revokeTokens = async (app) => {
    const ok = await notify.confirm({ title: "Đăng xuất toàn bộ kết nối?", message: `Thu hồi mọi token của ${app.name} nhưng vẫn giữ ứng dụng hoạt động.`, confirmText: "Thu hồi token", danger: true });
    if (!ok) return;
    const response = await fetch(`${API_BASE}/oauth/admin/clients/${app.id}/revoke-tokens`, { method: "POST", credentials: "include", headers: authHeaders(true) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return notify.error(data.error || "Không thể thu hồi token.");
    notify.success(`Đã thu hồi ${data.revoked || 0} kết nối.`);
    await loadApps();
  };

  const selected = apps.find((app) => app.clientId === guideClientId) || apps[0];
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.hugowishpax.studio";
  const authorizeUrl = `${origin}/oauth/authorize`;
  const tokenUrl = API_BASE.startsWith("http") ? `${API_BASE}/oauth/token` : `${origin}${API_BASE}/oauth/token`;
  const userinfoUrl = API_BASE.startsWith("http") ? `${API_BASE}/oauth/userinfo` : `${origin}${API_BASE}/oauth/userinfo`;
  const guide = useMemo(() => selected ? `// 1) Tạo code_verifier (43-128 ký tự) và code_challenge = BASE64URL(SHA256(verifier))\nconst params = new URLSearchParams({\n  response_type: "code",\n  client_id: "${selected.clientId}",\n  redirect_uri: "${selected.redirectUris[0] || "https://your-app.com/auth/hugo/callback"}",\n  scope: "profile email",\n  state: crypto.randomUUID(),\n  code_challenge: challenge,\n  code_challenge_method: "S256"\n});\nwindow.location.href = "${authorizeUrl}?" + params;\n\n// 2) Backend đổi code lấy token (application/x-www-form-urlencoded)\nPOST ${tokenUrl}\ngrant_type=authorization_code&client_id=${selected.clientId}&client_secret=YOUR_SECRET&code=CODE&redirect_uri=...&code_verifier=VERIFIER\n\n// 3) Đọc người dùng\nGET ${userinfoUrl}\nAuthorization: Bearer ACCESS_TOKEN` : "Tạo một ứng dụng để nhận hướng dẫn theo Client ID.", [selected, authorizeUrl, tokenUrl, userinfoUrl]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:flex md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white"><span className="material-symbols-outlined text-blue-500">login</span> Đăng nhập bằng Hugo Studio</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">Quản lý các app/web được phép dùng tài khoản Hugo Studio. Luồng dùng Authorization Code + PKCE; không chia sẻ cookie hay mật khẩu thành viên.</p>
        </div>
        <button type="button" onClick={() => { setShowCreate(true); setEditing(null); }} className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 md:mt-0">Thêm ứng dụng</button>
      </div>

      {revealedSecret && (
        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500">key</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-white">Client secret của {revealedSecret.name}</p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Sao chép ngay. Hugo Studio không thể hiển thị lại secret này.</p>
              <div className="mt-3 flex gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-black/80 px-3 py-2.5 text-xs text-emerald-300">{revealedSecret.value}</code>
                <button type="button" onClick={() => navigator.clipboard.writeText(revealedSecret.value).then(() => notify.success("Đã sao chép secret."))} className="rounded-xl bg-amber-500 px-3 text-xs font-black text-slate-950">Sao chép</button>
              </div>
            </div>
            <button type="button" onClick={() => setRevealedSecret(null)} aria-label="Đóng"><span className="material-symbols-outlined">close</span></button>
          </div>
        </div>
      )}

      {(showCreate || editing) && (
        <div className="rounded-3xl border border-blue-500/20 bg-white/80 p-6 shadow-xl dark:bg-[#151827]">
          <h3 className="mb-5 text-sm font-black text-slate-900 dark:text-white">{editing ? `Chỉnh sửa ${editing.name}` : "Đăng ký ứng dụng mới"}</h3>
          <AppForm
            key={editing?.id || "new-oauth-app"}
            initial={editing ? { ...editing, redirectUris: editing.redirectUris.join("\n") } : EMPTY_FORM}
            submitLabel={editing ? "Lưu thay đổi" : "Tạo kết nối"}
            onSubmit={editing ? updateApp : createApp}
            onCancel={() => { setShowCreate(false); setEditing(null); }}
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {loading ? <div className="col-span-full py-16 text-center text-sm text-slate-400">Đang tải ứng dụng…</div> : apps.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400 dark:border-white/10">Chưa có ứng dụng nào được đăng ký.</div>
        ) : apps.map((app) => (
          <article key={app.id} className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 font-black text-white">{app.name.slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{app.name}</h3>
                  <p className="mt-1 font-mono text-[10px] text-slate-400 break-all">{app.clientId}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${app.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"}`}>{app.status === "active" ? "Đang hoạt động" : "Đã thu hồi"}</span>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{app.description || "Không có mô tả."}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-100 p-2 dark:bg-white/5"><p className="text-sm font-black">{app.activeTokens}</p><p className="text-[9px] text-slate-400">Kết nối sống</p></div>
              <div className="rounded-xl bg-slate-100 p-2 dark:bg-white/5"><p className="text-sm font-black">{app.totalTokens}</p><p className="text-[9px] text-slate-400">Tổng cấp quyền</p></div>
              <div className="rounded-xl bg-slate-100 p-2 dark:bg-white/5"><p className="text-sm font-black">{app.clientType === "public" ? "PKCE" : "Secret"}</p><p className="text-[9px] text-slate-400">Loại client</p></div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-950 p-3 text-[10px] text-slate-300">
              {app.redirectUris.map((uri) => <p key={uri} className="break-all font-mono">{uri}</p>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setEditing(app); setShowCreate(false); }} className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black dark:border-white/10">Chỉnh sửa</button>
              {app.clientType === "confidential" && <button type="button" onClick={() => rotateSecret(app)} className="rounded-xl border border-amber-500/30 px-3 py-2 text-[10px] font-black text-amber-600">Đổi secret</button>}
              <button type="button" onClick={() => revokeTokens(app)} className="rounded-xl border border-rose-500/20 px-3 py-2 text-[10px] font-black text-rose-500">Thu hồi token</button>
              <button type="button" onClick={() => setStatus(app, app.status === "active" ? "revoked" : "active")} className={`rounded-xl px-3 py-2 text-[10px] font-black text-white ${app.status === "active" ? "bg-rose-600" : "bg-emerald-600"}`}>{app.status === "active" ? "Tắt ứng dụng" : "Kích hoạt"}</button>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-black text-slate-900 dark:text-white">Hướng dẫn kết nối nhanh</h3><p className="mt-1 text-xs text-slate-400">Mẫu chuẩn cho Authorization Code + PKCE.</p></div>
          {apps.length > 0 && <select value={selected?.clientId || ""} onChange={(e) => setGuideClientId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-black/30">{apps.map((app) => <option key={app.clientId} value={app.clientId}>{app.name}</option>)}</select>}
        </div>
        <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-[11px] leading-relaxed text-emerald-300"><code>{guide}</code></pre>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-100 p-4 text-xs dark:bg-white/5"><b>1. Giữ state</b><p className="mt-1 text-slate-500">Lưu state trong session rồi đối chiếu ở callback để chống CSRF.</p></div>
          <div className="rounded-2xl bg-slate-100 p-4 text-xs dark:bg-white/5"><b>2. Giữ verifier</b><p className="mt-1 text-slate-500">Code verifier chỉ nằm ở app khởi tạo yêu cầu, không gửi trên authorize URL.</p></div>
          <div className="rounded-2xl bg-slate-100 p-4 text-xs dark:bg-white/5"><b>3. Giữ secret</b><p className="mt-1 text-slate-500">Client secret chỉ nằm ở backend. Mobile/SPA phải chọn Public client.</p></div>
        </div>
      </div>
    </div>
  );
}
