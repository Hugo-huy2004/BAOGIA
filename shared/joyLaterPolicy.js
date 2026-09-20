/**
 * JOYlater — CHẾ TÀI NỢ QUÁ HẠN.
 * ============================================================================
 *
 * `joyLater.js` lo phần tính tiền. File này lo phần "nợ quá lâu thì sao", và nó
 * là một bậc thang, không phải một cái công tắc.
 *
 * ── VÌ SAO LÀ BẬC THANG ─────────────────────────────────────────────────────
 * Nợ quá hạn có hai nguyên nhân nhìn giống hệt nhau từ phía máy chủ: người quên
 * và người bỏ. Chỉ THỜI GIAN mới tách được hai loại đó. Khoá ngay từ ngày đầu
 * là phạt người quên; không làm gì cả là mời người bỏ. Nên mỗi bậc nặng hơn
 * bậc trước, và mỗi bậc đều báo trước bậc kế tiếp.
 *
 * ── BẬC CUỐI KHÔNG TỰ ĐỘNG ──────────────────────────────────────────────────
 * Khoá vĩnh viễn và ghi vào sổ đen là việc KHÔNG GỠ LẠI ĐƯỢC. Một lỗi tính ngày
 * hay một lần đồng hồ máy chủ lệch là mất vĩnh viễn tài khoản của người không
 * làm gì sai. Nên bậc cuối chỉ DỰNG HỒ SƠ và đẩy sang admin bấm nút duyệt —
 * đúng quy ước đã dùng cho mọi lệnh ghi trong bảng điều khiển Telegram.
 *
 * ── TÁI PHẠM LEO THANG NHANH HƠN ────────────────────────────────────────────
 * Người đã từng quỵt một lần rồi vay tiếp thì mọi mốc rút ngắn còn một nửa.
 * Lần đầu có thể là quên; lần thứ hai thì không.
 */

/** Các quyền bị thu hồi ở từng bậc. Tên ở đây là hợp đồng với phía máy chủ. */
export const RESTRICTIONS = Object.freeze({
  NEW_LOAN: "new_loan",       // không mở thêm khoản JOYlater
  TRANSFER: "transfer",       // không chuyển JOY cho người khác
  SPEND: "spend",             // không tiêu JOY vào tính năng trả phí
});

/**
 * Bậc thang, xếp từ nhẹ tới nặng. `afterDays` tính từ ngày tới hạn của đợt trễ
 * NHẤT (đợt quá hạn lâu nhất), không phải từ ngày mở khoản vay.
 */
export const DEBT_STAGES = Object.freeze([
  {
    id: "ontime", afterDays: -Infinity, restrict: [], lockDays: 0,
    // Chưa trễ. Không nhắc gì — nhắc khi chưa tới hạn là làm phiền.
  },
  {
    id: "grace", afterDays: 0, restrict: [], lockDays: 0,
    // Vừa quá hạn. Chỉ nhắc một câu, chưa lấy đi quyền nào: rất nhiều người
    // trả trong ba ngày đầu mà không cần bị siết gì.
  },
  {
    id: "restricted", afterDays: 7, restrict: [RESTRICTIONS.NEW_LOAN, RESTRICTIONS.TRANSFER], lockDays: 0,
    // Một tuần. Chặn CHUYỂN JOY trước tiên: đó là đường duy nhất để đẩy JOY
    // sang tài khoản khác rồi bỏ tài khoản nợ lại.
  },
  {
    id: "frozen", afterDays: 21, restrict: [RESTRICTIONS.NEW_LOAN, RESTRICTIONS.TRANSFER, RESTRICTIONS.SPEND], lockDays: 0,
    // Ba tuần. Đóng băng tiêu pha — JOY kiếm được từ đây chỉ còn một đường đi
    // là trả nợ. Vẫn CHƯA khoá tài khoản: người ta phải vào được app thì mới
    // kiếm JOY mà trả.
  },
  {
    id: "locked", afterDays: 45, restrict: [RESTRICTIONS.NEW_LOAN, RESTRICTIONS.TRANSFER, RESTRICTIONS.SPEND], lockDays: 30,
    // Sáu tuần rưỡi. Khoá tài khoản CÓ THỜI HẠN 30 ngày. Tự động được, vì nó
    // hết hạn — sai thì cũng chỉ sai trong một tháng.
  },
  {
    id: "review", afterDays: 90, restrict: [RESTRICTIONS.NEW_LOAN, RESTRICTIONS.TRANSFER, RESTRICTIONS.SPEND], lockDays: 30,
    // Ba tháng. Dựng hồ sơ khoá vĩnh viễn + ghi sổ đen, ĐỢI ADMIN DUYỆT.
    // Không tự động: xem chú thích đầu tệp.
    needsAdmin: true,
  },
]);

const STAGE_BY_ID = new Map(DEBT_STAGES.map((s) => [s.id, s]));

/** Người đã từng bị ghi sổ đen mà vẫn vay tiếp thì mọi mốc rút còn một nửa. */
export const REPEAT_SPEEDUP = 0.5;

/** Ngưỡng nợ quá nhỏ thì bỏ qua — không đáng để khoá tài khoản một ai. */
export const IGNORE_BELOW = 50;

/**
 * Bậc chế tài cho một khoản nợ.
 *
 * @param {number} daysOverdue  Số ngày quá hạn của đợt trễ lâu nhất.
 * @param {number} outstanding  Số JOY còn nợ.
 * @param {number} priorDefaults Số lần đã bị ghi sổ đen trước đây.
 */
export function stageFor({ daysOverdue = 0, outstanding = 0, priorDefaults = 0 } = {}) {
  if (!(outstanding > IGNORE_BELOW)) return STAGE_BY_ID.get("ontime");
  if (!(daysOverdue >= 0)) return STAGE_BY_ID.get("ontime");

  // Tái phạm: co mọi mốc lại, nhưng không bao giờ co bậc "grace" (mốc 0) —
  // ai cũng có quyền được nhắc trước khi bị lấy mất thứ gì.
  const factor = priorDefaults > 0 ? REPEAT_SPEEDUP : 1;

  let current = STAGE_BY_ID.get("ontime");
  for (const stage of DEBT_STAGES) {
    const threshold = stage.afterDays <= 0 ? stage.afterDays : stage.afterDays * factor;
    if (daysOverdue >= threshold) current = stage;
  }
  return current;
}

/** Bậc kế tiếp và còn bao nhiêu ngày nữa — để báo trước, không úp sọt. */
export function nextStage({ daysOverdue = 0, priorDefaults = 0 } = {}) {
  const factor = priorDefaults > 0 ? REPEAT_SPEEDUP : 1;
  for (const stage of DEBT_STAGES) {
    if (stage.afterDays <= 0) continue;
    const threshold = stage.afterDays * factor;
    if (daysOverdue < threshold) {
      return { stage, inDays: Math.ceil(threshold - daysOverdue) };
    }
  }
  return null;    // đã ở bậc cuối
}

/** Quyền này còn dùng được không? */
export function isRestricted(stageId, restriction) {
  return Boolean(STAGE_BY_ID.get(stageId)?.restrict.includes(restriction));
}

export const stageById = (id) => STAGE_BY_ID.get(id) || null;

/** Thứ tự nặng dần — để so sánh "bậc mới có nặng hơn bậc đã ghi không". */
export const stageRank = (id) => DEBT_STAGES.findIndex((s) => s.id === id);

export default { DEBT_STAGES, RESTRICTIONS, stageFor, nextStage, isRestricted, stageRank };
