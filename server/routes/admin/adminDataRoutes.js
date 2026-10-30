// CRUD chung cho react-admin (định dạng ra-data-simple-rest) — router con của /api/admin.
//
// Chỉ model trong RESOURCES mới ra được ngoài, và chỉ các trường được kể tên:
// danh sách trắng chứ không phải danh sách đen, thêm trường mới vào schema
// không tự lộ. Tiền (joyBalance, sổ JOY) chỉ xem — mọi thay đổi số dư phải đi
// qua joyService. Ghi bằng doc.save() để hook mã hoá của model (Bio) vẫn chạy.
import express from 'express';
import mongoose from 'mongoose';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import { hasAdminPermission } from '../../../shared/adminAccess.js';
import { logAdminAuditAction } from './adminShared.js';

const RESOURCES = {
  bios: {
    model: 'Bio', label: 'Thành viên', permission: 'users', ops: 'ru', search: ['email', 'displayName', 'phone'],
    list: ['email', 'displayName', 'phone', 'joyBalance', 'isEduVerified', 'createdAt'],
    edit: ['displayName', 'phone', 'headline', 'status', 'starVip', 'isEduVerified', 'isJoyWalletFrozen', 'profilePublic', 'trialExpiresAt', 'expiresAt'],
  },
  'support-tickets': {
    model: 'SupportTicket', label: 'Yêu cầu hỗ trợ', permission: 'support', ops: 'rud', search: ['email', 'fullName', 'issue'],
    list: ['fullName', 'email', 'status', 'createdAt'], edit: ['status', 'adminReply'], show: ['phone', 'issue', 'resolvedAt'],
  },
  bookings: {
    model: 'Booking', label: 'Đặt lịch tư vấn', permission: 'support', ops: 'rud', search: ['email', 'fullName', 'phone'],
    list: ['fullName', 'email', 'projectType', 'contacted', 'createdAt'], edit: ['contacted', 'notes'],
    show: ['phone', 'message', 'budget', 'timeline', 'voucherCode'],
  },
  'customer-projects': {
    model: 'CustomerProject', label: 'Dự án khách', permission: 'projects', ops: 'ru', search: ['projectId', 'name'],
    list: ['projectId', 'name', 'status', 'market', 'updatedAt'], edit: ['name', 'status', 'adminNote'],
  },
  packages: {
    model: 'Package', label: 'Gói dịch vụ', permission: 'commerce', ops: 'crud', search: ['name'],
    list: ['name', 'duration', 'durationUnit', 'giftCode'], edit: ['name', 'duration', 'durationUnit', 'color', 'giftCode'],
  },
  'utility-products': {
    model: 'UtilityProduct', label: 'Sản phẩm cửa hàng', permission: 'commerce', ops: 'crud', search: ['name', 'category'],
    list: ['name', 'priceJoy', 'category', 'stock', 'active'],
    edit: ['name', 'description', 'priceJoy', 'category', 'stock', 'active', 'imageUrl', 'productType', 'extendDays', 'tokenType', 'tokenAmount', 'radioMinutes'],
  },
  'utility-orders': {
    model: 'UtilityOrder', label: 'Đơn hàng', permission: 'commerce', ops: 'ru', search: ['email', 'productName', 'purchaseCode'],
    list: ['email', 'productName', 'priceJoy', 'status', 'createdAt'], edit: ['status'], show: ['purchaseCode'],
  },
  'promo-codes': {
    model: 'PromoCode', label: 'Mã giảm giá', permission: 'commerce', ops: 'crud', search: ['code'],
    list: ['code', 'discountType', 'discountValue', 'usedCount', 'active', 'expiresAt'],
    edit: ['code', 'discountType', 'discountValue', 'maxUses', 'minOrderJoy', 'applicableCategory', 'expiresAt', 'active'],
  },
  'gift-cards': {
    model: 'JoyGiftCard', label: 'Thẻ quà JOY', permission: 'commerce', ops: 'r', search: ['code', 'redeemedBy'],
    list: ['code', 'amount', 'redeemed', 'redeemedBy', 'expiresAt'], show: ['note', 'createdBy', 'redeemedAt'],
  },
  'joy-ledger': {
    model: 'JoyLedger', label: 'Sổ JOY', permission: 'commerce', ops: 'r', search: ['email', 'refId'],
    list: ['email', 'amount', 'balanceAfter', 'source', 'createdAt'], show: ['description', 'refId'],
  },
  'coder-resources': {
    model: 'CoderResource', label: 'Học liệu Coding', permission: 'learning', ops: 'crud', search: ['title'],
    list: ['title', 'type', 'stageId', 'pinned'], edit: ['title', 'type', 'stageId', 'description', 'url', 'body', 'readingMinutes', 'author', 'source', 'pinned'],
  },
  'cinema-movies': {
    model: 'CinemaMovie', label: 'Phim', permission: 'system', ops: 'rud', search: ['title'],
    list: ['title', 'year', 'category', 'views', 'active'], edit: ['title', 'description', 'category', 'year', 'active'],
  },
  'today-posts': {
    model: 'TodayPost', label: 'Bài Today', permission: 'security', ops: 'rd', search: ['authorEmail', 'text'],
    list: ['authorEmail', 'text', 'likeCount', 'replyCount', 'createdAt'],
  },
  'security-blocks': {
    model: 'SecurityBlock', label: 'Lệnh chặn', permission: 'security', ops: 'rud', search: ['reasonCode', 'lastCaseId'],
    list: ['subjectType', 'reasonCode', 'permanent', 'lockCount', 'expiresAt'], edit: ['permanent', 'expiresAt'], show: ['lastCaseId', 'lastLockedAt'],
  },
  'security-appeals': {
    model: 'SecurityAppeal', label: 'Kháng nghị', permission: 'security', ops: 'r', search: ['email', 'caseId'],
    list: ['email', 'caseId', 'status', 'createdAt'], show: ['imageUrl', 'decidedBy', 'decidedAt'],
  },
  'security-events': {
    model: 'SecurityEvent', label: 'Sự kiện an ninh', permission: 'security', ops: 'r', search: ['caseId', 'path'],
    list: ['category', 'severity', 'action', 'path', 'createdAt'], show: ['caseId', 'ruleId', 'method', 'network'],
  },
  'error-logs': {
    model: 'ErrorLog', label: 'Lỗi hệ thống', permission: 'system', ops: 'rd', search: ['message', 'source', 'path'],
    list: ['level', 'source', 'message', 'createdAt'], show: ['path', 'email', 'stack'],
  },
  'audit-logs': {
    model: 'AdminAuditLog', label: 'Nhật ký quản trị', permission: 'audit', ops: 'r', search: ['adminUsername', 'action', 'targetEmail'],
    list: ['adminUsername', 'action', 'targetEmail', 'createdAt'], show: ['ipAddress', 'details'],
  },
};

