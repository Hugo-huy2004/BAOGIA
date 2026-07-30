import express from 'express';
import Bio from '../models/Bio.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { awardJoy } from '../utils/joyService.js';
import { checkAndResetDecoRoom, updateTrashAndPetStatus } from '../utils/decoHelper.js';

const router = express.Router();

// Store configuration - the single source of truth for Deco items and prices.
const DECO_STORE = {
  // Desks
  desk_basic: { type: 'desk', price: 0, name: 'Bàn gỗ cơ bản' },
  desk_cyber: { type: 'desk', price: 800, name: 'Bàn Gaming Cyberpunk' },
  desk_minimal: { type: 'desk', price: 300, name: 'Bàn Trắng Minimal' },
  
  // Chairs
  chair_basic: { type: 'chair', price: 0, name: 'Ghế đẩu' },
  chair_gaming: { type: 'chair', price: 600, name: 'Ghế Gaming' },
  chair_office: { type: 'chair', price: 200, name: 'Ghế văn phòng êm ái' },

  // Computers
  laptop: { type: 'computer', price: 0, name: 'Laptop sinh viên' },
  pc_master_race: { type: 'computer', price: 1200, name: 'PC Master Race (3 Màn hình)' },
  macbook: { type: 'computer', price: 500, name: 'MacBook Pro' },

  // Pets
  cat_orange: { type: 'pet', price: 400, name: 'Mèo Cam béo' },
  cat_black: { type: 'pet', price: 400, name: 'Mèo Đen mun' },
  dog_corgi: { type: 'pet', price: 600, name: 'Chó Corgi mông to' },

  // Posters
  poster_hugo: { type: 'poster', price: 100, name: 'Poster Hugo Studio' },
  poster_anime: { type: 'poster', price: 200, name: 'Poster Anime' },
  poster_cyberpunk: { type: 'poster', price: 250, name: 'Poster Cyberpunk' },

  // Windows (day/night ambiance — powers the room's light mode)
  window_day: { type: 'window', price: 0, name: 'Cửa sổ ban ngày' },
  window_night: { type: 'window', price: 350, name: 'Cửa sổ đêm sao' },

  // Rugs (floor accent)
  rug_round: { type: 'rug', price: 150, name: 'Thảm tròn ấm áp' },
  rug_persian: { type: 'rug', price: 400, name: 'Thảm hoa văn Ba Tư' },

  // Plants (corner greenery)
  plant_fern: { type: 'plant', price: 120, name: 'Chậu Dương Xỉ 🌿' },
  plant_monstera: { type: 'plant', price: 300, name: 'Cây Monstera' },
  plant_cactus: { type: 'plant', price: 180, name: 'Xương Rồng mini' },

  // Lamps (mood lighting)
  lamp_floor: { type: 'lamp', price: 250, name: 'Đèn cây góc phòng' },
  lamp_neon: { type: 'lamp', price: 500, name: 'Đèn Neon LED' },

  // Shelves (wall-mounted accessory)
  shelf_wood: { type: 'shelf', price: 220, name: 'Kệ sách gỗ treo tường' },
  shelf_neon: { type: 'shelf', price: 450, name: 'Kệ Neon RGB' },

  // Wall Clocks (accessory)
  clock_wall: { type: 'clock', price: 150, name: 'Đồng hồ tròn cổ điển' },
  clock_neon: { type: 'clock', price: 380, name: 'Đồng hồ Neon Digital' },

  // Extra ambiance & accessories
  window_sunset: { type: 'window', price: 300, name: 'Cửa sổ hoàng hôn' },
  poster_galaxy: { type: 'poster', price: 280, name: 'Poster Dải Ngân Hà' },
  rug_cloud: { type: 'rug', price: 260, name: 'Thảm Mây bồng bềnh' },
  pet_bunny: { type: 'pet', price: 500, name: 'Thỏ Trắng tai cụp' },

  // Wall Colors
  wall_white: { type: 'wallColor', price: 0, name: 'Tường Trắng Kem' },
  wall_pink: { type: 'wallColor', price: 100, name: 'Tường Hồng Pastel' },
  wall_blue: { type: 'wallColor', price: 120, name: 'Tường Xanh Mint' },
  wall_dark: { type: 'wallColor', price: 200, name: 'Tường Indigo Tối' },
  wall_yellow: { type: 'wallColor', price: 150, name: 'Tường Vàng Chanh' },

  // Floor Styles
  wood_basic: { type: 'floorStyle', price: 0, name: 'Sàn Gỗ Ấm' },
  floor_wood_dark: { type: 'floorStyle', price: 200, name: 'Sàn Gỗ Óc Chó' },
  floor_tile_white: { type: 'floorStyle', price: 100, name: 'Sàn Gạch Trắng' },
  floor_tile_checker: { type: 'floorStyle', price: 150, name: 'Sàn Gạch Caro' }
};

