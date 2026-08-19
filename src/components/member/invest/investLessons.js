/**
 * Giáo trình sàn ảo Hugo — đã được đồng bộ ngôn ngữ (i18n).
 */
export const getLessons = (t) => [
  "co-phieu",
  "gia-dong",
  "rui-ro",
  "gia-von",
  "co-tuc",
  "da-dang-hoa",
  "ky-luat",
  "canh-bao"
].map(id => ({
  id,
  title: t(`invest.lessons.${id}.title`),
  summary: t(`invest.lessons.${id}.summary`),
  body: t(`invest.lessons.${id}.body`, { returnObjects: true }),
}));
