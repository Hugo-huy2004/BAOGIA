import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { getMemberSession, clearMemberSession } from "../services/authSession";
import { apiFetch } from "../services/api";
import { transferJoy, getJoyQrPayload } from "../services/joyApi";
import { notify } from "../lib/notify";
import memberService from "../services/classes/MemberService";
// Đuôi .jsx tường minh: macOS không phân biệt hoa/thường nên "./EcoRadio" bắt
// trúng ecoRadio.js (file helper) trước — build đứt vì file đó không có default export.
import EcoRadio from "./EcoRadio.jsx";
import EcoGames from "./EcoGames";
import EcoFold from "./EcoFold";
import { joyText } from "../lib/joyDisplay";

// Gộp Ví JOY + Thẻ thành viên + Hoạt động + Tài khoản của chế độ thường về MỘT
// trang. Ở chế độ thường bốn tab đó gọi API riêng mỗi lần chuyển; ở đây chỉ có
// đúng MỘT lượt gọi lấy số dư khi mở trang, sau đó không gọi lại.
//
// Những mục thêm vào (mã QR, điểm danh, lịch sử) nằm trong `EcoFold`: mở ra
// mới gọi, và mỗi lần mở chỉ một lượt. Nhiều tính năng hơn nhưng chi phí lúc
// mở trang vẫn y nguyên.

const money = (value) => `${value > 0 ? "+" : ""}${value.toLocaleString("vi-VN")}`;

