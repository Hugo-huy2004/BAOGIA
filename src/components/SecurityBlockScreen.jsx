import { useEffect, useState } from "react";

const STORAGE_KEY = "hugo_security_block";

function readStoredBlock() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || parsed.error !== "ACCESS_BLOCKED") return null;
    if (!parsed.permanent && parsed.blockedUntil && new Date(parsed.blockedUntil).getTime() <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function SecurityBlockBoundary({ children }) {
  const [block, setBlock] = useState(readStoredBlock);

  useEffect(() => {
    const onBlocked = (event) => setBlock(event.detail || readStoredBlock());
    window.addEventListener("hugo:security-blocked", onBlocked);
    return () => window.removeEventListener("hugo:security-blocked", onBlocked);
  }, []);

  if (!block) return children;

  const until = block.blockedUntil
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "long", timeStyle: "short" }).format(new Date(block.blockedUntil))
    : null;
  const appealHref = `mailto:contact@hugowishpax.studio?subject=${encodeURIComponent(`Khiếu nại mã vụ việc ${block.caseId || ''}`)}`;

  return (
    <main className="min-h-screen bg-background text-foreground grid place-items-center px-5 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-7 sm:p-10 shadow-xl" role="alert" aria-live="assertive">
        <span className="material-symbols-outlined grid h-12 w-12 place-items-center rounded-2xl bg-muted text-foreground" aria-hidden="true">
          security
        </span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Thông báo an ninh</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">Truy cập đã bị chặn</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {block.message || "Yêu cầu bị từ chối theo tiêu chuẩn an toàn và an ninh hệ thống."}
        </p>
        <dl className="mt-6 grid gap-3 rounded-2xl bg-muted p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Mã vụ việc</dt>
            <dd className="font-mono font-bold text-right break-all">{block.caseId || "Không có"}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Thời hạn</dt>
            <dd className="font-bold text-right">{block.permanent ? "Vĩnh viễn" : (until || "30 ngày")}</dd>
          </div>
        </dl>
        <p className="mt-5 text-xs leading-6 text-muted-foreground">
          Phản hồi này không cung cấp đường dẫn nội bộ, tệp, stack trace hay chi tiết cấu hình. Nếu cho rằng đây là nhầm lẫn, hãy ghi lại mã vụ việc và gửi khiếu nại qua kênh hỗ trợ chính thức.
        </p>
        <a href={appealHref} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background no-underline">
          <span className="material-symbols-outlined text-base" aria-hidden="true">support_agent</span>
          Gửi khiếu nại
        </a>
      </section>
    </main>
  );
}

export const SECURITY_BLOCK_STORAGE_KEY = STORAGE_KEY;
