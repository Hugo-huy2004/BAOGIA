import fs from "fs";

const jsxPath = "src/components/member/invest/HugoInvestTab.jsx";
let content = fs.readFileSync(jsxPath, "utf8");

const replacements = [
  { match: 'title = `Chốt lời \\$\\{company\\.symbol\\}`;', replace: 'title = `${t("invest.ui.advisorTakeProfit", "Chốt lời")} ${company.symbol}`;' },
  { match: 'badgeText = "Khuyến nghị Bán";', replace: 'badgeText = t("invest.ui.advisorRecSell", "Khuyến nghị Bán");' },
  { match: 'message = `Lời \\+\\$\\{pct\\.toFixed\\(1\\)\\}% đã vượt mốc hoà vốn \\$\\{breakEven\\.toFixed\\(1\\)\\}% \\(đủ bù cả phí mua lẫn phí bán\\)\\. Bán bây giờ là lãi thật vào ví\\.`;', replace: 'message = t("invest.ui.advisorTakeProfitMsg", `Lời +${pct.toFixed(1)}% đã vượt mốc hoà vốn ${breakEven.toFixed(1)}% (đủ bù cả phí mua lẫn phí bán). Bán bây giờ là lãi thật vào ví.`);' },
  { match: 'title = `Cắt lỗ \\$\\{company\\.symbol\\}`;', replace: 'title = `${t("invest.ui.advisorCutLoss", "Cắt lỗ")} ${company.symbol}`;' },
  { match: 'badgeText = "Cảnh báo rủi ro";', replace: 'badgeText = t("invest.ui.advisorRiskWarning", "Cảnh báo rủi ro");' },
  { match: 'message = `Cổ phiếu đang giảm \\$\\{pct\\.toFixed\\(1\\)\\}%\\. Hãy chú ý quản trị vốn hoặc cân nhắc cắt lỗ\\.`;', replace: 'message = t("invest.ui.advisorCutLossMsg", `Cổ phiếu đang giảm ${pct.toFixed(1)}%. Hãy chú ý quản trị vốn hoặc cân nhắc cắt lỗ.`);' },
  { match: 'title = `Tiếp tục giữ \\$\\{company\\.symbol\\}`;', replace: 'title = `${t("invest.ui.advisorKeepHolding", "Tiếp tục giữ")} ${company.symbol}`;' },
  { match: 'badgeText = "Nắm giữ";', replace: 'badgeText = t("invest.ui.advisorHolding", "Nắm giữ");' },
  { match: 'message = `Lời \\+\\$\\{pct\\.toFixed\\(1\\)\\}% CHƯA đủ hoà vốn: bán lúc này vẫn lỗ vì phí hai chiều\\. Mốc hoà vốn của ví bạn là \\+\\$\\{breakEven\\.toFixed\\(1\\)\\}%\\.`;', replace: 'message = t("invest.ui.advisorKeepHoldingMsg", `Lời +${pct.toFixed(1)}% CHƯA đủ hoà vốn: bán lúc này vẫn lỗ vì phí hai chiều. Mốc hoà vốn của ví bạn là +${breakEven.toFixed(1)}%.`);' },
  { match: 'title = `Nắm giữ \\$\\{company\\.symbol\\}`;', replace: 'title = `${t("invest.ui.advisorHold", "Nắm giữ")} ${company.symbol}`;' },
  { match: 'badgeText = "Vị thế tốt";', replace: 'badgeText = t("invest.ui.advisorGoodPosition", "Vị thế tốt");' },
  { match: 'message = `Vị thế \\$\\{company\\.symbol\\} đang ổn định với \\$\\{holding\\.quantity\\.toLocaleString\\(LOCALE\\)\\} cổ phiếu\\.`;', replace: 'message = t("invest.ui.advisorGoodPositionMsg", `Vị thế ${company.symbol} đang ổn định với ${holding.quantity.toLocaleString(LOCALE)} cổ phiếu.`);' },
  { match: 'title = `Theo dõi \\$\\{company\\.symbol\\}`;', replace: 'title = `${t("invest.ui.advisorWatch", "Theo dõi")} ${company.symbol}`;' },
  { match: 'badgeText = "Chưa nắm giữ";', replace: 'badgeText = t("invest.ui.advisorNotHolding", "Chưa nắm giữ");' },
  { match: 'message = `Giá hiện tại \\$\\{priceText\\(company\\.price\\)\\}\\. Mua vào thì cần giá tăng \\$\\{breakEven\\.toFixed\\(1\\)\\}% mới hoà được phí hai chiều\\.`;', replace: 'message = t("invest.ui.advisorWatchMsg", `Giá hiện tại ${priceText(company.price)}. Mua vào thì cần giá tăng ${breakEven.toFixed(1)}% mới hoà được phí hai chiều.`);' },
  
  { match: 'title = `Chốt lời \\$\\{topProfitable\\.symbol\\}`;', replace: 'title = `${t("invest.ui.advisorTakeProfit", "Chốt lời")} ${topProfitable.symbol}`;' },
  { match: 'badgeText = "Điểm chốt đẹp";', replace: 'badgeText = t("invest.ui.advisorGoodExit", "Điểm chốt đẹp");' },
  { match: 'message = `\\$\\{topProfitable\\.symbol\\} đang lời \\+\\$\\{\\(topProfitable\\.unrealizedPct \\* 100\\)\\.toFixed\\(1\\)\\}%, đã qua mốc hoà vốn \\$\\{breakEven\\.toFixed\\(1\\)\\}%\\.`;', replace: 'message = t("invest.ui.advisorGoodExitMsg", `${topProfitable.symbol} đang lời +${(topProfitable.unrealizedPct * 100).toFixed(1)}%, đã qua mốc hoà vốn ${breakEven.toFixed(1)}%.`);' },
  
  { match: 'title = `Quản trị rủi ro \\$\\{topLosing\\.symbol\\}`;', replace: 'title = `${t("invest.ui.advisorRiskMgmt", "Quản trị rủi ro")} ${topLosing.symbol}`;' },
  { match: 'badgeText = "Cảnh báo";', replace: 'badgeText = t("invest.ui.advisorWarning", "Cảnh báo");' },
  { match: 'message = `\\$\\{topLosing\\.symbol\\} đang giảm \\$\\{\\(topLosing\\.unrealizedPct \\* 100\\)\\.toFixed\\(1\\)\\}%\\. Cân nhắc hạ tỷ trọng bảo toàn vốn\\.`;', replace: 'message = t("invest.ui.advisorRiskMgmtMsg", `${topLosing.symbol} đang giảm ${(topLosing.unrealizedPct * 100).toFixed(1)}%. Cân nhắc hạ tỷ trọng bảo toàn vốn.`);' },
  
  { match: 'badgeText = "Tự động";', replace: 'badgeText = t("invest.ui.advisorAuto", "Tự động");' },
  { match: 'message = `Danh mục chưa mã nào qua mốc hoà vốn \\+\\$\\{breakEven\\.toFixed\\(1\\)\\}%\\. Bán sớm là trả phí hai lần cho một lần đi\\.`;', replace: 'message = t("invest.ui.advisorNoBreakEvenMsg", `Danh mục chưa mã nào qua mốc hoà vốn +${breakEven.toFixed(1)}%. Bán sớm là trả phí hai lần cho một lần đi.`);' },
  
  { match: 'title = "Sàn Ảo Hugo";', replace: 'title = t("invest.ui.advisorMarketTitle", "Sàn Ảo Hugo");' },
  { match: 'badgeText = "Hướng dẫn";', replace: 'badgeText = t("invest.ui.advisorGuide", "Hướng dẫn");' },
  { match: 'message = "Chưa có cổ phiếu trong danh mục\\. Sang tab Bảng giá chọn một mã để bắt đầu\\.";', replace: 'message = t("invest.ui.advisorEmptyMsg", "Chưa có cổ phiếu trong danh mục. Sang tab Bảng giá chọn một mã để bắt đầu.");' }
];