const shortDate = (value) => {
  try {
    return new Intl.DateTimeFormat("vi", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      .format(new Date(value));
  } catch { return ""; }
};

export default function EcoAccount() {
  const { t } = useTranslation();
  const session = getMemberSession();
  const [balance, setBalance] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState({ phone: "", amount: "", pin: "" });
  const [sending, setSending] = useState(false);
  const [bio, setBio] = useState(null);
  const [info, setInfo] = useState({ displayName: "", phone: "", school: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  // Một lần duy nhất cho mỗi lần mở trang. Không polling, không refetch khi
  // quay lại tab — đó chính là phần "nhẹ máy chủ" của chế độ này.
  useEffect(() => {
    let alive = true;
    if (!session?.email) return undefined;
    apiFetch(`/joy/balance?email=${encodeURIComponent(session.email)}`)
      .then((data) => { if (alive) setBalance(data?.balance ?? data?.joyBalance ?? 0); })
      .catch(() => { if (alive) setLoadFailed(true); });
    return () => { alive = false; };
  }, [session?.email]);

  // Hồ sơ cũng chỉ lấy MỘT lượt cùng lúc mở trang, gộp chung với số dư.
  useEffect(() => {
    let alive = true;
    if (!session?.email) return undefined;
    memberService.getMemberBio(session.email, session.displayName || "")
      .then((data) => {
        if (!alive || !data) return;
        setBio(data);
        setInfo({
          displayName: data.displayName || session.displayName || "",
          phone: data.phone || "",
          school: data.school || "",
        });
      })
      .catch(() => { /* không lấy được hồ sơ thì phần dưới vẫn dùng bình thường */ });
    return () => { alive = false; };
  }, [session?.email, session?.displayName]);

  const saveInfo = async (event) => {
    event.preventDefault();
    if (!bio?._id) {
      notify.error("Chưa tải được hồ sơ. Mở lại trang rồi thử tiếp.");
      return;
    }
    if (!info.displayName.trim()) {
      notify.error("Tên hiển thị không được để trống.");
      return;
    }
    setSavingInfo(true);
    try {
      await memberService.updateMemberBio(bio._id, {
        displayName: info.displayName.trim(),
        phone: info.phone.trim(),
        school: info.school.trim(),
      });
      notify.success("Đã lưu thông tin.");
    } catch (error) {
      notify.error(error.message || "Lưu thông tin không thành công.");
    } finally {
      setSavingInfo(false);
    }
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.phone.trim() || !Number.isFinite(amount) || amount <= 0) {
      notify.error("Nhập số điện thoại người nhận và số JOY hợp lệ.");
      return;
    }
    setSending(true);
    try {
      await transferJoy({
        fromEmail: session.email,
        toPhone: form.phone.trim(),
        amount,
        pin: form.pin,
        idempotencyKey: `saveE-${session.email}-${Date.now()}`,
      });
      notify.success(`Đã chuyển ${joyText(amount)}.`);
      setBalance((current) => (current == null ? current : current - amount));
      setForm({ phone: "", amount: "", pin: "" });
    } catch (error) {
      notify.error(error.message || "Chuyển JOY không thành công.");
    } finally {
      setSending(false);
    }
  };

  const bumpBalance = (delta) => setBalance((current) => (current == null ? current : current + delta));

  const logout = () => {
    clearMemberSession();
    window.location.href = "/login";
  };

  return (
    <>
      {/* ── Thẻ thành viên ── */}
      <section className="save-e-section" aria-labelledby="eco-card">
        <h2 id="eco-card">{t("saveE.account.theThanhVien")}</h2>
        <div className="save-e-membercard">
          <p className="save-e-name">{info.displayName || session?.displayName || t("saveE.account.thanhVienHugo")}</p>
          <small>{session?.email}</small>
          <p className="save-e-balance">
            {balance == null ? (loadFailed ? "—" : "…") : joyText(balance)}
          </p>
          {loadFailed ? <small>{t("saveE.account.chuaLayDuocSo")}</small> : null}
        </div>
      </section>

      {/* ── Mở ra mới gọi máy chủ ── */}
      <section className="save-e-section" aria-labelledby="eco-more">
        <h2 id="eco-more">{t("saveE.account.viJoy")}</h2>
        <div className="save-e-card">
          <EcoFold
            icon="qr_code_2"
            title={t("saveE.account.maQrNhanJoy")}
            hint="Mã do máy chủ ký, lấy một lượt khi mở"
            load={() => getJoyQrPayload(session.email)}
          >
            {({ data, reload }) => (data?.payload ? (
              <div className="save-e-qr">
                {/* Vẽ bằng SVG chứ không phải canvas: không có lớp bitmap để GPU
                    tô lại, và in ra vẫn nét. */}
                <QRCodeSVG value={data.payload} size={200} bgColor="#000000" fgColor="#ffffff" level="M" />
                {/* Token do máy chủ ký có hạn ~2 phút. Chế độ thường tự xin mã
                    mới theo chu kỳ; ở đây KHÔNG hẹn giờ — người quét báo hết hạn
                    thì bấm lấy mã mới, đúng một lượt gọi. */}
                <button type="button" className="save-e-chip" onClick={reload}>
                  <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
                  {t("saveE.account.layMaMoi")}
                </button>
                <p className="save-e-note">
                  {t("saveE.account.duaMaNayCho")}
                </p>
              </div>
            ) : null)}
          </EcoFold>

          <EcoFold
            icon="event_available"
            title={t("saveE.account.diemDanhNhanJoy")}
            hint="Mỗi ngày một lần"
            load={() => apiFetch("/checkin/status")}
          >
            {({ data, setData }) => (data ? (
              <div className="save-e-row">
                <div>
                  <strong>{data.canClaimToday ? t("saveE.account.homNayChuaDiem") : t("saveE.account.homNayDaDiem")}</strong>
                  <small>{t("saveE.account.chuoiLienTiep")} {data.consecutiveDays || 0} {t("saveE.account.ngay")}</small>
                </div>
                <button
                  type="button"
                  className="save-e-btn"
                  disabled={!data.canClaimToday}
                  onClick={async () => {
                    try {
                      const result = await apiFetch("/checkin/claim", { method: "POST" });
                      notify.success(`Đã nhận ${joyText(result.totalReward)}.`);
                      bumpBalance(result.totalReward);
                      setData({ ...data, canClaimToday: false, consecutiveDays: result.consecutiveDays });
                    } catch (error) {
                      notify.error(error.message || t("saveE.account.diemDanhKhongThanh"));
                    }
                  }}
                >
                  {t("saveE.account.diemDanh")}
                </button>
              </div>
            ) : null)}
          </EcoFold>

          <EcoFold
            icon="receipt_long"
            title={t("saveE.account.lichSuGiaoDich")}
            hint="10 dòng gần nhất"
            load={() => apiFetch("/joy/history?limit=10&days=0").then((data) => data.transactions || [])}
          >
            {({ data }) => (data?.length ? data.map((tx) => (
              <div className="save-e-row" key={tx.id}>
                <div>
                  <strong>{tx.title || tx.description || tx.source}</strong>
                  <small>{shortDate(tx.createdAt)}</small>
                </div>
                <span className={tx.amount > 0 ? "save-e-strong-green" : "save-e-strong-blue"}>
                  {money(tx.amount)}
                </span>
              </div>
            )) : data ? <p className="save-e-note">{t("saveE.account.chuaCoGiaoDich")}</p> : null)}
          </EcoFold>
        </div>
      </section>

      {/* ── Chuyển JOY ── */}
      <section className="save-e-section" aria-labelledby="eco-transfer">
        <h2 id="eco-transfer">{t("saveE.account.chuyenJoy")}</h2>
        <form className="save-e-card" onSubmit={submitTransfer}>
          <label className="save-e-field">
            <span>{t("saveE.account.soDienThoaiNguoi")}</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label className="save-e-field">
            <span>{t("saveE.account.soJoy")}</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </label>
          <label className="save-e-field">
            <span>{t("saveE.account.maPinGiaoDich")}</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={form.pin}
              onChange={(event) => setForm({ ...form, pin: event.target.value })}
            />
          </label>
          <button type="submit" className="save-e-btn save-e-btn--wide" disabled={sending}>
            {sending ? t("saveE.account.dangChuyen") : t("saveE.account.chuyenJoy")}
          </button>
        </form>
      </section>

      {/* ── Sửa thông tin ── */}
      <section className="save-e-section" aria-labelledby="eco-info">
        <h2 id="eco-info">{t("saveE.account.thongTinCaNhan")}</h2>
        <form className="save-e-card" onSubmit={saveInfo}>
          <label className="save-e-field">
            <span>{t("saveE.account.tenHienThi")}</span>
            <input
              type="text"
              autoComplete="name"
              value={info.displayName}
              onChange={(event) => setInfo({ ...info, displayName: event.target.value })}
            />
          </label>
          <label className="save-e-field">
            <span>{t("saveE.account.soDienThoai")}</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={info.phone}
              onChange={(event) => setInfo({ ...info, phone: event.target.value })}
            />
          </label>
          <label className="save-e-field">
            <span>{t("saveE.account.truongDonVi")}</span>
            <input
              type="text"
              value={info.school}
              onChange={(event) => setInfo({ ...info, school: event.target.value })}
            />
          </label>
          <button type="submit" className="save-e-btn save-e-btn--wide" disabled={savingInfo || !bio?._id}>
            {savingInfo ? t("saveE.account.dangLuu") : t("saveE.account.luuThongTin")}
          </button>
          <p className="save-e-note">
            {t("saveE.account.anhDaiDienAnh")}
          </p>
        </form>
      </section>

      <EcoRadio />
      <EcoGames onJoyChange={bumpBalance} />

      {/* ── Cài đặt cơ bản ── */}
      <section className="save-e-section" aria-labelledby="eco-settings">
        <h2 id="eco-settings">{t("saveE.account.caiDat")}</h2>
        <div className="save-e-card">
          <div className="save-e-row">
            <div>
              <strong>{t("saveE.account.dangXuat")}</strong>
              <small>{session?.email}</small>
            </div>
            <button type="button" className="save-e-btn save-e-btn--plain" onClick={logout}>
              {t("saveE.account.dangXuat")}
            </button>
          </div>
        </div>
        <p className="save-e-note">
          {t("saveE.account.batTatVaMuc")}
        </p>
      </section>
    </>
  );
}
