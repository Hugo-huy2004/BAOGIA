import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import dataApi from "../services/dataApi";
import useVisiblePoll from "../hooks/useVisiblePoll";
import HugoLogo from "../components/HugoLogo";
import { isAdminAuthenticated } from "../services/authSession";
import { notify } from "../lib/notify";

const FALLBACK_BANK_APPS = [
  { appId: "mb", appName: "MB Bank", bankName: "Ngân hàng TMCP Quân đội", autofill: true },
  { appId: "icb", appName: "VietinBank iPay", bankName: "Ngân hàng TMCP Công thương Việt Nam", autofill: true },
  { appId: "bidv", appName: "BIDV SmartBanking", bankName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", autofill: true },
  { appId: "ocb", appName: "OCB OMNI", bankName: "Ngân hàng TMCP Phương Đông", autofill: true },
  { appId: "acb", appName: "ACB One", bankName: "Ngân hàng TMCP Á Châu", autofill: true },
  { appId: "vcb", appName: "Vietcombank", bankName: "Ngân hàng TMCP Ngoại thương Việt Nam", autofill: false },
  { appId: "tcb", appName: "Techcombank Mobile", bankName: "Ngân hàng TMCP Kỹ thương Việt Nam", autofill: false },
  { appId: "vpb", appName: "VPBank NEO", bankName: "Ngân hàng TMCP Việt Nam Thịnh Vượng", autofill: false },
  { appId: "vba", appName: "Agribank E-Mobile Banking", bankName: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam", autofill: false },
  { appId: "tpb", appName: "TPBank Mobile", bankName: "Ngân hàng TMCP Tiên Phong", autofill: false },
];

const TABS = [
  { id: "bank", label: "Ứng dụng ngân hàng", icon: "account_balance" },
  { id: "qr", label: "VietQR", icon: "qr_code_2" },
  { id: "momo", label: "MoMo", icon: "account_balance_wallet" },
  { id: "shopeepay", label: "ShopeePay", icon: "wallet" },
];

const bankNames = {
  "970436": "Vietcombank", "970422": "MBBank", "970407": "Techcombank",
  "970415": "VietinBank", "970418": "BIDV", "970416": "ACB",
  "970432": "VPBank", "970423": "TPBank", "970405": "Agribank",
};

const bankDeeplinkIds = {
  "970436": "vcb", "970422": "mb", "970407": "tcb",
  "970415": "icb", "970418": "bidv", "970416": "acb",
  "970432": "vpb", "970423": "tpb", "970405": "vba",
  "970448": "ocb", "970441": "vib", "970437": "hdb",
  "970443": "shb", "970449": "lpb",
};

const getMobileBankPlatform = () => {
  if (typeof navigator === "undefined") return null;
  if (/Android/i.test(navigator.userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return null;
};

const normalizeSearch = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

function LoadingState() {
  const { t } = useTranslation();
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <div className="text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-primary/15 border-t-primary" />
        <p className="mt-4 text-xs font-bold text-muted-foreground">{t("paymentGateway.dangChuanBiThong")}</p>
      </div>
    </main>
  );
}

export default function PaymentGatewayPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const qrRef = useRef(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("bank");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [pollActive, setPollActive] = useState(true);
  const [bankApps, setBankApps] = useState(FALLBACK_BANK_APPS);
  const [bankAppsSource, setBankAppsSource] = useState("fallback");
  const [bankSearch, setBankSearch] = useState("");
  const mobileBankPlatform = useMemo(() => getMobileBankPlatform(), []);

  // Poll trạng thái giao dịch: 5 giây, nhưng CHỈ khi tab đang hiện, và dừng
  // hẳn khi giao dịch đã chốt (khác PENDING) hoặc gặp lỗi.
  //
  // Người trả tiền hầu như luôn chuyển sang app ngân hàng để quét QR — lúc đó
  // tab này bị ẩn, và bản cũ vẫn nện server 12 lần/phút cho một màn hình không
  // ai nhìn. Dừng lúc ẩn rồi gọi NGAY khi họ quay lại còn báo "đã thanh toán"
  // nhanh hơn chờ hết nhịp 5 giây.
  const fetchInfo = useCallback(async () => {
    try {
      const response = await dataApi.get(`/api/payos/info/${id}`);
      if (!response.data.success) throw new Error(response.data.error);
      setPaymentInfo(response.data.data);
      setError("");
      if (response.data.data.status !== "PENDING") setPollActive(false);
    } catch (requestError) {
      setError(requestError?.message || "Không tìm thấy giao dịch.");
      setPollActive(false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Mã giao dịch đổi thì mở lại vòng poll cho giao dịch mới.
  useEffect(() => {
    setPollActive(true);
    setLoading(true);
  }, [id]);

  useVisiblePoll(fetchInfo, 5000, pollActive);

  useEffect(() => {
    if (!mobileBankPlatform) return undefined;

    const controller = new AbortController();
    dataApi.get("/api/payos/bank-apps", {
      params: { platform: mobileBankPlatform },
      signal: controller.signal,
    }).then((response) => {
      if (!response.data?.success || !Array.isArray(response.data.data) || !response.data.data.length) return;
      setBankApps(response.data.data);
      setBankAppsSource("vietqr");
    }).catch((requestError) => {
      if (requestError?.name !== "CanceledError" && requestError?.code !== "ERR_CANCELED") {
        setBankAppsSource("fallback");
      }
    });

    return () => controller.abort();
  }, [mobileBankPlatform]);

  const fallbackQrUrl = useMemo(() => {
    if (!paymentInfo?.bin || !paymentInfo?.accountNumber) return "";
    const params = new URLSearchParams({
      amount: String(paymentInfo.amount),
      addInfo: paymentInfo.reason,
      accountName: paymentInfo.accountName || "",
    });
    return `https://img.vietqr.io/image/${paymentInfo.bin}-${paymentInfo.accountNumber}-compact2.png?${params}`;
  }, [paymentInfo]);

  const copy = async (value, field) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(field);
      notify.success(field === "account" ? "Đã sao chép số tài khoản." : "Đã sao chép nội dung chuyển khoản.");
      setTimeout(() => setCopied(""), 1800);
    } catch {
      notify.error("Trình duyệt không cho phép sao chép tự động.");
    }
  };

  const visibleBankApps = useMemo(() => {
    const query = normalizeSearch(bankSearch);
    if (!query) return bankApps;
    return bankApps.filter((bank) => normalizeSearch(`${bank.appName} ${bank.bankName}`).includes(query));
  }, [bankApps, bankSearch]);

  const openBank = (bank) => {
    if (!mobileBankPlatform) {
      setActiveTab("qr");
      notify.info("Trên máy tính, bạn hãy quét VietQR bằng ứng dụng ngân hàng trên điện thoại nhé.");
      return;
    }
    const beneficiaryBankId = bankDeeplinkIds[String(paymentInfo.bin)] || String(paymentInfo.bin);
    const query = new URLSearchParams({
      app: bank.appId,
      ba: `${paymentInfo.accountNumber}@${beneficiaryBankId}`,
      am: String(paymentInfo.amount),
      tn: paymentInfo.reason,
      bn: paymentInfo.accountName || "",
      url: `${window.location.origin}/pay/${id}`,
    });
    const deeplinkUrl = new URL("https://dl.vietqr.io/pay");
    query.forEach((value, key) => deeplinkUrl.searchParams.set(key, value));
    window.location.assign(deeplinkUrl.toString());
  };

  const downloadQr = () => {
    if (paymentInfo.qrCode && qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      if (svg) {
        const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `hugo-studio-${paymentInfo.customLinkId}.svg`;
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }
    }
    window.open(fallbackQrUrl, "_blank", "noopener,noreferrer");
  };

  const openWallet = (scheme) => {
    downloadQr();
    setTimeout(() => window.location.assign(`${scheme}://`), 350);
  };

  const cancelPayment = async () => {
    const confirmed = await notify.confirm({
      title: "Hủy giao dịch?",
      message: "Liên kết sẽ bị xóa khỏi hệ thống nếu giao dịch chưa được thanh toán.",
      confirmText: "Hủy giao dịch",
      danger: true,
    });
    if (!confirmed) return;
    setCancelling(true);
    try {
      const response = await dataApi.post(`/api/payos/cancel/${id}`);
      if (!response.data.success) throw new Error(response.data.error);
      setPaymentInfo((current) => ({ ...current, status: "CANCELLED" }));
      notify.success("Đã hủy giao dịch.");
    } catch (requestError) {
      notify.error(requestError?.response?.data?.error || requestError?.message || "Không thể hủy giao dịch.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingState />;

  if (error || !paymentInfo) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-center text-foreground">
        <div className="max-w-sm">
          <span className="material-symbols-outlined text-5xl text-destructive">error</span>
          <h1 className="mt-3 text-2xl font-black">{t("paymentGateway.giaoDichKhongHop")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || t("paymentGateway.lienKetKhongTon")}</p>
          <a href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-foreground px-5 text-sm font-bold text-background">{t("paymentGateway.veTrangChu")}</a>
        </div>
      </main>
    );
  }

  const isDonation = paymentInfo.kind === "DONATION";
  const isPaid = paymentInfo.status === "PAID";
  const isCancelled = paymentInfo.status === "CANCELLED";
  const amountLabel = `${paymentInfo.amount.toLocaleString("vi-VN")} VNĐ`;

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:py-10">
      <main className="mx-auto w-full max-w-3xl">
        <header className="mb-5 flex items-center justify-between">
          <a href="/" aria-label="Hugo Studio"><HugoLogo className="h-8 w-auto" /></a>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            PayOS API · VietQR
          </span>
        </header>

        {isPaid ? (
          <section className="rounded-[28px] border border-success/25 bg-card p-7 text-center shadow-sm sm:p-10">
            <span className="material-symbols-outlined text-6xl text-success">verified</span>
            <h1 className="mt-3 text-2xl font-black sm:text-3xl">{isDonation ? t("paymentGateway.camOnBanDa") : t("paymentGateway.thanhToanThanhCong")}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {isDonation ? t("paymentGateway.thuCamOnVa") : t("paymentGateway.giaoDichDaDuoc")}
            </p>
            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-muted/60 p-4 text-left text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t("paymentGateway.soTien")}</span><strong>{amountLabel}</strong></div>
              <div className="mt-2 flex justify-between gap-4"><span className="text-muted-foreground">{t("paymentGateway.ma")}</span><strong className="font-mono">{paymentInfo.customLinkId.slice(-10)}</strong></div>
            </div>
            <a href="/" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-white">{t("paymentGateway.veHugoStudio")}</a>
          </section>
        ) : isCancelled ? (
          <section className="rounded-[28px] border border-destructive/25 bg-card p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-6xl text-destructive">cancel</span>
            <h1 className="mt-3 text-2xl font-black">{t("paymentGateway.giaoDichDaHuy")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("paymentGateway.banCoTheQuay")}</p>
            <a href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-foreground px-5 text-sm font-bold text-background">{t("paymentGateway.veTrangChu")}</a>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/35 px-5 py-6 text-center sm:px-8">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{isDonation ? t("paymentGateway.khoanUngHoTu") : t("paymentGateway.yeuCauThanhToan")}</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{amountLabel}</h1>
              <p className="mt-2 text-xs text-muted-foreground">{t("paymentGateway.noiDung")} <strong className="text-foreground">{paymentInfo.reason}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-border p-3 sm:grid-cols-4">
              {TABS.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`min-h-14 rounded-2xl px-2 text-[10px] font-bold transition-colors ${activeTab === tab.id ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                  <span className="material-symbols-outlined mb-0.5 block text-xl">{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-8">
              {activeTab === "bank" && (
                <div>
                  <h2 className="text-base font-black">{t("paymentGateway.moUngDungNgan")}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("paymentGateway.chonAppNganHang")}</p>

                  {!mobileBankPlatform && (
                    <button type="button" onClick={() => setActiveTab("qr")} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-xs font-bold text-background">
                      <span className="material-symbols-outlined text-lg">qr_code_2</span>
                      {t("paymentGateway.dungVietqrVoiMoi")}
                    </button>
                  )}

                  {mobileBankPlatform && (
                    <label className="mt-4 flex min-h-12 items-center gap-2 rounded-xl border border-border bg-background px-3">
                      <span className="material-symbols-outlined text-lg text-muted-foreground">search</span>
                      <span className="sr-only">{t("paymentGateway.timUngDungNgan")}</span>
                      <input value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} placeholder={t("paymentGateway.timTenNganHang")} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                    </label>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {visibleBankApps.map((bank) => (
                      <button key={bank.appId} type="button" onClick={() => openBank(bank)} className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left transition-colors hover:bg-muted">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-foreground"><span className="material-symbols-outlined text-xl">account_balance</span></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-black">{bank.appName}</span>
                          <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{bank.bankName}</span>
                        </span>
                        {bank.autofill && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-black text-primary">{t("paymentGateway.tuDien")}</span>}
                      </button>
                    ))}
                  </div>
                  {!visibleBankApps.length && <p className="mt-4 text-center text-xs text-muted-foreground">{t("paymentGateway.chuaTimThayApp")}</p>}
                  {mobileBankPlatform && bankAppsSource === "fallback" && <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{t("paymentGateway.danhSachDayDu")}</p>}
                  <button type="button" onClick={() => setActiveTab("qr")} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-bold"><span className="material-symbols-outlined text-lg">qr_code_2</span>{t("paymentGateway.khongThayAppDung")}</button>
                </div>
              )}

              {activeTab === "qr" && (
                <QrPanel paymentInfo={paymentInfo} fallbackQrUrl={fallbackQrUrl} qrRef={qrRef} downloadQr={downloadQr} copy={copy} copied={copied} />
              )}

              {(activeTab === "momo" || activeTab === "shopeepay") && (
                <div className="text-center">
                  <h2 className="text-base font-black">{t("paymentGateway.thanhToanBang")} {activeTab === "momo" ? "MoMo" : "ShopeePay"}</h2>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">{t("paymentGateway.heThongSeTai")}</p>
                  <button type="button" onClick={() => openWallet(activeTab)} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-foreground px-6 text-sm font-bold text-background">
                    <span className="material-symbols-outlined">open_in_new</span>{t("paymentGateway.mo")} {activeTab === "momo" ? "MoMo" : "ShopeePay"}
                  </button>
                  <p className="mt-3 text-[10px] text-muted-foreground">{t("paymentGateway.khaNangMoTruc")}</p>
                </div>
              )}

              <div className="mt-7 grid gap-2 rounded-2xl border border-border bg-muted/35 p-4 text-xs sm:grid-cols-2">
                <button type="button" onClick={() => copy(paymentInfo.accountNumber, "account")} className="flex items-center justify-between rounded-xl bg-background p-3 text-left">
                  <span><span className="block text-[10px] text-muted-foreground">{t("paymentGateway.soTaiKhoan")}</span><strong className="font-mono">{paymentInfo.accountNumber}</strong></span>
                  <span className="material-symbols-outlined text-lg">{copied === "account" ? "check" : "content_copy"}</span>
                </button>
                <button type="button" onClick={() => copy(paymentInfo.reason, "reason")} className="flex items-center justify-between rounded-xl bg-background p-3 text-left">
                  <span><span className="block text-[10px] text-muted-foreground">{t("paymentGateway.noiDung2")}</span><strong>{paymentInfo.reason}</strong></span>
                  <span className="material-symbols-outlined text-lg">{copied === "reason" ? "check" : "content_copy"}</span>
                </button>
                <div className="sm:col-span-2 text-muted-foreground">{t("paymentGateway.nguoiNhan")} <strong className="text-foreground">{paymentInfo.accountName}</strong> · {bankNames[paymentInfo.bin] || t("paymentGateway.nganHangDoiTac")}</div>
              </div>

              <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><span className="material-symbols-outlined text-base">verified_user</span><span>{t("paymentGateway.khongDongTrangCho")}</span></p>

              {isAdminAuthenticated() && (
                <button type="button" disabled={cancelling} onClick={cancelPayment} className="mt-5 min-h-11 w-full rounded-xl border border-destructive/30 text-xs font-bold text-destructive disabled:opacity-50">{cancelling ? t("paymentGateway.dangHuy") : t("paymentGateway.huyVaXoaGiao")}</button>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function QrPanel({ paymentInfo, fallbackQrUrl, qrRef, downloadQr, copy, copied }) {
  const { t } = useTranslation();
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
      <div ref={qrRef} className="mx-auto grid size-[220px] place-items-center rounded-3xl border border-border bg-white p-4 shadow-sm">
        {paymentInfo.qrCode
          ? <QRCodeSVG value={paymentInfo.qrCode} size={184} level="M" marginSize={1} />
          : <img src={fallbackQrUrl} alt={t("paymentGateway.maVietqrThanhToan")} className="size-full object-contain" />}
      </div>
      <div>
        <h2 className="text-base font-black">{t("paymentGateway.quetVietqr")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("paymentGateway.moUngDungNgan2")}</p>
        <button type="button" onClick={downloadQr} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-foreground px-4 text-xs font-bold text-background"><span className="material-symbols-outlined text-lg">download</span>{t("paymentGateway.taiMaQr")}</button>
        <button type="button" onClick={() => copy(paymentInfo.reason, "reason")} className="ml-2 mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-bold"><span className="material-symbols-outlined text-lg">{copied === "reason" ? "check" : "content_copy"}</span>{t("paymentGateway.saoChepNoiDung")}</button>
      </div>
    </div>
  );
}
