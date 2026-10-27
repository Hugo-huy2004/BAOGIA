/**
 * Ảnh chia sẻ 1200×630 cho mỗi chiến dịch hợp tác → public/og/partner-<slug>.jpg.
 * Chạy lại khi thêm/đổi chiến dịch:  npm run og:partner
 *
 * Vẽ bằng SVG rồi rasterize qua sharp: hai nhân vật (cùng bản vẽ với phim, ở
 * src/pages/public/partner/mascotArt.js) bắt
 * tay đứng trên chữ COLLABORATE, sân khấu đen một luồng đèn như ở trang thật.
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
  const { mark } = campaign;
  const copy = campaign.copy.vi;
  const rig = MASCOT_RIG.partner(mark);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="spot" cx="600" cy="0" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="blur" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="glow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>
    <linearGradient id="word" x1="150" y1="0" x2="1050" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#38bdf8"/><stop offset=".28" stop-color="#3b82f6"/><stop offset=".5" stop-color="#7c6cf0"/><stop offset=".74" stop-color="${mark.accent}"/><stop offset="1" stop-color="#ffd9a8"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#000"/>
  <rect width="1200" height="630" fill="url(#spot)"/>
  <ellipse cx="600" cy="470" rx="440" ry="70" fill="url(#word)" opacity=".4" filter="url(#blur)"/>
  <text x="600" y="92" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="20" letter-spacing="6" fill="#86868b">${esc(copy.eyebrow.toUpperCase())}</text>
  <text x="600" y="152" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="52" letter-spacing="-1" fill="#f5f5f7">${esc(copy.headline)}</text>
  <g transform="translate(530 392) scale(1.15)">
    ${hugoBodySvg("og-hugo")}
    ${faceSvg(MASCOT_RIG.hugo.faceY, 1)}${limbsSvg(MASCOT_RIG.hugo, -1, 61)}
  </g>
  <g transform="translate(670 392) scale(1.15)">
    ${partnerBodySvg("og-partner", mark)}
    ${faceSvg(rig.faceY, -1)}${limbsSvg(rig, 1, -61)}
  </g>
  <text x="600" y="500" text-anchor="middle" textLength="900" lengthAdjust="spacingAndGlyphs" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="118" fill="url(#word)" filter="url(#glow)" opacity=".6">COLLABORATE</text>
  <text x="600" y="500" text-anchor="middle" textLength="900" lengthAdjust="spacingAndGlyphs" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="118" fill="url(#word)">COLLABORATE</text>
  <text x="600" y="566" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" letter-spacing="1" fill="#a1a1a6">+${campaign.bioDays} ngày Bio · +${campaign.joy} JOY · ${campaign.maxClaims} suất · ${esc(new URL(campaign.publicUrl).host)}</text>
</svg>`;
}

for (const campaign of Object.values(PARTNER_CAMPAIGNS)) {
  const out = path.join(ROOT, "public/og", `partner-${campaign.slug}.jpg`);
  await sharp(Buffer.from(svgFor(campaign))).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
  console.log(`OG: ${path.relative(ROOT, out)}`);
}
