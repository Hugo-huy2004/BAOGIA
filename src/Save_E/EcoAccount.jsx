import { useEffect, useState } from "react";
import { getMemberSession, clearMemberSession } from "../services/authSession";
import { apiFetch } from "../services/api";
import { transferJoy } from "../services/joyApi";
import { notify } from "../lib/notify";
import memberService from "../services/classes/MemberService";
import { setEcoMode } from "./ecoMode";
import EcoRadio from "./EcoRadio";
import EcoGames from "./EcoGames";

// Gộp Ví JOY + Thẻ thành viên + Hoạt động + Tài khoản của chế độ thường về MỘT
// trang. Ở chế độ thường bốn tab đó gọi API riêng mỗi lần chuyển; ở đây chỉ có
// đúng MỘT lượt gọi lấy số dư khi mở trang, sau đó không gọi lại.

export default function EcoAccount({ onExitEco }) {
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
      <EcoGames onJoyChange={(delta) => setBalance((current) => (current == null ? current : current + delta))} />

      {/* ── Cài đặt cơ bản ── */}
      <section className="save-e-section" aria-labelledby="eco-settings">
        <h2 id="eco-settings">Cài đặt</h2>
        <div className="save-e-card">
          <div className="save-e-row">
            <div>
              <strong>Chế độ Bảo vệ môi trường</strong>
              <small>Nền tối, chữ to, không AI, gọi máy chủ tối thiểu.</small>
            </div>
            <button
              type="button"
              className="save-e-btn save-e-btn--plain"
              onClick={() => { setEcoMode(false); onExitEco(); }}
            >
              Tắt
            </button>
          </div>
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
          Đang tắt trong chế độ này: trợ lý AI, bản đồ, cửa hàng, kho ứng dụng,
          hiệu ứng nền động và mọi lượt gọi máy chủ lặp lại theo chu kỳ.
        </p>
      </section>
    </>
  );
}
