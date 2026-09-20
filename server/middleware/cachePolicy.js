// Routes opt in to public caching; private data, writes and errors never do.
export function cachePolicy(req, res, next) {
  const writeHead = res.writeHead;
  res.writeHead = function (statusCode, statusMessage, headers) {
    if (typeof statusMessage === 'object') headers = statusMessage;
    if (Array.isArray(headers)) {
      for (let i = 0; i < headers.length; i += 2) res.setHeader(headers[i], headers[i + 1]);
    } else if (headers) {
      for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
    }
    const personal = req.headers.authorization || req.headers.cookie || res.hasHeader('Set-Cookie');
    const unsafe = !['GET', 'HEAD'].includes(req.method) || statusCode >= 400 || personal;
    if (unsafe || !res.hasHeader('Cache-Control')) {
      res.setHeader('Cache-Control', 'private, no-store');
    }
    if (/private|no-store/i.test(String(res.getHeader('Cache-Control')))) {
      res.setHeader('CDN-Cache-Control', 'no-store');
      res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
      res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store');
    }
    return typeof statusMessage === 'string'
      ? writeHead.call(this, statusCode, statusMessage)
      : writeHead.call(this, statusCode);
  };
  next();
}
