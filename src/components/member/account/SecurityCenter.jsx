import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../lib/notify";
import { webauthnHelper } from "../../../utils/webauthnHelper";
import { deviceName } from "../../../../shared/deviceName";
import { useJoy } from "../../../lib/joyDisplay";
import ConfirmItsYouDialog from "../ConfirmItsYouDialog";

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
  passkey: { icon: "fingerprint", vi: "Face ID / vân tay", desc: "Mở khoá và xác nhận giao dịch ngay trên máy" },
  pin: { icon: "password", vi: "Mã PIN giao dịch", desc: "Bảo vệ mọi lệnh chuyển JOY" },
  money2fa: { icon: "verified_user", vi: "Xác thực 2 lớp cho giao dịch lớn", desc: "PIN + Face ID hoặc Google khi chuyển JOY lớn" },
  hold: { icon: "shield_person", vi: "Rà soát giao dịch bất thường", desc: "Giao dịch lạ được giữ lại kiểm tra trước" },
  wallet: { icon: "account_balance_wallet", vi: "Ví đang hoạt động", desc: "Ví không bị khoá" },
};

export default function SecurityCenter() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  const load = useCallback(() => fetch(`${apiUrl()}/security/my-status`, { credentials: "include" })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then(setData)
    .catch(() => setErr(true)), []);

  useEffect(() => { load(); }, [load]);

  if (err) return <p className="text-[13px] text-muted-foreground">{t("memberPortal.security.loadError", "Không tải được trạng thái an ninh.")}</p>;
  if (!data) return <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />;

  const handleActivate = (protectionId) => {
    const actions = {
      passkey: async () => {
        try {
          await webauthnHelper.registerDevice("", deviceName(navigator.userAgent) || "Passkey");
          notify.success(t("memberPortal.security.passkeyAdded"));
          load();
        } catch (e) {
          if (e?.name !== "NotAllowedError") notify.error(e.message);
        }
      },
      pin: () => window.dispatchEvent(new CustomEvent("hugo:navigate-tab", { detail: { tab: "account", section: "security-pin" } })),
      money2fa: () => window.dispatchEvent(new CustomEvent("hugo:navigate-tab", { detail: { tab: "account", section: "security-2fa" } })),
      hold: () => {}, // auto-enabled, no user action needed
      wallet: () => window.dispatchEvent(new CustomEvent("hugo:navigate-tab", { detail: { tab: "account", section: "wallet" } })),
    };
    actions[protectionId]?.();
  };

  return (
    <div className="space-y-4">
      {/* Điểm bảo vệ — tín hiệu tin tưởng tức thì */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
        <div className="text-3xl font-black text-emerald-600">{data.score}%</div>
        <p className="mt-1 text-[12px] font-bold text-muted-foreground">
          {t("memberPortal.security.protected", "Tài khoản của bạn đang được bảo vệ")}
        </p>
      </div>

      <HeldTransfers holds={data.holds || []} onDone={load} />

      <div className="space-y-2">
        {data.protections.map((p) => {
          const row = ROWS[p.id];
          if (!row) return null;
          const state = p.on ? "on" : p.partial ? "partial" : "off";
          const color = state === "on" ? "text-emerald-600" : state === "partial" ? "text-amber-500" : "text-slate-400";
          const badge = state === "on" ? "check_circle" : state === "partial" ? "error" : "cancel";
          const isActionable = state !== "on";
          const Wrapper = isActionable ? "button" : "div";
          return (
            <Wrapper
              key={p.id}
              {...(isActionable ? { type: "button", onClick: () => handleActivate(p.id) } : {})}
              className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-3 w-full text-left ${isActionable ? "cursor-pointer hover:bg-accent/50 active:scale-[0.98] transition-all" : ""}`}
            >
              <span className="material-symbols-outlined text-xl text-muted-foreground">{row.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-foreground truncate">{t(`memberPortal.security.row.${p.id}`, row.vi)}</p>
                <p className="text-[11.5px] text-muted-foreground truncate">
                  {isActionable
                    ? t(`memberPortal.security.rowAction.${p.id}`, "Nhấn để thiết lập ngay")
                    : t(`memberPortal.security.rowDesc.${p.id}`, row.desc)}
                </p>
              </div>
              <span className={`material-symbols-outlined text-xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{badge}</span>
            </Wrapper>
          );
        })}
      </div>

      <SignedInDevices />

      <p className="text-center text-[11px] text-muted-foreground">
        {t("memberPortal.security.threshold", { amount: data.stepUpThreshold.toLocaleString("vi-VN"), defaultValue: "Giao dịch từ {{amount}} JOY cần xác thực 2 lớp" })}
      </p>
    </div>
  );
}

