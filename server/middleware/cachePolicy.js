// Routes opt in to public caching; private data, writes and errors never do.
export function cachePolicy(req, res, next) {
  const writeHead = res.writeHead;
  res.writeHead = function (statusCode, ...args) {
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
    return writeHead.call(this, statusCode, ...args);
  };
  next();
}
