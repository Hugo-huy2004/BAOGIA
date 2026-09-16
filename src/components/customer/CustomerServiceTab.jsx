import { useTranslation } from 'react-i18next';
import { estimateDelivery, getPackageFacts, warrantyUntil } from '../../../shared/projectPackages';

const STATUS_STEPS = [
  'Đang liên hệ',
  'Đang lên thiết kế',
  'Đang thực hiện',
  'Đang Kiểm tra',
  'Hoàn tất'
];

// Ghi chú tiến độ có thể mang trạng thái "Hỗ trợ và bảo trì" — đó là giai đoạn
// sau khi bàn giao, không phải một bước thứ sáu, nên quy về bước cuối.
const AFTER_HANDOVER = 'Hỗ trợ và bảo trì';
const normalize = (status) => (status === AFTER_HANDOVER ? 'Hoàn tất' : status);

/**
 * Tab "Dịch vụ" của cổng khách hàng.
 *
 * Câu hỏi duy nhất khách mở trang này để hỏi là: dự án của tôi đang ở đâu, và
 * lần cuối nó nhúc nhích là khi nào. Nên mỗi bước hiện KÈM NGÀY đạt tới, lấy
 * từ ghi chú tiến độ sớm nhất mang trạng thái đó — trước đây thanh tiến trình
 * chỉ tô màu, khách không biết mình đứng yên ở đó ba ngày hay ba tuần.
 */
