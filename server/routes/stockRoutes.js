import express from 'express';
import StockCompany from '../models/StockCompany.js';
import StockPosition from '../models/StockPosition.js';
import StockTrade from '../models/StockTrade.js';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { sessionKey } from '../utils/joyRateService.js';
import {
  runSession, seedCompanies, positionPL, applyBuy, applySell, tradeCosts,
  TRADING_FEE_RATE, CREATIVE_FEE_RATE, STOCK_QUOTE_CODE, calculateSecondPrice,
} from '../services/stockMarket.js';
import { CROSS_DENOM_FEE, denomKey } from '../../shared/joyCurrency.js';

const router = express.Router();

// Không ai được ôm quá nửa số cổ phần của một công ty: sàn dạy học, không phải
// chỗ một người thâu tóm rồi tự quyết giá.
const MAX_OWNERSHIP = 0.5;
const MAX_ORDER_QTY = 100000;

async function loadMarket() {
  const key = sessionKey();
  await runSession();
  const companies = await StockCompany.find({}).lean();
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    session: key,
    quoteCode: STOCK_QUOTE_CODE,
    feeRate: TRADING_FEE_RATE,
    creativeFeeRate: CREATIVE_FEE_RATE,
    conversionFeeRate: CROSS_DENOM_FEE,
    companies: companies.map((c) => {
      const currentPrice = calculateSecondPrice(c, nowSec);
      const prevPrice = c.prevPrice || c.basePrice || 100;
      return {
        symbol: c.symbol,
        name: c.name,
        sector: c.sector,
        description: c.description,
        price: currentPrice,
        prevPrice,
        change: prevPrice ? Math.round(((currentPrice - prevPrice) / prevPrice) * 1e4) / 1e4 : 0,
        volatility: c.volatility,
        dividendRate: c.dividendRate,
        sharesOutstanding: c.sharesOutstanding,
        marketCap: Math.round(currentPrice * c.sharesOutstanding),
        signal: c.lastSignal,
        history: (c.history || []).slice(-60),
      };
    }),
  };
  return payload;
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
    const [market, positions, bio, trades] = await Promise.all([
      loadMarket(),
      StockPosition.find({ email }).lean(),
      Bio.findOne({ email }).select('joyBalance joyDenom').lean(),
      StockTrade.find({ email }).sort({ at: -1 }).limit(30).lean(),
    ]);

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
        };
      });

    const invested = holdings.reduce((sum, h) => sum + h.cost, 0);
    const value = holdings.reduce((sum, h) => sum + h.value, 0);
    const realized = positions.reduce((sum, p) => sum + (p.realizedPL || 0), 0);

    res.json({
      success: true,
      session: market.session,
      quoteCode: market.quoteCode,
      walletDenom: denomKey(bio?.joyDenom),
      crossDenom: denomKey(bio?.joyDenom) !== 'en',
      cash: bio?.joyBalance || 0,
      invested,
      value,
      unrealized: value - invested,
      unrealizedPct: invested > 0 ? Math.round(((value - invested) / invested) * 1e4) / 1e4 : 0,
      realized,
      holdings,
      trades,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/stock/trade { symbol, side, quantity }
 *
 * Giá LẤY TỪ MÁY CHỦ, không bao giờ từ body: client gửi được giá là client tự
 * đặt giá mua cho mình. Ví trừ qua awardJoy nên mọi lệnh đều có dòng trong sổ
 * JOY, đối chiếu được.
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
    const company = await StockCompany.findOne({ symbol });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã cổ phiếu.' });
    }

    const price = calculateSecondPrice(company, Math.floor(Date.now() / 1000));
    const member = await Bio.findOne({ email }).select('joyDenom').lean();
    const costs = tradeCosts({ price, quantity, side, memberDenom: member?.joyDenom });
    const fee = costs.fees;
    const position = (await StockPosition.findOne({ email, symbol })) || new StockPosition({ email, symbol, quantity: 0, avgCost: 0 });

    if (side === 'buy') {
      if (position.quantity + quantity > company.sharesOutstanding * MAX_OWNERSHIP) {
        return res.status(400).json({ success: false, message: `Một người không được nắm quá ${MAX_OWNERSHIP * 100}% cổ phần một công ty.` });
      }

      const total = costs.total;
      await awardJoy(
        email,
        -total,
        'stock_buy',
        `Mua ${quantity} ${symbol} giá ${price} ${STOCK_QUOTE_CODE}`
          + ` (môi giới ${costs.brokerage} + sáng tạo ${costs.creativeFee}`
          + (costs.conversionFee ? ` + đổi đơn vị ${costs.conversionFee}` : '') + ' JOY)',
        { refId: symbol },
      );

      const next = applyBuy(position, quantity, price);
      position.quantity = next.quantity;
      position.avgCost = next.avgCost;
      await position.save();
      await StockTrade.create({ email, symbol, side, quantity, price, fee, total, realizedPL: 0 });

      return res.json({
        success: true,
        message: `Đã mua ${quantity} ${symbol} giá ${price} ${STOCK_QUOTE_CODE}/cổ phiếu, trừ ví ${total} JOY (gồm ${fee} JOY phí).`,
        trade: { symbol, side, quantity, price, ...costs },
        position: { quantity: position.quantity, avgCost: position.avgCost },
      });
    }

    if (position.quantity < quantity) {
      return res.status(400).json({ success: false, message: `Bạn chỉ đang nắm ${position.quantity} ${symbol}.` });
    }

    const result = applySell(position, quantity, price, fee);
    await awardJoy(
      email,
      result.proceeds,
      'stock_sell',
      `Bán ${quantity} ${symbol} giá ${price} ${STOCK_QUOTE_CODE}`
        + ` (môi giới ${costs.brokerage} + sáng tạo ${costs.creativeFee}`
        + (costs.conversionFee ? ` + đổi đơn vị ${costs.conversionFee}` : '') + ' JOY)',
      { refId: symbol },
    );

    position.quantity = result.quantity;
    position.avgCost = result.avgCost;
    position.realizedPL = (position.realizedPL || 0) + result.realizedPL;
    await position.save();
    await StockTrade.create({ email, symbol, side, quantity, price, fee, total: result.proceeds, realizedPL: result.realizedPL });

    res.json({
      success: true,
      message: result.realizedPL >= 0
        ? `Đã bán ${quantity} ${symbol}, lãi ${result.realizedPL} JOY sau phí.`
        : `Đã bán ${quantity} ${symbol}, lỗ ${Math.abs(result.realizedPL)} JOY sau phí.`,
      trade: { symbol, side, quantity, price, ...costs, total: result.proceeds, realizedPL: result.realizedPL },
      position: { quantity: position.quantity, avgCost: position.avgCost },
    });
  } catch (error) {
    const message = String(error.message || '');
    if (message.includes('INSUFFICIENT')) {
      return res.status(400).json({ success: false, message: 'Số dư JOY không đủ cho lệnh này.' });
    }
    res.status(400).json({ success: false, message: message || 'Không đặt được lệnh.' });
  }
});

export default router;
