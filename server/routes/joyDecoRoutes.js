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
      .map(c => ({
        _id: c._id,
        slug: c.slug,
        displayName: c.displayName,
        avatarUrl: c.avatarUrl,
        decoRoom: c.decoRoom
      }));

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
      awardJoy(
        sender.email, -numAmount, 'deco_tip_sent',
        `Tip cho Ký Túc Xá của ${recipient.displayName} (-${numAmount} JOY). Mã GD: ${txCode}.`,
        { refId: txCode, bioDoc: sender }
      ),
      awardJoy(
        recipient.email, numAmount, 'deco_tip_received',
        `${senderName} đã ghé thăm Ký Túc Xá và tip cho bạn ${numAmount} JOY. Mã GD: ${txCode}.`,
        {
          refId: txCode,
          bioDoc: recipient,
          notificationTitle: 'Khách ghé thăm Ký Túc Xá',
          notificationMessage: `${senderName} thấy phòng bạn quá đẹp nên đã tip ${numAmount} JOY!`,
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
      `Thuê bao/Gia hạn KTX HugoHome: ${plan === 'daily' ? `${durationDays} ngày` : plan === 'monthly' ? '1 tháng' : '6 tháng'} (Giá: ${basePrice} JOY, Phí sáng tạo: ${creatorFee} JOY)`,
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
      return res.json({ success: true, balance: visitor.joyBalance, visitedRooms: visitor.decoRoom.visitedRooms });
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
        `Mua vé tham quan KTX của ${host.displayName} (-${ticketPrice} JOY). Mã GD: ${txCode}.`,
        { refId: txCode, bioDoc: visitor, skipSave: true }
      ),
      awardJoy(
        host.email, ticketPrice, 'deco_visit_received',
        `${visitor.displayName || 'Một người bạn'} đã mua vé ghé thăm phòng của bạn (+${ticketPrice} JOY). Mã GD: ${txCode}.`,
        {
          refId: txCode,
          bioDoc: host,
          notificationTitle: 'Khách mua vé tham quan',
          notificationMessage: `${visitor.displayName || 'Một người bạn'} đã mua vé 10 JOY để tham quan phòng bạn!`,
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

    res.json({ success: true, balance: visitorResult.balance, visitedRooms: visitor.decoRoom.visitedRooms });
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
      lastCleanedAt: bio.decoRoom.lastCleanedAt
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
    await bio.save();

    res.json({ success: true, petFedAt: bio.decoRoom.petFedAt });
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
