/**
 * OOP Membership Tier Models & Factory
 * Manages member privileges, threshold calculation, card themes, and visual styles.
 *
 * Bảng màu thẻ (2026-08): pastel nhạt + chữ cùng tông đậm, hạng đỉnh là nền mực
 * + chữ vàng. Bộ cũ là gradient neon bão hoà với chữ trắng — hạng Gold gần như
 * không đọc nổi, và năm hạng là năm bảng màu rời rạc chứ không thành một dải.
 *
 * Mỗi hạng chỉ còn đúng những token thẻ THẬT SỰ dùng tới. Bảy token cũ
 * (neonGlow, chipGradient, actionBtnStyle, ringsColor, joyTextColor,
 * accentColorClass, secondaryColorHex, badgeTitle) không còn chỗ nào đọc sau khi
 * thẻ bỏ chip EMV và vòng tròn đồng tâm — đã xoá.
 */

export class BaseMembershipTier {
  constructor({
    id,
    name,
    colorHex,
    cardBgStyle,
    textClass,
    pillStyle,
    borderColor,
    pattern,
    minReferrals,
    privileges = [],
    description = ""
  }) {
    this.id = id;
    this.name = name;
    this.colorHex = colorHex;
    this.cardBgStyle = cardBgStyle;
    this.textClass = textClass;
    this.pillStyle = pillStyle;
    this.borderColor = borderColor;
    /** Hoạ tiết nền riêng của hạng — xem CardPattern trong card/JoyCard.jsx. */
    this.pattern = pattern;
    this.minReferrals = minReferrals;
    this.privileges = privileges;
    this.description = description;
  }

  isUnlocked(referralCount = 0) {
    return (referralCount || 0) >= this.minReferrals;
  }

  getProgress(referralCount = 0, nextTier = null) {
    const currentCount = referralCount || 0;
    if (currentCount < this.minReferrals) return 0;
    if (!nextTier) return 100; // Max tier reached

    const range = nextTier.minReferrals - this.minReferrals;
    const progressInTier = currentCount - this.minReferrals;
    return Math.min(100, Math.max(0, Math.floor((progressInTier / range) * 100)));
  }

  getReferralsNeeded(referralCount = 0) {
    const currentCount = referralCount || 0;
    if (currentCount >= this.minReferrals) return 0;
    return this.minReferrals - currentCount;
  }

  getPrivileges() {
    return this.privileges;
  }
}

// 1. MemberShip (0 giới thiệu) — bạc ngọc trai
export class MemberTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "membership",
      name: "MemberShip",
      colorHex: "#8FA3BC",
      cardBgStyle: "linear-gradient(135deg, #F0F3F8 0%, #CFD8E4 52%, #A9B6C8 100%)",
      textClass: "text-slate-800",
      pillStyle: "bg-slate-900/[0.08] text-slate-800",
      borderColor: "#9FAFC4",
      pattern: "guilloche",
      minReferrals: 0,
      description: "Đặc quyền cơ bản dành cho thành viên mới tạo tài khoản",
      privileges: [
        { id: "p1", title: "Tài khoản Hugo Studio chuẩn", icon: "badge" },
        { id: "p2", title: "Tích điểm JOY khi hoàn thành nhiệm vụ", icon: "stars" }
      ]
    });
  }
}

// 2. Silver (2 giới thiệu) — xanh trời
export class SilverTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "silver",
      name: "Silver",
      colorHex: "#2FA8FF",
      cardBgStyle: "linear-gradient(135deg, #DCEEFF 0%, #A6D4FF 52%, #74BEFF 100%)",
      textClass: "text-sky-900",
      pillStyle: "bg-sky-950/10 text-sky-900",
      borderColor: "#7FC2FF",
      pattern: "waves",
      minReferrals: 2,
      description: "Dành cho thành viên đã giới thiệu 2 người mới",
      privileges: [
        { id: "s1", title: "Tặng Hugo Arcade 7 ngày", icon: "sports_esports", detail: "Miễn phí 7 ngày trải nghiệm Hugo Arcade" },
        { id: "s2", title: "Tặng 500 JOY (Voucher)", icon: "confirmation_number", detail: "Nhận voucher 500 JOY vào ví" }
      ]
    });
  }
}