replacements.forEach(rep => {
  content = content.replace(new RegExp(rep.match, "g"), rep.replace);
});

fs.writeFileSync(jsxPath, content, "utf8");

// Also add these to en translation json
let enData = JSON.parse(fs.readFileSync("src/i18n/locales/en/translation.json", "utf8"));
const newKeys = {
  "advisorTakeProfit": "Chốt lời",
  "advisorRecSell": "Khuyến nghị Bán",
  "advisorTakeProfitMsg": "Lời +${pct.toFixed(1)}% đã vượt mốc hoà vốn ${breakEven.toFixed(1)}% (đủ bù cả phí mua lẫn phí bán). Bán bây giờ là lãi thật vào ví.",
  "advisorCutLoss": "Cắt lỗ",
  "advisorRiskWarning": "Cảnh báo rủi ro",
  "advisorCutLossMsg": "Cổ phiếu đang giảm ${pct.toFixed(1)}%. Hãy chú ý quản trị vốn hoặc cân nhắc cắt lỗ.",
  "advisorKeepHolding": "Tiếp tục giữ",
  "advisorHolding": "Nắm giữ",
  "advisorKeepHoldingMsg": "Lời +${pct.toFixed(1)}% CHƯA đủ hoà vốn: bán lúc này vẫn lỗ vì phí hai chiều. Mốc hoà vốn của ví bạn là +${breakEven.toFixed(1)}%.",
  "advisorHold": "Nắm giữ",
  "advisorGoodPosition": "Vị thế tốt",
  "advisorGoodPositionMsg": "Vị thế ${company.symbol} đang ổn định với ${holding.quantity.toLocaleString(LOCALE)} cổ phiếu.",
  "advisorWatch": "Theo dõi",
  "advisorNotHolding": "Chưa nắm giữ",
  "advisorWatchMsg": "Giá hiện tại ${priceText(company.price)}. Mua vào thì cần giá tăng ${breakEven.toFixed(1)}% mới hoà được phí hai chiều.",
  "advisorGoodExit": "Điểm chốt đẹp",
  "advisorGoodExitMsg": "${topProfitable.symbol} đang lời +${(topProfitable.unrealizedPct * 100).toFixed(1)}%, đã qua mốc hoà vốn ${breakEven.toFixed(1)}%.",
  "advisorRiskMgmt": "Quản trị rủi ro",
  "advisorWarning": "Cảnh báo",
  "advisorRiskMgmtMsg": "${topLosing.symbol} đang giảm ${(topLosing.unrealizedPct * 100).toFixed(1)}%. Cân nhắc hạ tỷ trọng bảo toàn vốn.",
  "advisorAuto": "Tự động",
  "advisorNoBreakEvenMsg": "Danh mục chưa mã nào qua mốc hoà vốn +${breakEven.toFixed(1)}%. Bán sớm là trả phí hai lần cho một lần đi.",
  "advisorMarketTitle": "Sàn Ảo Hugo",
  "advisorGuide": "Hướng dẫn",
  "advisorEmptyMsg": "Chưa có cổ phiếu trong danh mục. Sang tab Bảng giá chọn một mã để bắt đầu."
};

Object.keys(newKeys).forEach(k => {
  enData.invest.ui[k] = newKeys[k];
});
fs.writeFileSync("src/i18n/locales/en/translation.json", JSON.stringify(enData, null, 2), "utf8");
console.log("Patched SmartAdvisorCard");
