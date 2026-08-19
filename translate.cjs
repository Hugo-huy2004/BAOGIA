const fs = require("fs");

const investVi = JSON.parse(fs.readFileSync("invest_vi.json", "utf8"));

// English Translation
const investEn = {
  invest: {
    lessons: {
      "co-phieu": {
        title: "What is a Stock?",
        summary: "Buying a stock means buying a piece of a company, not just a number.",
        body: [
          "Hugo Film issues 120,000 shares. Buying 100 shares means you own 100/120,000 of the company — about 0.08%.",
          "Stock price × Total shares = MARKET CAP. This is what the market values the entire company at. Look at market cap to know how big a company is, don't just look at the stock price: a 45 JOY stock is not necessarily cheaper than a 100 JOY stock."
        ]
      },
      "gia-dong": {
        title: "Why Do Prices Fluctuate?",
        summary: "Prices move based on whether the company performs BETTER or WORSE than expected.",
        body: [
          "Every session, the exchange measures the last 7 days of activity for each company against its 30-day average. This difference is called the surprise.",
          "Hugo Arcade has 150 plays this week, the average is 100 ⇒ surprise = +50%. Multiplied by the ticker's specific volatility (9%) ⇒ the price increases by 4.5% that session.",
          "Real-world lesson: the market doesn't reward companies for doing well, it rewards them for doing BETTER THAN EXPECTED. That's why a company can report record profits yet its stock still falls."
        ]
      },
      "rui-ro": {
        title: "Risk Follows Reward",
        summary: "The ticker that climbs the fastest is also the one that falls the hardest.",
        "body": [
          "The four tickers on the exchange have different volatilities: HARC 9% (strongest), HNEWS 7%, HFILM 5%, HBANK 3% (smoothest).",
          "With the same +50% good news surprise: HARC jumps 4.5% while HBANK only rises 1.5%. But with bad news, HARC also loses 4.5% while HBANK only loses 1.5%.",
          "There is no such thing as 'high return and safe'. Anyone pitching you that in the real world is almost certainly running a scam."
        ]
      },
      "gia-von": {
        title: "Average Cost Basis",
        summary: "Buying more at a different price recalculates your cost basis, it's not just the last price.",
        "body": [
          "You buy 10 shares at 100, then buy 10 more at 200. Cost basis = (10×100 + 10×200) / 20 = 150 JOY.",
          "Profit/loss is always measured from 150, not 200. Many beginners misread this and think they're losing when they're actually profiting — or vice versa."
        ]
      },
      "co-tuc": {
        "title": "Dividends",
        "summary": "Some companies pay shareholders regularly instead of relying solely on price appreciation.",
        "body": [
          "Hugo Bank pays 0.15% of its stock price per session to holders. The price doesn't move much, but the cash flow is consistent.",
          "In the real world, bank and utility stocks often behave this way: slow price growth, compensated by dividends. Tech stocks are the opposite.",
          "Which style you choose depends on your goals — steady cash or waiting for capital gains."
        ]
      },
      "da-dang-hoa": {
        "title": "Don't Put All Eggs in One Basket",
        "summary": "Allocate capital across different sectors so one piece of bad news doesn't wipe out your account.",
        "body": [
          "The four companies on the exchange belong to four different sectors: cinema, gaming, media, finance. Bad news in the gaming sector won't drag the bank down with it.",
          "Try it yourself once: put all your JOY into HARC for a week, then divide it evenly across four tickers next week. Compare the two — the feeling of portfolio volatility is also a lesson."
        ]
      },
      "ky-luat": {
        "title": "Discipline Beats Prediction",
        "summary": "Decide your exit points beforehand, don't let emotions decide for you.",
        "body": [
          "Before buying, write down two numbers: at what profit you'll sell, and at what loss you'll cut. Then do exactly as you wrote.",
          "Beginners often do the reverse: taking small profits out of fear, and holding onto losses out of regret — resulting in small wins and massive losses.",
          "This exchange uses JOY so mistakes don't cost real money. Make enough mistakes here before taking real money to the real market."
        ]
      },
      "canh-bao": {
        "title": "How Virtual Differs From Real",
        "summary": "Understand the limits of simulation so you don't bring illusions into the real world.",
        "body": [
          "Here, prices match 3 sessions/day (09:00 · 15:00 · 21:00) and always fill the volume you order. Real markets match continuously, and sometimes there are no buyers when you want to sell.",
          "Here, companies don't go bankrupt and prices don't drop to 0. In real markets they do — and shareholders are the last to get paid.",
          "JOY is not real money and cannot be converted to cash. The results in this app are not a promise for any real-world investments."
        ]
      }
    },
    dictionary: {
      "pnl": {
        "title": "Total Unrealized PnL & ROI",
        "badge": "Most Important Metric",
        "summary": "Shows how much money you are winning or losing after deducting all fees.",
        "details": [
          "Invested Capital: The total amount you spent to buy your current shares.",
          "Current Value: The amount you would receive if you instantly sold all shares at real-time market prices.",
          "Unrealized PnL: Current Value minus Invested Capital. A positive number (+) means you are in PROFIT, negative (-) means a LOSS."
        ],
        "example": "Example: You spent 100,000 on HFILM, and those shares are now worth 125,000 ➔ you are UP +25,000 (+25%) on paper. Only when you SELL and deduct fees does it become actual profit in your wallet."
      },
      "second_price": {
        "title": "Continuous Intraday Pricing",
        "badge": "Unpredictable",
        "summary": "The price moves in 60-second ticks, generated by the server using a secret seed — every member sees the same chart.",
        "details": [
          "Each tick is a new price point; the server sends the entire path so the chart you see perfectly matches the execution price.",
          "The market shifts states every 15 minutes: sideways, uptrend, downtrend, boom, crash, or a news shock.",
          "NO ONE can predict the next tick — the seed stays on the server and is never sent out. Don't trust anyone claiming to know the top or bottom.",
          "The price is always pulled toward the session's anchor (determined by business performance), so a trend can run for hours but won't go one way forever."
        ],
        "example": "To make actual profit, the price must move far enough to cover two-way fees — oscillating for a few minutes will just let fees eat your capital."
      },
      "conversion_fee": {
        "title": "Wallet Currency Doesn't Affect Price",
        "badge": "Conversion Fee Removed",
        "summary": "You buy and sell at the same price regardless of your wallet unit — the exchange no longer charges conversion fees.",
        "details": [
          "The exchange lists prices in the standard JOYka (Kavo) unit, while your wallet displays your chosen unit (Mira, Luno, Velu...). They are just two ways to WRITE the same underlying JOY amount.",
          "Previously, every order incurred a 15% conversion fee each way, pushing the breakeven point for alternative wallets to 51.6% — you had to guess a 50% company value spike just to break even.",
          "That fee has been removed: the ledger records raw JOY from start to finish so no actual currency exchange ever happens. Now all wallets break even at ~1.01%."
        ],
        "example": "Example: Buy 1,000, wallet deducts 1,005. Price rises to 1,011 to break even; rises to 1,100, sell returns 1,094, netting 89 in profit."
      },
      "brokerage_fee": {
        "title": "0.5% Brokerage Fee",
        "badge": "Trading Cost",
        "summary": "The exchange only collects one single fee: 0.5% of the order value, each way.",
        "details": [
          "Brokerage fee: 0.5% of order value, minimum 1 JOY, collected on both buying and selling — mirroring what real-world brokerages charge.",
          "The 5% Creator Fee each way has been REMOVED: that was a peer-to-peer transfer fee, but buying stocks doesn't transfer money to another person.",
          "Because it's charged both ways, the breakeven point is 1.01%, not 0.5%: you pay 0.5% extra to buy, and are deducted 0.5% when selling.",
          "All fees are clearly displayed before you click Confirm Order."
        ]
      },
      "market_cap": {
        "title": "Market Capitalization (Market Cap)",
        "badge": "Business Valuation",
        "summary": "The total monetary value of all shares a company has issued.",
        "details": [
          "Formula: Market Cap = (Current Stock Price) × (Total Shares Outstanding).",
          "Large-cap companies usually fluctuate steadily and safely. Small-cap companies can surge easily but have much higher volatility."
        ]
      },
      "smart_advice": {
        "title": "AI Butler Advisory Signals",
        "badge": "Automated Investment Assistant",
        "summary": "The AI automatically analyzes the market and your portfolio to provide optimal advice.",
        "details": [
          "SHOULD TAKE PROFIT: when gains exceed the 1.01% breakeven mark — below that, selling still results in a loss due to two-way fees.",
          "STOP-LOSS WARNING: when the stock drops more than 10%.",
          "HOLD: when in profit but hasn't crossed the breakeven mark — selling now is still a loss."
        ]
      }
    }
  }
};

const languages = ["en", "vi", "zh", "ja", "ko", "th", "es", "fr", "id"];
const localesDir = "src/i18n/locales";

languages.forEach(lang => {
  const filePath = `${localesDir}/${lang}/translation.json`;
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (lang === "vi") {
      data.invest = investVi.invest;
    } else {
      data.invest = investEn.invest; // Use English as fallback for all others, and native for EN.
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`Updated ${lang}`);
  }
});
