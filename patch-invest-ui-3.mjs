import fs from "fs";

const jsxPath = "src/components/member/invest/HugoInvestTab.jsx";
let content = fs.readFileSync(jsxPath, "utf8");

const replacements = [
  { match: 'data.success \\? "Đã khớp lệnh thành công" : "Không đặt được lệnh"', replace: 'data.success ? t("invest.ui.orderSuccess", "Đã khớp lệnh thành công") : t("invest.ui.orderFailed", "Không đặt được lệnh")' },
  { match: '>Niêm yết \\{quoteText\\(company\\.price\\)\\} · quy về ví bạn theo tỷ giá hôm nay<', replace: '>{t("invest.ui.quoteNotice", "Niêm yết")} {quoteText(company.price)} · {t("invest.ui.convertedNotice", "quy về ví bạn theo tỷ giá hôm nay")}<' },
  { match: '>tham chiếu \\{priceText\\(company\\.price\\)\\}<', replace: '>{t("invest.ui.referencePrice", "tham chiếu")} {priceText(company.prevPrice)}<' }, // Wait, the match is prevPrice! I'll fix this below.
  { match: 'label="Cổ phiếu phát hành"', replace: 'label={t("invest.ui.sharesOutstanding", "Cổ phiếu phát hành")}' },
  { match: 'label="Vốn hoá thị trường"', replace: 'label={t("invest.ui.marketCap", "Vốn hoá thị trường")}' },
  { match: 'label="Biên độ dao động"', replace: 'label={t("invest.ui.volatility", "Biên độ dao động")}' },
  { match: 'label="Cổ tức mỗi phiên"', replace: 'label={t("invest.ui.dividendRate", "Cổ tức mỗi phiên")}' },
  { match: 'Bạn đang nắm \\{holding.quantity.toLocaleString\\("vi-VN"\\)\\} cổ phiếu \\{company.symbol\\}', replace: '{t("invest.ui.holdingNoticePart1", "Bạn đang nắm")} {holding.quantity.toLocaleString("vi-VN")} {t("invest.ui.sharesOf", "cổ phiếu")} {company.symbol}' },
  { match: 'Lãi/lỗ trên giấy:\\{" "\\}', replace: '{t("invest.ui.paperPnL", "Lãi/lỗ trên giấy:")}{" "}' },
  { match: '>Đặt lệnh khớp ngay<', replace: '>{t("invest.ui.placeOrder", "Đặt lệnh khớp ngay")}<' },
  { match: '>Tất cả<', replace: '>{t("invest.ui.all", "Tất cả")}<' },
  { match: 'label={`Phí môi giới \\(\\$\\{\\(feeRate \\* 100\\)\\.toFixed\\(1\\)\\}%\\)`}', replace: 'label={t("invest.ui.brokerageFeeLbl", `Phí môi giới (${(feeRate * 100).toFixed(1)}%)`)}' },
  { match: 'label={`Phí sáng tạo \\(\\$\\{\\(creativeRate \\* 100\\)\\.toFixed\\(0\\)\\}%\\)`}', replace: 'label={t("invest.ui.creativeFeeLbl", `Phí sáng tạo (${(creativeRate * 100).toFixed(0)}%)`)}' },
  { match: 'label={`Phí đổi đơn vị \\(\\$\\{\\(conversionRate \\* 100\\)\\.toFixed\\(0\\)\\}%\\)`}', replace: 'label={t("invest.ui.conversionFeeLbl", `Phí đổi đơn vị (${(conversionRate * 100).toFixed(0)}%)`)}' },
  { match: 'label=\\{side === "buy" \\? `Tổng trừ ví \\(\\$\\{costs\\.walletCode\\}\\)` : `Tổng về ví \\(\\$\\{costs\\.walletCode\\}\\)`\\}', replace: 'label={side === "buy" ? t("invest.ui.totalDeducted", `Tổng trừ ví (${costs.walletCode})`) : t("invest.ui.totalAdded", `Tổng về ví (${costs.walletCode})`)}' },
  { match: 'label="Số dư ví khả dụng"', replace: 'label={t("invest.ui.availableBalance", "Số dư ví khả dụng")}' },
  { match: 'value=\\{cash === null \\? \\(walletLoaded \\? "Chưa có ví JOY" : "Đang tải…"\\) : moneyText\\(cash\\)\\}', replace: 'value={cash === null ? (walletLoaded ? t("invest.ui.noWallet", "Chưa có ví JOY") : t("invest.ui.loading", "Đang tải…")) : moneyText(cash)}' },
  { match: 'Thiếu \\{moneyText\\(total - cash\\)\\} để đặt lệnh này. Giảm số lượng hoặc nạp thêm vào ví.', replace: '{t("invest.ui.shortageNotice1", "Thiếu")} {moneyText(total - cash)} {t("invest.ui.shortageNotice2", "để đặt lệnh này. Giảm số lượng hoặc nạp thêm vào ví.")}' },
  { match: 'Tài khoản này chưa có ví JOY nên chưa đặt lệnh được. Mở app Tài khoản để tạo hồ sơ trước.', replace: '{t("invest.ui.noWalletError", "Tài khoản này chưa có ví JOY nên chưa đặt lệnh được. Mở app Tài khoản để tạo hồ sơ trước.")}' },
  { match: 'Sàn niêm yết bằng \\{STOCK_QUOTE_CODE\\}: \\{quoteText\\(gross\\)\\} cho lệnh này. Số trên đã quy về đơn vị ví của bạn.', replace: '{t("invest.ui.quoteCurrencyNotice1", "Sàn niêm yết bằng")} {STOCK_QUOTE_CODE}: {quoteText(gross)} {t("invest.ui.quoteCurrencyNotice2", "cho lệnh này. Số trên đã quy về đơn vị ví của bạn.")}' },
  { match: '<span>\\{side === "buy" \\? `Xác nhận mua \\$\\{qty\\.toLocaleString\\(LOCALE\\)\\} cổ` : `Xác nhận bán \\$\\{qty\\.toLocaleString\\(LOCALE\\)\\} cổ`\\}</span>', replace: '<span>{side === "buy" ? t("invest.ui.confirmBuy", `Xác nhận mua ${qty.toLocaleString(LOCALE)} cổ`) : t("invest.ui.confirmSell", `Xác nhận bán ${qty.toLocaleString(LOCALE)} cổ`)}</span>' },
  { match: '\\{isProfit \\? "Đang lời" : "Đang lỗ"\\}', replace: '{isProfit ? t("invest.ui.isProfitTrue", "Đang lời") : t("invest.ui.isProfitFalse", "Đang lỗ")}' },
  { match: '\\{holding\\.quantity\\.toLocaleString\\("vi-VN"\\)\\} cổ · vốn \\{priceText\\(holding\\.avgCost\\)\\}', replace: '{holding.quantity.toLocaleString("vi-VN")} {t("invest.ui.sharesShort", "cổ")} · {t("invest.ui.capitalShort", "vốn")} {priceText(holding.avgCost)}' },
  { match: '· phí \\{moneyText\\(trade\\.fee\\)\\} · bấm xem hoá đơn', replace: '· {t("invest.ui.feeText", "phí")} {moneyText(trade.fee)} · {t("invest.ui.viewReceiptAction", "bấm xem hoá đơn")}' },
  { match: '"Không trả"', replace: 't("invest.ui.noDividend", "Không trả")' }
];

