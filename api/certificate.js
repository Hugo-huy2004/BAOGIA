// OG preview cho chứng chỉ HugoCoder: chèn meta cá nhân hóa vào index.html
// để bot Facebook/Zalo/Discord thấy đúng tên học viên + chặng khi chia sẻ link.
export default async function handler(req, res) {
  const { slug, phase } = req.query;

  if (!slug || !phase) {
    return res.status(400).send('Missing certificate params');
  }

  const backendUrl = process.env.VITE_API_URL || 'https://api.hugowishpax.studio/api';
  const apiEndpoint = backendUrl.startsWith('http')
    ? `${backendUrl}/bios/certificate/${encodeURIComponent(slug)}/${encodeURIComponent(phase)}`
    : `https://api.hugowishpax.studio/api/bios/certificate/${encodeURIComponent(slug)}/${encodeURIComponent(phase)}`;

  let title = 'Chứng chỉ HugoCoder — Hugo Studio';
  let description = 'Chứng chỉ hoàn thành chặng học lập trình web trên lộ trình 100 bài của HugoCoder, xác thực trực tuyến bởi Hugo Studio.';

  try {
    const apiRes = await fetch(apiEndpoint);
    if (apiRes.ok) {
      const cert = await apiRes.json();
      title = `Chứng chỉ ${cert.stageTitle} — ${cert.displayName}`;
      const skills = (cert.skills || []).slice(0, 3).join(' • ');
      description = `${cert.displayName} đã hoàn thành ${cert.rangeText} (${cert.lessonsInStage} bài) trên lộ trình HugoCoder 100 bài. Năng lực: ${skills}. Xác thực trực tuyến bởi Hugo Studio.`;
    }
  } catch (err) {
    console.error('Error fetching certificate info in serverless function:', err);
  }

  const host = req.headers.host || 'www.hugowishpax.studio';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const templateUrl = `${protocol}://${host}/index.html`;

  try {
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error(`Failed to load index.html template: ${templateResponse.statusText}`);
    }
    let html = await templateResponse.text();

    const esc = (s) => String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
    html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${esc(title)}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${esc(description)}" />`);
    html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="https://${host}/certificate/${esc(slug)}/${esc(phase)}" />`);
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${esc(description)}" />`);
    // og:image giữ ảnh thương hiệu 1200x630 sẵn có — đủ chuẩn khung chia sẻ

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error serving certificate meta page:', error);
    return res.status(500).send('Internal Server Error');
  }
}
