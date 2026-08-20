import express from 'express';
import StockCompany from '../models/StockCompany.js';
import StockPosition from '../models/StockPosition.js';
import StockTrade from '../models/StockTrade.js';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { runSession, seedCompanies, ticksFor, livePrice, sessionKey, tidyHistory } from '../services/stockMarket.js';
import {
  positionPL, tradeCosts, priceAt,
  TRADING_FEE_RATE, CREATIVE_FEE_RATE, STOCK_CONVERSION_FEE_RATE, STOCK_QUOTE_CODE,
  MAX_SEGMENT_MOVE, SEGMENT_SEC,
} from '../../shared/stockPricing.js';
import { denomKey, denomOf, toDenom } from '../../shared/joyCurrency.js';

const router = express.Router();

// Không ai được ôm quá nửa số cổ phần của một công ty: sàn dạy học, không phải
// chỗ một người thâu tóm rồi tự quyết giá.
const MAX_OWNERSHIP = 0.5;
const MAX_ORDER_QTY = 100000;

/**
 * Chênh lệch giá tối đa chấp nhận giữa màn hình và lúc khớp. Giá nhấp nhô từng
 * giây, nên client gửi kèm giá nó ĐANG hiện; lệch quá ngưỡng này thì từ chối
 * và trả giá mới về, thay vì âm thầm khớp ở một giá người dùng chưa từng thấy.
 */
const PRICE_TOLERANCE = 0.03;

/**
 * Hồ sơ của thành viên đang đăng nhập — tra theo `email` HOẶC `contactEmail`.
 *
 * Cả app dùng cặp đó (bioRoutes, radioRoutes, và quan trọng nhất là awardJoy).
 * Sàn thì chỉ tra `email`, nên ai đăng nhập bằng email liên hệ sẽ thấy "Số dư
 * ví khả dụng: 0" và nút Mua bị khoá — trong khi ví họ có tiền và awardJoy vẫn
 * trừ được bình thường. Tệ hơn: `joyDenom` cũng rơi về mặc định, tức là màn
 * xác nhận tính nhầm phí đổi đơn vị 15% cho một cái ví không hề phải đổi.
 */
function memberBio(email, fields) {
  return Bio.findOne({ $or: [{ email }, { contactEmail: email }] }).select(fields).lean();
}

async function loadMarket() {
  const key = sessionKey();
  await runSession();
  const companies = await StockCompany.find({}).lean();
  const nowSec = Math.floor(Date.now() / 1000);

  return {
    session: key,
    quoteCode: STOCK_QUOTE_CODE,
    feeRate: TRADING_FEE_RATE,
    creativeFeeRate: CREATIVE_FEE_RATE,
    conversionFeeRate: STOCK_CONVERSION_FEE_RATE,
    maxSegmentMove: MAX_SEGMENT_MOVE,
    segmentSec: SEGMENT_SEC,
    // Đồng hồ máy chủ: client lấy nó làm gốc nội suy thay vì đồng hồ máy mình,
    // nếu không thì máy lệch giờ sẽ đọc đường giá ở một chỗ khác hẳn.
    serverTime: Date.now(),
    companies: companies.map((c) => {
      // Đường giá của phiên — CHỈ mảng mốc được gửi xuống, hạt giống thì không.
      const ticks = ticksFor(c, { key, nowSec });
      const price = priceAt({ ...c, ticks }, nowSec);
      const prevPrice = c.prevPrice || c.basePrice || 100;
      return {
        symbol: c.symbol,
        name: c.name,
        sector: c.sector,
        description: c.description,
        // GIÁ CHỐT PHIÊN — gốc để cả hai phía tính sóng theo giây. Thiếu con số
        // này, client lấy `price` (đã dao động) làm gốc rồi dao động lần nữa:
        // sóng chồng sóng, màn hình lệch hẳn giá khớp thật của máy chủ.
        sessionPrice: c.price,
        ticks,
        price,
        prevPrice,
        change: prevPrice ? Math.round(((price - prevPrice) / prevPrice) * 1e4) / 1e4 : 0,
        volatility: c.volatility,
        basePrice: c.basePrice,
        dividendRate: c.dividendRate,
        sharesOutstanding: c.sharesOutstanding,
        marketCap: Math.round(price * c.sharesOutstanding),
        signal: c.lastSignal,
        // Dọn mốc trùng trước khi gửi: biểu đồ khoá nến theo thời gian.
        history: tidyHistory(c.history).slice(-60),
      };
    }),
  };
}

