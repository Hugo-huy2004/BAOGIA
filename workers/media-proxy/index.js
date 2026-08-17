/**
 * Cửa trung chuyển phim cho Chill Premium.
 *
 * Vấn đề thật, đo được từ Việt Nam: `archive.org/download/…` chuyển hướng 302 tới
 * một máy dữ liệu cụ thể (ví dụ `dn801201.us.archive.org`), và nhiều nhà mạng VN
 * không đi tới được máy đó — trình duyệt báo `ERR_TIMED_OUT` cho cả file phim
 * lẫn ảnh xem trước. Không thư viện phát video nào chữa được một máy chủ không
 * bắt tay TCP; phải đổi đường đi.
 *
 * Worker này là đường đi đó: trình duyệt chỉ nói chuyện với Cloudflare (có PoP
 * ngay tại HCM/HN), còn chặng Cloudflare → Internet Archive chạy trên đường
 * backbone của Cloudflare. Bytes được cache ở biên nên người xem thứ hai của
 * cùng bộ phim lấy từ PoP, không ra tận Mỹ nữa.
 *
 * KHÔNG đặt cửa này trong Node/Render: mỗi lượt xem phim là vài trăm MB băng
 * thông RA — đúng khoản đã làm cháy hạn mức Render một lần (xem
 * docs/tach-tai-render.md). Cloudflare Worker không tính băng thông.
 *
 * ponytail: chỉ cho phép đúng các host của Internet Archive. Một proxy nhận mọi
 * URL là proxy mở — người khác sẽ dùng nó để giấu nguồn traffic của họ.
 *
 * Triển khai:
 *   cd workers/media-proxy && npx wrangler deploy
 * rồi đặt URL Worker vào `.env` của frontend:
 *   VITE_CINEMA_MEDIA_PROXY=https://hugostudio-media.<tên>.workers.dev
 */

const ALLOWED_HOST = /(^|\.)archive\.org$/;

// Cache ở biên một ngày. File phim public domain không đổi, nên TTL dài là an
// toàn; hết hạn thì Worker lấy lại một lần rồi cache tiếp.
const CACHE_TTL_SECONDS = 86400;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Chỉ nhận GET/HEAD', { status: 405, headers: CORS });
    }

    const target = new URL(request.url).searchParams.get('u');
    if (!target) {
      return new Response('Thiếu tham số ?u=', { status: 400, headers: CORS });
    }

    let upstream;
    try {
      upstream = new URL(target);
    } catch {
      return new Response('URL không hợp lệ', { status: 400, headers: CORS });
    }
    if (upstream.protocol !== 'https:' || !ALLOWED_HOST.test(upstream.hostname)) {
      return new Response('Chỉ trung chuyển archive.org', { status: 403, headers: CORS });
    }

    // Range phải đi kèm: trình phát tua bằng chính header này. Bỏ Range đi là
    // buộc tải cả file từ đầu mỗi lần người xem kéo thanh thời gian.
    const range = request.headers.get('Range');
    const response = await fetch(upstream.toString(), {
      method: request.method,
      headers: range ? { Range: range } : {},
      redirect: 'follow',
      // Chỉ cache bản trả về LÀNH. `services/img` của Internet Archive hay 504
      // vài phút; cache lỗi 1 ngày là biến cú sặc đó thành poster hỏng cả ngày.
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: { '200-299': CACHE_TTL_SECONDS, '300-399': 0, '400-499': 60, '500-599': 0 },
      },
    });

    const headers = new Headers(CORS);
    for (const name of ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges', 'ETag', 'Last-Modified']) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    // Trình duyệt cũng không được giữ bản lỗi: lần vẽ lại sau phải hỏi lại thật.
    headers.set(
      'Cache-Control',
      response.ok ? `public, max-age=${CACHE_TTL_SECONDS}` : 'no-store'
    );

    return new Response(response.body, { status: response.status, headers });
  },
};
