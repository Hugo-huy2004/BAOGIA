export const RELIGION_LABELS = {
  vi: {
    buddhism_theravada: "Phật giáo Theravāda (Phật giáo Nguyên thủy)",
    buddhism_mahayana: "Phật giáo Mahāyāna (Phật giáo Đại thừa)",
    buddhism_vajrayana: "Phật giáo Vajrayāna (Phật giáo Kim Cương thừa)",
    buddhism_pure_land: "Phật giáo Tịnh Độ tông", buddhism_zen: "Phật giáo Thiền tông (Zen)",
    christianity_roman_catholic: "Kitô giáo – Công giáo Rôma",
    christianity_eastern_orthodox: "Kitô giáo – Chính Thống giáo Đông phương",
    christianity_oriental_orthodox: "Kitô giáo – Chính Thống giáo Cổ Đông phương",
    christianity_anglican: "Kitô giáo – Anh giáo", christianity_lutheran: "Kitô giáo – Giáo hội Luther",
    christianity_reformed_presbyterian: "Kitô giáo – Cải cách / Trưởng Lão",
    christianity_baptist: "Kitô giáo – Báp-tít", christianity_methodist: "Kitô giáo – Giám Lý",
    christianity_pentecostal: "Kitô giáo – Ngũ Tuần",
    christianity_seventh_day_adventist: "Kitô giáo – Cơ Đốc Phục Lâm",
    christianity_latter_day_saints: "Giáo hội Các Thánh hữu Ngày sau của Chúa Giê Su Ky Tô",
    christianity_jehovahs_witnesses: "Nhân Chứng Giê-hô-va",
    islam_sunni: "Hồi giáo Sunni", islam_shia: "Hồi giáo Shia", islam_ibadi: "Hồi giáo Ibadi",
    islam_ahmadiyya: "Hồi giáo Ahmadiyya", hinduism_vaishnavism: "Ấn Độ giáo – Vaishnavism",
    hinduism_shaivism: "Ấn Độ giáo – Shaivism", hinduism_shaktism: "Ấn Độ giáo – Shaktism",
    hinduism_smartism: "Ấn Độ giáo – Smartism", judaism_orthodox: "Do Thái giáo Chính thống",
    judaism_conservative_masorti: "Do Thái giáo Bảo thủ / Masorti", judaism_reform: "Do Thái giáo Cải cách",
    judaism_reconstructionist: "Do Thái giáo Tái thiết", sikhism: "Sikh giáo", jainism: "Kỳ Na giáo (Jainism)",
    bahai_faith: "Đức tin Baháʼí", zoroastrianism: "Hỏa giáo (Zoroastrianism)", shinto: "Thần đạo (Shintō)",
    taoism: "Đạo giáo (Taoism / Daoism)", confucianism: "Nho giáo", caodaism: "Đạo Cao Đài",
    hoahao_buddhism: "Phật giáo Hòa Hảo", tenrikyo: "Tenrikyō", cheondoism: "Cheondoism (Thiên Đạo giáo)",
    rastafari: "Rastafari", self_describe: "Tự ghi tên tôn giáo / hệ phái chính xác",
    none: "Không theo tôn giáo", prefer_not_to_say: "Không muốn tiết lộ",
  },
  en: {
    buddhism_theravada: "Theravāda Buddhism", buddhism_mahayana: "Mahāyāna Buddhism",
    buddhism_vajrayana: "Vajrayāna Buddhism", buddhism_pure_land: "Pure Land Buddhism", buddhism_zen: "Zen Buddhism",
    christianity_roman_catholic: "Christianity — Roman Catholicism",
    christianity_eastern_orthodox: "Christianity — Eastern Orthodoxy",
    christianity_oriental_orthodox: "Christianity — Oriental Orthodoxy",
    christianity_anglican: "Christianity — Anglicanism", christianity_lutheran: "Christianity — Lutheranism",
    christianity_reformed_presbyterian: "Christianity — Reformed / Presbyterian",
    christianity_baptist: "Christianity — Baptist", christianity_methodist: "Christianity — Methodism",
    christianity_pentecostal: "Christianity — Pentecostalism",
    christianity_seventh_day_adventist: "Christianity — Seventh-day Adventism",
    christianity_latter_day_saints: "The Church of Jesus Christ of Latter-day Saints",
    christianity_jehovahs_witnesses: "Jehovah's Witnesses", islam_sunni: "Sunni Islam", islam_shia: "Shia Islam",
    islam_ibadi: "Ibadi Islam", islam_ahmadiyya: "Ahmadiyya Islam", hinduism_vaishnavism: "Hinduism — Vaishnavism",
    hinduism_shaivism: "Hinduism — Shaivism", hinduism_shaktism: "Hinduism — Shaktism",
    hinduism_smartism: "Hinduism — Smartism", judaism_orthodox: "Orthodox Judaism",
    judaism_conservative_masorti: "Conservative / Masorti Judaism", judaism_reform: "Reform Judaism",
    judaism_reconstructionist: "Reconstructionist Judaism", sikhism: "Sikhism", jainism: "Jainism",
    bahai_faith: "Baháʼí Faith", zoroastrianism: "Zoroastrianism", shinto: "Shintō",
    taoism: "Taoism / Daoism", confucianism: "Confucianism", caodaism: "Caodaism",
    hoahao_buddhism: "Hòa Hảo Buddhism", tenrikyo: "Tenrikyō", cheondoism: "Cheondoism",
    rastafari: "Rastafari", self_describe: "Enter the exact religion / denomination",
    none: "No religion", prefer_not_to_say: "Prefer not to say",
  },
};

const languageKey = (language) => String(language || "vi").toLowerCase().startsWith("vi") ? "vi" : "en";

export function countryDisplayName(code, language = "vi") {
  if (!code) return "";
  try {
    return new Intl.DisplayNames([language], { type: "region" }).of(String(code).toUpperCase()) || code;
  } catch {
    return code;
  }
}

export function religionDisplayName(value, language = "vi") {
  if (!value) return "";
  if (String(value).startsWith("self:")) return String(value).slice(5).trim();
  return RELIGION_LABELS[languageKey(language)][value] || value;
}

export function profileAnswerDisplayName(value, language = "vi") {
  if (!value) return "";
  if (String(value).startsWith("self:")) return String(value).slice(5).trim();
  if (value === "prefer_not_to_say") return languageKey(language) === "vi" ? "Không muốn tiết lộ" : "Prefer not to say";
  return value;
}

export function formatFullAddress(profile, language = "vi") {
  const parts = [
    profile?.exactAddress,
    profile?.locality,
    profile?.adminArea,
    countryDisplayName(profile?.countryCode, language),
  ].map((part) => String(part || "").trim()).filter(Boolean);

  return parts.filter((part, index) => {
    const normalized = part.toLocaleLowerCase(language);
    return !parts.slice(0, index).some((earlier) => earlier.toLocaleLowerCase(language).includes(normalized));
  }).join(", ");
}