// GET /api/stock/market — bảng giá bốn công ty
router.get('/market', requireMember, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, ...(await loadMarket()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/stock/portfolio — danh mục của chính người đang đăng nhập
router.get('/portfolio', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const [market, positions, bio, trades, feeRows] = await Promise.all([
      loadMarket(),
      StockPosition.find({ email }).lean(),
      memberBio(email, 'joyBalance joyDenom'),
      StockTrade.find({ email }).sort({ at: -1 }).limit(30).lean(),
      // Tổng phí đã trả theo mã — bài học "phí ăn bao nhiêu" phải có số thật.
      StockTrade.aggregate([
        { $match: { email } },
        { $group: { _id: '$symbol', fees: { $sum: '$fee' } } },
      ]),
    ]);
    const feesOf = Object.fromEntries(feeRows.map((r) => [r._id, r.fees]));

    const walletDenom = denomKey(bio?.joyDenom);
    const priceOf = Object.fromEntries(market.companies.map((c) => [c.symbol, c.price]));
    const holdings = positions
      .filter((p) => p.quantity > 0)
      .map((p) => {
        const price = priceOf[p.symbol] || p.avgCost;
        return {
          symbol: p.symbol,
          name: market.companies.find((c) => c.symbol === p.symbol)?.name || p.symbol,
          quantity: p.quantity,
          avgCost: p.avgCost,
          price,
          ...positionPL(p, price),
          realizedPL: p.realizedPL || 0,
          dividendReceived: p.dividendReceived || 0,
          feesPaid: feesOf[p.symbol] || 0,
        };
      });

    const invested = holdings.reduce((sum, h) => sum + h.cost, 0);
    const value = holdings.reduce((sum, h) => sum + h.value, 0);
    const realized = positions.reduce((sum, p) => sum + (p.realizedPL || 0), 0);
    const dividends = positions.reduce((sum, p) => sum + (p.dividendReceived || 0), 0);

    res.json({
      success: true,
      session: market.session,
      quoteCode: market.quoteCode,
      // Đơn vị ví của chính người này: mọi số tiền trên màn hình phải viết theo
      // đơn vị đó, còn bảng giá vẫn niêm yết bằng đơn vị gốc.
      walletDenom,
      walletCode: denomOf(walletDenom).code,
      crossDenom: walletDenom !== 'en',
      // `null` = KHÔNG TÌM THẤY VÍ (khác hẳn "ví đang có 0"). Client cần phân
      // biệt hai chuyện đó để hiện đúng lý do nút Mua bị khoá.
      cash: bio ? bio.joyBalance || 0 : null,
      hasWallet: Boolean(bio),
      invested,
      value,
      unrealized: value - invested,
      unrealizedPct: invested > 0 ? Math.round(((value - invested) / invested) * 1e4) / 1e4 : 0,
      realized,
      dividends,
      holdings,
      trades,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Đảm bảo vị thế tồn tại trước khi cộng trừ.
 *
 * Hai lệnh mua đầu tiên chạy song song thì cả hai cùng thấy "chưa có vị thế" và
 * cùng upsert — MongoDB cho một cái vào, cái kia đâm vào khoá duy nhất
 * (email, symbol). Thử lại là xong: lần sau tài liệu đã có nên chỉ còn cập nhật.
 */
async function ensurePosition(email, symbol) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await StockPosition.updateOne(
        { email, symbol },
        { $setOnInsert: { quantity: 0, avgCost: 0, realizedPL: 0, dividendReceived: 0 } },
        { upsert: true },
      );
      return;
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
}

/** Hoá đơn của một lệnh — cùng một hình dạng cho lúc khớp và lúc xem lại. */
function receiptOf({ company, side, quantity, price, costs, realizedPL, balanceAfter, session, at }) {
  return {
    at: at || new Date(),
    session,
    symbol: company.symbol,
    name: company.name,
    side,
    quantity,
    price,
    gross: costs.gross,
    brokerage: costs.brokerage,
    creativeFee: costs.creativeFee,
    conversionFee: costs.conversionFee,
    fees: costs.fees,
    total: costs.total,
    realizedPL,
    balanceAfter,
    quoteCode: costs.quoteCode,
    walletCode: costs.walletCode,
    walletAmount: costs.totalInWallet,
    rates: costs.rates,
  };
}

/**
 * POST /api/stock/trade { symbol, side, quantity, expectedPrice? }
 *
 * Giá LẤY TỪ MÁY CHỦ, không bao giờ từ body: client gửi được giá là client tự
 * đặt giá mua cho mình. `expectedPrice` chỉ dùng để ĐỐI CHIẾU rồi từ chối khi
 * lệch quá 3%. Ví trừ qua awardJoy nên mọi lệnh đều có dòng trong sổ JOY.
 */
router.post('/trade', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { symbol, side } = req.body;
    const quantity = Math.floor(Number(req.body?.quantity));

    if (!['buy', 'sell'].includes(side)) {
      return res.status(400).json({ success: false, message: 'Lệnh chỉ có thể là mua hoặc bán.' });
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_ORDER_QTY) {
      return res.status(400).json({ success: false, message: 'Số lượng cổ phiếu không hợp lệ.' });
    }

    await seedCompanies();
    const company = await StockCompany.findOne({ symbol }).lean();
    if (!company) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã cổ phiếu.' });
    }

    const session = sessionKey();
    const price = livePrice(company, { key: session });

    const expected = Number(req.body?.expectedPrice);
    if (Number.isFinite(expected) && expected > 0
      && Math.abs(price - expected) / price > PRICE_TOLERANCE) {
      return res.status(409).json({
        success: false,
        price,
        message: `Giá vừa đổi từ ${expected} sang ${price} ${STOCK_QUOTE_CODE}. Kiểm tra lại rồi đặt lệnh.`,
      });
    }

    const member = await memberBio(email, 'joyDenom');
    const costs = tradeCosts({ price, quantity, side, memberDenom: member?.joyDenom });
    const walletCode = costs.walletCode;

    const feeLine = `môi giới ${costs.brokerage} + sáng tạo ${costs.creativeFee}`
      + (costs.conversionFee ? ` + đổi đơn vị ${costs.conversionFee}` : '');

    if (side === 'buy') {
      const cap = Math.floor(company.sharesOutstanding * MAX_OWNERSHIP);
      await ensurePosition(email, symbol);

      const held = (await StockPosition.findOne({ email, symbol }).select('quantity').lean())?.quantity || 0;
      if (held + quantity > cap) {
        return res.status(400).json({
          success: false,
          message: `Một người không được nắm quá ${MAX_OWNERSHIP * 100}% cổ phần một công ty (tối đa ${cap.toLocaleString('vi-VN')} ${symbol}).`,
        });
      }

      const { balance } = await awardJoy(
        email, -costs.total, 'stock_buy',
        `Mua ${quantity} ${symbol} giá ${price} ${STOCK_QUOTE_CODE} (${feeLine} JOY)`,
        { refId: symbol },
      );

      // Cập nhật vị thế bằng MỘT lệnh ghi nguyên tử (aggregation pipeline):
      // đọc-rồi-ghi như bản trước làm hai lệnh mua song song ghi đè nhau, giá
      // vốn bình quân ra sai và người học nhìn thấy một mức lãi không có thật.
      // Trần sở hữu nằm trong BỘ LỌC, nên nó cũng được kiểm nguyên tử.
      //
      // Giá vốn cộng bằng costs.total (giá trị + phí mua) chứ không phải gross:
      // ví bị trừ total, nên lãi/lỗ chốt sau này mới khớp đúng biến động ví.
      const position = await StockPosition.findOneAndUpdate(
        { email, symbol, quantity: { $lte: cap - quantity } },
        [{
          $set: {
            quantity: { $add: [{ $ifNull: ['$quantity', 0] }, quantity] },
            avgCost: {
              $round: [{
                $divide: [
                  { $add: [{ $multiply: [{ $ifNull: ['$avgCost', 0] }, { $ifNull: ['$quantity', 0] }] }, costs.total] },
                  { $add: [{ $ifNull: ['$quantity', 0] }, quantity] },
                ],
              }, 2],
            },
          },
        }],
        { new: true },
      );

      if (!position) {
        // Lệnh song song vừa lấp đầy trần. Tiền đã trừ rồi nên phải hoàn NGAY.
        await awardJoy(email, costs.total, 'stock_sell',
          `Hoàn tiền lệnh mua ${quantity} ${symbol} không khớp được`, { refId: symbol });
        return res.status(400).json({
          success: false,
          message: `Một người không được nắm quá ${MAX_OWNERSHIP * 100}% cổ phần một công ty.`,
        });
      }

      const receipt = receiptOf({ company, side, quantity, price, costs, realizedPL: 0, balanceAfter: balance, session });
      await StockTrade.create({
        email, symbol, side, quantity, price,
        fee: costs.fees, brokerage: costs.brokerage, creativeFee: costs.creativeFee,
        conversionFee: costs.conversionFee, walletCode, walletAmount: costs.totalInWallet, session,
        total: costs.total, balanceAfter: balance, realizedPL: 0, at: receipt.at,
      });

      return res.json({
        success: true,
        message: `Đã mua ${quantity} ${symbol} giá ${price} ${STOCK_QUOTE_CODE}, trừ ví ${toDenom(costs.total, member?.joyDenom).amount} ${walletCode}.`,
        receipt,
        position: { quantity: position.quantity, avgCost: position.avgCost },
      });
    }

    // ── BÁN ────────────────────────────────────────────────────────────────
    if (costs.total <= 0) {
      return res.status(400).json({
        success: false,
        message: `Phí (${costs.fees} ${STOCK_QUOTE_CODE}) lớn hơn giá trị lệnh. Bán số lượng lớn hơn để lệnh có nghĩa.`,
      });
    }

    // GIỮ CHỖ TRƯỚC, cộng tiền sau. Kiểm tra rồi mới trừ như bản trước cho phép
    // hai lệnh bán song song cùng vượt qua chỗ kiểm tra và cùng được trả tiền —
    // bán được nhiều cổ phiếu hơn số đang nắm, tức là in JOY.
    const before = await StockPosition.findOneAndUpdate(
      { email, symbol, quantity: { $gte: quantity } },
      { $inc: { quantity: -quantity } },
      { new: false },
    );
    if (!before) {
      const held = (await StockPosition.findOne({ email, symbol }).select('quantity').lean())?.quantity || 0;
      return res.status(400).json({ success: false, message: `Bạn chỉ đang nắm ${held} ${symbol}.` });
    }

    const realizedPL = Math.round(costs.gross - before.avgCost * quantity - costs.fees);
    let balance;
    try {
      ({ balance } = await awardJoy(
        email, costs.total, 'stock_sell',
        `Bán ${quantity} ${symbol} giá ${price} ${STOCK_QUOTE_CODE} (${feeLine} JOY)`,
        { refId: symbol },
      ));
    } catch (error) {
      // Ví đóng băng chẳng hạn: trả cổ phiếu về chỗ cũ, không để mất trắng.
      await StockPosition.updateOne({ email, symbol }, { $inc: { quantity } });
      throw error;
    }

    const remaining = before.quantity - quantity;
    await StockPosition.updateOne(
      { email, symbol },
      { $inc: { realizedPL }, ...(remaining > 0 ? {} : { $set: { avgCost: 0 } }) },
    );

    const receipt = receiptOf({ company, side, quantity, price, costs, realizedPL, balanceAfter: balance, session });
    await StockTrade.create({
      email, symbol, side, quantity, price,
      fee: costs.fees, brokerage: costs.brokerage, creativeFee: costs.creativeFee,
      conversionFee: costs.conversionFee, walletCode, walletAmount: costs.totalInWallet, session,
      total: costs.total, balanceAfter: balance, realizedPL, at: receipt.at,
    });

    res.json({
      success: true,
      message: realizedPL >= 0
        ? `Đã bán ${quantity} ${symbol}, lãi ${toDenom(realizedPL, member?.joyDenom).amount} ${walletCode} sau phí.`
        : `Đã bán ${quantity} ${symbol}, lỗ ${toDenom(Math.abs(realizedPL), member?.joyDenom).amount} ${walletCode} sau phí.`,
      receipt,
      position: { quantity: remaining, avgCost: remaining > 0 ? before.avgCost : 0 },
    });
  } catch (error) {
    const message = String(error.message || '');
    if (message.includes('INSUFFICIENT')) {
      return res.status(400).json({ success: false, message: 'Số dư JOY không đủ cho lệnh này.' });
    }
    if (message.includes('FROZEN')) {
      return res.status(400).json({ success: false, message: 'Ví JOY đang bị đóng băng, không đặt lệnh được.' });
    }
    res.status(400).json({ success: false, message: message || 'Không đặt được lệnh.' });
  }
});

export default router;
