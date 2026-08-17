import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { MembershipFactory } from "../../../models/membershipTier";
import CardPattern from "./CardPattern";

/**
 * Thẻ thành viên Hugo — dựng theo giải phẫu của một tấm thẻ THẬT, hai mặt lật
 * được.
 *
 *   Mặt trước: tên phát hành · hạng · tiến trình lên hạng · số dư · chủ thẻ ·
 *              mã thẻ.
 *   Mặt sau:   dải từ đen · quy định sử dụng · ô chữ ký.
 *
 * CHẠM VÀO THẺ để lật. Trước đây mỗi mặt đeo một nút tròn nhỏ (••• và ✕) chỉ để
 * lật — hai chấm xám lửng lơ ở góc thẻ, mà bản thân tấm thẻ đã là vùng chạm to
 * nhất màn hình.
 *
 * Không vẽ chip EMV và sóng contactless: thẻ này không quẹt ở đâu cả, vẽ vào chỉ
 * là đạo cụ. Vạch tiến trình lên hạng nằm sát mép dưới thẻ, thay cho một thanh
 * rời phía dưới cùng một dòng chữ nữa.
 *
 * Màu và hoạ tiết lấy từ `models/membershipTier.js`; `tier` là thẻ đang xem (có
 * thể là hạng chưa mở, để xem trước), không truyền thì lấy hạng hiện tại.
 */

/** Mã giới thiệu đọc như số thẻ: tách nhóm 4 ký tự. */
const groupCode = (code) => (code || "").replace(/(.{4})/g, "$1 ").trim();

/** Hạt nhám phủ mặt thẻ — nhựa mờ, không phải kính bóng. Nhiễu vẽ bằng
 *  feTurbulence ngay trong data URI: vài trăm byte, không thêm file ảnh nào. */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">'
  + '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter>'
  + '<rect width="140" height="140" filter="url(#n)"/></svg>',
)}")`;

