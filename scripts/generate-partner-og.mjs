/**
 * Ảnh chia sẻ 1200×630 cho mỗi chiến dịch hợp tác → public/og/partner-<slug>.jpg.
 * Chạy lại khi thêm/đổi chiến dịch:  npm run og:partner
 *
 * Vẽ bằng SVG rồi rasterize qua sharp: hai nhân vật (cùng bản vẽ với phim, ở
 * src/pages/public/partner/mascotArt.js) bắt
 * tay đứng trên chữ COLLABORATE, nền điện ảnh với vệt lộ sáng như ở trang thật.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PARTNER_CAMPAIGNS } from "../shared/partnerCampaigns.js";
import { MASCOT_RIG, faceSvg, hugoBodySvg, limbsSvg, partnerBodySvg } from "../src/pages/public/partner/mascotArt.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svgFor(campaign) {
  const { mark, partnerName } = campaign;
  const copy = campaign.copy.vi;
  const rig = MASCOT_RIG.partner(mark);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f3550"/><stop offset=".45" stop-color="#0b0f17"/><stop offset="1" stop-color="#2a1f1a"/></linearGradient>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>
    <filter id="glow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>
    <linearGradient id="word" x1="150" y1="0" x2="1050" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#38bdf8"/><stop offset=".28" stop-color="#3b82f6"/><stop offset=".5" stop-color="#7c6cf0"/><stop offset=".74" stop-color="${mark.accent}"/><stop offset="1" stop-color="#ffd9a8"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="80" cy="40" r="260" fill="#00b8ff" opacity=".45" filter="url(#blur)"/>
  <circle cx="1140" cy="160" r="240" fill="#a15fb5" opacity=".45" filter="url(#blur)"/>
  <circle cx="900" cy="700" r="260" fill="${mark.accent}" opacity=".45" filter="url(#blur)"/>
  <rect width="1200" height="30" fill="#000"/><rect y="600" width="1200" height="30" fill="#000"/>
  <text x="600" y="98" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="24" letter-spacing="4" fill="#d9d2ff">${esc(copy.eyebrow.toUpperCase())}</text>
  <text x="600" y="160" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="54" fill="#fff">${esc(copy.headline)}</text>
  <g transform="translate(530 392) scale(1.15)">
    ${hugoBodySvg("og-hugo")}
    ${faceSvg(MASCOT_RIG.hugo.faceY, 1)}${limbsSvg(MASCOT_RIG.hugo, -1, 61)}
  </g>
  <g transform="translate(670 392) scale(1.15)">
    ${partnerBodySvg("og-partner", mark)}
    ${faceSvg(rig.faceY, -1)}${limbsSvg(rig, 1, -61)}
  </g>
  <text x="600" y="500" text-anchor="middle" textLength="900" lengthAdjust="spacingAndGlyphs" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="118" fill="url(#word)" filter="url(#glow)" opacity=".9">COLLABORATE</text>
  <text x="600" y="500" text-anchor="middle" textLength="900" lengthAdjust="spacingAndGlyphs" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="118" fill="url(#word)">COLLABORATE</text>
  <text x="600" y="560" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="24" fill="#f6f3ff">+${campaign.bioDays} ngày Bio · +${campaign.joy} JOY · ${campaign.maxClaims} suất · ${esc(new URL(campaign.publicUrl).host)}</text>
  <text x="1170" y="20" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="${mark.accent}">● REC · ${esc(partnerName)} × HUGO STUDIO</text>
</svg>`;
}

for (const campaign of Object.values(PARTNER_CAMPAIGNS)) {
  const out = path.join(ROOT, "public/og", `partner-${campaign.slug}.jpg`);
  await sharp(Buffer.from(svgFor(campaign))).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
  console.log(`OG: ${path.relative(ROOT, out)}`);
}
