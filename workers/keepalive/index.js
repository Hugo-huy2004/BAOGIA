// Cloudflare Worker — giữ ấm Render trong khung giờ hoạt động.
//
// Vì sao ping từ bên ngoài chứ không phải node-cron trong server:
//   1. Khi Render đã cho service ngủ, process đã chết — cron nội bộ không thể
//      tự ping để đánh thức chính mình. Worker thì gọi được từ ngoài vào.
//   2. Khung giờ nằm ở đây nên đổi lịch không cần deploy lại backend.
//
// PING_URL phải là URL *.onrender.com gốc, KHÔNG dùng api.hugowishpax.studio:
// tên miền đó đi qua Cloudflare, và Cache Rule cho /api/* có thể trả về bản
// cache mà không bao giờ chạm tới origin — ping như vậy sẽ không đánh thức được.

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(ping(env));
  },

  // Cho phép gọi tay để kiểm tra: curl https://<worker>.workers.dev
  async fetch(_request, env) {
    return new Response(await ping(env));
  },
};

async function ping(env) {
  const started = Date.now();
  try {
    // Instance đang ngủ mất 30–60s để dậy. Đây là thời gian chờ I/O nên không
    // tính vào giới hạn 10ms CPU của Workers free plan.
    const res = await fetch(env.PING_URL, { method: 'GET' });
    return `${res.status} in ${Date.now() - started}ms`;
  } catch (e) {
    return `failed after ${Date.now() - started}ms: ${e.message}`;
  }
}
