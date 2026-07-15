import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import Bio from '../models/Bio.js';
import joyRoutes from '../routes/joyRoutes.js';

// Extract handlers
const handlers = {};
joyRoutes.stack.forEach(layer => {
  if (layer.route) {
    const path = layer.route.path;
    const method = Object.keys(layer.route.methods)[0];
    // The last element in the route's middleware stack is the handler itself
    const handler = layer.route.stack[layer.route.stack.length - 1].handle;
    handlers[`${method.toUpperCase()} ${path}`] = handler;
  }
});

vi.mock('../models/Bio.js', () => {
  return {
    default: {
      findOne: vi.fn(),
    }
  };
});

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

describe('Ví JOY — Mã PIN & Idempotency Key', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /has-pin', () => {
    it('trả về hasPin = false nếu chưa cài PIN', async () => {
      const handler = handlers['GET /has-pin'];
      expect(handler).toBeTruthy();

      const mockBio = { email: 'user@test.vn', transactionPin: null };
      Bio.findOne.mockResolvedValue(mockBio);

      const req = { memberEmail: 'user@test.vn' };
      const res = mockRes();

      await handler(req, res);

      expect(res.body).toEqual({ hasPin: false });
    });

    it('trả về hasPin = true nếu đã cài PIN', async () => {
      const handler = handlers['GET /has-pin'];
      const mockBio = { email: 'user@test.vn', transactionPin: 'hashed_pin_value' };
      Bio.findOne.mockResolvedValue(mockBio);

      const req = { memberEmail: 'user@test.vn' };
      const res = mockRes();

      await handler(req, res);

      expect(res.body).toEqual({ hasPin: true });
    });
  });

  describe('POST /set-pin', () => {
    it('chặn mã PIN không hợp lệ (không phải 6 chữ số)', async () => {
      const handler = handlers['POST /set-pin'];
      const req = { memberEmail: 'user@test.vn', body: { pin: '12345' } };
      const res = mockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('6 chữ số');
    });

    it('băm mật khẩu và lưu mã PIN hợp lệ', async () => {
      const handler = handlers['POST /set-pin'];
      const saveSpy = vi.fn().mockResolvedValue(true);
      const mockBio = { email: 'user@test.vn', save: saveSpy };
      Bio.findOne.mockResolvedValue(mockBio);

      const req = { memberEmail: 'user@test.vn', body: { pin: '123456' } };
      const res = mockRes();

      await handler(req, res);

      expect(saveSpy).toHaveBeenCalled();
      expect(mockBio.transactionPin).toBeTruthy();
      expect(mockBio.transactionPin).not.toBe('123456'); // Phải được băm
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /verify-pin', () => {
    it('trả về success = true nếu khớp PIN', async () => {
      const handler = handlers['POST /verify-pin'];
      const hashedPin = await bcrypt.hash('654321', 10);
      const mockBio = { email: 'user@test.vn', transactionPin: hashedPin };
      Bio.findOne.mockResolvedValue(mockBio);

      const req = { memberEmail: 'user@test.vn', body: { pin: '654321' } };
      const res = mockRes();

      await handler(req, res);

      expect(res.body.success).toBe(true);
    });

    it('trả về success = false nếu không khớp PIN', async () => {
      const handler = handlers['POST /verify-pin'];
      const hashedPin = await bcrypt.hash('654321', 10);
      const mockBio = { email: 'user@test.vn', transactionPin: hashedPin };
      Bio.findOne.mockResolvedValue(mockBio);

      const req = { memberEmail: 'user@test.vn', body: { pin: '000000' } };
      const res = mockRes();

      await handler(req, res);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /transfer - Bảo mật mở rộng', () => {
    it('ngăn chặn request trùng lặp (Idempotency Key)', async () => {
      const handler = handlers['POST /transfer'];
      const req = {
        memberEmail: 'sender@test.vn',
        body: {
          toEmail: 'receiver@test.vn',
          amount: 50,
          idempotencyKey: 'test-uuid-key-1'
        }
      };
      
      const res1 = mockRes();
      const res2 = mockRes();

      // Mock user profiles
      const senderBio = { email: 'sender@test.vn', joyBalance: 100, transactionPin: null };
      Bio.findOne.mockResolvedValueOnce(senderBio); // For sender lookup

      // Trigger first request
      await handler(req, res1);

      // Trigger second duplicate request
      await handler(req, res2);

      // The second request should be blocked with 409 Conflict
      expect(res2.statusCode).toBe(409);
      expect(res2.body.error).toContain('đang được xử lý hoặc đã gửi trước đó');
    });

    it('yêu cầu và xác thực PIN giao dịch nếu tài khoản gửi đã cài PIN', async () => {
      const handler = handlers['POST /transfer'];
      const hashedPin = await bcrypt.hash('999999', 10);
      const senderBio = { email: 'sender@test.vn', joyBalance: 100, transactionPin: hashedPin };
      Bio.findOne.mockResolvedValue(senderBio);

      // Request không gửi kèm PIN
      const reqNoPin = {
        memberEmail: 'sender@test.vn',
        body: { toEmail: 'receiver@test.vn', amount: 50 }
      };
      const resNoPin = mockRes();
      await handler(reqNoPin, resNoPin);
      expect(resNoPin.statusCode).toBe(400);
      expect(resNoPin.body.error).toContain('cung cấp mã PIN');

      // Request gửi kèm sai PIN
      const reqWrongPin = {
        memberEmail: 'sender@test.vn',
        body: { toEmail: 'receiver@test.vn', amount: 50, pin: '000000' }
      };
      const resWrongPin = mockRes();
      await handler(reqWrongPin, resWrongPin);
      expect(resWrongPin.statusCode).toBe(400);
      expect(resWrongPin.body.error).toContain('không chính xác');
    });
  });
});
