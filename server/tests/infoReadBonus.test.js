import { describe, it, expect, vi, beforeEach } from 'vitest';
import Bio from '../models/Bio.js';
import joyRoutes from '../routes/joyRoutes.js';
import { awardJoy } from '../utils/joyService.js';

const handlers = {};
joyRoutes.stack.forEach(layer => {
  if (layer.route) {
    const path = layer.route.path;
    const method = Object.keys(layer.route.methods)[0];
    const handler = layer.route.stack[layer.route.stack.length - 1].handle;
    handlers[`${method.toUpperCase()} ${path}`] = handler;
  }
});

vi.mock('../models/Bio.js', () => ({
  default: { findOne: vi.fn() },
}));

vi.mock('../utils/joyService.js', () => ({
  awardJoy: vi.fn().mockResolvedValue({ balance: 150 }),
  getJoyHistory: vi.fn(),
}));

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

describe('POST /claim-info-read-bonus — thưởng đọc hết bản nâng cấp 2.0', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    awardJoy.mockResolvedValue({ balance: 150 });
  });

  it('cộng 50 JOY và đánh dấu đã nhận trong lần đầu', async () => {
    const handler = handlers['POST /claim-info-read-bonus'];
    expect(handler).toBeTruthy();

    const save = vi.fn().mockResolvedValue(true);
    Bio.findOne.mockResolvedValue({ email: 'user@test.vn', infoReadBonusClaimed: false, joyBalance: 100, save });

    const res = mockRes();
    await handler({ memberEmail: 'user@test.vn' }, res);

    expect(awardJoy).toHaveBeenCalledWith('user@test.vn', 50, 'info_read_bonus', expect.any(String));
    expect(save).toHaveBeenCalled();
    expect(res.body).toEqual({ success: true, balance: 150 });
  });

  it('không cộng thêm lần thứ hai', async () => {
    const handler = handlers['POST /claim-info-read-bonus'];
    const save = vi.fn();
    Bio.findOne.mockResolvedValue({ email: 'user@test.vn', infoReadBonusClaimed: true, joyBalance: 150, save });

    const res = mockRes();
    await handler({ memberEmail: 'user@test.vn' }, res);

    expect(awardJoy).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(res.body).toEqual({ success: true, alreadyClaimed: true, balance: 150 });
  });

  it('lấy danh tính từ req.memberEmail, không nhận email do client gửi', async () => {
    const handler = handlers['POST /claim-info-read-bonus'];
    const save = vi.fn().mockResolvedValue(true);
    Bio.findOne.mockResolvedValue({ email: 'real@test.vn', infoReadBonusClaimed: false, joyBalance: 0, save });

    const res = mockRes();
    await handler({ memberEmail: 'real@test.vn', body: { email: 'attacker@evil.vn' } }, res);

    expect(Bio.findOne).toHaveBeenCalledWith({ email: 'real@test.vn' });
    expect(awardJoy).toHaveBeenCalledWith('real@test.vn', 50, 'info_read_bonus', expect.any(String));
  });
});