const DECO_STORY = Object.freeze([
  {
    chapter: 1,
    title: 'Chiếc chìa khóa phòng 27',
    reward: 80,
    unlocks: ['wall_pink', 'plant_fern', 'rug_round'],
    requirements: [
      { id: 'clean', label: 'Dọn 2 đống rác đầu tiên' },
      { id: 'move', label: 'Kéo và sắp xếp lại ít nhất 1 món đồ' }
    ]
  },
  {
    chapter: 2,
    title: 'Một góc thuộc về mình',
    reward: 100,
    unlocks: ['poster_hugo', 'lamp_floor'],
    requirements: [
      { id: 'wall', label: 'Đổi màu bức tường cũ' },
      { id: 'green', label: 'Đặt một chậu cây trong phòng' },
      { id: 'cozy50', label: 'Đạt 50% độ ấm cúng' }
    ]
  },
  {
    chapter: 3,
    title: 'Bưu kiện không ghi tên',
    reward: 130,
    unlocks: ['cat_orange'],
    requirements: [
      { id: 'poster', label: 'Treo poster Hugo bí ẩn' },
      { id: 'lamp', label: 'Bật một nguồn sáng mới' }
    ]
  },
  {
    chapter: 4,
    title: 'Vị khách dưới mái hiên',
    reward: 150,
    unlocks: ['window_night'],
    requirements: [
      { id: 'pet', label: 'Cho một người bạn nhỏ vào phòng' },
      { id: 'feed', label: 'Chăm sóc và cho bạn ấy ăn' },
      { id: 'clean3', label: 'Đã dọn tổng cộng 3 đống rác' }
    ]
  },
  {
    chapter: 5,
    title: 'Đêm mở cửa Hugo Campus',
    reward: 300,
    unlocks: [],
    requirements: [
      { id: 'night', label: 'Chuyển căn phòng sang khung cảnh đêm' },
      { id: 'cozy70', label: 'Đạt 70% độ ấm cúng' },
      { id: 'public', label: 'Bật trưng bày phòng trên Bio' }
    ]
  }
]);

function roomCoziness(items = {}) {
  const filled = ['desk', 'chair', 'computer', 'window', 'poster', 'rug', 'plant', 'lamp', 'shelf', 'clock', 'pet']
    .filter((slot) => items?.[slot]).length;
  return Math.min(100, Math.round((filled / 11) * 80) + (items?.pet ? 12 : 0) + (items?.plant ? 8 : 0));
}

function ensureStoryContainer(room) {
  if (!room.story) room.story = {};
  if (!room.story.stats) room.story.stats = {};
  if (!Array.isArray(room.story.claimedChapters)) room.story.claimedChapters = [];
  return room.story;
}

