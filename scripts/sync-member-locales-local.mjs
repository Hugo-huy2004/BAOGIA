import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = path.join(ROOT, "src/i18n/locales");
const CHECKPOINT_DIR = path.join(os.tmpdir(), "hugo-member-i18n");
const MODEL = process.env.HUGO_TRANSLATION_MODEL || "qwen2.5:3b";
const OLLAMA_URL = process.env.HUGO_OLLAMA_URL || "http://127.0.0.1:11434";
const START_FRESH = process.env.HUGO_TRANSLATION_FRESH === "1";
const FINALIZE_PARTIAL = process.env.HUGO_TRANSLATION_FINALIZE_PARTIAL === "1";
const TARGETS = {
  zh: "Simplified Chinese for Mainland China",
  th: "Thai",
  ja: "Japanese",
  ko: "Korean",
  id: "Indonesian",
  es: "Spanish for Spain",
  fr: "French for France",
};
const CRITICAL_ACCOUNT_COPY = {
  zh: {
    "memberPortal.settings.account.bioTitle": "Hugo Bio 个人资料",
    "memberPortal.settings.account.bioDescription": "自定义你的外观、会员卡和社交链接",
    "memberPortal.settings.account.publicBio": "公开 Bio 页面",
    "memberPortal.settings.account.publicBioDescription": "打开你的公开 Bio 页面",
    "memberPortal.accountHub.done": "完成",
    "memberPortal.accountHub.documents.rightsTitle": "权利与访问",
    "memberPortal.accountHub.documents.privilegesTitle": "会员特权",
    "memberPortal.accountHub.documents.conditionsTitle": "会员权利与义务",
  },
  th: {
    "memberPortal.settings.account.bioTitle": "โปรไฟล์ Hugo Bio",
    "memberPortal.settings.account.bioDescription": "ปรับแต่งรูปลักษณ์ บัตรสมาชิก และลิงก์โซเชียลของคุณ",
    "memberPortal.settings.account.publicBio": "หน้า Bio สาธารณะ",
    "memberPortal.settings.account.publicBioDescription": "เปิดหน้า Bio สาธารณะของคุณ",
    "memberPortal.accountHub.done": "เสร็จสิ้น",
    "memberPortal.accountHub.documents.rightsTitle": "สิทธิและการเข้าถึง",
    "memberPortal.accountHub.documents.privilegesTitle": "สิทธิพิเศษสำหรับสมาชิก",
    "memberPortal.accountHub.documents.conditionsTitle": "สิทธิและหน้าที่ของสมาชิก",
  },
  ja: {
    "memberPortal.settings.account.bioTitle": "Hugo Bioプロフィール",
    "memberPortal.settings.account.bioDescription": "外観、会員カード、ソーシャルリンクをカスタマイズ",
    "memberPortal.settings.account.publicBio": "公開Bioページ",
    "memberPortal.settings.account.publicBioDescription": "公開Bioページを開く",
    "memberPortal.accountHub.done": "完了",
    "memberPortal.accountHub.documents.rightsTitle": "権利とアクセス",
    "memberPortal.accountHub.documents.privilegesTitle": "会員特典",
    "memberPortal.accountHub.documents.conditionsTitle": "会員の権利と義務",
  },
  ko: {
    "memberPortal.settings.account.bioTitle": "Hugo Bio 프로필",
    "memberPortal.settings.account.bioDescription": "외관, 회원 카드 및 소셜 링크 맞춤 설정",
    "memberPortal.settings.account.publicBio": "공개 Bio 페이지",
    "memberPortal.settings.account.publicBioDescription": "공개 Bio 페이지 열기",
    "memberPortal.accountHub.done": "완료",
    "memberPortal.accountHub.documents.rightsTitle": "권리 및 접근",
    "memberPortal.accountHub.documents.privilegesTitle": "회원 특전",
    "memberPortal.accountHub.documents.conditionsTitle": "회원의 권리와 의무",
  },
  id: {
    "memberPortal.settings.account.bioTitle": "Profil Hugo Bio",
    "memberPortal.settings.account.bioDescription": "Sesuaikan tampilan, kartu anggota, dan tautan sosial Anda",
    "memberPortal.settings.account.publicBio": "Halaman Bio publik",
    "memberPortal.settings.account.publicBioDescription": "Buka halaman Bio publik Anda",
    "memberPortal.accountHub.done": "Selesai",
    "memberPortal.accountHub.documents.rightsTitle": "Hak dan akses",
    "memberPortal.accountHub.documents.privilegesTitle": "Keistimewaan anggota",
    "memberPortal.accountHub.documents.conditionsTitle": "Hak dan kewajiban anggota",
  },
  es: {
    "memberPortal.settings.account.bioTitle": "Perfil de Hugo Bio",
    "memberPortal.settings.account.bioDescription": "Personaliza tu apariencia, tarjeta de miembro y enlaces sociales",
    "memberPortal.settings.account.publicBio": "Página Bio pública",
    "memberPortal.settings.account.publicBioDescription": "Abre tu página Bio pública",
    "memberPortal.accountHub.done": "Listo",
    "memberPortal.accountHub.documents.rightsTitle": "Derechos y acceso",
    "memberPortal.accountHub.documents.privilegesTitle": "Privilegios de miembro",
    "memberPortal.accountHub.documents.conditionsTitle": "Derechos y obligaciones de los miembros",
  },
  fr: {
    "memberPortal.settings.account.bioTitle": "Profil Hugo Bio",
    "memberPortal.settings.account.bioDescription": "Personnalisez votre apparence, votre carte de membre et vos liens sociaux",
    "memberPortal.settings.account.publicBio": "Page Bio publique",
    "memberPortal.settings.account.publicBioDescription": "Ouvrir votre page Bio publique",
    "memberPortal.accountHub.done": "Terminé",
    "memberPortal.accountHub.documents.rightsTitle": "Droits et accès",
    "memberPortal.accountHub.documents.privilegesTitle": "Privilèges des membres",
    "memberPortal.accountHub.documents.conditionsTitle": "Droits et obligations des membres",
  },
};
// Hand-written copy the compact local model cannot be trusted with (marketing
// blurbs, brand voice). Applied after generation, so a re-run never clobbers it.
const OVERRIDES = JSON.parse(await fs.readFile(path.join(ROOT, "scripts/locale-overrides.json"), "utf8"));
const MEMBER_ROOTS = [
  "aura", "memberPortal", "memberTabs", "utilities", "companion",
  "hugoPsy", "hugoCoderLearning", "arcadeGame", "arcadeIntro",
  "navbar",
];
// Public pages a visitor can reach before signing in. They used to fall back to
// English for every non-Vietnamese reader. The admin roots stay out: one
// operator reads them, and Vietnamese/English already covers that.
const PUBLIC_ROOTS = [
  "footer", "donationUI", "intro", "servicesPage", "faqPage",
  "bookingPage", "templatesPage", "loginPage", "customerPortal",
  "studentBenefitsPage", "paymentGateway", "userGuide", "studentPricing", "saveE",
];
const TRANSLATED_ROOTS = [...MEMBER_ROOTS, ...PUBLIC_ROOTS];
// Small batches are intentionally faster overall on compact local models:
// they obey the exact-array contract reliably and avoid expensive retries.
const MAX_CHUNK_CHARS = 1_000;
const MAX_CHUNK_ENTRIES = 10;

