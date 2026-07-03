import express from 'express';
import Bio from '../models/Bio.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { awardJoy } from '../utils/joyService.js';

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
  lamp_neon: { type: 'lamp', price: 500, name: 'Đèn Neon LED' }
};

// GET /api/deco/store - Returns the catalog of items
router.get('/store', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    res.json({
      store: DECO_STORE,
      unlockedItems: bio.decoRoom?.unlockedItems || [],
      balance: bio.joyBalance || 0
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
    const { enabled, wallColor, floorStyle, items } = req.body;
    const email = req.memberEmail;

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    if (!bio.decoRoom) bio.decoRoom = { unlockedItems: [] };
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
    if (wallColor) bio.decoRoom.wallColor = wallColor;
    if (floorStyle) bio.decoRoom.floorStyle = floorStyle;
    
    // Merge cleanItems
    bio.decoRoom.items = { ...bio.decoRoom.items, ...cleanItems };

    bio.markModified('decoRoom');
    await bio.save();

    res.json({ success: true, decoRoom: bio.decoRoom });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/deco/neighborhood - Fetch a random list of enabled Deco Rooms
router.get('/neighborhood', requireMember, async (req, res) => {
  try {
    // Fetch users with decoRoom.enabled = true
    const neighbors = await Bio.aggregate([
      { $match: { "decoRoom.enabled": true, status: "active" } },
      { $sample: { size: 20 } },
      { $project: { slug: 1, displayName: 1, avatarUrl: 1, decoRoom: 1 } }
    ]);
    
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
    if (!Number.isInteger(numAmount) || numAmount < 10) {
      return res.status(400).json({ error: 'Số tiền Tip tối thiểu là 10 JOY.' });
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

export default router;
