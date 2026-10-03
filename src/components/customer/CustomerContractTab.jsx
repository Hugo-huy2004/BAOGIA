import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../../config/apiBase";
import { notify } from "../../lib/notify";
import { buildContract, contractLangFor, warrantyActive, warrantyItems } from "../../../shared/projectContract";
import { PROJECT_ADDONS } from "../../../shared/projectWorkflow";
import { formatMoney, getPackageFacts, listPrice, marketOf } from "../../../shared/projectPackages";
import ContractDocument from "../contract/ContractDocument";

/**
 * Hợp đồng và hồ sơ dự án của khách: xác nhận hợp đồng, xem tiền, tải bản bàn
 * giao, báo lỗi bảo hành, chọn gói lẻ lúc kết thúc — và toàn văn hợp đồng kèm
 * mọi phụ lục (nhật ký, bảng kê, phiếu bảo hành). Tải PDF = in từ trình duyệt.
 */

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-50";
const field = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none focus:border-foreground/40";

export default function CustomerContractTab({ project, onChange }) {
  const { t, i18n } = useTranslation();
  const lang = contractLangFor(i18n.resolvedLanguage || i18n.language);
  const contract = useMemo(() => buildContract(project, { lang }), [project, lang]);
  const currency = marketOf(project.market).currency;
  const money = (n) => formatMoney(n, currency);
  const [name, setName] = useState(project.customer?.fullName || "");
  const [claim, setClaim] = useState("");
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const terminated = project.status === "terminated";

  const post = async (path, body, ok) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/customer-projects/me/${path}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      onChange?.(data.project);
      notify.success(ok);
      return true;
    } catch (err) {
      notify.error(err.message || t("customerPortal.contract.error", "Chưa thực hiện được, bạn thử lại nhé."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addons = PROJECT_ADDONS.filter((a) => {
    const f = getPackageFacts(a.id);
    return !f?.appliesTo || f.appliesTo.includes(project.packageId);
  });

  return (
    <div className="space-y-6">
      {terminated ? (
        <div className="rounded-2xl border-2 border-destructive/50 p-5 text-sm leading-6">
          <p className="font-semibold">{t("customerPortal.contract.terminated", "Hợp đồng đã chấm dứt")}</p>
          <p className="mt-1 text-muted-foreground">{t("customerPortal.contract.terminatedBody", "Thông báo và căn cứ nằm ở đầu hợp đồng bên dưới và trong mục Trao đổi.")}</p>
        </div>
      ) : null}

      {contract.needsAcceptance && !terminated ? (
        <form className="rounded-2xl border border-foreground/20 bg-card p-5"
          onSubmit={(e) => { e.preventDefault(); post("contract/accept", { name }, t("customerPortal.contract.accepted", "Đã xác nhận hợp đồng. Cảm ơn bạn.")); }}>
          <p className="text-sm font-semibold">
            {t("customerPortal.contract.needsAccept", "Hợp đồng có phiên bản mới (v{{v}}). Bạn đọc kỹ bên dưới rồi xác nhận.", { v: project.contract?.version })}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("customerPortal.contract.acceptNote", "Gõ họ tên và bấm xác nhận là giao kết hợp đồng bằng phương tiện điện tử (Luật Giao dịch điện tử 2023). Hệ thống ghi lại thời điểm, địa chỉ IP và trình duyệt.")}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("customerPortal.contract.namePh", "Họ và tên")} required />
            <button type="submit" disabled={busy} className={`${btn} shrink-0 bg-foreground text-background`}>{t("customerPortal.contract.accept", "Tôi đã đọc và đồng ý")}</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {[[t("customerPortal.contract.total", "Tổng hợp đồng"), contract.totals.total], [t("customerPortal.contract.paid", "Đã thanh toán"), contract.totals.paid], [t("customerPortal.contract.due", "Còn lại"), contract.totals.due]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-xl font-semibold">{money(v)}</p>
          </div>
        ))}
      </div>

      {project.sourceDelivery?.fileUrl ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("customerPortal.contract.zip", "Mã nguồn bàn giao")}</p>
            <p className="truncate text-xs text-muted-foreground">{project.sourceDelivery.fileName} · SHA-256 {project.sourceDelivery.checksum ? `${project.sourceDelivery.checksum.slice(0, 16)}…` : "—"}</p>
          </div>
          <a href={project.sourceDelivery.fileUrl} target="_blank" rel="noreferrer" className={`${btn} shrink-0 bg-foreground text-background`}>
            <span aria-hidden className="material-symbols-outlined text-[18px]">download</span>{t("customerPortal.contract.download", "Tải .ZIP")}
          </a>
        </div>
      ) : null}

      {project.status === "addons" ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">{t("customerPortal.contract.addonsTitle", "Chọn thêm gói lẻ (không bắt buộc)")}</p>
          <div className="mt-3 space-y-2">
            {addons.map((a) => (
              <label key={a.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <input type="checkbox" className="mt-1" checked={picked.includes(a.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, a.id] : p.filter((x) => x !== a.id)))} />
                <span className="min-w-0 text-sm">
                  <span className="font-semibold">{a.label}</span> · {money(listPrice(a.id, project.packageId, project.market))}{a.recurring ? " / tháng" : ""}
                  <span className="block text-xs text-muted-foreground">{a.blurb}</span>
                </span>
              </label>
            ))}
          </div>
          <button type="button" disabled={busy} onClick={() => post("addons", { ids: picked }, t("customerPortal.contract.addonsSent", "Đã gửi lựa chọn. Hugo Studio sẽ xác nhận và cập nhật hợp đồng."))} className={`${btn} mt-3 bg-foreground text-background`}>
            {picked.length ? t("customerPortal.contract.addonsSend", "Gửi lựa chọn") : t("customerPortal.contract.addonsSkip", "Không cần thêm")}
          </button>
        </div>
      ) : null}

      {warrantyActive(project) ? (
        <form className="rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => { e.preventDefault(); if (await post("warranty/claims", { description: claim }, t("customerPortal.contract.claimSent", "Đã gửi yêu cầu bảo hành. Hugo Studio phản hồi trong 1 – 2 ngày làm việc."))) setClaim(""); }}>
          <p className="text-sm font-semibold">{t("customerPortal.contract.claimTitle", "Báo lỗi bảo hành")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {warrantyItems(project).map((w) => `${w.title}: ${w.lifetime ? t("customerPortal.contract.lifetime", "trọn đời") : w.subscription ? t("customerPortal.contract.subscription", "trong thời gian đăng ký") : new Date(w.endsAt).toLocaleDateString()}`).join(" · ")}
          </p>
          <textarea rows={3} className={`${field} mt-3`} value={claim} onChange={(e) => setClaim(e.target.value)} required
            placeholder={t("customerPortal.contract.claimPh", "Trang nào, thiết bị, trình duyệt, lỗi ra sao. Gửi kèm ảnh chụp ở mục Trao đổi.")} />
          <button type="submit" disabled={busy} className={`${btn} mt-3 border border-border`}>{t("customerPortal.contract.claimSend", "Gửi yêu cầu bảo hành")}</button>
        </form>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">{t("customerPortal.contract.docTitle", "Toàn văn hợp đồng và phụ lục")}</p>
        <button type="button" onClick={() => window.print()} className={`${btn} border border-border`}>
          <span aria-hidden className="material-symbols-outlined text-[18px]">picture_as_pdf</span>{t("customerPortal.contract.pdf", "Tải PDF")}
        </button>
      </div>
      <ContractDocument contract={contract} />
    </div>
  );
}
