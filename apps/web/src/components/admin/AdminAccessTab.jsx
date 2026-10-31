import { useCallback, useEffect, useState } from "react";
import { ADMIN_ROLES } from "../../../../../packages/shared/adminAccess";
import { notify } from "../../lib/notify";

/**
 * Tài khoản quản trị — chạy hẳn trên plugin admin của Better Auth (chỉ Chủ hệ
 * thống gọi được). Không mật khẩu: admin đăng nhập bằng mã gửi về email. Một
 * người giữ được nhiều vai trò; quyền là hợp các vai trò (packages/shared/adminAccess.js).
 */
const client = async () => (await import("../../lib/authClient")).adminAuthClient;
const rolesOf = (user) => String(user.role || "viewer").split(",").map((r) => r.trim()).filter(Boolean);

async function call(fn) {
  const { data, error } = await fn(await client());
  if (error) throw new Error(error.message || "Không thể xử lý yêu cầu.");
  return data;
}

export default function AdminAccessTab({ currentAdminId }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", name: "", role: "viewer" });

  const load = useCallback(async () => {
    try { setAdmins((await call((c) => c.admin.listUsers({ query: { limit: 200, sortBy: "createdAt" } }))).users || []); }
    catch (error) { notify.error(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, message) => {
    try { await call(fn); notify.success(message); load(); return true; }
    catch (error) { notify.error(error.message); return false; }
  };

  const create = (event) => {
    event.preventDefault();
    act((c) => c.admin.createUser({ email: form.email.trim().toLowerCase(), name: form.name.trim(), role: form.role }), "Đã thêm. Người đó đăng nhập ở /admin bằng mã gửi về email.")
      .then((ok) => ok && setForm({ email: "", name: "", role: "viewer" }));
  };

  const toggleRole = (user, role) => {
    const current = rolesOf(user);
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
    if (!next.length) return notify.warning("Cần ít nhất một vai trò. Muốn chặn hẳn thì bấm Khoá.");
    act((c) => c.admin.setRole({ userId: user.id, role: next }), "Đã đổi vai trò.");
  };

  const remove = async (user) => {
    if (!await notify.confirm({ title: "Xoá tài khoản quản trị?", message: `${user.name || user.email} mất quyền truy cập ngay.`, confirmText: "Xoá", danger: true })) return;
    act((c) => c.admin.removeUser({ userId: user.id }), "Đã xoá.");
  };

  const field = "min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[15px]";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <form onSubmit={create} className="grid gap-3 rounded-3xl border border-border bg-card p-6 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <h2 className="text-lg font-semibold sm:col-span-4">Thêm quản trị viên</h2>
        <input required type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
        <input required placeholder="Tên hiển thị" aria-label="Tên hiển thị" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
        <select aria-label="Vai trò" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={field}>
          {Object.entries(ADMIN_ROLES).map(([id, role]) => <option key={id} value={id}>{role.label}</option>)}
        </select>
        <button className="min-h-11 rounded-xl bg-foreground px-5 text-[15px] font-semibold text-background">Thêm</button>
      </form>

      {loading ? <p className="p-10 text-center text-sm text-muted-foreground">Đang tải…</p> : (
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
          {admins.map((user) => {
            const self = String(user.id) === String(currentAdminId);
            const roles = rolesOf(user);
            return (
              <li key={user.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{user.name || user.email}{self && <span className="ml-2 text-xs font-medium text-muted-foreground">(bạn)</span>}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}{user.banned ? " · Đã khoá" : ""}</p>
                  </div>
                  {!self && (
                    <>
                      <button type="button" onClick={() => act((c) => c.admin.revokeUserSessions({ userId: user.id }), "Đã đăng xuất mọi thiết bị.")} className="min-h-11 rounded-xl px-3 text-sm font-medium hover:bg-muted">Đăng xuất hết</button>
                      <button type="button" onClick={() => act((c) => (user.banned ? c.admin.unbanUser({ userId: user.id }) : c.admin.banUser({ userId: user.id })), user.banned ? "Đã mở khoá." : "Đã khoá.")} className="min-h-11 rounded-xl px-3 text-sm font-medium hover:bg-muted">{user.banned ? "Mở khoá" : "Khoá"}</button>
                      <button type="button" onClick={() => remove(user)} aria-label={`Xoá ${user.email}`} className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <span aria-hidden className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Vai trò">
                  {Object.entries(ADMIN_ROLES).map(([id, role]) => {
                    const on = roles.includes(id);
                    return (
                      <button key={id} type="button" disabled={self} aria-pressed={on} title={role.description} onClick={() => toggleRole(user, id)}
                        className={`min-h-9 rounded-full border px-3 text-sm disabled:opacity-60 ${on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
