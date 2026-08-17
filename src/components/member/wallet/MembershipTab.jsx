import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { MembershipFactory } from "../../../models/membershipTier";

// Tab Membership — thẻ thành viên và đặc quyền theo hạng thẻ.
//
// Thẻ là thẻ MÀU gốc (`MemberCardStack`), không phải bản phẳng: hạng thẻ có bảng
// màu riêng trong `membershipTier.js` (cardBgStyle) và đó là nhận diện của hạng.
// Đây là NGOẠI LỆ có chủ đích của quy ước icon/màu đơn sắc, giống mascot ở trang
// giới thiệu.
//
// Mã QR nằm NGAY TRÊN THẺ, trỏ tới trang Bio công khai — khác mã QR chuyển JOY
// trong ví (mã đó là token HMAC có hạn). Cũng là mã sẽ in lên thẻ vật lý.
//
// Đặc quyền lấy thẳng từ `MembershipFactory`: thêm hạng hay sửa quyền lợi trong
// model là tab này đổi theo, không chép tay danh sách nào.
const MemberCardStack = lazy(() => import("../card/MemberCardStack"));

export default function MembershipTab({
  bio, publicLink, referralCount = 0, referralCode, onCopyReferral,
}) {
  const { t } = useTranslation();
  const { currentTier, nextTier, progressPct, referralsNeeded } =
    MembershipFactory.calculateProgressDetails(referralCount);

  // Thẻ đang lướt tới — mặc định là hạng của bạn.
  const [viewTier, setViewTier] = useState(currentTier);
  const viewOwned = referralCount >= viewTier.minReferrals;

  return (
    <div className="wal-ms">
      <Suspense fallback={<p className="wal-loading">…</p>}>
        <MemberCardStack
          referralCount={referralCount}
          qrValue={publicLink || ""}
          referralCode={referralCode || bio?.referralCode}
          displayName={bio?.displayName}
          email={bio?.email || bio?.contactEmail || ""}
          onCopyReferral={onCopyReferral}
          onTierChange={setViewTier}
        />
      </Suspense>

      {/* Tiến độ lên hạng — số thật từ model, không phải thanh trang trí */}
      <section className="wal-tier-progress">
        <div className="wal-tier-progress__head">
          <span>
            <small>{t("memberPortal.walletApp.currentTier")}</small>
            <strong style={{ color: currentTier?.colorHex }}>{currentTier?.name}</strong>
          </span>
          {nextTier && (
            <span className="wal-tier-progress__next">
              <small>{t("memberPortal.walletApp.nextTier")}</small>
              <strong>{nextTier.name}</strong>
            </span>
          )}
        </div>
        <div className="wal-tier-progress__bar">
          <div style={{ width: `${Math.min(100, progressPct || 0)}%` }} />
        </div>
        <p className="wal-tier-progress__hint">
          {nextTier
            ? t("memberPortal.walletApp.tierNeed", { count: referralsNeeded, tier: nextTier.name })
            : t("memberPortal.walletApp.tierTop")}
        </p>
      </section>

      {/* Đặc quyền của ĐÚNG tấm thẻ đang xem — lướt thẻ là đổi danh sách này,
          nên không cần một danh sách gấp liệt kê cả năm hạng cùng lúc. */}
      <h2 className="wal-title">{t("memberPortal.walletApp.tierPerks")}</h2>
      <section className="wal-perks">
        <div className="wal-perks__head">
          <span className="wal-tier__dot" style={{ background: viewTier.colorHex }} aria-hidden="true" />
          <span className="wal-tier__name">
            <strong>{viewTier.name}</strong>
            <small>
              {viewTier.minReferrals === 0
                ? t("memberPortal.walletApp.tierDefault")
                : t("memberPortal.walletApp.tierFrom", { count: viewTier.minReferrals })}
            </small>
          </span>
          <span className={`wal-tier__state${viewOwned ? " is-owned" : ""}`}>
            {viewOwned ? t("memberPortal.walletApp.tierOwned") : t("memberPortal.walletApp.tierLocked")}
          </span>
        </div>
        <ul>
          {viewTier.privileges.map((perk) => (
            <li key={perk.id}>
              <span className="material-symbols-outlined" aria-hidden="true">{perk.icon || "check"}</span>
              <span>
                <strong>{perk.title}</strong>
                {perk.detail && <small>{perk.detail}</small>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