function vietnamDayKey(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

function getDailyRoomState(room = {}) {
  const todayKey = vietnamDayKey();
  const items = room.items || {};
  const hasPet = Boolean(items.pet);
  const requirements = [
    {
      id: 'daily_clean',
      label: 'Dọn phòng hôm nay và giữ tối đa 2 đống rác',
      complete: vietnamDayKey(room.lastCleanedAt || 0) === todayKey && Number(room.trashCount ?? 6) <= 2
    },
    {
      id: 'daily_cozy',
      label: 'Duy trì độ ấm cúng từ 70%',
      complete: roomCoziness(items) >= 70
    },
    {
      id: 'daily_pet',
      label: hasPet ? 'Chăm sóc thú cưng hôm nay' : 'Không có thú cưng cần chăm sóc',
      complete: !hasPet || vietnamDayKey(room.petFedAt || 0) === todayKey
    },
    {
      id: 'daily_public',
      label: 'Giữ căn phòng mở trưng bày',
      complete: Boolean(room.enabled)
    }
  ];
  const claimedToday = room.story?.lastDailyClaimKey === todayKey;
  return {
    reward: 50,
    dayKey: todayKey,
    claimedToday,
    ready: !claimedToday && requirements.every((requirement) => requirement.complete),
    streak: Number(room.story?.dailyStreak || 0),
    requirements
  };
}

function evaluateStoryRequirement(id, room = {}) {
  const items = room.items || {};
  const storyStats = room.story?.stats || {};
  const wall = room.wallColor || 'wall_white';
  const positions = room.positions || {};
  const checks = {
    clean: Number(storyStats.cleaned || 0) >= 2,
    move: Object.keys(positions).length >= 1,
    wall: wall !== 'wall_white' && wall !== '#f4f4f5',
    green: Boolean(items.plant),
    cozy50: roomCoziness(items) >= 50,
    poster: items.poster === 'poster_hugo',
    lamp: Boolean(items.lamp),
    pet: Boolean(items.pet),
    feed: Number(storyStats.fed || 0) >= 1,
    clean3: Number(storyStats.cleaned || 0) >= 3,
    night: items.window === 'window_night',
    cozy70: roomCoziness(items) >= 70,
    public: Boolean(room.enabled)
  };
  return Boolean(checks[id]);
}

function getStoryState(room = {}) {
  const claimedChapters = [...new Set((room.story?.claimedChapters || []).map(Number))]
    .filter((chapter) => chapter >= 1 && chapter <= DECO_STORY.length)
    .sort((a, b) => a - b);
  const activeChapter = DECO_STORY.find((entry) => !claimedChapters.includes(entry.chapter)) || null;
  const chapter = activeChapter
    ? {
        ...activeChapter,
        requirements: activeChapter.requirements.map((requirement) => ({
          ...requirement,
          complete: evaluateStoryRequirement(requirement.id, room)
        }))
      }
    : null;
  return {
    claimedChapters,
    activeChapter: chapter,
    completed: !activeChapter,
    totalChapters: DECO_STORY.length,
    daily: !activeChapter ? getDailyRoomState(room) : null,
    stats: {
      cleaned: Number(room.story?.stats?.cleaned || 0),
      fed: Number(room.story?.stats?.fed || 0)
    }
  };
}

// GET /api/deco/store - Returns the catalog of items
router.get('/store', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    await checkAndResetDecoRoom(bio);
    await updateTrashAndPetStatus(bio);

    res.json({
      store: DECO_STORE,
      unlockedItems: bio.decoRoom?.unlockedItems || [],
      expiresAt: bio.decoRoom?.expiresAt || null,
      visitedRooms: bio.decoRoom?.visitedRooms || [],
      lastCleanedAt: bio.decoRoom?.lastCleanedAt || null,
      trashCount: bio.decoRoom?.trashCount ?? 6,
      petStatus: bio.decoRoom?.petStatus || 'alive',
      petFedAt: bio.decoRoom?.petFedAt || null,
      story: getStoryState(bio.decoRoom),
      balance: bio.joyBalance || 0,
      email: bio.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/deco/buy - Buy an item with JOY
router.post('/buy', requireMember, async (req, res) => {
  try {
    const { itemId } = req.body;
    const email = req.memberEmail;

    if (!itemId || !DECO_STORE[itemId]) {
      return res.status(400).json({ error: 'Vật phẩm không hợp lệ.' });
    }

    const itemDef = DECO_STORE[itemId];

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    // Make sure decoRoom is initialized
    if (!bio.decoRoom) bio.decoRoom = {};
    if (!bio.decoRoom.unlockedItems) bio.decoRoom.unlockedItems = [];

    if (bio.decoRoom.unlockedItems.includes(itemId)) {
      return res.status(400).json({ error: 'Bạn đã sở hữu vật phẩm này rồi.' });
    }

    if (itemDef.price > 0) {
      if (bio.joyBalance < itemDef.price) {
        return res.status(400).json({ error: `Bạn không đủ JOY. Cần ${itemDef.price} JOY để mua vật phẩm này.` });
      }

      // Deduct JOY
      const { balance } = await awardJoy(
        bio.email,
        -itemDef.price,
        'deco_buy',
        `Mua sắm nội thất KTX: ${itemDef.name}`,
        { bioDoc: bio, skipSave: true }
      );
    }

    bio.decoRoom.unlockedItems.push(itemId);
    bio.markModified('decoRoom.unlockedItems');
    await bio.save();

    res.json({ success: true, balance: bio.joyBalance, unlockedItems: bio.decoRoom.unlockedItems });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/save - Save room configuration
router.post('/save', requireMember, async (req, res) => {
  try {
    const { enabled, wallColor, floorStyle, items, positions } = req.body;
    const email = req.memberEmail;

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    if (!bio.decoRoom) bio.decoRoom = { unlockedItems: [], positions: {} };
    const unlocked = bio.decoRoom.unlockedItems || [];

    // Security: ensure users only place items they have unlocked or are free
    const cleanItems = {};
    if (items) {
      for (const [slot, itemId] of Object.entries(items)) {
        if (!itemId) {
          cleanItems[slot] = null;
          continue;
        }
        
        const itemDef = DECO_STORE[itemId];
        // Must be a valid item, and either free or unlocked
        if (itemDef && (itemDef.price === 0 || unlocked.includes(itemId))) {
          cleanItems[slot] = itemId;
        }
      }
    }

    bio.decoRoom.enabled = !!enabled;
    if (wallColor) {
      if (wallColor.startsWith('#')) {
        bio.decoRoom.wallColor = wallColor;
      } else {
        const wallDef = DECO_STORE[wallColor];
        if (wallDef && (wallDef.price === 0 || unlocked.includes(wallColor))) {
          bio.decoRoom.wallColor = wallColor;
        } else {
          return res.status(400).json({ error: 'Bạn chưa sở hữu màu tường này.' });
        }
      }
    }
    if (floorStyle) {
      const floorDef = DECO_STORE[floorStyle];
      if (floorDef && (floorDef.price === 0 || unlocked.includes(floorStyle))) {
        bio.decoRoom.floorStyle = floorStyle;
      } else if (['wood_basic', 'wood_dark', 'tile_white', 'tile_checker'].includes(floorStyle)) {
        bio.decoRoom.floorStyle = floorStyle;
      } else {
        return res.status(400).json({ error: 'Bạn chưa sở hữu kiểu sàn này.' });
      }
    }
    
    // Merge cleanItems properly without spreading mongoose subdocument
    const prevPet = bio.decoRoom.items?.pet || null;
    if (cleanItems) {
      for (const [k, v] of Object.entries(cleanItems)) {
        bio.decoRoom.items[k] = v;
      }
    }

    // Pet lifecycle: a dead pet can only be revived or removed. Whenever the
    // pet slot changes (removed, or a new pet equipped), the old death state
    // must not carry over — reset status and restart the hunger clock.
    const nextPet = bio.decoRoom.items?.pet || null;
    if (nextPet !== prevPet) {
      bio.decoRoom.petStatus = 'alive';
      bio.decoRoom.petFedAt = new Date();
      bio.markModified('decoRoom.petStatus');
      bio.markModified('decoRoom.petFedAt');
    }

    // Merge positions
    if (positions) {
      // Need to stringify/parse to strip mongoose internals if any, though positions is Mixed.
      const oldPos = bio.decoRoom.positions ? JSON.parse(JSON.stringify(bio.decoRoom.positions)) : {};
      bio.decoRoom.positions = { ...oldPos, ...positions };
      bio.markModified('decoRoom.positions');
    }

    bio.markModified('decoRoom.items');
    await bio.save();

    res.json({ success: true, decoRoom: bio.decoRoom });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/story/claim - Server-verified chapter completion.
router.post('/story/claim', requireMember, async (req, res) => {
  try {
    const requestedChapter = Number(req.body?.chapter);
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    const currentState = getStoryState(bio.decoRoom);
    if (currentState.completed) {
      return res.json({ success: true, alreadyClaimed: true, story: currentState, balance: bio.joyBalance });
    }

    const active = currentState.activeChapter;
    if (!Number.isInteger(requestedChapter) || requestedChapter !== active.chapter) {
      return res.status(409).json({
        error: `Bạn cần hoàn thành chương ${active.chapter} trước.`,
        story: currentState
      });
    }

    const incomplete = active.requirements.filter((requirement) => !requirement.complete);
    if (incomplete.length) {
      return res.status(400).json({
        error: 'Bạn vẫn còn nhiệm vụ chưa hoàn thành.',
        missing: incomplete.map((requirement) => requirement.id),
        story: currentState
      });
    }

    // Reserve the chapter atomically before awarding JOY. This blocks double
    // taps and two open devices from claiming the same chapter twice.
    const update = {
      $addToSet: {
        'decoRoom.story.claimedChapters': requestedChapter,
        ...(active.unlocks.length ? { 'decoRoom.unlockedItems': { $each: active.unlocks } } : {})
      }
    };
    const reservation = await Bio.updateOne(
      {
        _id: bio._id,
        'decoRoom.story.claimedChapters': { $ne: requestedChapter }
      },
      update
    );

    if (!reservation.modifiedCount) {
      const latest = await Bio.findById(bio._id);
      return res.json({
        success: true,
        alreadyClaimed: true,
        story: getStoryState(latest?.decoRoom),
        balance: latest?.joyBalance || 0,
        unlockedItems: latest?.decoRoom?.unlockedItems || []
      });
    }

    const rewardResult = await awardJoy(
      bio.email,
      active.reward,
      'deco_story',
      `Hoàn thành chương ${active.chapter}: ${active.title}`,
      {
        refId: `deco-story-${active.chapter}`,
        notificationTitle: `Hoàn thành “${active.title}”`,
        notificationMessage: `Chương mới của HugoRoom đã được mở khóa.`,
        actionUrl: '/member/utilities/deco'
      }
    );

    const isFinalChapter = requestedChapter === DECO_STORY.length;
    if (isFinalChapter) {
      await Bio.updateOne(
        { _id: bio._id },
        { $set: { 'decoRoom.story.completedAt': new Date() } }
      );
    }

    const latest = await Bio.findById(bio._id);
    res.json({
      success: true,
      reward: active.reward,
      unlocked: active.unlocks,
      balance: rewardResult.balance,
      unlockedItems: latest?.decoRoom?.unlockedItems || [],
      story: getStoryState(latest?.decoRoom)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/story/daily-claim - 50 JOY for maintaining a completed room.
router.post('/story/daily-claim', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    await updateTrashAndPetStatus(bio);
    const state = getStoryState(bio.decoRoom);
    if (!state.completed) {
      return res.status(403).json({ error: 'Hãy hoàn thành toàn bộ 5 chương trước.', story: state });
    }

    const daily = state.daily;
    if (daily.claimedToday) {
      return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance, story: state });
    }
    if (!daily.ready) {
      return res.status(400).json({
        error: 'Căn phòng chưa hoàn thành nhịp sống hôm nay.',
        missing: daily.requirements.filter((requirement) => !requirement.complete).map((requirement) => requirement.id),
        story: state
      });
    }

    const yesterdayKey = vietnamDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const nextStreak = bio.decoRoom.story?.lastDailyClaimKey === yesterdayKey
      ? Number(bio.decoRoom.story?.dailyStreak || 0) + 1
      : 1;
    const reservation = await Bio.updateOne(
      {
        _id: bio._id,
        'decoRoom.story.lastDailyClaimKey': { $ne: daily.dayKey }
      },
      {
        $set: {
          'decoRoom.story.lastDailyClaimKey': daily.dayKey,
          'decoRoom.story.dailyStreak': nextStreak
        }
      }
    );

    if (!reservation.modifiedCount) {
      const latest = await Bio.findById(bio._id);
      return res.json({
        success: true,
        alreadyClaimed: true,
        balance: latest?.joyBalance || 0,
        story: getStoryState(latest?.decoRoom)
      });
    }

    const reward = await awardJoy(
      bio.email,
      50,
      'deco_daily',
      `Duy trì phòng 27 ngày ${daily.dayKey} · chuỗi ${nextStreak} ngày`,
      {
        refId: `deco-daily-${daily.dayKey}`,
        notificationTitle: `Phòng 27 sáng đèn · ${nextStreak} ngày`,
        notificationMessage: 'Bạn đã hoàn thành toàn bộ nhịp sống hôm nay.',
        actionUrl: '/member/utilities/deco'
      }
    );

    const latest = await Bio.findById(bio._id);
    res.json({
      success: true,
      reward: 50,
      balance: reward.balance,
      story: getStoryState(latest?.decoRoom)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

function distanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function publicNeighborEnvironment(profile = {}) {
  const source = profile.lastLocationCheck?.lat != null
    ? profile.lastLocationCheck
    : profile.trustedLocation?.lat != null
      ? profile.trustedLocation
      : null;
  const addressParts = String(profile.address || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  // Never expose a street-level address or precise coordinates. Two trailing
  // administrative components are enough to tell the story of the place.
  const area = addressParts.length >= 2
    ? addressParts.slice(-2).join(', ')
    : 'Khu vực lân cận';
  return {
    area,
    weatherPoint: source
      ? {
          lat: Math.round(Number(source.lat) * 10) / 10,
          lon: Math.round(Number(source.lng) * 10) / 10
        }
      : null
  };
}

function publicRoomView(room = {}) {
  return {
    enabled: Boolean(room.enabled),
    wallColor: room.wallColor,
    floorStyle: room.floorStyle,
    items: room.items || {},
    positions: room.positions || {},
    trashCount: Number(room.trashCount || 0),
    petStatus: room.petStatus || 'alive',
    story: {
      claimedChapters: room.story?.claimedChapters || []
    }
  };
}

// GET /api/deco/neighborhood - Fetch Deco Rooms within 50km radius (both online/offline)
router.get('/neighborhood', requireMember, async (req, res) => {
  try {
    const fromEmail = req.memberEmail;
    const requesterBio = await Bio.findOne({ email: fromEmail });
    if (!requesterBio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    let lat = req.query.lat ? parseFloat(req.query.lat) : null;
    let lng = req.query.lng ? parseFloat(req.query.lng) : null;

    if (lat === null || lng === null) {
      if (requesterBio.lastLocationCheck && requesterBio.lastLocationCheck.lat !== null) {
        lat = requesterBio.lastLocationCheck.lat;
        lng = requesterBio.lastLocationCheck.lng;
      } else if (requesterBio.trustedLocation && requesterBio.trustedLocation.lat !== null) {
        lat = requesterBio.trustedLocation.lat;
        lng = requesterBio.trustedLocation.lng;
      }
    }
    
    // Fetch all bios (both online and offline)
    const candidates = await Bio.find(
      {},
      "slug displayName avatarUrl decoRoom trustedLocation lastLocationCheck address"
    ).lean();

    // Filter within 50km
    const filtered = candidates
      .filter(c => {
        // Skip self
        if (c.slug === requesterBio.slug) return false;
        // The neighborhood is an exhibition of rooms their owners explicitly
        // made public. Never leak private/disabled room layouts.
        if (!c.decoRoom?.enabled) return false;
        
        let cLat = null;
        let cLng = null;
        if (c.lastLocationCheck && c.lastLocationCheck.lat !== null) {
          cLat = c.lastLocationCheck.lat;
          cLng = c.lastLocationCheck.lng;
        } else if (c.trustedLocation && c.trustedLocation.lat !== null) {
          cLat = c.trustedLocation.lat;
          cLng = c.trustedLocation.lng;
        }
        
        if (cLat === null || cLng === null) {
          // Address keyword fallback
          if (requesterBio.address && c.address) {
            const clean = str => str.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
            const reqWords = clean(requesterBio.address).filter(w => w.length >= 3);
            const candWords = clean(c.address).filter(w => w.length >= 3);
            const matches = reqWords.some(w => candWords.includes(w));
            if (matches) return true;
          }
          return false;
        }
        
        const dist = distanceKm(lat, lng, cLat, cLng);
        return dist !== null && dist <= 50;
      })
      .map(c => {
        const hasAccess = requesterBio.decoRoom?.visitedRooms?.includes(c.slug) || false;
        return {
          _id: c._id,
          slug: c.slug,
          displayName: c.displayName,
          avatarUrl: c.avatarUrl,
          hasAccess,
          // A ticket protects the actual layout. Before purchase the client
          // receives only enough metadata to render a locked teaser.
          decoRoom: hasAccess ? publicRoomView(c.decoRoom) : null,
          teaser: {
            night: c.decoRoom?.items?.window === 'window_night',
            coziness: roomCoziness(c.decoRoom?.items || {})
          },
          environment: publicNeighborEnvironment(c)
        };
      });

    // Sample up to 20
    const neighbors = filtered.sort(() => 0.5 - Math.random()).slice(0, 20);

    res.json({ success: true, neighbors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/deco/knock - Knock on someone's door
// Does not require auth (public visitors can knock)
router.post('/knock', async (req, res) => {
  try {
    const { targetSlug } = req.body;
    if (!targetSlug) return res.status(400).json({ error: 'Missing targetSlug' });

    const targetBio = await Bio.findOne({ slug: targetSlug });
    if (!targetBio) return res.status(404).json({ error: 'Bio not found' });

    // In a real app, this would dispatch a websocket message to the target user.
    // For now, we return success so the frontend can show a confirmation.
    // Optionally, we could log it in `history` but we don't want to spam it.
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/tip - Donate JOY to a bio owner
router.post('/tip', requireMember, async (req, res) => {
  try {
    const { targetSlug, amount } = req.body;
    const fromEmail = req.memberEmail;
    
    if (!targetSlug || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const numAmount = Number(amount);
    if (!Number.isInteger(numAmount) || numAmount < 10 || numAmount > 100) {
      return res.status(400).json({ error: 'Số tiền Tip (bonus) phải nằm trong khoảng từ 10 - 100 JOY.' });
    }

    const sender = await Bio.findOne({ email: fromEmail });
    if (!sender) return res.status(404).json({ error: 'Sender not found' });

    const recipient = await Bio.findOne({ slug: targetSlug });
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    if (sender.email === recipient.email) {
      return res.status(400).json({ error: 'Không thể tự Tip cho chính mình.' });
    }

    if (sender.joyBalance < numAmount) {
      return res.status(400).json({ error: 'Số dư JOY không đủ.' });
    }

    // Execute transfer
    const txCode = `TIP${Date.now().toString(36).toUpperCase()}`;
    const senderName = sender.displayName || 'Một người bạn';

    const [senderResult] = await Promise.all([
      // Mô tả không nhắc lại số JOY và mã GD: cả hai đã là field riêng trên
      // thông báo (amount/refCode) và được hiện ở cột phải.
      awardJoy(
        sender.email, -numAmount, 'deco_tip_sent',
        `Tip cho Ký Túc Xá của ${recipient.displayName}.`,
        { refId: txCode, bioDoc: sender, counterparty: recipient.displayName || '' }
      ),
      awardJoy(
        recipient.email, numAmount, 'deco_tip_received',
        `${senderName} đã ghé thăm Ký Túc Xá và tip cho bạn.`,
        {
          refId: txCode,
          bioDoc: recipient,
          counterparty: senderName,
          notificationTitle: `${senderName} đã tip cho Ký Túc Xá của bạn`,
          notificationMessage: 'Khách thấy phòng bạn quá đẹp nên để lại một chút JOY.',
          pushNotify: true,
          pushTitle: 'Khách ghé thăm Ký Túc Xá',
          pushBody: `${senderName} đã tip cho bạn ${numAmount} JOY!`,
          actionUrl: '/member/joy'
        }
      )
    ]);

    res.json({ success: true, balance: senderResult.balance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/rent - Rent or extend subscription for HugoHome (with flexible schemes)
router.post('/rent', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    let { plan, days } = req.body || {};
    if (!plan) plan = 'monthly'; // default to monthly for legacy requests

    let durationDays = 30;
    let basePrice = 299;
    let creatorFee = 30;

    if (plan === 'daily') {
      const numDays = Math.floor(Number(days));
      if (isNaN(numDays) || numDays < 1) {
        return res.status(400).json({ error: 'Số ngày thuê không hợp lệ.' });
      }
      durationDays = numDays;
      basePrice = durationDays * 15;
      creatorFee = Math.ceil(basePrice * 0.1);
    } else if (plan === 'monthly') {
      durationDays = 30;
      basePrice = 299;
      creatorFee = 30;
    } else if (plan === 'long') {
      durationDays = 180;
      basePrice = 1500;
      creatorFee = 150;
    } else {
      return res.status(400).json({ error: 'Gói thuê bao không hợp lệ.' });
    }

    const totalPrice = basePrice + creatorFee;

    if (bio.joyBalance < totalPrice) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${totalPrice} JOY để thanh toán gói thuê bao.` });
    }

    // Deduct total JOY
    const { balance } = await awardJoy(
      bio.email,
      -totalPrice,
      'deco_rent',
      // Tổng tiền đã là field `amount`; ở đây chỉ giữ phần tách giá/phí vì đó
      // là thông tin người dùng KHÔNG suy ra được từ tổng.
      `Gia hạn ${plan === 'daily' ? `${durationDays} ngày` : plan === 'monthly' ? '1 tháng' : '6 tháng'} · giá ${basePrice} JOY + ${creatorFee} JOY phí sáng tạo.`,
      { bioDoc: bio, skipSave: true }
    );

    // Update expiresAt
    const now = new Date();
    let currentExpires = bio.decoRoom?.expiresAt ? new Date(bio.decoRoom.expiresAt) : null;
    const durationMs = durationDays * 24 * 60 * 60 * 1000;

    if (!currentExpires || currentExpires < now) {
      bio.decoRoom.expiresAt = new Date(now.getTime() + durationMs);
    } else {
      bio.decoRoom.expiresAt = new Date(currentExpires.getTime() + durationMs);
    }

    bio.markModified('decoRoom.expiresAt');
    await bio.save();

    res.json({ success: true, balance: bio.joyBalance, expiresAt: bio.decoRoom.expiresAt });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/visit - Buy entrance ticket to visit another user's room (10 JOY)
router.post('/visit', requireMember, async (req, res) => {
  try {
    const { targetSlug } = req.body;
    const visitorEmail = req.memberEmail;

    if (!targetSlug) return res.status(400).json({ error: 'Thiếu mã phòng (targetSlug).' });

    const visitor = await Bio.findOne({ email: visitorEmail });
    if (!visitor) return res.status(404).json({ error: 'Không tìm thấy tài khoản người viếng thăm.' });

    const host = await Bio.findOne({ slug: targetSlug });
    if (!host) return res.status(404).json({ error: 'Không tìm thấy phòng ký túc xá.' });

    if (visitor.email === host.email) {
      return res.status(400).json({ error: 'Bạn không cần mua vé vào phòng của chính mình.' });
    }

    // Make sure visitedRooms array exists
    if (!visitor.decoRoom) visitor.decoRoom = {};
    if (!visitor.decoRoom.visitedRooms) visitor.decoRoom.visitedRooms = [];

    // If already paid to visit, return success immediately
    if (visitor.decoRoom.visitedRooms.includes(targetSlug)) {
      return res.json({
        success: true,
        alreadyOwned: true,
        balance: visitor.joyBalance,
        visitedRooms: visitor.decoRoom.visitedRooms,
        neighbor: {
          slug: host.slug,
          displayName: host.displayName,
          avatarUrl: host.avatarUrl,
          decoRoom: publicRoomView(host.decoRoom),
          hasAccess: true,
          environment: publicNeighborEnvironment(host)
        }
      });
    }

    const ticketPrice = 10;
    if (visitor.joyBalance < ticketPrice) {
      return res.status(400).json({ error: `Số dư JOY không đủ mua vé. Vé vào cổng là ${ticketPrice} JOY.` });
    }

    const txCode = `VST${Date.now().toString(36).toUpperCase()}`;

    // Execute transfer: visitor -> host
    const [visitorResult] = await Promise.all([
      awardJoy(
        visitor.email, -ticketPrice, 'deco_visit_sent',
        `Mua vé tham quan Ký Túc Xá của ${host.displayName}.`,
        { refId: txCode, bioDoc: visitor, skipSave: true, counterparty: host.displayName || '' }
      ),
      awardJoy(
        host.email, ticketPrice, 'deco_visit_received',
        `${visitor.displayName || 'Một người bạn'} đã mua vé ghé thăm phòng của bạn.`,
        {
          refId: txCode,
          bioDoc: host,
          counterparty: visitor.displayName || 'Một người bạn',
          notificationTitle: `${visitor.displayName || 'Một người bạn'} đã ghé thăm phòng bạn`,
          // Giá vé lấy từ biến, không viết cứng "10 JOY" — sửa giá là câu này sai.
          notificationMessage: 'Khách đã mua vé để vào tham quan Ký Túc Xá của bạn.',
          pushNotify: true,
          pushTitle: 'Khách mua vé tham quan',
          pushBody: `${visitor.displayName || 'Một người bạn'} đã ghé thăm phòng bạn!`,
          actionUrl: '/member/joy'
        }
      )
    ]);

    visitor.decoRoom.visitedRooms.push(targetSlug);
    visitor.markModified('decoRoom.visitedRooms');
    await visitor.save();

    res.json({
      success: true,
      balance: visitorResult.balance,
      visitedRooms: visitor.decoRoom.visitedRooms,
      neighbor: {
        slug: host.slug,
        displayName: host.displayName,
        avatarUrl: host.avatarUrl,
        decoRoom: publicRoomView(host.decoRoom),
        hasAccess: true,
        environment: publicNeighborEnvironment(host)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/clean - Sweep 1 trash pile and get 5 JOY reward (max 6 piles, 1h spawn interval)
router.post('/clean', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    // Sync trashCount first
    await updateTrashAndPetStatus(bio);

    const currentTrash = bio.decoRoom?.trashCount ?? 0;
    if (currentTrash <= 0) {
      return res.status(400).json({ error: 'Phòng KTX đang rất sạch sẽ, không có rác để dọn dẹp! ✨' });
    }

    // Decrement trash count
    const nextTrash = currentTrash - 1;
    bio.decoRoom.trashCount = nextTrash;
    bio.markModified('decoRoom.trashCount');

    const now = new Date();
    // If we just cleaned the last piece, reset spawn anchor
    if (nextTrash === 0) {
      bio.decoRoom.lastTrashSpawnedAt = now;
      bio.markModified('decoRoom.lastTrashSpawnedAt');
    }
    bio.decoRoom.lastCleanedAt = now;
    bio.markModified('decoRoom.lastCleanedAt');
    ensureStoryContainer(bio.decoRoom);
    bio.decoRoom.story.stats.cleaned = Number(bio.decoRoom.story?.stats?.cleaned || 0) + 1;
    bio.markModified('decoRoom.story.stats.cleaned');

    // Award 5 JOY
    const cleanReward = 5;
    const { balance } = await awardJoy(
      bio.email,
      cleanReward,
      'deco_clean',
      'Phần thưởng quét dọn rác KTX HugoHome (+5 JOY)',
      { bioDoc: bio, skipSave: true }
    );

    await bio.save();

    res.json({ 
      success: true, 
      balance: bio.joyBalance, 
      trashCount: bio.decoRoom.trashCount,
      lastCleanedAt: bio.decoRoom.lastCleanedAt,
      story: getStoryState(bio.decoRoom)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/feed-pet - Feed equipped pet for free to reset 24h hunger timer
router.post('/feed-pet', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    await updateTrashAndPetStatus(bio);

    if (!bio.decoRoom?.items?.pet) {
      return res.status(400).json({ error: 'Bạn chưa nuôi thú cưng trong phòng KTX!' });
    }

    if (bio.decoRoom.petStatus === 'dead') {
      return res.status(400).json({ error: 'Thú cưng đã qua đời, bạn cần hồi sinh trước khi cho ăn.' });
    }

    const now = new Date();
    bio.decoRoom.petFedAt = now;
    bio.markModified('decoRoom.petFedAt');
    ensureStoryContainer(bio.decoRoom);
    bio.decoRoom.story.stats.fed = Number(bio.decoRoom.story?.stats?.fed || 0) + 1;
    bio.markModified('decoRoom.story.stats.fed');
    await bio.save();

    res.json({
      success: true,
      petFedAt: bio.decoRoom.petFedAt,
      story: getStoryState(bio.decoRoom)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/deco/revive-pet - Revive pet for 99 JOY
router.post('/revive-pet', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    await updateTrashAndPetStatus(bio);

    if (!bio.decoRoom?.items?.pet) {
      return res.status(400).json({ error: 'Bạn chưa nuôi thú cưng trong phòng KTX!' });
    }

    if (bio.decoRoom.petStatus !== 'dead') {
      return res.status(400).json({ error: 'Thú cưng vẫn đang sống khỏe mạnh! 🐾' });
    }

    const price = 99;
    if (bio.joyBalance < price) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${price} JOY để hồi sinh thú cưng.` });
    }

    const { balance } = await awardJoy(
      bio.email,
      -price,
      'store_purchase',
      'Chi phí hồi sinh thú cưng KTX HugoHome',
      { bioDoc: bio, skipSave: true }
    );

    const now = new Date();
    bio.decoRoom.petStatus = 'alive';
    bio.decoRoom.petFedAt = now;
    bio.markModified('decoRoom.petStatus');
    bio.markModified('decoRoom.petFedAt');
    await bio.save();

    res.json({ 
      success: true, 
      balance: bio.joyBalance, 
      petStatus: bio.decoRoom.petStatus, 
      petFedAt: bio.decoRoom.petFedAt 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
