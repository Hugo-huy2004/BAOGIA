/**
 * OOP Membership Tier Models & Factory
 * Manages member privileges, threshold calculation, card themes, and visual styles.
 */

export class BaseMembershipTier {
  constructor({
    id,
    name,
    badgeTitle,
    colorHex,
    secondaryColorHex,
    cardBgStyle,
    neonGlow,
    neonBorder,
    textClass,
    accentColorClass,
    pillStyle,
    joyTextColor,
    chipGradient,
    actionBtnStyle,
    ringsColor,
    minReferrals,
    privileges = [],
    description = ""
  }) {
    this.id = id;
    this.name = name;
    this.badgeTitle = badgeTitle;
    this.colorHex = colorHex;
    this.secondaryColorHex = secondaryColorHex;
    this.cardBgStyle = cardBgStyle;
    this.neonGlow = neonGlow;
    this.neonBorder = neonBorder;
    this.textClass = textClass;
    this.accentColorClass = accentColorClass;
    this.pillStyle = pillStyle;
    this.joyTextColor = joyTextColor;
    this.chipGradient = chipGradient;
    this.actionBtnStyle = actionBtnStyle;
    this.ringsColor = ringsColor;
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

// 1. MemberShip Tier (0 Referrals - Warm Ivory Gold & Silk Pearl)
export class MemberTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "membership",
      name: "MemberShip",
      badgeTitle: "MEMBER",
      colorHex: "#F59E0B",
      secondaryColorHex: "#FEF3C7",
      cardBgStyle: "linear-gradient(135deg, #FFFDF0 0%, #FEF3C7 45%, #FDE68A 100%)",
      neonGlow: "0 10px 30px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.9)",
      neonBorder: "#F59E0B",
      textClass: "text-amber-950",
      accentColorClass: "text-amber-800",
      pillStyle: "bg-amber-950/10 border-amber-950/20 text-amber-950 font-bold backdrop-blur-md",
      joyTextColor: "text-amber-800 font-black",
      chipGradient: "linear-gradient(135deg, #FFF099 0%, #D4AF37 50%, #997A00 100%)",
      actionBtnStyle: "bg-amber-950 text-white hover:bg-black border-amber-950/30",
      ringsColor: "rgba(180, 83, 9, 0.14)",
      minReferrals: 0,
      description: "Đặc quyền cơ bản dành cho thành viên mới tạo tài khoản",
      privileges: [
        { id: "p1", title: "Tài khoản Hugo Studio chuẩn", icon: "badge" },
        { id: "p2", title: "Tích điểm JOY khi hoàn thành nhiệm vụ", icon: "stars" }
      ]
    });
  }
}

// 2. Silver Tier (2 Referrals - Electric Cyber Fuchsia Pink)
export class SilverTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "silver",
      name: "Silver",
      badgeTitle: "SILVER",
      colorHex: "#C026D3",
      secondaryColorHex: "#E024D6",
      cardBgStyle: "linear-gradient(135deg, #E024D6 0%, #C026D3 55%, #9333EA 100%)",
      neonGlow: "0 12px 35px rgba(192, 38, 211, 0.55), inset 0 0 25px rgba(255, 255, 255, 0.3)",
      neonBorder: "#F472B6",
      textClass: "text-white drop-shadow-xs",
      accentColorClass: "text-pink-100",
      pillStyle: "bg-white/20 border-white/35 text-white font-bold backdrop-blur-md",
      joyTextColor: "text-amber-300 font-black drop-shadow-xs",
      chipGradient: "linear-gradient(135deg, #FFE066 0%, #D4AF37 50%, #886600 100%)",
      actionBtnStyle: "bg-white/25 text-white hover:bg-white/35 border-white/40",
      ringsColor: "rgba(255, 255, 255, 0.18)",
      minReferrals: 2,
      description: "Dành cho thành viên đã giới thiệu 2 người mới",
      privileges: [
        { id: "s1", title: "Tặng Hugo Arcade 7 ngày", icon: "sports_esports", detail: "Miễn phí 7 ngày trải nghiệm Hugo Arcade" },
        { id: "s2", title: "Tặng 500 JOY (Voucher)", icon: "confirmation_number", detail: "Nhận voucher 500 JOY vào ví" }
      ]
    });
  }
}

// 3. Gold Tier (5 Referrals - High-Beam Champion Cyberpunk Gold)
export class GoldTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "gold",
      name: "Gold",
      badgeTitle: "GOLD",
      colorHex: "#EAB308",
      secondaryColorHex: "#FACC15",
      cardBgStyle: "linear-gradient(135deg, #EAB308 0%, #CA8A04 50%, #A16207 100%)",
      neonGlow: "0 12px 35px rgba(234, 179, 8, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.4)",
      neonBorder: "#FDE047",
      textClass: "text-white drop-shadow-xs",
      accentColorClass: "text-amber-100",
      pillStyle: "bg-white/20 border-white/35 text-white font-bold backdrop-blur-md",
      joyTextColor: "text-amber-200 font-black drop-shadow-xs",
      chipGradient: "linear-gradient(135deg, #FFF099 0%, #D4AF37 50%, #664E00 100%)",
      actionBtnStyle: "bg-white/25 text-white hover:bg-white/35 border-white/40",
      ringsColor: "rgba(255, 255, 255, 0.18)",
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

// 4. Diamond Tier (15 Referrals - Royal Ultra-Violet Magenta)
export class DiamondTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "diamond",
      name: "Diamond",
      badgeTitle: "DIAMOND",
      colorHex: "#7E22CE",
      secondaryColorHex: "#A855F7",
      cardBgStyle: "linear-gradient(135deg, #A855F7 0%, #7E22CE 50%, #581C87 100%)",
      neonGlow: "0 12px 35px rgba(126, 34, 206, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.3)",
      neonBorder: "#C084FC",
      textClass: "text-white drop-shadow-xs",
      accentColorClass: "text-purple-100",
      pillStyle: "bg-white/20 border-white/35 text-white font-bold backdrop-blur-md",
      joyTextColor: "text-amber-300 font-black drop-shadow-xs",
      chipGradient: "linear-gradient(135deg, #FFE066 0%, #D4AF37 50%, #664E00 100%)",
      actionBtnStyle: "bg-white/25 text-white hover:bg-white/35 border-white/40",
      ringsColor: "rgba(255, 255, 255, 0.18)",
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

// 5. Premium Tier (50 Referrals - Cyber Electric Lime Green)
export class PremiumTier extends BaseMembershipTier {
  constructor() {
    super({
      id: "premium",
      name: "Premium",
      badgeTitle: "PREMIUM",
      colorHex: "#15803D",
      secondaryColorHex: "#22C55E",
      cardBgStyle: "linear-gradient(135deg, #16A34A 0%, #15803D 50%, #14532D 100%)",
      neonGlow: "0 12px 35px rgba(21, 128, 61, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.3)",
      neonBorder: "#4ADE80",
      textClass: "text-white drop-shadow-xs",
      accentColorClass: "text-emerald-100",
      pillStyle: "bg-white/20 border-white/35 text-white font-bold backdrop-blur-md",
      joyTextColor: "text-amber-300 font-black drop-shadow-xs",
      chipGradient: "linear-gradient(135deg, #FFF099 0%, #D4AF37 50%, #4D3D00 100%)",
      actionBtnStyle: "bg-white/25 text-white hover:bg-white/35 border-white/40",
      ringsColor: "rgba(255, 255, 255, 0.18)",
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
