import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Trung tâm An ninh: một màn cho người dùng THẤY mình được bảo vệ. Nguồn sự
// thật là /api/security/my-status — component chỉ hiển thị, không tự suy đoán
// trạng thái an ninh.
// Cùng cách suy ra base URL như các service khác trong repo (mỗi file tự có
// bản này; không có module chung để import).
const apiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl;
  if (typeof window !== "undefined") return `${window.location.origin}${envUrl || "/api"}`;
  return "/api";
};

const ROWS = {
  pin: { icon: "password", vi: "Mã PIN giao dịch", desc: "Bảo vệ mọi lệnh chuyển JOY" },
  money2fa: { icon: "verified_user", vi: "Xác thực 2 lớp cho giao dịch lớn", desc: "PIN + mã email khi chuyển số tiền lớn" },
  hold: { icon: "shield_person", vi: "Rà soát giao dịch bất thường", desc: "Giao dịch lạ được giữ lại kiểm tra trước" },
  wallet: { icon: "account_balance_wallet", vi: "Ví đang hoạt động", desc: "Ví không bị khoá" },
};

export default function SecurityCenter() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${apiUrl()}/security/my-status`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setData(d))
      .catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, []);

  if (err) return <p className="text-[13px] text-muted-foreground">{t("memberPortal.security.loadError", "Không tải được trạng thái an ninh.")}</p>;
  if (!data) return <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />;

  return (
    <div className="space-y-4">
      {/* Điểm bảo vệ — tín hiệu tin tưởng tức thì */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
        <div className="text-3xl font-black text-emerald-600">{data.score}%</div>
        <p className="mt-1 text-[12px] font-bold text-muted-foreground">
          {t("memberPortal.security.protected", "Tài khoản của bạn đang được bảo vệ")}
        </p>
      </div>

      {data.pendingHolds > 0 && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-[12.5px] font-bold text-indigo-600 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">hourglass_top</span>
          {t("memberPortal.security.pendingHolds", { count: data.pendingHolds, defaultValue: "{{count}} giao dịch đang được rà soát an toàn" })}
        </div>
      )}

      <div className="space-y-2">
        {data.protections.map((p) => {
          const row = ROWS[p.id];
          if (!row) return null;
          const state = p.on ? "on" : p.partial ? "partial" : "off";
          const color = state === "on" ? "text-emerald-600" : state === "partial" ? "text-amber-500" : "text-slate-400";
          const badge = state === "on" ? "check_circle" : state === "partial" ? "error" : "cancel";
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <span className="material-symbols-outlined text-xl text-muted-foreground">{row.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-foreground truncate">{t(`memberPortal.security.row.${p.id}`, row.vi)}</p>
                <p className="text-[11.5px] text-muted-foreground truncate">{t(`memberPortal.security.rowDesc.${p.id}`, row.desc)}</p>
              </div>
              <span className={`material-symbols-outlined text-xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{badge}</span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {t("memberPortal.security.threshold", { amount: data.stepUpThreshold.toLocaleString("vi-VN"), defaultValue: "Giao dịch từ {{amount}} JOY cần xác thực 2 lớp" })}
      </p>
    </div>
  );
}
