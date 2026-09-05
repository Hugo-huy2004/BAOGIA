// Chặn IP tấn công ngay tại TƯỜNG LỬA Cloudflare — trước khi request chạm tới
// Render. Khác hẳn khoá ở tầng ứng dụng (SecurityBlock): ở đó request vẫn tới
// server, vẫn tốn CPU và BĂNG THÔNG (thứ Render tính tiền). Chặn ở CF edge thì
// kẻ tấn công bị dập từ ngoài cổng, không tốn một byte nào của mình.
//
// Cần CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID (đã có sẵn cho DNS). Thiếu thì
// hàm trả { edge: false } và nơi gọi tự lùi về khoá tầng ứng dụng — không bao
// giờ ném lỗi làm hỏng luồng an ninh.
const API = 'https://api.cloudflare.com/client/v4';

function creds() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  return token && zone ? { token, zone } : null;
}

export function edgeFirewallEnabled() {
  return Boolean(creds());
}

async function cf(path, options = {}) {
  const c = creds();
  if (!c) return null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${c.token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!data.success) {
    // CF trả 400 "identical rule exists" khi IP đã bị chặn từ trước — đó là
    // kết quả mong muốn, không phải lỗi. Nuốt nó, các lỗi khác thì báo lên.
    const dup = (data.errors || []).some((e) => /identical|already exists|duplicate/i.test(e.message || ''));
    if (!dup) throw new Error((data.errors || []).map((e) => e.message).join('; ') || `CF HTTP ${res.status}`);
  }
  return data;
}

// Tạo IP Access Rule mức "block" cho một IP. Idempotent: gọi lại trên IP đã
// chặn thì im lặng trả về ok.
export async function blockIpAtEdge(ip, note = '') {
  const c = creds();
  if (!c || !ip) return { edge: false };
  try {
    const data = await cf(`/zones/${c.zone}/firewall/access_rules/rules`, {
      method: 'POST',
      body: JSON.stringify({
        mode: 'block',
        configuration: { target: 'ip', value: String(ip).replace(/^::ffff:/, '') },
        notes: String(note || 'Hugo Security auto-block').slice(0, 1024),
      }),
    });
    return { edge: true, ruleId: data?.result?.id || null };
  } catch (error) {
    console.error('[CF firewall block]', error.message);
    return { edge: false, error: error.message };
  }
}

// Chặn cả một QUỐC GIA hoặc một ASN ở edge — cho khi một nguồn tấn công dồn dập
// mà đổi IP liên tục (chặn từng IP không xuể). CF IP Access Rule nhận target
// 'country' (mã ISO 2 chữ, vd 'CN') hoặc 'asn' (vd 'AS14061').
//
// Đây là VŨ KHÍ HẠNG NẶNG: một mã quốc gia sai là chặn oan hàng triệu người.
// Nên nó KHÔNG bao giờ tự động — chỉ chạy khi Boss ra lệnh, và bản tổng kết chỉ
// GỢI Ý dựa trên dữ liệu, không tự bấm cò.
export async function blockScopeAtEdge({ target, value, note = '' }) {
  const c = creds();
  if (!c) return { edge: false };
  if (!['country', 'asn'].includes(target) || !value) return { edge: false, error: 'target không hợp lệ' };
  const clean = target === 'country' ? String(value).toUpperCase().slice(0, 2) : String(value).toUpperCase().replace(/^AS?/, 'AS');
  try {
    const data = await cf(`/zones/${c.zone}/firewall/access_rules/rules`, {
      method: 'POST',
      body: JSON.stringify({
        mode: 'block',
        configuration: { target, value: clean },
        notes: String(note || `Hugo geo-block ${clean}`).slice(0, 1024),
      }),
    });
    return { edge: true, ruleId: data?.result?.id || null, value: clean };
  } catch (error) {
    console.error('[CF geo-block]', error.message);
    return { edge: false, error: error.message };
  }
}

export async function unblockScopeAtEdge({ target, value }) {
  const c = creds();
  if (!c) return { edge: false };
  const clean = target === 'country' ? String(value).toUpperCase().slice(0, 2) : String(value).toUpperCase().replace(/^AS?/, 'AS');
  try {
    const list = await cf(`/zones/${c.zone}/firewall/access_rules/rules?configuration.target=${target}&configuration.value=${encodeURIComponent(clean)}`);
    const id = list?.result?.[0]?.id;
    if (!id) return { edge: false, notFound: true };
    await cf(`/zones/${c.zone}/firewall/access_rules/rules/${id}`, { method: 'DELETE' });
    return { edge: true, removed: id };
  } catch (error) {
    return { edge: false, error: error.message };
  }
}

// Gỡ chặn: theo ruleId nếu có, không thì tìm theo IP rồi xoá. Dùng khi Boss
// bấm "giải khóa" hoặc khi một IP bị chặn oan.
export async function unblockIpAtEdge({ ip = '', ruleId = '' } = {}) {
  const c = creds();
  if (!c) return { edge: false };
  try {
    let id = ruleId;
    if (!id && ip) {
      const list = await cf(`/zones/${c.zone}/firewall/access_rules/rules?configuration.target=ip&configuration.value=${encodeURIComponent(String(ip).replace(/^::ffff:/, ''))}`);
      id = list?.result?.[0]?.id;
    }
    if (!id) return { edge: false, notFound: true };
    await cf(`/zones/${c.zone}/firewall/access_rules/rules/${id}`, { method: 'DELETE' });
    return { edge: true, removed: id };
  } catch (error) {
    console.error('[CF firewall unblock]', error.message);
    return { edge: false, error: error.message };
  }
}
