import { PROJECT_STATUSES } from '../../../shared/projectWorkflow';
import { PHASES, phaseOf } from '../../../shared/projectPhases';

/**
 * Tab "Tổng quan" của cổng khách hàng — trả lời đúng ba câu khách mở trang để hỏi:
 *   1. Dự án đang ở đâu?            → tên bước + một câu giải thích
 *   2. Tôi cần làm gì?              → MỘT thẻ việc, bấm là tới đúng chỗ làm
 *   3. Bao giờ xong, đã làm những gì? → ngày dự kiến + 7 giai đoạn + nhật ký
 *
 * Mọi thứ đọc thẳng từ máy trạng thái (shared/projectWorkflow.js) và giai đoạn
 * (shared/projectPhases.js). Bản trước so với 5 nhãn tiếng Việt cũ nên thanh tiến
 * độ không bao giờ tô bước nào.
 */

const CLOSED = ['closed', 'terminated', 'cancelled'];

// Việc khách cần làm ở từng trạng thái. Không có dòng ở đây = khách chỉ việc chờ.
function nextAction(project) {
  const needsContract = (project.contract?.version || 0) > (project.contract?.acceptedVersion || 0);
  if (project.status === 'awaiting_requirements' || project.status === 'draft') {
    return { tab: 'brief', title: 'Điền phiếu yêu cầu', body: 'Khoảng 10 phút. Ô nào chưa rõ cứ bỏ trống, Hugo Studio sẽ hỏi lại.', cta: 'Bắt đầu điền' };
  }
  if (needsContract && !CLOSED.includes(project.status)) {
    return { tab: 'contract', title: 'Xem và xác nhận hợp đồng', body: `Hợp đồng có phiên bản mới (v${project.contract.version}). Đọc rồi gõ họ tên để xác nhận.`, cta: 'Mở hợp đồng' };
  }
  if (project.status === 'client_review') {
    return { tab: 'requests', title: 'Dùng thử và góp ý', body: 'Bản chạy thử đã sẵn sàng. Ghi lại chỗ cần sửa ở mục Trao đổi.', cta: 'Gửi góp ý' };
  }
  if (project.status === 'addons') {
    return { tab: 'contract', title: 'Chọn dịch vụ đi kèm', body: 'Không bắt buộc. Bấm “Không cần thêm” nếu bạn không cần.', cta: 'Xem lựa chọn' };
  }
  if (project.status === 'feedback') {
    return { tab: 'requests', title: 'Cho Hugo Studio biết cảm nhận', body: 'Vài dòng ở mục Trao đổi là đủ.', cta: 'Viết cảm nhận' };
  }
  return null;
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');

export default function CustomerServiceTab({ project, onGo }) {
  const status = PROJECT_STATUSES[project.status] || { label: project.status, blurb: '' };
  const current = phaseOf(project.status);
  const stopped = ['terminated', 'cancelled'].includes(project.status);
  const done = project.status === 'closed';
  const action = nextAction(project);

  // Ngày bước vào từng giai đoạn = lần chuyển trạng thái SỚM NHẤT vào giai đoạn đó.
  const reachedAt = Object.fromEntries(PHASES.map((ph) => [ph.id,
    (project.history || []).filter((h) => ph.statuses.includes(h.toStatus)).map((h) => h.at).sort()[0] || null]));
  const worklog = [...(project.worklog || [])].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
  const due = project.estimate?.dueAt;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* 1 — Đang ở đâu */}
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">{current ? `Giai đoạn ${current.no}/${PHASES.length} · ${current.label}` : 'Dự án'}</p>
        <h2 className="mt-1 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold leading-tight tracking-[-.03em]">{status.label}</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{status.blurb}</p>
        {due && !done && !stopped ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-sm font-medium">
            <span aria-hidden className="material-symbols-outlined text-[18px]">event</span>Dự kiến xong {fmtDate(due)}
          </p>
        ) : null}
      </section>

      {/* 2 — Việc của bạn */}
      {action ? (
        <section className="flex flex-col gap-4 rounded-3xl bg-foreground p-6 text-background sm:flex-row sm:items-center sm:p-8">
          <div className="min-w-0 flex-1">
            <p className="text-sm opacity-70">Việc của bạn</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-.02em]">{action.title}</h3>
            <p className="mt-1 text-[15px] leading-6 opacity-80">{action.body}</p>
          </div>
          <button type="button" onClick={() => onGo(action.tab)}
            className="min-h-11 shrink-0 rounded-full bg-background px-6 text-[15px] font-semibold text-foreground">
            {action.cta}
          </button>
        </section>
      ) : !done && !stopped ? (
        <p className="px-2 text-[15px] text-muted-foreground">Bạn chưa cần làm gì. Có bước mới, Hugo Studio sẽ gửi email cho bạn.</p>
      ) : null}

      {/* 3 — Bảy giai đoạn */}
      <section className="rounded-3xl border border-border bg-card px-6 py-2 sm:px-8">
        <ol>
          {PHASES.map((ph) => {
            const isNow = current?.id === ph.id && !done;
            const isDone = done || (current && ph.no < current.no);
            return (
              <li key={ph.id} className="flex items-center gap-4 border-b border-border py-4 last:border-0" aria-current={isNow ? 'step' : undefined}>
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${isDone || isNow ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'}`}>
                  {isDone ? <span aria-hidden className="material-symbols-outlined text-[18px]">check</span> : ph.no}
                </span>
                <span className={`min-w-0 flex-1 text-[15px] ${isNow ? 'font-semibold' : isDone ? '' : 'text-muted-foreground'}`}>{ph.label}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {isNow ? 'Đang làm' : reachedAt[ph.id] && isDone ? fmtDate(reachedAt[ph.id]) : ''}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 4 — Đã làm gì */}
      {worklog.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h3 className="text-base font-semibold">Hugo Studio đã làm</h3>
          <ul className="mt-3">
            {worklog.map((w) => (
              <li key={w._id || `${w.at}-${w.title}`} className="border-b border-border py-3 last:border-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium">{w.title}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">{fmtDate(w.at)}</span>
                </div>
                {w.detail ? <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{w.detail}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
