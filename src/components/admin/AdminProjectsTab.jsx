import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROJECT_STATUSES } from "../../../shared/projectWorkflow";
import { phaseOf } from "../../../shared/projectPhases";
import { PROJECT_PACKAGE_GROUPS, estimateDelivery, getPackageFacts, listPrice, formatMoney } from "../../../shared/projectPackages";
import { API_BASE } from '../../config/apiBase';
import { notify } from '../../lib/notify';
import ProjectLinkSheet from './ProjectLinkSheet';

/**
 * Dự án khách hàng: bên trái mở dự án mới, bên phải danh sách.
 * Tạo xong là hiện ngay thẻ link gửi khách — khách mở link thì dự án tự rời
 * "nháp" (server tự tích "đã gửi link"), admin không phải bấm thêm bước nào.
 */

const STATUS_OPTIONS = Object.entries(PROJECT_STATUSES).map(([id, s]) => ({ id, label: s.adminLabel }));
const DEFAULT_PACKAGE = PROJECT_PACKAGE_GROUPS[0].options[0].id;
const EMPTY = { fullName: '', market: 'domestic', servicePackage: DEFAULT_PACKAGE, phone: '', email: '', firstNote: '' };

const field = "w-full min-h-11 rounded-xl border border-border bg-background px-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
const label = "block text-sm font-medium text-muted-foreground mb-1";
const chip = "rounded-full bg-muted px-2.5 py-1 text-xs font-medium";

function PackagePreview({ id, market }) {
  const p = getPackageFacts(id);
  if (!p) return null;
  const eta = estimateDelivery(id, new Date());
  const price = listPrice(p.id, '', market);
  const fmt = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {eta && <span className={chip}>Bàn giao ~ {fmt(eta.from)} – {fmt(eta.to)}</span>}
      {price > 0 && <span className={chip}>{p.priceFrom ? 'Từ ' : ''}{formatMoney(price, market === 'international' ? 'usd' : 'vnd')}{p.recurring ? ' / tháng' : ''}</span>}
      {p.warranty === 'lifetime' ? <span className={chip}>Bảo hành trọn đời</span> : p.warrantyDays > 0 ? <span className={chip}>Bảo hành {p.warrantyDays} ngày</span> : null}
      {p.payments && <span className={chip}>Thanh toán {p.payments.join('/')}%</span>}
      {p.free && <span className={chip}>Miễn phí</span>}
    </div>
  );
}