export default function JoyCard({
  referralCount = 0,
  referralCode = "",
  displayName = "",
  email = "",
  qrValue = "",
  onCopyReferral,
  tier: tierProp = null,
  progress = null,
}) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  const tier = tierProp || MembershipFactory.getCurrentTier(referralCount);
  const unlocked = tier.isUnlocked(referralCount);
  const rawName = displayName || email?.split("@")[0] || t("memberPortal.navigation.memberFallback");
  const cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim();
  const darkCard = tier.id === "premium";
  const cardRules = t("memberPortal.joy.card.rules", { returnObjects: true });

  // `container-type: inline-size` biến mặt thẻ thành mốc đo: mọi cỡ chữ dưới đây
  // tính bằng `cqw` nên thẻ to nhỏ theo màn hình mà TỈ LỆ giữ nguyên. Cỡ px cố
  // định thì thẻ trên máy tính bảng thành một tấm thẻ đầy chữ li ti.
  const faceClass =
    `absolute inset-0 flex flex-col overflow-hidden rounded-[18px] [container-type:inline-size]`
    + ` [backface-visibility:hidden] ${tier.textClass}`;
  const faceStyle = {
    background: tier.cardBgStyle,
    // Bóng đổ hai tầng: một tầng sát mép để thấy cạnh thẻ, một tầng loang xa để
    // thẻ nằm TRÊN mặt giấy chứ không in vào giấy. Hai tầng inset là cạnh vát:
    // mép trên bắt sáng, mép dưới đổ bóng — thẻ dày lên chứ không phẳng lì.
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.20),"
      + " 0 1px 2px rgba(16,24,40,0.14), 0 12px 28px -8px rgba(16,24,40,0.30)",
  };

  // Chữ KHẮC CHÌM: nét tối đè lên mặt thẻ, gờ sáng hắt ngay bên dưới — mắt đọc
  // ra một rãnh chìm chứ không phải chữ in lên trên.
  const engraved = {
    color: darkCard ? "rgba(245,226,180,0.50)" : "rgba(23,32,48,0.42)",
    textShadow: darkCard
      ? "0 1px 0 rgba(255,255,255,0.12), 0 -1px 1px rgba(0,0,0,0.85)"
      : "0 1px 0 rgba(255,255,255,0.85), 0 -1px 1px rgba(0,0,0,0.28)",
  };
  // Rãnh kẻ dưới tên hạng: cùng thủ pháp, một nét chìm + một gờ sáng.
  const groove = {
    background: darkCard ? "rgba(0,0,0,0.55)" : "rgba(23,32,48,0.20)",
    boxShadow: darkCard ? "0 1px 0 rgba(255,255,255,0.10)" : "0 1px 0 rgba(255,255,255,0.75)",
  };

  const flip = () => setFlipped((v) => !v);

  return (
    <div
      className="w-full cursor-pointer [perspective:1500px]"
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped
        ? t("memberPortal.joy.card.flipFront")
        : t("memberPortal.joy.card.flipRules")}
      onClick={flip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          flip();
        }
      }}
    >
      <div
        className={`relative aspect-[1.586/1] w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* ── MẶT TRƯỚC ─────────────────────────────────────────────────── */}
        <div className={faceClass} style={faceStyle} aria-hidden={flipped}>
          <CardPattern kind={tier.pattern} />
          {/* Vệt sáng chéo — mặt nhựa bóng bắt ánh sáng. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(112deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.06) 34%, rgba(255,255,255,0) 52%)",
            }}
            aria-hidden="true"
          />
          {/* Lớp nhám phủ toàn mặt thẻ */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.10]"
            style={{ backgroundImage: GRAIN }}
            aria-hidden="true"
          />

          {/* BỐ CỤC: hai cột. Cột trái là toàn bộ chữ, xếp ba tầng đều nhau —
              hiệu phát hành trên, tên hạng khắc chìm ở giữa, hai ô thông tin
              dưới. Cột phải chỉ có MỘT vật: mã QR, canh giữa theo chiều dọc nên
              nằm đúng đường ngang với tên hạng. Trước đây ba dải chữ nằm rời
              nhau, nửa phải trên bỏ trống nên thẻ trông lệch. */}
          <div className="relative flex h-full items-stretch gap-[5%] p-[5.5%]">
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <span className="text-[3.2cqw] font-semibold uppercase tracking-[0.22em] opacity-70">Hugo Studio</span>

              {/* Tên hạng — vai chính của tấm thẻ, khắc chìm vào mặt nhựa. */}
              <div className="min-w-0">
                <span className="block truncate text-[7cqw] font-bold uppercase leading-none tracking-[0.09em]" style={engraved}>
                  {tier.name}
                </span>
                {unlocked ? (
                  // Rãnh kẻ mảnh dưới tên: cùng thủ pháp khắc, để tên có chân
                  // đứng thay vì lơ lửng giữa khoảng trống.
                  <span className="mt-[3.4%] block h-px w-[40%]" style={groove} aria-hidden="true" />
                ) : (
                  <span className="mt-[3.4%] block text-[2.9cqw] uppercase tracking-[0.12em] opacity-60">
                    {t("memberPortal.joy.card.referralsNeeded", {
                      count: tier.getReferralsNeeded(referralCount),
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-end gap-[8%]">
                <div className="min-w-0">
                  <span className="block text-[2.7cqw] uppercase tracking-[0.14em] opacity-55">{t("memberPortal.joy.card.cardholder")}</span>
                  <span className="block truncate text-[3.9cqw] font-semibold uppercase tracking-wide">{cleanName}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onCopyReferral?.(); }}
                  className="min-w-0 text-left transition-opacity active:opacity-60"
                  title={t("memberPortal.joy.card.copyCode")}
                >
                  <span className="block text-[2.7cqw] uppercase tracking-[0.14em] opacity-55">{t("memberPortal.joy.card.cardCode")}</span>
                  <span className="block truncate font-mono text-[3.9cqw] font-semibold tracking-[0.14em]">
                    {groupCode(referralCode) || "—"}
                  </span>
                </button>
              </div>
            </div>

            {/* Mã QR trang Bio — vật duy nhất của cột phải, nổi trên mặt thẻ nhờ
                một tầng bóng mảnh, như miếng dán bạch kim. */}
            <div className="flex shrink-0 items-center">
              {unlocked && qrValue ? (
                <span
                  className="block w-[21cqw] rounded-[9px] bg-white p-[1.4cqw] leading-none"
                  style={{ boxShadow: "0 1px 3px rgba(16,24,40,0.28)" }}
                >
                  <QRCodeSVG className="h-auto w-full" value={qrValue} size={128} level="M" bgColor="#ffffff" fgColor="#000000" />
                </span>
              ) : (
                <span className="flex aspect-square w-[21cqw] items-center justify-center rounded-[9px] bg-current/10">
                  <span className="material-symbols-outlined text-[7cqw] opacity-50" aria-hidden="true">
                    {unlocked ? "qr_code_2" : "lock"}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Vạch tiến trình lên hạng, chạy sát mép dưới thẻ. Trước đây nó là
              một thanh rời nằm dưới thẻ kèm thêm một dòng chữ — hai phần tử nữa
              trên một trang vốn đã thưa. */}
          {progress?.nextTier && (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-current/15" aria-hidden="true">
              <div className="h-full bg-current opacity-60" style={{ width: `${progress.progressPct}%` }} />
            </div>
          )}
        </div>

        {/* ── MẶT SAU ───────────────────────────────────────────────────── */}
        <div className={`${faceClass} [transform:rotateY(180deg)]`} style={faceStyle} aria-hidden={!flipped}>
          <CardPattern kind={tier.pattern} />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.10]"
            style={{ backgroundImage: GRAIN }}
            aria-hidden="true"
          />

          {/* Dải từ — chi tiết nhận diện mặt sau của mọi tấm thẻ. */}
          <div
            className="relative mt-[7%] h-[16%] w-full shrink-0"
            style={{ background: darkCard ? "#05070B" : "#1C2028" }}
            aria-hidden="true"
          />

          <div className="relative flex min-h-0 flex-1 flex-col p-[5.5%] pt-[3.5%]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
              {t("memberPortal.joy.card.usageRules")}
            </span>

            <ul className="mt-1.5 space-y-[3px]">
              {(Array.isArray(cardRules) ? cardRules : []).map((rule) => (
                <li key={rule} className="flex gap-1.5 text-[10.5px] leading-snug opacity-85">
                  <span className="mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
                  <span className="min-w-0">{rule}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-end justify-between gap-3">
              {/* Ô chữ ký của thẻ thật — ở đây là chỗ ghi mã thẻ. */}
              <span
                className="flex h-[26px] min-w-0 flex-1 items-center rounded-[3px] px-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-[#1C2028]"
                style={{ background: "rgba(255,255,255,0.82)" }}
              >
                <span className="truncate">{groupCode(referralCode) || "—"}</span>
              </span>
              <span className="shrink-0 text-[9px] uppercase tracking-[0.14em] opacity-55">
                hugowishpax.studio
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { JoyCard };