const models = {};
const modelOf = async (name) => (models[name] ||= (await import(`../../models/${name}.js`)).default);

const fieldSpec = (Model, name) => {
  const p = Model.schema.paths[name];
  const type = { String: 'text', Number: 'number', Boolean: 'bool', Date: 'date' }[p?.instance] || 'json';
  return { name, type, ...(p?.enumValues?.length ? { options: p.enumValues } : {}) };
};

const readable = (r) => [...new Set([...r.list, ...(r.edit || []), ...(r.show || [])])];
const toRecord = (doc, fields) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return Object.fromEntries([['id', String(obj._id)], ...fields.map((f) => [f, obj[f] ?? null])]);
};
const parse = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Gắn tài nguyên + quyền; thao tác không có trong `ops` trả 405.
const resource = (op) => async (req, res, next) => {
  const r = RESOURCES[req.params.resource];
  if (!r || !hasAdminPermission(req.admin.permissions, r.permission)) return res.status(404).json({ error: 'Không có bảng này.' });
  if (!r.ops.includes(op)) return res.status(405).json({ error: 'Bảng này không cho thao tác đó.' });
  req.resource = r;
  req.Model = await modelOf(r.model);
  next();
};

// Chỉ nhận các trường sửa được, ép kiểu theo schema; mọi thứ khác bị bỏ.
const writable = (r, body = {}) => Object.fromEntries((r.edit || []).filter((f) => f in body).map((f) => [f, body[f] === '' ? null : body[f]]));

