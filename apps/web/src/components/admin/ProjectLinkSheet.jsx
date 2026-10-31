import { useEffect, useState } from "react";
import { API_BASE } from "../../config/apiBase";
import { notify } from "../../lib/notify";

/**
 * Link cổng dự án cho khách — hiện ra để admin MỞ / SAO CHÉP / CHIA SẺ.
 *
 * Link được xin trước khi hiện nút: Safari chỉ cho ghi bộ nhớ tạm ngay trong cú
 * bấm, còn bản cũ chép SAU một lần fetch nên trên iPhone luôn hỏng (và lúc tạo
 * dự án thì nuốt lỗi, vẫn báo "đã sao chép").
 */
export default function ProjectLinkSheet({ project, path: knownPath, onClose }) {
  const [path, setPath] = useState(knownPath || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (knownPath || !project?._id) return;
    fetch(`${API_BASE}/customer-projects/${project._id}/share`, { credentials: "include" })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setPath(d.path); })
      .catch((e) => setError(e.message || "Không lấy được link"));
  }, [project?._id, knownPath]);

  const url = path ? `${window.location.origin}${path}` : "";
  const copy = () => navigator.clipboard.writeText(url).then(() => notify.success("Đã sao chép link"), () => notify.error("Trình duyệt chặn sao chép — giữ ngón tay trên link để chép"));
  const share = () => navigator.share({ title: `Dự án ${project?.projectId || ""}`, text: "Link theo dõi dự án của bạn tại Hugo Studio", url }).catch(() => {});
  const btn = "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="plink-title" className="w-full max-w-md rounded-3xl bg-card p-6 text-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="plink-title" className="text-lg font-semibold">Link cho khách</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {project?.customer?.fullName || project?.name} · {project?.projectId}. Khách bấm là vào, không cần mật khẩu. Đừng đăng link này công khai.
        </p>
        <div className="mt-4 break-all rounded-xl bg-muted p-3 font-mono text-sm">
          {error ? <span className="text-destructive">{error}</span> : url ? <a href={url} target="_blank" rel="noreferrer" className="underline">{url}</a> : "Đang lấy link…"}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={!url} onClick={copy} className={`${btn} bg-foreground text-background disabled:opacity-40`}>
            <span aria-hidden className="material-symbols-outlined text-[18px]">content_copy</span>Sao chép
          </button>
          {typeof navigator.share === "function" && (
            <button type="button" disabled={!url} onClick={share} className={`${btn} border border-border disabled:opacity-40`}>
              <span aria-hidden className="material-symbols-outlined text-[18px]">ios_share</span>Chia sẻ
            </button>
          )}
        </div>
        <button type="button" onClick={onClose} className="mt-2 min-h-11 w-full rounded-xl text-sm font-medium text-muted-foreground">Xong</button>
      </div>
    </div>
  );
}
