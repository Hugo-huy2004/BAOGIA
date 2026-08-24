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

  const handleSelfUnlock = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setBlock(null);
      window.location.reload();
    } catch {}
  };

  return (
    <main className="min-h-screen bg-background text-foreground grid place-items-center px-5 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-rose-500/20 bg-card p-7 sm:p-10 shadow-2xl" role="alert" aria-live="assertive">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500 text-2xl" aria-hidden="true">
            verified_user
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Bảo mật Hugo Security Sentinel</p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Xác Nhận Người Dùng Thật</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {block.message || "Hệ thống phát hiện tần suất truy cập bất thường từ thiết bị của bạn. Để đảm bảo an toàn, vui lòng xác nhận bạn là con người."}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSelfUnlock}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-rose-700 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">check_circle</span>
            Tôi là người dùng thật (Vào lại ứng dụng)
          </button>
        </div>

        <dl className="mt-6 grid gap-2 rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Mã vụ việc:</span>
            <span className="font-mono font-bold text-foreground">{block.caseId || "N/A"}</span>
          </div>
        </dl>
      </section>
    </main>
  );
}

export const SECURITY_BLOCK_STORAGE_KEY = STORAGE_KEY;