// Thiết bị đang đăng nhập — như Apple ID: thấy máy lạ thì đăng xuất nó ngay.
// Dữ liệu và thao tác đều là API phiên có sẵn của Better Auth.
function SignedInDevices() {
  const { t, i18n } = useTranslation();
  const [sessions, setSessions] = useState(null);
  const [current, setCurrent] = useState("");

  const load = useCallback(async () => {
    const { memberAuthClient } = await import("../../../lib/authClient");
    const [{ data: list }, { data: me }] = await Promise.all([memberAuthClient.listSessions(), memberAuthClient.getSession()]);
    setCurrent(me?.session?.token || "");
    setSessions((list || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
  }, []);

  useEffect(() => { load().catch(() => setSessions([])); }, [load]);

  const revoke = async (token) => {
    const { memberAuthClient } = await import("../../../lib/authClient");
    const { error } = token ? await memberAuthClient.revokeSession({ token }) : await memberAuthClient.revokeOtherSessions();
    if (error) notify.error(t("memberPortal.security.revokeFailed"));
    else notify.success(t("memberPortal.security.revoked"));
    load();
  };

  if (!sessions?.length) return null;
  const others = sessions.filter((s) => s.token !== current);
  return (
    <section className="space-y-2" aria-labelledby="signed-in-devices">
      <h3 id="signed-in-devices" className="px-1 text-[13px] font-bold text-muted-foreground">{t("memberPortal.security.devices")}</h3>
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <span className="material-symbols-outlined text-xl text-muted-foreground" aria-hidden="true">{/iPhone|Android/.test(s.userAgent || "") ? "smartphone" : "computer"}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-foreground truncate">{deviceName(s.userAgent || "") || t("memberPortal.security.unknownDevice")}</p>
            <p className="text-[12px] text-muted-foreground truncate">
              {s.token === current ? t("memberPortal.security.thisDevice") : new Date(s.updatedAt).toLocaleString(i18n.language)}
            </p>
          </div>
          {s.token !== current && (
            <button type="button" onClick={() => revoke(s.token)} className="min-h-11 px-3 text-[14px] font-semibold text-destructive">
              {t("memberPortal.security.signOut")}
            </button>
          )}
        </div>
      ))}
      {others.length > 1 && (
        <button type="button" onClick={() => revoke("")} className="w-full min-h-11 rounded-2xl border border-border text-[14px] font-semibold text-destructive">
          {t("memberPortal.security.signOutOthers")}
        </button>
      )}
    </section>
  );
}

// Lệnh chuyển JOY bị giữ: hết giờ chờ an toàn thì chính chủ mở Face ID là tiền đi,
// không phải chờ admin (server/services/transferHold.js).
function HeldTransfers({ holds, onDone }) {
  const { t } = useTranslation();
  const joy = useJoy();
  const [confirming, setConfirming] = useState("");

  const release = async () => {
    const txCode = confirming;
    setConfirming("");
    const res = await fetch(`${apiUrl()}/security/holds/${encodeURIComponent(txCode)}/confirm`, { method: "POST", credentials: "include" });
    if (res.ok) notify.success(t("memberPortal.security.holdReleased"));
    else notify.error((await res.json().catch(() => ({}))).error || t("memberPortal.confirmItsYou.failed"));
    onDone();
  };

  if (!holds.length) return null;
  return (
    <section className="space-y-2" aria-labelledby="held-transfers">
      <h3 id="held-transfers" className="px-1 text-[13px] font-bold text-muted-foreground">{t("memberPortal.security.holdsTitle")}</h3>
      {holds.map((h) => {
        const ready = Date.now() >= new Date(h.readyAt).getTime();
        return (
          <div key={h.txCode} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="material-symbols-outlined text-xl text-muted-foreground" aria-hidden="true">hourglass_top</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-foreground truncate">{joy.text(h.amount)} → {h.to}</p>
              <p className="text-[12px] text-muted-foreground">
                {ready ? t("memberPortal.security.holdReady") : t("memberPortal.security.holdWait", { time: new Date(h.readyAt).toLocaleTimeString(joy.locale, { hour: "2-digit", minute: "2-digit" }) })}
              </p>
            </div>
            {ready && (
              <button type="button" onClick={() => setConfirming(h.txCode)} className="min-h-11 px-3 rounded-xl bg-foreground text-background text-[14px] font-semibold">
                {t("memberPortal.security.holdConfirm")}
              </button>
            )}
          </div>
        );
      })}
      {confirming && (
        <ConfirmItsYouDialog reason={t("memberPortal.confirmItsYou.reasonMoney")} onConfirmed={release} onCancel={() => setConfirming("")} />
      )}
    </section>
  );
}
