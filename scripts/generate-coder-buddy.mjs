/**
 * Dựng sẵn 6 gương mặt của Hugo (nhân vật trong Hugo Coding) bằng DiceBear,
 * kiểu "avataaars" của Pablo Stanley — miễn phí cả mục đích thương mại, mã MIT.
 *
 * Dựng lúc build chứ không trong trình duyệt: thư viện nặng ~46 KB gzip, còn
 * 6 tệp SVG tĩnh thì không tốn byte JS nào. Đổi diện mạo ở đây rồi chạy lại:
 *   node scripts/generate-coder-buddy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";

// Ba nét nhận dạng giữ từ mascot cũ: tóc đen ngắn, kính râm, áo hoodie xanh.
const LOOK = {
  seed: "hugo",
  top: ["shortFlat"],
  hairColor: ["2c1b18"],
  accessories: ["wayfarers"],
  accessoriesProbability: 100,
  accessoriesColor: ["262e33"],
  skinColor: ["ffdbb4"],
  clothing: ["hoodie"],
  clothesColor: ["5199e4"],
  facialHairProbability: 0,
};

const FACE = {
  learn: { eyes: ["default"], eyebrows: ["defaultNatural"], mouth: ["smile"] },
  practice: { eyes: ["squint"], eyebrows: ["upDownNatural"], mouth: ["default"] },
  exam: { eyes: ["default"], eyebrows: ["raisedExcitedNatural"], mouth: ["serious"] },
  correct: { eyes: ["happy"], eyebrows: ["raisedExcitedNatural"], mouth: ["smile"] },
  wrong: { eyes: ["default"], eyebrows: ["sadConcernedNatural"], mouth: ["concerned"] },
  done: { eyes: ["happy"], eyebrows: ["raisedExcited"], mouth: ["twinkle"] },
};

const out = path.resolve(import.meta.dirname, "../apps/web/public/coder");
fs.mkdirSync(out, { recursive: true });
for (const [mood, face] of Object.entries(FACE)) {
  fs.writeFileSync(path.join(out, `buddy-${mood}.svg`), createAvatar(avataaars, { ...LOOK, ...face }).toString());
}
console.log(`✓ ${Object.keys(FACE).length} gương mặt → apps/web/public/coder/`);
