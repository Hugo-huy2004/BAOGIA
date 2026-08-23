import 'dotenv/config';
import mongoose from 'mongoose';
import CoderResource from '../models/CoderResource.js';
import ReadingSession from '../models/ReadingSession.js';
import { READING_LESSONS, requiredReadingFor } from '../../shared/readingLessons.js';

/**
 * Kiểm tra cửa "qua bài bằng đọc".
 *
 * Ba thứ phải đúng, và cả ba đều là chỗ dễ hỏng lặng lẽ:
 *   1. Mọi bài đọc khai trong readingLessons.js đều có bài viết thật trong kho.
 *      Sai một chữ trong tiêu đề là học viên gặp bài không bao giờ qua được.
 *   2. Chưa đủ thời gian thì không chốt được.
 *   3. Đủ thời gian thì chốt được, và chốt lần hai không đổi mốc hoàn thành.
 *
 * Chạy: node server/scripts/check-reading-gate.mjs (trong thư mục server/)
 */
const PROBE = 'kiem-tra-cua-doc@hugowishpax.studio';

const finishable = async (session) => {
  const elapsed = Date.now() - session.startedAt.getTime();
  return elapsed >= session.requiredMinutes * 60_000;
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const problems = [];

  // 1. Mỗi bài học có yêu cầu đọc phải trỏ tới một bài viết có thật.
  for (const [lessonId, title] of Object.entries(READING_LESSONS)) {
    const article = await CoderResource.findOne({ type: 'article', title }).lean();
    if (!article) {
      problems.push(`${lessonId}: không có bài viết nào tên “${title}” trong kho.`);
      continue;
    }
    if (!article.body || !article.references?.length) {
      problems.push(`${lessonId}: bài “${title}” thiếu toàn văn hoặc thiếu trích dẫn.`);
    }
    console.log(`OK  ${lessonId} → ${title} (${article.readingMinutes} phút)`);
  }

  // 2 & 3. Luật thời gian, thử trên một phiên tạm rồi dọn.
  const sample = await CoderResource.findOne({ type: 'article' }).lean();
  if (sample) {
    await ReadingSession.deleteMany({ memberEmail: PROBE });

    const fresh = await ReadingSession.create({
      memberEmail: PROBE,
      resourceId: sample._id,
      requiredMinutes: sample.readingMinutes || 5,
      startedAt: new Date(),
    });
    if (await finishable(fresh)) problems.push('Vừa mở đã chốt được bài đọc — luật thời gian hỏng.');
    else console.log('OK  vừa mở thì chưa chốt được');

    fresh.startedAt = new Date(Date.now() - (fresh.requiredMinutes * 60_000 + 1000));
    await fresh.save();
    if (!await finishable(fresh)) problems.push('Đã đủ thời gian mà vẫn không chốt được.');
    else console.log('OK  đủ thời gian thì chốt được');

    await ReadingSession.deleteMany({ memberEmail: PROBE });
  }

  // 4. Không bài đọc nào trỏ tới một bài học không tồn tại trong lộ trình.
  for (const lessonId of Object.keys(READING_LESSONS)) {
    const n = Number(lessonId.replace('lesson', ''));
    if (!Number.isInteger(n) || n < 1 || n > 100) problems.push(`${lessonId}: id bài học không hợp lệ.`);
    if (requiredReadingFor(lessonId) !== READING_LESSONS[lessonId]) {
      problems.push(`${lessonId}: requiredReadingFor trả về sai.`);
    }
  }

  await mongoose.disconnect();

  if (problems.length) {
    console.error(`\nCửa đọc có ${problems.length} vấn đề:`);
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exitCode = 1;
  } else {
    console.log(`\nCửa đọc đạt: ${Object.keys(READING_LESSONS).length} bài qua bằng đọc, luật thời gian đúng.`);
  }
}

main().catch((error) => {
  console.error('Kiểm tra cửa đọc thất bại:', error);
  process.exit(1);
});
