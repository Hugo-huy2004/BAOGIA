import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JoyCard from "./JoyCard";
import { MembershipFactory } from "../../../models/membershipTier";
import { useTranslation } from "react-i18next";

/**
 * Thẻ thành viên + thanh tiến trình lên hạng.
 *
 * Vuốt ngang (hoặc bấm chấm tròn) để xem màu thẻ của từng hạng — kể cả hạng
 * chưa mở, vì nhìn thấy tấm thẻ mình sắp có mới là lý do để mời thêm bạn.
 * Tiến trình lên hạng vẽ ngay TRÊN thẻ (xem JoyCard), không còn thanh rời phía
 * dưới, và chỉ hiện trên đúng thẻ của người dùng chứ không đổi theo thẻ đang
 * xem: đó là số liệu, không phải ảnh minh hoạ.
 */
export default function MemberCardStack({
  referralCount = 0,
  referralCode = "",
  displayName = "",
  email = "",
  qrValue = "",
  onCopyReferral,
  onTierChange,
}) {
  const { t } = useTranslation();
  const tiers = MembershipFactory.getAllTiers();
  const { currentTier, nextTier, progressPct, referralsNeeded } =
    MembershipFactory.calculateProgressDetails(referralCount);

  const currentIndex = Math.max(0, tiers.findIndex((t) => t.id === currentTier.id));
  const [index, setIndex] = useState(currentIndex);
  const tier = tiers[index];

  // Thẻ đang xem quyết định danh sách đặc quyền hiện bên dưới — lướt thẻ là đổi
  // đặc quyền, không phải mở thêm một danh sách gấp nữa.
  useEffect(() => { onTierChange?.(tier); }, [tier, onTierChange]);

  const step = (delta) => setIndex((i) => Math.min(tiers.length - 1, Math.max(0, i + delta)));

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={tier.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.x < -40 || velocity.x < -300) step(1);
            if (offset.x > 40 || velocity.x > 300) step(-1);
          }}
          className="touch-pan-y"
        >
          <JoyCard
            tier={tier}
            referralCount={referralCount}
            qrValue={qrValue}
            referralCode={referralCode}
            displayName={displayName}
            email={email}
            onCopyReferral={onCopyReferral}
            // Tiến trình chỉ vẽ trên THẺ CỦA BẠN; xem trước hạng khác thì tấm
            // thẻ đó không nói gì về tiến trình của bạn cả.
            progress={tier.id === currentTier.id ? { nextTier, progressPct, referralsNeeded } : null}
          />
        </motion.div>
      </AnimatePresence>

      {/* Chấm chọn hạng: mỗi chấm mang đúng màu của hạng đó, nên nhìn hàng chấm
          là đã thấy được dải màu — không cần mở từng thẻ. */}
      <div className="flex items-center justify-center gap-2">
        {tiers.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={t("memberPortal.joy.card.viewTier", { tier: item.name })}
            aria-current={i === index ? "true" : undefined}
            className="flex h-9 w-7 items-center justify-center"
          >
            <span
              className={`rounded-full transition-all ${i === index ? "h-2.5 w-5" : "h-2.5 w-2.5 opacity-45"}`}
              style={{ background: item.colorHex }}
            />
          </button>
        ))}
      </div>

    </div>
  );
}