const router = express.Router();

router.get('/data/_resources', requireAdmin, async (req, res, next) => {
  try {
    const out = [];
    for (const [id, r] of Object.entries(RESOURCES)) {
      if (!hasAdminPermission(req.admin.permissions, r.permission)) continue;
      const Model = await modelOf(r.model);
      out.push({ id, label: r.label, ops: r.ops, list: r.list.map((f) => fieldSpec(Model, f)), edit: (r.edit || []).map((f) => fieldSpec(Model, f)), show: (r.show || []).map((f) => fieldSpec(Model, f)) });
    }
    res.json(out);
  } catch (err) { next(err); }
});

router.get('/data/:resource', requireAdmin, resource('r'), async (req, res, next) => {
  try {
    const r = req.resource;
    const [sortField = 'createdAt', order = 'DESC'] = parse(req.query.sort, []);
    const [start = 0, end = 24] = parse(req.query.range, []).map(Number);
    const { q, id, ...rest } = parse(req.query.filter, {});
    const query = {};
    if (id) query._id = { $in: [].concat(id).filter((x) => mongoose.isValidObjectId(x)) };
    if (q) query.$or = r.search.map((f) => ({ [f]: { $regex: escapeRe(String(q).slice(0, 100)), $options: 'i' } }));
    for (const [f, v] of Object.entries(rest)) if (r.list.includes(f)) query[f] = v;
    const sortBy = sortField === 'id' ? '_id' : (r.list.includes(sortField) ? sortField : '_id');
    const limit = Math.min(Math.max(end - start + 1, 1), 100);
    const { Model } = req;
    const [docs, total] = await Promise.all([
      Model.find(query).sort({ [sortBy]: order === 'ASC' ? 1 : -1 }).skip(Math.max(start, 0)).limit(limit),
      Model.countDocuments(query),
    ]);
    res.set('Content-Range', `${req.params.resource} ${start}-${start + docs.length - 1}/${total}`);
    res.json(docs.map((d) => toRecord(d, r.list)));
  } catch (err) { next(err); }
});

router.get('/data/:resource/:id', requireAdmin, resource('r'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Không tìm thấy.' });
    const doc = await req.Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Không tìm thấy.' });
    res.json(toRecord(doc, readable(req.resource)));
  } catch (err) { next(err); }
});

router.post('/data/:resource', requireAdmin, resource('c'), async (req, res, next) => {
  try {
    const doc = await new req.Model(writable(req.resource, req.body)).save();
    await logAdminAuditAction(req, 'data_create', doc._id, '', req.params.resource);
    res.status(201).json(toRecord(doc, readable(req.resource)));
  } catch (err) { if (err.name === 'ValidationError') return res.status(400).json({ error: err.message }); next(err); }
});

router.put('/data/:resource/:id', requireAdmin, resource('u'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Không tìm thấy.' });
    const doc = await req.Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Không tìm thấy.' });
    const changes = writable(req.resource, req.body);
    doc.set(changes);
    const changed = doc.modifiedPaths();
    await doc.save();
    if (changed.length) await logAdminAuditAction(req, 'data_update', doc._id, doc.email || '', req.params.resource, { fields: changed });
    res.json(toRecord(doc, readable(req.resource)));
  } catch (err) { if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ error: err.message }); next(err); }
});

router.delete('/data/:resource/:id', requireAdmin, resource('d'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Không tìm thấy.' });
    const doc = await req.Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Không tìm thấy.' });
    await logAdminAuditAction(req, 'data_delete', doc._id, doc.email || '', req.params.resource);
    res.json(toRecord(doc, readable(req.resource)));
  } catch (err) { next(err); }
});

export default router;
