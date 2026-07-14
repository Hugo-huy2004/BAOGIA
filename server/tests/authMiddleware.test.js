import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireMember, requireAdmin, requireCustomer, signMemberToken, signCustomerToken } from '../middleware/authMiddleware.js';
import { JWT_SECRET } from '../utils/secrets.js';

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

const run = (middleware, req) => {
  const res = mockRes();
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  return { res, nextCalled };
};

describe('requireMember', () => {
  it('rejects requests with no token', () => {
    const { res, nextCalled } = run(requireMember, { cookies: {}, headers: {}, query: {}, body: {} });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('accepts a valid member token via Bearer header and binds identity from it', () => {
    const token = signMemberToken('Alice@Example.edu');
    const req = {
      cookies: {},
      headers: { authorization: `Bearer ${token}` },
      query: { email: 'victim@example.com' }, // attacker-supplied — must be ignored
      body: {},
    };
    const { nextCalled } = run(requireMember, req);
    expect(nextCalled).toBe(true);
    expect(req.memberEmail).toBe('alice@example.edu'); // normalized, from token not query
  });

  it('accepts a valid member token via member_jwt cookie', () => {
    const token = signMemberToken('bob@example.edu');
    const req = { cookies: { member_jwt: token }, headers: {}, query: {}, body: {} };
    const { nextCalled } = run(requireMember, req);
    expect(nextCalled).toBe(true);
    expect(req.memberEmail).toBe('bob@example.edu');
  });

  it('rejects a forged token signed with the wrong secret', () => {
    const forged = jwt.sign({ email: 'victim@example.com', role: 'member' }, 'not-the-real-secret');
    const req = { cookies: {}, headers: { authorization: `Bearer ${forged}` }, query: {}, body: {} };
    const { res, nextCalled } = run(requireMember, req);
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('rejects an expired member token', () => {
    const expired = jwt.sign({ email: 'a@b.edu', role: 'member' }, JWT_SECRET, { expiresIn: -10 });
    const req = { cookies: { member_jwt: expired }, headers: {}, query: {}, body: {} };
    const { res, nextCalled } = run(requireMember, req);
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('lets an admin act on a target email from the request', () => {
    const adminToken = jwt.sign({ id: '1', role: 'admin' }, JWT_SECRET);
    const req = { cookies: { jwt: adminToken }, headers: {}, query: { email: 'Target@Example.edu' }, body: {} };
    const { nextCalled } = run(requireMember, req);
    expect(nextCalled).toBe(true);
    expect(req.isAdminActor).toBe(true);
    expect(req.memberEmail).toBe('target@example.edu');
  });

  it('accepts an admin token with no target email (id-addressed routes)', () => {
    const adminToken = jwt.sign({ id: '1', role: 'admin' }, JWT_SECRET);
    const req = { cookies: { jwt: adminToken }, headers: {}, query: {}, body: {} };
    const { nextCalled } = run(requireMember, req);
    expect(nextCalled).toBe(true);
    expect(req.isAdminActor).toBe(true);
    expect(req.memberEmail).toBeNull();
  });
});

describe('requireCustomer', () => {
  it('rejects requests with no token', () => {
    const { res, nextCalled } = run(requireCustomer, { cookies: {}, headers: {}, params: { id: 'anything' } });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('binds projectId from the token, ignoring the :id in the URL (no IDOR)', () => {
    const token = signCustomerToken('myProjectId');
    const req = { cookies: { customer_jwt: token }, headers: {}, params: { id: 'someoneElsesProjectId' } };
    const { nextCalled } = run(requireCustomer, req);
    expect(nextCalled).toBe(true);
    expect(req.customerRole).toBe('customer');
    expect(req.projectId).toBe('myProjectId'); // from token, NOT the attacker-supplied :id
  });

  it('lets an admin act on the project named by :id', () => {
    const adminToken = jwt.sign({ id: '1', role: 'admin' }, JWT_SECRET);
    const req = { cookies: { jwt: adminToken }, headers: {}, params: { id: 'targetProject' } };
    const { nextCalled } = run(requireCustomer, req);
    expect(nextCalled).toBe(true);
    expect(req.customerRole).toBe('admin');
    expect(req.projectId).toBe('targetProject');
  });

  it('rejects a forged customer token', () => {
    const forged = jwt.sign({ projectId: 'x', role: 'customer' }, 'wrong-secret');
    const req = { cookies: { customer_jwt: forged }, headers: {}, params: { id: 'x' } };
    const { res, nextCalled } = run(requireCustomer, req);
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('rejects a member token on customer routes (wrong role)', () => {
    const token = signMemberToken('m@e.edu');
    const req = { cookies: { customer_jwt: token }, headers: {}, params: { id: 'x' } };
    const { res, nextCalled } = run(requireCustomer, req);
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });
});

describe('requireAdmin', () => {
  it('rejects a member token on admin routes', () => {
    const token = signMemberToken('member@example.edu');
    const req = { cookies: { jwt: token }, headers: {} };
    const { res, nextCalled } = run(requireAdmin, req);
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('accepts a valid admin token', () => {
    const token = jwt.sign({ id: '1', role: 'admin' }, JWT_SECRET);
    const req = { cookies: { jwt: token }, headers: {} };
    const { nextCalled } = run(requireAdmin, req);
    expect(nextCalled).toBe(true);
  });
});
