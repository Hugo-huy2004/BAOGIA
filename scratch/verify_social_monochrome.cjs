const { chromium } = require('playwright');
const path = require('path');

const sampleBio = {
  slug: "peter-hugo",
  displayName: "Peter Hugo Wishpax Lê",
  avatarUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779207682/hugo_wishpax/avatars/avatar_phucphgcs230327_fpt_edu_vn_1779207682370.webp",
  headline: "Senior Creative Technologist & Digital Architect",
  bio: "Đam mê sáng tạo trải nghiệm số tinh xảo, chú trọng tính trực quan và thẩm mỹ cao cấp.",
  status: "active",
  isEduVerified: true,
  jobTitle: "Creative Technologist",
  education: "Greenwich University",
  phone: "0908123456",
  birthday: "2004",
  address: "TP. Hồ Chí Minh",
  hobbies: "Nhiếp ảnh, Kiến trúc, Phim ảnh",
  skills: "React, Node.js, TypeScript, UI/UX Architecture, Cloud",
  height: "1m78",
  weight: "68kg",
  measurements: "96-76-95",
  links: [
    { label: "Facebook", url: "https://www.facebook.com/hugowishpax" },
    { label: "Instagram", url: "https://instagram.com/hugowishpax" },
    { label: "TikTok", url: "https://tiktok.com/@pethugowishpaxle" },
    { label: "Zalo", url: "https://zalo.me/0908123456" },
    { label: "GitHub", url: "https://github.com/Hugo-huy2004" },
    { label: "X", url: "https://x.com/hugowishpax" },
    { label: "Threads", url: "https://threads.net/@hugowishpax" },
    { label: "Discord", url: "https://discord.gg/hugostudio" },
    { label: "LinkedIn", url: "https://linkedin.com/in/peter-hugo" },
    { label: "Pinterest", url: "https://pinterest.com/hugowishpax" },
    { label: "Website bán hàng", url: "https://shopee.vn/hugostudio" },
    { label: "Website cá nhân", url: "https://hugowishpax.studio" }
  ],
  projects: [
    {
      title: "Hugo Price Doc & Dynamic Bio Engine",
      description: "Hệ thống báo giá điện tử và nền tảng Bio cá nhân hóa với kiến trúc bảo mật cao cấp.",
      imageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779207682/hugo_wishpax/avatars/avatar_phucphgcs230327_fpt_edu_vn_1779207682370.webp",
      link: "https://hugowishpax.studio/b/peter-hugo"
    }
  ],
  services: [
    {
      title: "Tư Vấn Kiến Trúc Hệ Thống Fullstack",
      price: "Từ 15.000.000đ",
      description: "Thiết kế kiến trúc ứng dụng Web/App quy mô cao cấp, tối ưu hóa CSDL và Micro-services."
    }
  ]
};

const outDir = '/Users/wishpaxhugo/.gemini/antigravity-ide/brain/0bc000f0-53c0-4ace-84cc-9547048685c7/scratch';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Route mocking cho public bio
  await page.route('**/api/bios/slug/peter-hugo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        bio: {
          ...sampleBio,
          theme: { template: 'frost' }
        }
      })
    });
  });

  await page.goto('http://localhost:3000/b/peter-hugo', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 1. Chụp Bio Theme Frost
  await page.screenshot({ path: path.join(outDir, 'bio_monochrome_frost.png'), fullPage: true });

  // 2. Chuyển sang Graphite
  await page.evaluate(() => {
    const el = document.querySelector('.bio-canvas');
    if (el) el.setAttribute('data-bio-theme', 'graphite');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'bio_monochrome_graphite.png'), fullPage: true });

  // 3. Chuyển sang Aurora
  await page.evaluate(() => {
    const el = document.querySelector('.bio-canvas');
    if (el) el.setAttribute('data-bio-theme', 'aurora');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'bio_monochrome_aurora.png'), fullPage: true });

  // 4. Chuyển sang Brutalism
  await page.evaluate(() => {
    const el = document.querySelector('.bio-canvas');
    if (el) el.setAttribute('data-bio-theme', 'brutalism');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'bio_monochrome_brutalism.png'), fullPage: true });

  // 5. Chuyển sang Flat
  await page.evaluate(() => {
    const el = document.querySelector('.bio-canvas');
    if (el) el.setAttribute('data-bio-theme', 'flat');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'bio_monochrome_flat.png'), fullPage: true });

  // Kiểm tra giao diện Quản lý Thẻ Liên Kết (LinksSubTab)
  await page.setViewportSize({ width: 900, height: 800 });
  await page.route('**/api/bios/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sampleBio)
    });
  });
  await page.goto('http://localhost:3000/member/account/links', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, 'member_links_subtab.png'), fullPage: false });

  // Kiểm tra giao diện Chọn Theme (DesignSubTab)
  await page.goto('http://localhost:3000/member/account/design', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, 'member_design_subtab.png'), fullPage: false });

  await browser.close();
  console.log('All tests completed successfully!');
})();
