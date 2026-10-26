// Thẻ chia sẻ cho trang Bio (/bio/:slug, /b/:slug): bot Facebook/Zalo/Discord
// không chạy JavaScript, nên chèn tên, giới thiệu và ảnh đại diện của đúng người
// vào khung SPA (app-shell.html do scripts/generate-seo.mjs xuất ra).
//
// Vị thành niên: giữ tên (trang công khai vẫn hiện tên) nhưng KHÔNG đưa ảnh đại
// diện lên thẻ chia sẻ và đặt noindex — theo chính sách 14–18 không tiết lộ trọn.
const ORIGIN = 'https://www.hugowishpax.studio';
const FALLBACK_IMAGE = `${ORIGIN}/og-image.png`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (text, max = 195) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).replace(/\s+\S*$/, '')}…`;
};

export default async function handler(req, res) {
  const slug = String(req.query.slug || '').trim();
  if (!slug || !/^[\w.-]{1,80}$/.test(slug)) {
    return res.status(400).send('Missing bio slug');
  }

  const backendUrl = process.env.VITE_API_URL || 'https://api.hugowishpax.studio/api';
  const apiBase = backendUrl.startsWith('http') ? backendUrl : 'https://api.hugowishpax.studio/api';

  let title = 'Trang Bio — Hugo Studio';
  let description = 'Trang Bio cá nhân trong hệ sinh thái Hugo Studio: giới thiệu, dự án, kỹ năng và mọi liên kết trên một đường dẫn.';
  let image = FALLBACK_IMAGE;
  let minor = false;

  try {
    const apiRes = await fetch(`${apiBase}/bios/slug/${encodeURIComponent(slug)}`);
    if (apiRes.ok) {
      const { bio } = await apiRes.json();
      if (bio?.displayName) {
        minor = bio.isMinor === true;
        title = `${bio.displayName} — Hugo Studio`;
        description = clamp(bio.bio || bio.headline || description);
        const avatar = String(bio.avatarUrl || '');
        if (!minor && avatar) image = avatar.startsWith('https://') ? avatar : `${ORIGIN}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
      }
    }
  } catch (err) {
    console.error('bio-og: không lấy được bio', err);
  }

  const host = req.headers.host || 'www.hugowishpax.studio';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const pageUrl = `${ORIGIN}/bio/${encodeURIComponent(slug)}`;

  try {
    const shell = await fetch(`${protocol}://${host}/app-shell.html`);
    if (!shell.ok) throw new Error(`app-shell.html ${shell.status}`);
    let html = await shell.text();

    const set = (attr, name, value) => {
      html = html.replace(new RegExp(`<meta\\s+${attr}="${name}"\\s+content="[^"]*"\\s*/?>`, 'i'), `<meta ${attr}="${name}" content="${esc(value)}" />`);
    };
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
    html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${pageUrl}" />`);
    set('name', 'description', description);
    set('property', 'og:type', 'profile');
    set('property', 'og:title', title);
    set('property', 'og:description', description);
    set('property', 'og:url', pageUrl);
    set('property', 'og:image', image);
    set('property', 'og:image:secure_url', image);
    set('property', 'og:image:alt', title);
    set('name', 'twitter:title', title);
    set('name', 'twitter:description', description);
    set('name', 'twitter:image', image);
    set('name', 'twitter:image:alt', title);
    // Ảnh đại diện không rõ cỡ/định dạng: bỏ khai báo để bot tự đo.
    if (image !== FALLBACK_IMAGE) html = html.replace(/\s*<meta property="og:image:(?:type|width|height)" content="[^"]*" \/>/g, '');
    if (minor) set('name', 'robots', 'noindex, nofollow, noarchive');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (error) {
    console.error('bio-og: không dựng được trang', error);
    return res.status(500).send('Internal Server Error');
  }
}
