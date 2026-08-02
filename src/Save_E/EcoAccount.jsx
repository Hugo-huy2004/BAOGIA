import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getMemberSession, clearMemberSession } from "../services/authSession";
import { apiFetch } from "../services/api";
import { transferJoy, getJoyQrPayload } from "../services/joyApi";
import { notify } from "../lib/notify";
import memberService from "../services/classes/MemberService";
import EcoRadio from "./EcoRadio";
import EcoGames from "./EcoGames";
import EcoFold from "./EcoFold";

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
      notify.success(`Đã chuyển ${amount} JOY.`);
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
        <h2 id="eco-card">Thẻ thành viên</h2>
        <div className="save-e-membercard">
          <p className="save-e-name">{info.displayName || session?.displayName || "Thành viên Hugo"}</p>
          <small>{session?.email}</small>
          <p className="save-e-balance">
            {balance == null ? (loadFailed ? "—" : "…") : balance.toLocaleString("vi-VN")} JOY
          </p>
          {loadFailed ? <small>Chưa lấy được số dư. Mở lại trang để thử lần nữa.</small> : null}
        </div>
      </section>

      {/* ── Mở ra mới gọi máy chủ ── */}
      <section className="save-e-section" aria-labelledby="eco-more">
        <h2 id="eco-more">Ví JOY</h2>
        <div className="save-e-card">
          <EcoFold
            icon="qr_code_2"
            title="Mã QR nhận JOY"
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
                  Lấy mã mới
                </button>
                <p className="save-e-note">
                  Đưa mã này cho người chuyển JOY cho bạn. Mã có hạn khoảng 2 phút — quá hạn thì bấm
                  “Lấy mã mới”.
                </p>
              </div>
            ) : null)}
          </EcoFold>

          <EcoFold
            icon="event_available"
            title="Điểm danh nhận JOY"
            hint="Mỗi ngày một lần"
            load={() => apiFetch("/checkin/status")}
          >
            {({ data, setData }) => (data ? (
              <div className="save-e-row">
                <div>
                  <strong>{data.canClaimToday ? "Hôm nay chưa điểm danh" : "Hôm nay đã điểm danh"}</strong>
                  <small>Chuỗi liên tiếp: {data.consecutiveDays || 0} ngày</small>
                </div>
                <button
                  type="button"
                  className="save-e-btn"
                  disabled={!data.canClaimToday}
                  onClick={async () => {
                    try {
                      const result = await apiFetch("/checkin/claim", { method: "POST" });
                      notify.success(`Đã nhận ${result.totalReward} JOY.`);
                      bumpBalance(result.totalReward);
                      setData({ ...data, canClaimToday: false, consecutiveDays: result.consecutiveDays });
                    } catch (error) {
                      notify.error(error.message || "Điểm danh không thành công.");
                    }
                  }}
                >
                  Điểm danh
                </button>
              </div>
            ) : null)}
          </EcoFold>

          <EcoFold
            icon="receipt_long"
            title="Lịch sử giao dịch"
            hint="10 dòng gần nhất"
            load={() => apiFetch("/joy/history?limit=10").then((data) => data.transactions || [])}
          >
            {({ data }) => (data?.length ? data.map((tx) => (
              <div className="save-e-row" key={tx._id}>
                <div>
                  <strong>{tx.description || tx.source}</strong>
                  <small>{shortDate(tx.createdAt)}</small>
                </div>
                <span className={tx.amount > 0 ? "save-e-strong-green" : "save-e-strong-blue"}>
                  {money(tx.amount)}
                </span>
              </div>
            )) : data ? <p className="save-e-note">Chưa có giao dịch nào.</p> : null)}
          </EcoFold>
        </div>
      </section>

      {/* ── Chuyển JOY ── */}
      <section className="save-e-section" aria-labelledby="eco-transfer">
        <h2 id="eco-transfer">Chuyển JOY</h2>
        <form className="save-e-card" onSubmit={submitTransfer}>
          <label className="save-e-field">
            <span>Số điện thoại người nhận</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label className="save-e-field">
            <span>Số JOY</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </label>
          <label className="save-e-field">
            <span>Mã PIN giao dịch</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={form.pin}
              onChange={(event) => setForm({ ...form, pin: event.target.value })}
            />
          </label>
          <button type="submit" className="save-e-btn save-e-btn--wide" disabled={sending}>
            {sending ? "Đang chuyển…" : "Chuyển JOY"}
          </button>
        </form>
      </section>

      {/* ── Sửa thông tin ── */}
      <section className="save-e-section" aria-labelledby="eco-info">
        <h2 id="eco-info">Thông tin cá nhân</h2>
        <form className="save-e-card" onSubmit={saveInfo}>
          <label className="save-e-field">
            <span>Tên hiển thị</span>
            <input
              type="text"
              autoComplete="name"
              value={info.displayName}
              onChange={(event) => setInfo({ ...info, displayName: event.target.value })}
            />
          </label>
          <label className="save-e-field">
            <span>Số điện thoại</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={info.phone}
              onChange={(event) => setInfo({ ...info, phone: event.target.value })}
            />
          </label>
          <label className="save-e-field">
            <span>Trường / đơn vị</span>
            <input
              type="text"
              value={info.school}
              onChange={(event) => setInfo({ ...info, school: event.target.value })}
            />
          </label>
          <button type="submit" className="save-e-btn save-e-btn--wide" disabled={savingInfo || !bio?._id}>
            {savingInfo ? "Đang lưu…" : "Lưu thông tin"}
          </button>
          <p className="save-e-note">
            Ảnh đại diện, ảnh bìa và giao diện trang cá nhân chỉnh ở chế độ thường —
            chúng là phần tải ảnh nặng nhất nên không đưa vào đây.
          </p>
        </form>
      </section>

      <EcoRadio />
      <EcoGames onJoyChange={bumpBalance} />

      {/* ── Cài đặt cơ bản ── */}
      <section className="save-e-section" aria-labelledby="eco-settings">
        <h2 id="eco-settings">Cài đặt</h2>
        <div className="save-e-card">
          <div className="save-e-row">
            <div>
              <strong>Đăng xuất</strong>
              <small>{session?.email}</small>
            </div>
            <button type="button" className="save-e-btn save-e-btn--plain" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </div>
        <p className="save-e-note">
          Bật/tắt và mức “tự động” nằm ở tab Xanh. Đang tắt trong chế độ này: trợ lý AI, bản đồ,
          cửa hàng, kho ứng dụng, hiệu ứng nền động và mọi lượt gọi máy chủ lặp lại theo chu kỳ.
        </p>
      </section>
    </>
  );
}