replacements.forEach(rep => {
  content = content.replace(new RegExp(rep.match, "g"), rep.replace);
});

// For some trickier ones
content = content.replace(/>tham chiếu \{priceText\(company\.prevPrice\)\}</g, ">{t('invest.ui.referencePrice', 'tham chiếu')} {priceText(company.prevPrice)}<");
content = content.replace(/<strong>Ví khác đơn vị gốc:<\/strong> phí quy đổi 15% thu cả chiều <strong>MUA và BÁN<\/strong>, nên giá phải tăng\{" "\}\n\s*<strong>\{\(breakEvenPct\(true\) \* 100\)\.toFixed\(1\)\}%<\/strong> thì bán mới hoà vốn\./g, "{t('invest.ui.diffWalletNotice', `Ví khác đơn vị gốc: phí quy đổi 15% thu cả chiều MUA và BÁN, nên giá phải tăng ${(breakEvenPct(true) * 100).toFixed(1)}% thì bán mới hoà vốn.`)}");

content = content.replace(/<strong>Mốc hoà vốn:<\/strong> phí môi giới 0,5% thu cả hai chiều, nên giá phải tăng\{" "\}\n\s*<strong>\{\(breakEvenPct\(false\) \* 100\)\.toFixed\(2\)\}%<\/strong> thì bán mới huề vốn — bán sớm hơn là lỗ\./g, "{t('invest.ui.breakEvenNotice', `Mốc hoà vốn: phí môi giới 0,5% thu cả hai chiều, nên giá phải tăng ${(breakEvenPct(false) * 100).toFixed(2)}% thì bán mới huề vốn — bán sớm hơn là lỗ.`)}");

content = content.replace(/Chưa nắm giữ cổ phiếu nào\. Hãy chuyển sang tab <strong className="text-foreground">\{t\('invest\.ui\.marketTab', 'Bảng giá'\)\}<\/strong> để chọn cổ phiếu và tích lũy lợi nhuận!/g, "{t('invest.ui.emptyPortfolio1', 'Chưa nắm giữ cổ phiếu nào. Hãy chuyển sang tab')} <strong className=\"text-foreground\">{t('invest.ui.marketTab', 'Bảng giá')}</strong> {t('invest.ui.emptyPortfolio2', 'để chọn cổ phiếu và tích lũy lợi nhuận!')}");

fs.writeFileSync(jsxPath, content, "utf8");
console.log("Applied phase 3 translations to JSX");
