export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Missing transaction ID');
  }

  // 1. Fetch transaction details from the backend
  const backendUrl = process.env.VITE_API_URL || 'https://api.hugowishpax.studio/api';
  const apiEndpoint = backendUrl.startsWith('http')
    ? `${backendUrl}/payos/info/${id}`
    : `https://api.hugowishpax.studio/api/payos/info/${id}`;

  let title = 'Yêu Cầu Chuyển Khoản - Hugo Studio';
  let description = 'Cổng thanh toán và chuyển khoản thông minh của Hugo Studio, bảo mật qua PayOS.';
  let image = 'https://payos.vn/wp-content/uploads/2025/06/Casso-payOSLogo-1.svg';

  try {
    const apiRes = await fetch(apiEndpoint);
    if (apiRes.ok) {
      const result = await apiRes.json();
      if (result.success && result.data) {
        const { amount, reason } = result.data;
        title = `Yêu Cầu Chuyển Khoản - ${amount.toLocaleString('vi-VN')} ₫`;
        description = `Nội dung: "${reason}". Vui lòng bấm vào liên kết để tiến hành chuyển khoản qua VietQR. Cổng thanh toán bảo mật bởi PayOS.`;
      }
    }
  } catch (err) {
    console.error('Error fetching payment info in serverless function:', err);
  }

  // 2. Fetch the compiled index.html template from the deployment CDN
  const host = req.headers.host || 'www.hugowishpax.studio';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const templateUrl = `${protocol}://${host}/index.html`;

  try {
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error(`Failed to load index.html template: ${templateResponse.statusText}`);
    }
    let html = await templateResponse.text();

    // 3. Dynamically replace SEO & Open Graph meta tags using Regex
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
    html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${image}" />`);
    html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="https://${host}/pay/${id}" />`);
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${description}" />`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error serving index.html with meta tags:', error);
    return res.status(500).send('Internal Server Error');
  }
}
