#!/usr/bin/env node
// Đồng bộ thư viện phim công cộng Hugo Cinema từ Internet Archive vào MongoDB.
//
//   node server/scripts/syncCinema.mjs              # ghi vào MongoDB
//   node server/scripts/syncCinema.mjs --dry        # chỉ in ra, không ghi
//   node server/scripts/syncCinema.mjs --selfcheck  # kiểm tra hàm bóc metadata
//
// Admin cũng bấm được cùng việc này ở tab "Quản trị Phim Cinema"
// (POST /api/cinema/admin/sync).
import assert from 'node:assert/strict';
import process from 'node:process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PUBLIC_DOMAIN_FILMS,
  buildMovieDoc,
  formatDuration,
  parseRuntimeSeconds,
  pickVideoFiles,
  plainText,
  syncCinemaLibrary,
} from '../services/cinemaLibrary.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(serverDir, '.env') });

/** Kiểm tra phần dễ sai nhất: bóc thời lượng và chọn file phát. */
function selfcheck() {
  assert.equal(parseRuntimeSeconds('1:31:44'), 5504);
  assert.equal(parseRuntimeSeconds('01:14:43'), 4483);
  assert.equal(parseRuntimeSeconds('51:56'), 3116);
  assert.equal(parseRuntimeSeconds('0:16:36'), 996);
  assert.equal(parseRuntimeSeconds('108 min'), 6480);
  assert.equal(parseRuntimeSeconds('89 min.'), 5340);
  assert.equal(parseRuntimeSeconds('1:33.13'), 5593, 'runtime kiểu "1:33.13" của Nosferatu');
  assert.equal(parseRuntimeSeconds('596.5'), 597, 'length của file derivative là số giây');
  assert.equal(parseRuntimeSeconds(''), 0);
  assert.equal(parseRuntimeSeconds('không rõ'), 0);

  assert.equal(formatDuration(5504), '1h 32m');
  assert.equal(formatDuration(996), '17m');
  assert.equal(formatDuration(0), '');

  const picked = pickVideoFiles([
    { name: 'his_girl_friday.mpeg', size: '900000000' },
    { name: 'his_girl_friday.mp4', size: '401207987', width: '640', height: '480' },
    { name: 'his_girl_friday_512kb.mp4', size: '90000000', width: '320', height: '240' },
    { name: 'thumb.jpg', size: '12000' },
  ]);
  assert.equal(picked.primary.name, 'his_girl_friday.mp4', 'bản nét nhất làm nguồn chính');
  assert.equal(picked.fallback.name, 'his_girl_friday_512kb.mp4', 'derivative nhẹ làm đường lùi');

  // Nét hơn thắng dung lượng: bản 1080p nén tốt vẫn phải được chọn trước bản
  // 480p nặng gấp ba lần.
  const hd = pickVideoFiles([
    { name: 'phim_480p.mp4', size: '600000000', width: '640', height: '480' },
    { name: 'phim_1080p.mp4', size: '200000000', width: '1920', height: '1080' },
  ]);
  assert.equal(hd.primary.name, 'phim_1080p.mp4', 'ưu tiên độ phân giải, không phải dung lượng');

  // Trần 1080p: bản 4K 2.8GB không được chọn khi item có bản 480p xem được.
  const capped = pickVideoFiles([
    { name: 'bbb_4k.webm', size: '2964000000', width: '4000', height: '2250' },
    { name: 'bbb.mp4', size: '62000000', width: '854', height: '480' },
  ]);
  assert.equal(capped.primary.name, 'bbb.mp4', 'bỏ qua bản trên 1080p khi còn bản khác');
  const onlyHuge = pickVideoFiles([{ name: 'charge_1608p.mp4', size: '192000000', width: '3840', height: '1608' }]);
  assert.equal(onlyHuge.primary.name, 'charge_1608p.mp4', 'chỉ có bản 4K thì vẫn phải phát được');
  assert.equal(pickVideoFiles([{ name: 'scan.pdf' }]), null, 'không có video thì trả null');
  const single = pickVideoFiles([{ name: 'only.mp4', size: '10' }]);
  assert.equal(single.fallback, null, 'chỉ một file thì không tự nhân đôi làm dự phòng');

  assert.equal(plainText('<p>Xin <b>chào</b></p>&amp;'), 'Xin chào\n\n&');
  assert.equal(plainText('a'.repeat(20), 10), `${'a'.repeat(10)}…`);

  const ids = new Set(PUBLIC_DOMAIN_FILMS.map((f) => f.id));
  assert.equal(ids.size, PUBLIC_DOMAIN_FILMS.length, 'danh sách phim không được trùng id');

  console.log('syncCinema selfcheck: đạt.');
}

async function dryRun() {
  for (const film of PUBLIC_DOMAIN_FILMS) {
    // Internet Archive thỉnh thoảng để một request treo tới hết timeout. Một
    // phim hỏng không được làm chết cả lượt kiểm tra 40 phim còn lại.
    const doc = await buildMovieDoc(film).catch((error) => {
      console.log(`✗ ${film.id} — ${error.message}`);
      return null;
    });
    if (!doc) {
      console.log(`✗ ${film.id} — không có file video`);
      continue;
    }
    console.log(
      `✓ ${doc.title} | ${doc.year || '?'} | ${doc.duration || '?'} | ${doc.category} | ${doc.license || 'không ghi giấy phép'}`
    );
  }
}

const flags = process.argv.slice(2);

if (flags.includes('--selfcheck')) {
  selfcheck();
} else if (flags.includes('--dry')) {
  await dryRun();
} else {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hugo';
  await mongoose.connect(uri);
  const result = await syncCinemaLibrary({ log: (line) => console.log(`  ${line}`) });
  console.log(
    `\nĐã lưu ${result.saved}/${result.total} phim, rút ${result.removed} phim khỏi kệ.`
      + (result.skipped.length ? ` Bỏ qua: ${result.skipped.join(', ')}` : '')
  );
  await mongoose.disconnect();
}