function flatten(value, parts = [], output = []) {
  if (typeof value === "string") output.push({ id: parts.join("."), text: value });
  else if (Array.isArray(value)) value.forEach((item, index) => flatten(item, [...parts, String(index)], output));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => flatten(item, [...parts, key], output));
  return output;
}

// The locale is seeded from a clone of the English dictionary, so every
// container already exists with the right shape. Guessing array-vs-object from
// the key turned the game id "2048" into a 2049-slot sparse array.
function setAtPath(target, dottedPath, value) {
  const parts = dottedPath.split(".");
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (cursor[part] == null) return;
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;
}

function chunkEntries(entries) {
  const chunks = [];
  let current = [];
  let size = 0;
  for (const entry of entries) {
    const nextSize = JSON.stringify(entry).length;
    if (current.length && (size + nextSize > MAX_CHUNK_CHARS || current.length >= MAX_CHUNK_ENTRIES)) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(entry);
    size += nextSize;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

// Prices, dates and counts are facts, not copy. Masking them alongside the
// interpolation tokens means a translation can never quietly restate 1.900.000
// as 1,900,000 — or invent a different number on the services page.
// Only money-shaped numbers are masked: a price such as 1.900.000 must survive
// verbatim, while masking every single digit filled short strings with markers
// the compact model then dropped, forcing endless retries.
// Tên thương hiệu đi cùng nhóm được bảo vệ. Model đã từng bẻ "Hugo" thành
// "ฮูจู"/"ホグー" hoặc bỏ hẳn ở 399 khoá — mask thì nó không còn cơ hội đụng vào.
// Bắt cả dạng ghép (HugoPSY, HugoArcade) bằng [A-Za-z]* ngay sau "Hugo", và
// "Hugo Studio" phải đứng TRƯỚC trong nhánh: bảo vệ mỗi "Hugo" thì model dịch
// nốt chữ "Studio" còn lại và cho ra "ホジスタ dio".
const PROTECTED = () => /Hugo\s+(?:Studio|Arcade|Team|Profile|Radio|Store)|Hugo[A-Za-z]*|JOY|{{[^{}]+}}|<\/?[a-zA-Z][^>]*>|%\w|\d[\d.,]*[.,]\d[\d.,]*|\d{3,}/g;
const tokens = (text) => [...String(text).matchAll(PROTECTED())].map((match) => match[0]).sort();
const hasSameTokens = (source, target) => JSON.stringify(tokens(source)) === JSON.stringify(tokens(target));

function maskProtectedTokens(text) {
  const protectedTokens = [];
  const masked = String(text).replace(PROTECTED(), (token) => {
    const marker = `__HUGO_${protectedTokens.length}__`;
    protectedTokens.push(token);
    return marker;
  });
  return { masked, protectedTokens };
}

function restoreProtectedTokens(text, protectedTokens) {
  return protectedTokens.reduce(
    (result, token, index) => result.replaceAll(`__HUGO_${index}__`, token),
    String(text),
  );
}

async function recoverTranslation(entries, language, attempt, error) {
  if (attempt < 2) return askOllama(entries, language, attempt + 1);
  if (entries.length > 1) {
    const middle = Math.ceil(entries.length / 2);
    return [
      ...await askOllama(entries.slice(0, middle), language),
      ...await askOllama(entries.slice(middle), language),
    ];
  }
  // A compact model can occasionally refuse a one-word UI command. Keep
  // that isolated source value so one stubborn label cannot discard the
  // other ~2,000 valid translations; the parity audit reports these later.
  console.warn(`[fallback] ${entries[0].id}: ${error.message}`);
  return entries;
}

async function askOllama(entries, language, attempt = 1) {
  const prepared = entries.map(({ text }) => maskProtectedTokens(text));
  const prompt = [
    `Translate Hugo Studio Member Portal interface copy from English to ${language}.`,
    `Return ONLY a JSON array of exactly ${entries.length} translated strings in the same order as the input array.`,
    "Do not add explanations. Do not translate Hugo Studio, Hugo, Hugo Bio, HugoPSY, HugoRadio, JOY, URLs or codes.",
    "Copy every protected marker such as __HUGO_0__ exactly. Preserve punctuation needed by the UI and intentional newline.",
    "Use natural, concise interface language. Translate legal, privacy, age, safety and payment text precisely.",
    JSON.stringify(prepared.map(({ masked }) => masked)),
  ].join("\n");
  let payload;
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        format: {
          type: "array",
          minItems: entries.length,
          maxItems: entries.length,
          items: { type: "string" },
        },
        options: { temperature: 0, num_ctx: 4_096, num_predict: 768 },
      }),
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    payload = await response.json();
  } catch (error) {
    return recoverTranslation(entries, language, attempt, error);
  }
  try {
    const parsed = JSON.parse(payload.response);
    const collectStrings = (value, output = []) => {
      if (typeof value === "string") output.push(value);
      else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
      else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, output));
      return output;
    };
    const translated = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.translations)
        ? parsed.translations
        : entries.length === 1 && typeof parsed?.translation === "string"
          ? [parsed.translation]
          : collectStrings(parsed);
    if (!Array.isArray(translated) || translated.length !== entries.length) {
      throw new Error(`expected ${entries.length} translations, received ${translated?.length}`);
    }
    const result = entries.map((entry, index) => ({
      id: entry.id,
      text: restoreProtectedTokens(translated[index], prepared[index].protectedTokens),
    }));
    const invalid = result.find(({ id, text }) => typeof text !== "string"
      || !text.trim()
      || !hasSameTokens(entries.find((entry) => entry.id === id).text, text));
    if (invalid) throw new Error(`invalid or missing value: ${invalid.id}`);
    return result;
  } catch (error) {
    return recoverTranslation(entries, language, attempt, error);
  }
}