export default function AdminProjectsTab() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [linkFor, setLinkFor] = useState(null); // { project, path? }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-projects`, { credentials: 'include' });
      setProjects(res.ok ? await res.json() : []);
    } catch { notify.error('Không tải được danh sách dự án'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/customer-projects`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tạo được dự án');
      notify.success(`Đã mở dự án ${data.projectId}`);
      setForm(EMPTY);
      setLinkFor({ project: data, path: data.portalPath });
      fetchProjects();
    } catch (err) { notify.error(err.message); }
    finally { setCreating(false); }
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleting(true);
    try {
      const verify = await fetch(`${API_BASE}/admin/verify-password`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!verify.ok) { setDeleteError((await verify.json()).error || 'Sai mật khẩu'); return; }
      const res = await fetch(`${API_BASE}/customer-projects/${deleteTarget._id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      notify.success('Đã xoá dự án');
      setDeleteTarget(null);
      fetchProjects();
    } catch { setDeleteError('Không xoá được, thử lại'); }
    finally { setIsDeleting(false); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) =>
      (!statusFilter || p.status === statusFilter) &&
      (!q || [p.customer?.fullName, p.name, p.customer?.phone, p.projectId].some((v) => v?.toLowerCase().includes(q))));
  }, [projects, search, statusFilter]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <form onSubmit={handleCreate} className="space-y-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Mở dự án mới</h2>
        <div>
          <label className={label} htmlFor="np-name">Tên khách hàng</label>
          <input id="np-name" required value={form.fullName} onChange={set('fullName')} className={field} />
        </div>
        <div>
          <span className={label}>Thị trường · không đổi được sau khi tạo</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="radiogroup">
            {[['domestic', 'Trong nước · VNĐ'], ['international', 'Quốc tế · USD']].map(([id, text]) => (
              <button key={id} type="button" role="radio" aria-checked={form.market === id} onClick={() => setForm({ ...form, market: id })}
                className={`min-h-10 rounded-lg text-sm font-medium ${form.market === id ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>{text}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={label} htmlFor="np-pkg">Gói dịch vụ</label>
          <select id="np-pkg" value={form.servicePackage} onChange={set('servicePackage')} className={field}>
            {PROJECT_PACKAGE_GROUPS.map((g) => (
              <optgroup key={g.id} label={g.label}>
                {g.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </optgroup>
            ))}
          </select>
          <PackagePreview id={form.servicePackage} market={form.market} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="np-phone">Điện thoại</label>
            <input id="np-phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="np-email">Email</label>
            <input id="np-email" type="email" value={form.email} onChange={set('email')} className={field} />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">Có email thì khách nhận thư báo mỗi khi dự án sang bước mới.</p>
        <div>
          <label className={label} htmlFor="np-note">Ghi chú mở dự án</label>
          <textarea id="np-note" rows={3} value={form.firstNote} onChange={set('firstNote')} placeholder="Phạm vi đã nói, thứ khách cần gửi…" className={`${field} py-2`} />
        </div>
        <button type="submit" disabled={creating} className="min-h-11 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background disabled:opacity-50">
          {creating ? 'Đang tạo…' : 'Tạo dự án và lấy link'}
        </button>
      </form>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, SĐT, mã HG-…" className={`${field} flex-1`} aria-label="Tìm dự án" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${field} sm:w-56`} aria-label="Lọc trạng thái">
            <option value="">Mọi trạng thái</option>
            {STATUS_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{filtered.length} dự án</p>
        <ul className="mt-2 divide-y divide-border">
          {filtered.map((p) => {
            const phase = phaseOf(p.status);
            return (
              <li key={p._id} className="flex items-center gap-3 py-3">
                <button type="button" onClick={() => navigate(`/admin/projects/${p._id}`)} className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold">{p.customer?.fullName || p.name}</span>
                    {p.unreadCount > 0 && <span className="shrink-0 rounded-full bg-destructive px-2 text-xs font-semibold text-white">{p.unreadCount}</span>}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {p.projectId} · {phase ? `GĐ ${phase.no} · ` : ''}{PROJECT_STATUSES[p.status]?.adminLabel || p.status}
                  </span>
                </button>
                <button type="button" onClick={() => setLinkFor({ project: p })} aria-label="Link cho khách" className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-muted">
                  <span aria-hidden className="material-symbols-outlined text-[20px]">link</span>
                </button>
                <button type="button" onClick={() => { setDeleteTarget(p); setDeletePassword(''); setDeleteError(''); }} aria-label="Xoá dự án" className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <span aria-hidden className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </li>
            );
          })}
        </ul>
        {!loading && filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dự án nào khớp.</p>}
      </section>

      {linkFor && <ProjectLinkSheet project={linkFor.project} path={linkFor.path} onClose={() => setLinkFor(null)} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteTarget(null)}>
          <form role="dialog" aria-modal="true" onSubmit={handleConfirmDelete} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 text-foreground shadow-2xl">
            <h2 className="text-lg font-semibold">Xoá dự án {deleteTarget.projectId}?</h2>
            <p className="text-sm text-muted-foreground">Xoá hẳn dự án của <strong className="text-foreground">{deleteTarget.customer?.fullName || deleteTarget.name}</strong>, link của khách và mọi tin nhắn. Không hoàn tác được.</p>
            <input type="password" autoFocus required value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Mật khẩu admin" className={field} aria-label="Mật khẩu admin" />
            {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="min-h-11 rounded-xl bg-muted text-sm font-semibold">Huỷ</button>
              <button type="submit" disabled={isDeleting} className="min-h-11 rounded-xl bg-destructive text-sm font-semibold text-white disabled:opacity-50">{isDeleting ? 'Đang xoá…' : 'Xoá'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
