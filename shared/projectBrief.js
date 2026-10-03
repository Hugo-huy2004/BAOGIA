import { REQUIREMENT_SECTIONS, MOSCOW_LEVELS } from './projectWorkflow.js';
import { getPackageFacts } from './projectPackages.js';

/**
 * Phiếu yêu cầu khách vừa nộp → văn bản A4 "Bảng yêu cầu dự án": mỗi phần
 * của form thành một mục đánh số, câu hỏi | câu trả lời. Dựng từ dữ liệu, không
 * lưu bản văn, nên khách sửa phiếu thì bảng tự cập nhật.
 *
 * Tiêu đề mục viết lại dạng văn bản (form hỏi "Bạn là ai", văn bản ghi "Thông
 * tin liên hệ"). Câu bỏ trống không in, để bảng chỉ còn điều khách đã nói.
 */
const DOC_TITLES = {
  contact: 'Thông tin liên hệ',
  business: 'Hoạt động kinh doanh',
  journey: 'Khách hàng và quyết định mua',
  goal: 'Mục tiêu của website',
  scope: 'Gói, trang và tính năng',
  design: 'Định hướng thiết kế',
  content: 'Nội dung',
  technical: 'Kỹ thuật',
  constraints: 'Thời gian và ràng buộc',
};

const fmtDate = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function formatValue(field, v) {
  if (v === undefined || v === null || v === '') return '';
  switch (field.type) {
    case 'package': return getPackageFacts(v)?.label || String(v);
    case 'date': return fmtDate(v);
    case 'moscow':
      return MOSCOW_LEVELS.map((l) => (v?.[l.id]?.length ? `${l.label}: ${v[l.id].join(', ')}` : '')).filter(Boolean).join('\n');
    case 'references':
      return (Array.isArray(v) ? v : []).map((r) => [r.url, r.note].filter(Boolean).join(' — ')).filter(Boolean).join('\n');
    default:
      return Array.isArray(v) ? v.join(', ') : String(v);
  }
}

export function buildBrief(project) {
  const r = project.requirements || {};
  const sections = [];
  for (const s of REQUIREMENT_SECTIONS) {
    const rows = s.fields.map((f) => [f.label, formatValue(f, r[f.id])]).filter(([, v]) => v);
    if (rows.length) sections.push({ id: s.id, title: DOC_TITLES[s.id] || s.title, rows });
  }
  const answered = REQUIREMENT_SECTIONS.flatMap((s) => s.fields).filter((f) => formatValue(f, r[f.id])).length;
  const total = REQUIREMENT_SECTIONS.flatMap((s) => s.fields).length;
  return {
    title: 'BẢNG YÊU CẦU DỰ ÁN',
    meta: [
      ['Mã dự án', project.projectId || '—'],
      ['Khách hàng', r.fullName || project.customer?.fullName || project.name || '—'],
      ['Nộp lúc', project.requirementsSubmittedAt ? new Date(project.requirementsSubmittedAt).toLocaleString('vi-VN') : '—'],
      ['Số câu đã trả lời', `${answered}/${total}`],
    ],
    sections,
  };
}