async function main() {
  const requested = process.argv.slice(2);
  const languages = requested.length ? requested : Object.keys(TARGETS);
  const source = JSON.parse(await fs.readFile(path.join(LOCALES_DIR, "en/translation.json"), "utf8"));
  const dictionary = Object.fromEntries(TRANSLATED_ROOTS.map((root) => [root, source[root]]).filter(([, value]) => value));
  const entries = flatten(dictionary);
  // The portal deliberately repeats common actions such as “Done”, “Back” and
  // “Try again”. Translate each source sentence once, then fan it back out to
  // every key. This materially cuts local inference time without changing the
  // resulting locale shape.
  const canonicalByText = new Map();
  const canonicalForId = new Map();
  for (const entry of entries) {
    const canonical = canonicalByText.get(entry.text) || entry;
    canonicalByText.set(entry.text, canonical);
    canonicalForId.set(entry.id, canonical.id);
  }
  const canonicalEntries = [...canonicalByText.values()];
  const chunks = chunkEntries(canonicalEntries);
  await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
  console.log(`${entries.length} keys / ${canonicalEntries.length} unique strings, ${chunks.length} chunks per language, model ${MODEL}`);

  for (const code of languages) {
    if (!TARGETS[code]) throw new Error(`Unsupported language: ${code}`);
    const checkpointPath = path.join(CHECKPOINT_DIR, `${code}.json`);
    let translatedById = {};
    if (!START_FRESH) {
      try { translatedById = JSON.parse(await fs.readFile(checkpointPath, "utf8")); } catch { /* start clean */ }
    }
    for (let index = 0; index < chunks.length; index += 1) {
      const missing = chunks[index].filter(({ id }) => !translatedById[id]);
      if (!missing.length) continue;
      if (FINALIZE_PARTIAL) continue;
      const translated = await askOllama(missing, TARGETS[code]);
      translated.forEach(({ id, text }) => { translatedById[id] = text; });
      await fs.writeFile(checkpointPath, JSON.stringify(translatedById), "utf8");
      console.log(`[${code}] ${index + 1}/${chunks.length}`);
    }
    let output = {};
    try {
      output = JSON.parse(await fs.readFile(path.join(LOCALES_DIR, code, "translation.json"), "utf8"));
    } catch { /* a new locale starts with only the Member Portal roots */ }
    // Legal/member documents are generated by the dedicated document sync
    // script from their structured source. Preserve them while refreshing the
    // regular UI keys, whose English source intentionally does not duplicate
    // the full document bodies.
    const memberDocumentContent = output.memberPortal?.accountHub?.documents?.content;
    // Seed from the English shape so arrays stay arrays and objects stay
    // objects, then overwrite every leaf with its translation.
    Object.assign(output, structuredClone(dictionary));
    entries.forEach(({ id, text }) => {
      const translated = translatedById[canonicalForId.get(id)];
      setAtPath(output, id, translated && !translated.includes("__HUGO_") ? translated : text);
    });
    Object.entries({ ...CRITICAL_ACCOUNT_COPY[code], ...OVERRIDES[code] })
      .forEach(([id, text]) => setAtPath(output, id, text));
    if (memberDocumentContent) {
      output.memberPortal.accountHub.documents.content = memberDocumentContent;
    }
    await fs.writeFile(
      path.join(LOCALES_DIR, code, "translation.json"),
      `${JSON.stringify(output, null, 2)}\n`,
      "utf8",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
