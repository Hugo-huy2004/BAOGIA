#!/usr/bin/env node
// Kiểm tra một tên đăng nhập admin CÓ TỒN TẠI trong MongoDB hay không.
// Không hỏi mật khẩu, không in mật khẩu, không in băm.
//
//   node server/scripts/check-admin-login.mjs <tên-đăng-nhập>
//
// Có vì một lỗi thật đã tốn cả buổi để lần ra: bản ghi Admin lưu username dưới
// dạng băm SHA-256 (xem phần seed trong server.js), còn route đăng nhập lại đi
// tìm đúng chữ người dùng gõ — nên /api/admin/login trả 401 kể cả khi mật khẩu
// đúng, và màn hình không nói được là sai tên hay sai mật khẩu.
import crypto from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(serverDir, '.env') });

const input = process.argv[2];
if (!input) {
  console.error('Cách dùng: node server/scripts/check-admin-login.mjs <tên-đăng-nhập>');
  process.exit(1);
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const raw = input.trim();
const lookups = [...new Set([sha256(raw), sha256(raw.toLowerCase()), raw.toLowerCase()])];

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hugo');
const total = await Admin.countDocuments();
const found = await Admin.findOne({ username: { $in: lookups } }).lean();

if (found) {
  console.log(`✓ Có tài khoản admin khớp tên "${raw}" (tạo ${found.createdAt?.toISOString?.().slice(0, 10) || '?'}).`);
  console.log('  Đăng nhập vẫn 401 thì là sai mật khẩu, không phải sai tên.');
} else {
  console.log(`✗ Không có tài khoản admin nào khớp tên "${raw}". Trong cơ sở dữ liệu đang có ${total} tài khoản.`);
  console.log('  Tạo tài khoản đầu tiên: đặt ADMIN_SEED_USERNAME + ADMIN_SEED_PASSWORD trong server/.env rồi khởi động lại server (chỉ chạy khi chưa có tài khoản nào).');
}

await mongoose.disconnect();
