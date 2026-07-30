import { cozinessScore } from './decoAssets';

export const DECO_STORY_CHAPTERS = Object.freeze([
  {
    chapter: 1,
    title: 'Chiếc chìa khóa phòng 27',
    kicker: 'Hồi I · Ngày chuyển đến',
    scene: '17:42 · Hugo Campus',
    summary: 'Một chiếc chìa khóa cũ, căn phòng bị bỏ quên và lời nhắn duy nhất từ người thuê trước.',
    dialogue: '“Nếu cậu khiến căn phòng này sống lại, nó sẽ chỉ đường đến những người đang cần một nơi để thuộc về.”',
    narrator: 'Mây',
    accent: '#f6b56b',
    reward: 80,
    unlockLabels: ['Tường hồng Pastel', 'Chậu Dương Xỉ', 'Thảm tròn ấm áp'],
  },
  {
    chapter: 2,
    title: 'Một góc thuộc về mình',
    kicker: 'Hồi II · Dấu vết đầu tiên',
    scene: '07:15 · Sáng hôm sau',
    summary: 'Ánh sáng trở lại. Mây muốn bạn biến căn phòng vô danh thành nơi phản chiếu chính mình.',
    dialogue: '“Đừng trang trí để gây ấn tượng. Hãy đặt vào đây một thứ khiến cậu muốn quay về.”',
    narrator: 'Mây',
    accent: '#75d7b7',
    reward: 100,
    unlockLabels: ['Poster Hugo bí ẩn', 'Đèn cây góc phòng'],
  },
  {
    chapter: 3,
    title: 'Bưu kiện không ghi tên',
    kicker: 'Hồi III · Tín hiệu trên tường',
    scene: '22:08 · Một tối mưa',
    summary: 'Một bưu kiện xuất hiện trước cửa. Bên trong là poster Hugo và bóng đèn chỉ sáng khi được đặt đúng chỗ.',
    dialogue: '“Có người vẫn đang theo dõi căn phòng 27. Hãy treo thông điệp lên và bật tín hiệu.”',
    narrator: 'Mây',
    accent: '#9b83ff',
    reward: 130,
    unlockLabels: ['Mèo Cam béo'],
  },
  {
    chapter: 4,
    title: 'Vị khách dưới mái hiên',
    kicker: 'Hồi IV · Một nhịp tim mới',
    scene: '05:36 · Sau cơn mưa',
    summary: 'Tiếng cào cửa khe khẽ đánh thức bạn. Một người bạn nhỏ đang chờ được cho vào.',
    dialogue: '“Một căn phòng chỉ thật sự sống khi có ai đó được chăm sóc trong nó.”',
    narrator: 'Mây',
    accent: '#ff8eab',
    reward: 150,
    unlockLabels: ['Cửa sổ đêm sao'],
  },
  {
    chapter: 5,
    title: 'Đêm mở cửa Hugo Campus',
    kicker: 'Hồi cuối · Ánh đèn hành lang',
    scene: '20:00 · Đêm triển lãm',
    summary: 'Căn phòng 27 đã sẵn sàng trở thành ngọn đèn đầu tiên của khu phố sáng tạo.',
    dialogue: '“Mở cửa đi. Có thể một người ngoài kia cũng đang tìm kiếm cảm giác được thuộc về.”',
    narrator: 'Mây',
    accent: '#63b8ff',
    reward: 300,
    unlockLabels: ['Danh hiệu Người giữ ánh sáng'],
  },
]);

export function chapterMeta(chapter) {
  return DECO_STORY_CHAPTERS.find((entry) => entry.chapter === Number(chapter)) || DECO_STORY_CHAPTERS[0];
}

function localRequirementComplete(id, room = {}, stats = {}) {
  const items = room.items || {};
  const wall = room.wallColor || 'wall_white';
  const checks = {
    clean: Number(stats.cleaned || 0) >= 2,
    move: Object.keys(room.positions || {}).length >= 1,
    wall: wall !== 'wall_white' && wall !== '#f4f4f5',
    green: Boolean(items.plant),
    cozy50: cozinessScore(items) >= 50,
    poster: items.poster === 'poster_hugo',
    lamp: Boolean(items.lamp),
    pet: Boolean(items.pet),
    feed: Number(stats.fed || 0) >= 1,
    clean3: Number(stats.cleaned || 0) >= 3,
    night: items.window === 'window_night',
    cozy70: cozinessScore(items) >= 70,
    public: Boolean(room.enabled),
  };
  return Boolean(checks[id]);
}

function localDayKey(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function withLocalStoryProgress(story, room) {
  if (!story) return story;
  if (!story.activeChapter && story.daily) {
    const today = localDayKey();
    const items = room.items || {};
    const requirements = story.daily.requirements.map((requirement) => {
      const checks = {
        daily_clean: localDayKey(room.lastCleanedAt || 0) === today && Number(room.trashCount ?? 6) <= 2,
        daily_cozy: cozinessScore(items) >= 70,
        daily_pet: !items.pet || localDayKey(room.petFedAt || 0) === today,
        daily_public: Boolean(room.enabled),
      };
      return { ...requirement, complete: Boolean(checks[requirement.id]) };
    });
    return {
      ...story,
      daily: {
        ...story.daily,
        requirements,
        ready: !story.daily.claimedToday && requirements.every((requirement) => requirement.complete),
      },
    };
  }
  if (!story.activeChapter) return story;
  const stats = story.stats || {};
  return {
    ...story,
    activeChapter: {
      ...story.activeChapter,
      requirements: story.activeChapter.requirements.map((requirement) => ({
        ...requirement,
        complete: localRequirementComplete(requirement.id, room, stats),
      })),
    },
  };
}
