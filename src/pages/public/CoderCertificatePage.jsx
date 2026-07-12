import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { notify } from "../../lib/notify";

// Chứng chỉ chặng HugoCoder — trang công khai để học viên chia sẻ.
// Dữ liệu được máy chủ xác thực từ completedLessons: không thể giả mạo bằng URL.
export default function CoderCertificatePage() {
  const { slug, phase } = useParams();
  const [cert, setCert] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | notfound

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    fetch(`${apiBase}/bios/certificate/${slug}/${phase}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setCert(await res.json());
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [slug, phase]);

  useEffect(() => {
    if (cert) {
      document.title = `Chứng chỉ ${cert.stageTitle} — ${cert.displayName} | HugoCoder`;
    }
    return () => { document.title = "Hugo Studio"; };
  }, [cert]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify.success("Đã sao chép liên kết chứng chỉ!");
    } catch {
      notify.error("Không sao chép được, hãy copy từ thanh địa chỉ.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-3xl text-muted-foreground">progress_activity</span>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-foreground">workspace_premium</span>
        </span>
        <h1 className="text-lg font-black text-foreground">Không tìm thấy chứng chỉ</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Chứng chỉ không tồn tại hoặc học viên chưa hoàn thành chặng học này trên HugoCoder.
        </p>
        <Link to="/" className="text-sm font-bold text-foreground underline underline-offset-4">Về trang chủ Hugo Studio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tấm chứng chỉ — thiết kế trang trọng, in được */}
        <div className="relative bg-card border-2 border-foreground/80 rounded-sm p-8 sm:p-12 print:border-black">
          {/* Viền kép cổ điển */}
          <div className="absolute inset-2 border border-foreground/30 rounded-sm pointer-events-none" />

          <div className="relative text-center space-y-6">
            <div className="space-y-2">
              <span className="inline-flex w-14 h-14 rounded-full bg-muted items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-foreground">workspace_premium</span>
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">Hugo Studio — HugoCoder</p>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-wide">Chứng chỉ hoàn thành</h1>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Chứng nhận bạn học</p>
              <p className="text-2xl sm:text-4xl font-black text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                {cert.displayName}
              </p>
              <p className="text-xs text-muted-foreground">đã hoàn thành trọn vẹn</p>
              <p className="text-base sm:text-lg font-black text-foreground">{cert.stageTitle}</p>
              <p className="text-[11px] text-muted-foreground">{cert.rangeText} • {cert.lessonsInStage} bài học • lộ trình 100 bài</p>
            </div>

            {cert.tagline && (
              <p className="text-[12px] italic text-muted-foreground max-w-md mx-auto leading-relaxed">“{cert.tagline}”</p>
            )}

            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Năng lực đã kiểm chứng</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {cert.skills.map((skill, i) => (
                  <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted text-foreground border border-border">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="text-center">
                <p className="text-lg font-black text-foreground">{cert.totalCompleted}/100</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Bài đã hoàn thành</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-lg font-black text-foreground">Chặng {cert.phaseNumber}/6</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Cột mốc lộ trình</p>
              </div>
              {cert.graduated && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-lg font-black text-foreground">Chốt sổ</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Đồ án tuyệt vời</p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-border/60 flex items-center justify-between text-left">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Cấp bởi</p>
                <p className="text-xs font-black text-foreground">Hugo Studio</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Xác thực trực tuyến</p>
                <p className="text-[10px] font-mono text-muted-foreground">hugo.io.vn/certificate/{cert.slug}/{cert.phaseNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hành động — ẩn khi in */}
        <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">link</span>
            Sao chép liên kết
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-foreground border border-border text-xs font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            In / Lưu PDF
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-foreground border border-border text-xs font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">school</span>
            Học HugoCoder
          </Link>
        </div>

        <p className="text-center text-[10px] text-muted-foreground print:hidden">
          Chứng chỉ được xác thực theo thời gian thực từ tiến trình học tập trên hệ thống Hugo Studio.
        </p>
      </div>
    </div>
  );
}
