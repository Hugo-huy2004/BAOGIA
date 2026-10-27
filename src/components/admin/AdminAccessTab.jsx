import { useCallback, useEffect, useState } from "react";
import { ADMIN_PERMISSIONS, ADMIN_ROLES } from "../../../shared/adminAccess";
import { notify } from "../../lib/notify";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const PERMISSION_LABELS = {
  overview: "Tổng quan", queue: "Hàng đợi", users: "Thành viên", support: "Hỗ trợ",
  projects: "Dự án", commerce: "Kinh doanh & JOY", learning: "Hugo Coding",
  hugoteam: "HugoTeam", security: "An ninh", system: "Hệ thống", audit: "Nhật ký", access: "Quản trị quyền",
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/admin/accounts${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Không thể xử lý yêu cầu.");
  return data;
}

export default function AdminAccessTab({ currentAdminId }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [passwordFor, setPasswordFor] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ loginName: "", displayName: "", password: "", role: "viewer" });

  const load = useCallback(async () => {
    setLoading(true);
    try { setAdmins((await request("")).admins || []); }
    catch (error) { notify.error(error.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (event) => {
    event.preventDefault();
    try {
      await request("", { method: "POST", body: JSON.stringify(form) });
      setForm({ loginName: "", displayName: "", password: "", role: "viewer" });
      setCreating(false);
      notify.success("Đã tạo tài khoản quản trị.");
      load();
    } catch (error) { notify.error(error.message); }
  };

  const update = async (admin, payload) => {
    try {
      const { admin: updated } = await request(`/${admin.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      setAdmins((items) => items.map((item) => item.id === updated.id ? updated : item));
      notify.success("Đã cập nhật quyền.");
      return true;
    } catch (error) { notify.error(error.message); return false; }
  };

  const remove = async (admin) => {
    if (!await notify.confirm({ title: "Xóa tài khoản quản trị?", message: `${admin.displayName} sẽ mất quyền truy cập ngay lập tức.`, confirmText: "Xóa tài khoản", danger: true })) return;
    try {
      await request(`/${admin.id}`, { method: "DELETE" });
      setAdmins((items) => items.filter((item) => item.id !== admin.id));
      notify.success("Đã xóa tài khoản quản trị.");
    } catch (error) { notify.error(error.message); }
  };

  const resetPassword = async (admin) => {
    if (newPassword.length < 10) return notify.warning("Mật khẩu cần ít nhất 10 ký tự.");
    if (!await update(admin, { password: newPassword })) return;
    setPasswordFor("");
    setNewPassword("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-400">Kiểm soát truy cập</p><h2 className="text-2xl font-black tracking-tight sm:text-3xl">Đúng người, đúng quyền</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Mỗi nhân sự chỉ nhìn thấy và gọi được API thuộc phạm vi được cấp. Chủ hệ thống luôn giữ toàn quyền.</p></div>
        <button type="button" onClick={() => setCreating((value) => !value)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-slate-950"><span className="material-symbols-outlined text-[19px]">person_add</span>Thêm quản trị viên</button>
      </div>

      {creating && (
        <form onSubmit={create} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-bold text-slate-600">Tên hiển thị<input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-950" /></label>
          <label className="text-xs font-bold text-slate-600">Tên đăng nhập<input required value={form.loginName} onChange={(e) => setForm({ ...form, loginName: e.target.value.toLowerCase() })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-950" placeholder="minh.support" /></label>
          <label className="text-xs font-bold text-slate-600">Mật khẩu ban đầu<input required minLength={10} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-950" /></label>
          <label className="text-xs font-bold text-slate-600">Vai trò<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-950">{Object.entries(ADMIN_ROLES).map(([id, role]) => <option key={id} value={id}>{role.label}</option>)}</select></label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end"><button type="button" onClick={() => setCreating(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500">Hủy</button><button className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white">Tạo tài khoản</button></div>
        </form>
      )}

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải tài khoản…</div> : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <article key={admin.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 font-black text-white">{admin.displayName.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-black text-slate-950">{admin.displayName}</h3>{String(admin.id) === String(currentAdminId) && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-700">BẠN</span>}</div><p className="text-xs text-slate-500">{ADMIN_ROLES[admin.role]?.description}</p></div></div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={admin.role} disabled={String(admin.id) === String(currentAdminId)} onChange={(e) => update(admin, { role: e.target.value, permissions: [] })} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 disabled:opacity-50">{Object.entries(ADMIN_ROLES).map(([id, role]) => <option key={id} value={id}>{role.label}</option>)}</select>
                  <button type="button" disabled={String(admin.id) === String(currentAdminId)} onClick={() => update(admin, { active: !admin.active })} className={`min-h-10 rounded-xl px-3 text-xs font-black disabled:opacity-50 ${admin.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{admin.active ? "Đang hoạt động" : "Đã khóa"}</button>
                  <button type="button" disabled={String(admin.id) === String(currentAdminId)} onClick={() => { setPasswordFor(passwordFor === admin.id ? "" : admin.id); setNewPassword(""); }} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-30" aria-label={`Đặt lại mật khẩu ${admin.displayName}`}><span className="material-symbols-outlined text-[19px]">key</span></button>
                  <button type="button" disabled={String(admin.id) === String(currentAdminId)} onClick={() => remove(admin)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30" aria-label={`Xóa ${admin.displayName}`}><span className="material-symbols-outlined text-[19px]">delete</span></button>
                </div>
              </div>
              {passwordFor === admin.id && <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><input autoFocus type="password" minLength={10} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mật khẩu mới, tối thiểu 10 ký tự" className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm sm:max-w-xs" /><button type="button" onClick={() => resetPassword(admin)} className="min-h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white">Đặt lại mật khẩu</button></div>}
              {admin.role !== "owner" && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{ADMIN_PERMISSIONS.filter((permission) => permission !== "access").map((permission) => { const checked = admin.permissions.includes(permission); const last = checked && admin.permissions.length === 1; return <button key={permission} type="button" disabled={last} title={last ? "Cần giữ ít nhất một quyền — muốn chặn hẳn thì khóa tài khoản" : undefined} onClick={() => update(admin, { permissions: checked ? admin.permissions.filter((item) => item !== permission) : [...admin.permissions, permission] })} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold disabled:cursor-not-allowed ${checked ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 text-slate-500 hover:border-slate-400"}`}>{checked && <span className="material-symbols-outlined text-[14px]" aria-hidden="true">check</span>}{PERMISSION_LABELS[permission]}</button>; })}</div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
