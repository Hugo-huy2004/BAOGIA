#!/usr/bin/env node
// Đặt lại tài khoản quản trị (khôi phục khi quên tên đăng nhập / mật khẩu).
//
//   node server/scripts/reset-admin.mjs <tên-đăng-nhập> <mật-khẩu-mới>
//
// Chạy được vì người chạy đã có quyền vào máy chủ và chuỗi kết nối MongoDB
// trong server/.env — đúng mức quyền của chủ hệ thống. Script KHÔNG đọc, không
// giải và không in mật khẩu cũ: nó chỉ ghi đè bằng bản băm bcrypt mới.
//
// Vì sao cần: phần seed trong server.js chỉ chạy khi CHƯA có tài khoản nào
// (`count === 0`), nên một khi đã lỡ quên thì không còn đường nào vào lại.
import crypto from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(serverDir, '.env') });

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Cách dùng: node server/scripts/reset-admin.mjs <tên-đăng-nhập> <mật-khẩu-mới>');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Mật khẩu phải từ 10 ký tự trở lên — trang đăng nhập admin nằm ngoài Internet.');
  process.exit(1);
}

// Cùng quy ước với phần seed trong server.js: username lưu dạng băm tra cứu,
// mật khẩu băm bcrypt (có muối, chậm).
const usernameHash = crypto.createHash('sha256').update(username.trim()).digest('hex');

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hugo');
const existing = await Admin.findOne({ username: usernameHash });

if (existing) {
  existing.password = await bcrypt.hash(password, 12);
  await existing.save();
  console.log(`✓ Đã đặt lại mật khẩu cho tài khoản "${username}".`);
} else {
  await Admin.create({ username: usernameHash, password: await bcrypt.hash(password, 12) });
  console.log(`✓ Đã tạo tài khoản quản trị "${username}".`);
}

const total = await Admin.countDocuments();
console.log(`  Tổng số tài khoản quản trị: ${total}.`);
console.log('  Đăng nhập ở /login → tab Quản trị, rồi nhập mã OTP 4 số gửi qua Telegram.');
await mongoose.disconnect();