export default function CustomerServiceTab({ project }) {
  const { t } = useTranslation();
  const notes = project.progressNotes || [];
  const currentStatus = normalize(project.status);
  const currentStepIndex = STATUS_STEPS.indexOf(currentStatus);
  const isCompleted = currentStatus === 'Hoàn tất';

  // Ngày đạt tới từng bước: ghi chú SỚM NHẤT mang trạng thái đó.
  const stepDates = STATUS_STEPS.map((step) => {
    const first = notes
      .filter((n) => normalize(n.status) === step)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    return first ? new Date(first.createdAt) : null;
  });

  const lastNote = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  // Những con số dưới đây SUY RA từ gói và từ ngày mở dự án, không ai phải gõ:
  // cửa sổ bàn giao dự kiến, hạn bảo hành, và các đợt thanh toán của gói.
  const facts = getPackageFacts(project.servicePackage);
  const startedAt = stepDates[0] || project.createdAt;
  const delivery = estimateDelivery(project.servicePackage, startedAt);
  const completedAt = stepDates[STATUS_STEPS.length - 1];
  const warrantyEnd = warrantyUntil(project.servicePackage, completedAt);
  const daysLeft = warrantyEnd ? Math.ceil((warrantyEnd - new Date()) / 86400000) : null;
  // Đợt thanh toán nào đã tới: mốc chia đều theo số bước đã đi qua.
  const paidStages = facts?.payments
    ? Math.min(facts.payments.length, Math.max(1, Math.ceil(((currentStepIndex + 1) / STATUS_STEPS.length) * facts.payments.length)))
    : 0;
  const fmtDate = (d) => d?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtFull = (d) => d?.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const html = (text) => {
    if (!text) return '';
    return /<[a-z][\s\S]*>/i.test(text) ? text : text.replace(/\n/g, '<br />');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* ── Đang ở đâu ─────────────────────────────────────── */}
      <section className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">{project.servicePackage}</p>
        <h2 className="mt-2 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold leading-tight tracking-[-.035em]">
          {currentStatus}
        </h2>
        {lastNote && (
          <p className="mt-3 text-sm text-muted-foreground">
            Cập nhật lần cuối {fmtFull(new Date(lastNote.createdAt))}
          </p>
        )}

        <div className="mt-8 border-t border-border">
          {STATUS_STEPS.map((step, index) => {
            // Dự án đã hoàn tất thì bước cuối cũng là bước ĐÃ XONG, không phải
            // bước "đang diễn ra" — trước đây nó hiện số 5 thay vì dấu tích.
            const active = index === currentStepIndex;
            const done = index < currentStepIndex || (isCompleted && active);
            const date = stepDates[index];
            return (
              <div key={step} className="flex items-center gap-4 border-b border-border py-4">
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    done || active ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'
                  }`}
                >
                  {done ? <span className="material-symbols-outlined text-[16px]">check</span> : index + 1}
                </span>
                <span className={`flex-1 text-sm ${active ? 'font-semibold text-foreground' : done ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                  {step}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {date ? fmtDate(date) : active ? 'đang diễn ra' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Những thứ suy ra từ gói ────────────────────────── */}
      {(delivery || warrantyEnd || facts?.payments) && (
        <section className="grid gap-px overflow-hidden rounded-[1.5rem] border border-border bg-border sm:grid-cols-2">
          {delivery && !isCompleted && (
            <div className="bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground">Dự kiến bàn giao</p>
              <p className="mt-2 text-lg font-semibold tracking-[-.02em]">
                {fmtDate(delivery.from)} – {fmtDate(delivery.to)}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Tính theo thời gian thực hiện của gói, kể từ ngày mở dự án. Thiếu nội dung từ bạn thì đồng hồ dừng.
              </p>
            </div>
          )}

          {isCompleted && warrantyEnd && (
            <div className="bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground">Bảo hành</p>
              <p className="mt-2 text-lg font-semibold tracking-[-.02em]">
                {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Đến {fmtDate(warrantyEnd)} · {facts?.warrantyDays} ngày kể từ lúc bàn giao.
              </p>
            </div>
          )}

          {facts?.payments && (
            <div className="bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground">Đợt thanh toán</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {facts.payments.map((percent, index) => (
                  <span
                    key={index}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                      index < paidStages ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {percent}%
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Đợt tô đậm là phần đã tới theo tiến độ. Con số cuối cùng luôn theo báo giá đã ký.
              </p>
            </div>
          )}

          {facts?.recurring && (
            <div className="bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground">Hình thức</p>
              <p className="mt-2 text-lg font-semibold tracking-[-.02em]">Theo tháng</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Gói này chạy liên tục, không có ngày bàn giao cuối.</p>
            </div>
          )}
        </section>
      )}

      {/* ── Người phụ trách ────────────────────────────────── */}
      <section className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-8">
        <h3 className="text-sm font-semibold tracking-[-.01em]">Người phụ trách dự án</h3>
        <p className="mt-3 text-base font-medium">{project.handlerName || 'Đang cập nhật'}</p>
        {project.handlerPhone && (
          <a href={`tel:${project.handlerPhone}`} className="link-more mt-2 inline-flex items-center gap-1.5 text-sm">
            <span className="material-symbols-outlined text-[16px]">call</span>
            {project.handlerPhone}
          </a>
        )}
      </section>

      {/* ── Nhật ký tiến độ ────────────────────────────────── */}
      {notes.length > 0 && (
        <section className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-8">
          <h3 className="text-sm font-semibold tracking-[-.01em]">Nhật ký tiến độ</h3>
          <div className="mt-6 border-t border-border">
            {[...notes].reverse().map((note, idx) => (
              <article key={`${note.createdAt}-${idx}`} className="border-b border-border py-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold tracking-[-.01em]">{normalize(note.status)}</span>
                  <span className="font-mono text-xs text-muted-foreground">{fmtFull(new Date(note.createdAt))}</span>
                </div>
                <div
                  className="prose prose-sm mt-2 max-w-none text-sm leading-7 text-muted-foreground dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: html(note.note) }}
                />
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Lời kết khi đã bàn giao ────────────────────────── */}
      {isCompleted && project.finalNote && (
        <section className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-8">
          <h3 className="text-sm font-semibold tracking-[-.01em]">{t('customerPortal.service.summary')}</h3>
          <div
            className="prose prose-sm mt-4 max-w-none text-sm leading-7 text-muted-foreground dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html(project.finalNote) }}
          />
        </section>
      )}
    </div>
  );
}