// 3. Gold (5 giới thiệu) — cam đào
export class GoldTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "gold",
      name: "Gold",
      colorHex: "#FF9F1A",
      cardBgStyle: "linear-gradient(135deg, #FFF0C9 0%, #FFD183 52%, #FFB347 100%)",
      textClass: "text-amber-900",
      pillStyle: "bg-amber-950/10 text-amber-900",
      borderColor: "#FFC966",
      pattern: "rays",
      minReferrals: 5,
      description: "Dành cho thành viên đã giới thiệu 5 người mới",
      privileges: [
        { id: "g1", title: "Tặng Hugo Arcade 1 tháng", icon: "sports_esports", detail: "1 tháng VIP Hugo Arcade" },
        { id: "g2", title: "Tặng 1.300 JOY (Voucher)", icon: "confirmation_number", detail: "Nhận voucher 1.300 JOY" },
        { id: "g3", title: "Tặng voucher 14 ngày duy trì tài khoản", icon: "event_available", detail: "Gia hạn duy trì tài khoản 14 ngày" }
      ]
    });
  }
}

// 4. Diamond (15 giới thiệu) — tím lavender
export class DiamondTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "diamond",
      name: "Diamond",
      colorHex: "#9B5CFF",
      cardBgStyle: "linear-gradient(135deg, #F0E4FF 0%, #D3B4FF 52%, #B189FF 100%)",
      textClass: "text-violet-900",
      pillStyle: "bg-violet-950/10 text-violet-900",
      borderColor: "#BC93FF",
      pattern: "facets",
      minReferrals: 15,
      description: "Dành cho thành viên đã giới thiệu 15 người mới",
      privileges: [
        { id: "d1", title: "Tặng Hugo Arcade 6 tháng", icon: "sports_esports", detail: "6 tháng VIP Hugo Arcade" },
        { id: "d2", title: "Tặng 3.500 JOY (Voucher)", icon: "confirmation_number", detail: "Nhận voucher 3.500 JOY" },
        { id: "d3", title: "Tặng voucher 90 ngày duy trì tài khoản", icon: "event_available", detail: "Gia hạn duy trì tài khoản 90 ngày" }
      ]
    });
  }
}

// 5. Premium (50 giới thiệu) — mực đêm + vàng, hạng đỉnh nên phá tông pastel
export class PremiumTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "premium",
      name: "Premium",
      colorHex: "#F0CE84",
      cardBgStyle: "linear-gradient(135deg, #333A4D 0%, #1D2331 52%, #0D1015 100%)",
      textClass: "text-[#F5E2B4]",
      pillStyle: "bg-white/[0.14] text-[#F5E2B4]",
      borderColor: "#7A6947",
      pattern: "stars",
      minReferrals: 50,
      description: "Dành cho thành viên đã giới thiệu 50 người mới",
      privileges: [
        { id: "pr1", title: "Tặng Hugo Arcade 6 tháng", icon: "sports_esports", detail: "6 tháng VIP Hugo Arcade" },
        { id: "pr2", title: "Tặng 20.000 JOY (Voucher)", icon: "confirmation_number", detail: "Nhận voucher 20.000 JOY siêu cấp" },
        { id: "pr3", title: "Tặng voucher 1 năm duy trì tài khoản", icon: "event_available", detail: "Gia hạn duy trì 365 ngày" },
        { id: "pr4", title: "Quà Secret từ Hugo Studio", icon: "card_giftcard", detail: "Phần quà bí mật độc quyền từ Founder" }
      ]
    });
  }
}

// Factory to query and manage tiers using OOP pattern
export class MembershipFactory {
  static tiers = [
    new MemberTier(),
    new SilverTier(),
    new GoldTier(),
    new DiamondTier(),
    new PremiumTier()
  ];

  static getAllTiers() {
    return this.tiers;
  }

  static getCurrentTier(referralCount = 0) {
    const count = Number(referralCount) || 0;
    let activeTier = this.tiers[0];
    for (const tier of this.tiers) {
      if (count >= tier.minReferrals) {
        activeTier = tier;
      }
    }
    return activeTier;
  }

  static getNextTier(referralCount = 0) {
    const count = Number(referralCount) || 0;
    for (const tier of this.tiers) {
      if (count < tier.minReferrals) {
        return tier;
      }
    }
    return null; // Already at top tier (Premium)
  }

  static getTierById(tierId) {
    return this.tiers.find((t) => t.id === tierId) || this.tiers[0];
  }

  static calculateProgressDetails(referralCount = 0) {
    const current = this.getCurrentTier(referralCount);
    const next = this.getNextTier(referralCount);
    const progressPct = current.getProgress(referralCount, next);
    const needed = next ? next.getReferralsNeeded(referralCount) : 0;

    return {
      currentTier: current,
      nextTier: next,
      progressPct,
      referralsNeeded: needed,
      referralCount: Number(referralCount) || 0
    };
  }
}
