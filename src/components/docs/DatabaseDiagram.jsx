import { useState } from "react";

/**
 * Sơ đồ Cơ sở Dữ liệu & Mối quan hệ Thực thể (Database Entity Relationship Diagram - ERD)
 * Chuẩn phong cách Apple Technical Whitepaper & Harvard Engineering Report:
 * - Thể hiện các Collections / Bảng cốt lõi trong MongoDB của Hugo Studio.
 * - Hiển thị chi tiết kiểu dữ liệu, khóa chính (PK), khóa ngoại (FK), chỉ mục (Index).
 * - Phân tích tính toàn vẹn dữ liệu, kiểm tra mối quan hệ (1:1, 1:N, N:M) và cơ chế Append-Only.
 */

const ENTITIES = [
  {
    id: "UserProfile",
    name: "UserProfile",
    collection: "userprofiles",
    role: "Thực thể định danh gốc (Core Identity Entity)",
    desc: "Lưu thông tin tài khoản, chân dung quan tâm (User Understanding Layer), biểu đồ giờ hoạt động và cấu hình phiên.",
    color: "sky",
    fields: [
      { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính tự sinh MongoDB" },
      { name: "email", type: "String", key: "Indexed, Unique", desc: "Định danh tài khoản người dùng" },
      { name: "interests", type: "Map<String, Number>", key: "", desc: "Trọng số sở thích học tập & công nghệ" },
      { name: "activeHours", type: "Array<Number>[24]", key: "", desc: "Histogram hoạt động 24h theo múi giờ" },
      { name: "engagementCount", type: "Number", key: "", desc: "Số lượt tương tác tích cực" },
      { name: "createdAt / updatedAt", type: "Date", key: "", desc: "Dấu vết thời gian hệ thống" },
    ],
    relations: [
      { target: "WebAuthnCredential", type: "1:N", desc: "Một người dùng đăng ký nhiều thiết bị Passkey" },
      { target: "BioProfile", type: "1:1", desc: "Một người dùng sở hữu 1 trang cá nhân Bio @slug" },
      { target: "JoyLedger", type: "1:N", desc: "Một người dùng sở hữu lịch sử biến động sổ cái JOY" },
      { target: "PaymentLink", type: "1:N", desc: "Lịch sử hóa đơn dịch vụ & đóng góp" },
    ],
  },
  {
    id: "WebAuthnCredential",
    name: "WebAuthnCredential",
    collection: "webauthncredentials",
    role: "Thực thể khóa mật mã sinh trắc học (Passkey)",
    desc: "Lưu Public Key COSE và bộ đếm chữ ký. Không bao giờ lưu Private Key hay vân tay/Face ID của người dùng.",
    color: "indigo",
    fields: [
      { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
      { name: "email", type: "String", key: "FK, Indexed", desc: "Tham chiếu tới UserProfile.email" },
      { name: "credentialID", type: "String", key: "Indexed, Unique", desc: "Mã định danh chứng chỉ Base64URL" },
      { name: "publicKey", type: "String", key: "", desc: "Khóa công khai Public Key (COSE format)" },
      { name: "counter", type: "Number", key: "", desc: "Bộ đếm chữ ký chống Replay Attack" },
      { name: "deviceName", type: "String", key: "", desc: "Tên thiết bị (iPhone Face ID, MacBook Touch ID...)" },
      { name: "lastUsedAt", type: "Date", key: "", desc: "Thời điểm đăng nhập gần nhất" },
    ],
    relations: [
      { target: "UserProfile", type: "N:1", desc: "Thuộc về một tài khoản duy nhất (Cascade on Delete)" },
    ],
  },
  {
    id: "BioProfile",
    name: "BioProfile",
    collection: "bios",
    role: "Hồ sơ cá nhân điện ảnh (Cinematic Bio Profile)",
    desc: "Cấu hình trang @slug, hiệu ứng hào quang Aura, lớp thời tiết tương tác và các liên kết công khai.",
    color: "blue",
    fields: [
      { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
      { name: "slug", type: "String", key: "Indexed, Unique", desc: "Đường dẫn tùy biến (hugowishpax.studio/bio/:slug)" },
      { name: "ownerEmail", type: "String", key: "FK, Indexed", desc: "Email chủ sở hữu hồ sơ" },
      { name: "displayName", type: "String", key: "", desc: "Tên hiển thị nghệ thuật" },
      { name: "auraTheme", type: "String", key: "", desc: "Chủ đề màu sắc hào quang (Cosmic, Emerald, Amber...)" },
      { name: "blocks", type: "Array<BlockObject>", key: "", desc: "Danh sách thẻ liên kết, mạng xã hội, dự án" },
      { name: "weatherEffect", type: "Boolean", key: "", desc: "Bật/tắt lớp phủ thời tiết thời gian thực" },
    ],
    relations: [
      { target: "UserProfile", type: "1:1", desc: "Liên kết 1-1 với tài khoản chủ sở hữu" },
    ],
  },
  {
    id: "JoyLedger",
    name: "JoyLedger",
    collection: "joyledgers",
    role: "Sổ cái điểm thưởng bất biến (Append-Only Ledger)",
    desc: "Lưu vết mọi giao dịch điểm thưởng JOY. Tuyệt đối không UPDATE số dư trực tiếp, chỉ INSERT dòng mới để chống Race Condition.",
    color: "emerald",
    fields: [
      { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
      { name: "email", type: "String", key: "FK, Indexed", desc: "Tham chiếu tài khoản hưởng hoặc trừ điểm" },
      { name: "amount", type: "Number", key: "", desc: "Số lượng điểm biến động (+/- JOY)" },
      { name: "balanceAfter", type: "Number", key: "", desc: "Số dư tức thời sau khi áp dụng giao dịch" },
      { name: "source", type: "String", key: "Indexed", desc: "Nguồn: streak_checkin, pomodoro, chess_win, p2p_transfer" },
      { name: "refId", type: "String", key: "", desc: "Mã tham chiếu đơn hàng hoặc token chuyển điểm" },
      { name: "createdAt", type: "Date", key: "Indexed (Compound)", desc: "Mốc thời gian giao dịch (email + createdAt index)" },
    ],
    relations: [
      { target: "UserProfile", type: "N:1", desc: "Mỗi dòng ghi sổ gắn chặt với một tài khoản" },
      { target: "PendingTransfer", type: "1:1 (ref)", desc: "Tham chiếu lệnh chuyển điểm nếu phát sinh từ P2P" },
    ],
  },
  {
    id: "PendingTransfer",
    name: "PendingTransfer",
    collection: "pendingtransfers",
    role: "Lệnh chuyển điểm P2P hạt phân tử (TTL 60s)",
    desc: "Đối tượng trung gian trong phiên quét QR hạt phân tử. Tự động xóa khỏi Database sau 60 giây nhờ MongoDB TTL Index.",
    color: "amber",
    fields: [
      { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
      { name: "token", type: "String", key: "Indexed, Unique", desc: "Mã băm ngẫu nhiên mã hóa trong QR" },
      { name: "receiverEmail", type: "String", key: "FK", desc: "Người tạo mã để nhận điểm" },
      { name: "status", type: "String", key: "", desc: "PENDING | COMPLETED | EXPIRED" },
      { name: "pinChallenge", type: "String", key: "", desc: "Salt bí mật dùng một lần để đối soát PIN" },
      { name: "createdAt", type: "Date", key: "TTL Index (60s)", desc: "Tự động hủy tài liệu sau 60 giây" },
    ],
    relations: [
      { target: "UserProfile", type: "N:1", desc: "Người nhận và người gửi đều là UserProfile" },
      { target: "JoyLedger", type: "1:2", desc: "Khi hoàn tất, sinh 2 dòng JoyLedger (người gửi -JOY, người nhận +JOY)" },
    ],
  },
  {
    id: "PaymentLink",
    name: "PaymentLink",
    collection: "paymentlinks",
    role: "Hóa đơn & Đơn hàng thanh toán tự động (PayOS)",
    desc: "Lưu vết đơn hàng dịch vụ web hoặc ủng hộ máy chủ, liên kết mã đơn hàng với cổng Napas 24/7.",
    color: "blue",
    fields: [
      { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
      { name: "orderCode", type: "Number", key: "Indexed, Unique", desc: "Mã đơn hàng số nguyên liên ngân hàng" },
      { name: "customLinkId", type: "String", key: "Unique", desc: "Mã định danh liên kết thanh toán" },
      { name: "amount", type: "Number", key: "", desc: "Số tiền chính xác đến từng đồng (VND)" },
      { name: "status", type: "String", key: "Indexed", desc: "PENDING | PAID | CANCELLED" },
      { name: "donorEmail", type: "String", key: "FK, Optional", desc: "Email người thanh toán" },
      { name: "paidAt", type: "Date", key: "", desc: "Thời điểm Napas bắn Webhook HMAC xác nhận" },
    ],
    relations: [
      { target: "UserProfile", type: "N:1 (optional)", desc: "Gắn với tài khoản thành viên nếu đăng nhập" },
    ],
  },
  {
    id: "AdminAuditLog",
    name: "AdminAuditLog",
    collection: "adminauditlogs",
    role: "Nhật ký kiểm toán an ninh quản trị (Audit Trail)",
    desc: "Ghi vết vĩnh viễn mọi hành động của Quản trị viên. Bất biến, không thể sửa đổi hay xóa bỏ để bảo đảm minh bạch.",
    color: "slate",
    fields: [
      { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
      { name: "adminId", type: "String", key: "Indexed", desc: "Mã định danh Admin thực hiện thao tác" },
      { name: "action", type: "String", key: "Indexed", desc: "login | adjust_joy | block_user | update_config" },
      { name: "targetEmail", type: "String", key: "Indexed", desc: "Đối tượng chịu tác động (nếu có)" },
      { name: "ipAddress", type: "String", key: "", desc: "Địa chỉ IP nguồn của phiên quản trị" },
      { name: "userAgent", type: "String", key: "", desc: "Trình duyệt và thiết bị của Admin" },
      { name: "details", type: "Mixed", key: "", desc: "Dữ liệu trước và sau biến động (Snapshot)" },
      { name: "createdAt", type: "Date", key: "Indexed", desc: "Mốc thời gian ghi log chính xác đến millisecond" },
    ],
    relations: [
      { target: "Admin", type: "N:1", desc: "Liên kết quản trị viên thực thi tác vụ" },
    ],
  },
];

const RELATIONSHIPS = [
  {
    from: "UserProfile",
    to: "WebAuthnCredential",
    cardinality: "1 : N",
    rule: "Một người dùng có thể kích hoạt nhiều Passkey (Touch ID, Face ID, Windows Hello). Khi xóa tài khoản User, toàn bộ Credential bị thu hồi (Cascade Delete).",
  },
  {
    from: "UserProfile",
    to: "BioProfile",
    cardinality: "1 : 1",
    rule: "Mỗi người dùng sở hữu duy nhất 1 trang Bio theo slug độc nhất. Slug được index unique để bảo vệ thương hiệu cá nhân.",
  },
  {
    from: "UserProfile",
    to: "JoyLedger",
    cardinality: "1 : N (Append-Only)",
    rule: "Quan hệ ghi sổ một chiều. Hệ thống không bao giờ UPDATE số dư trực tiếp trong bảng User mà tính toán đối soát từ các dòng JoyLedger để loại bỏ hoàn toàn Race Condition.",
  },
  {
    from: "PendingTransfer",
    to: "JoyLedger",
    cardinality: "1 : 2 Atomic",
    rule: "Khi lệnh chuyển điểm P2P hoàn tất thành công, hệ thống kích hoạt transaction nguyên tử tạo đồng thời 2 dòng JoyLedger: Người gửi (-JOY) và Người nhận (+JOY).",
  },
  {
    from: "UserProfile",
    to: "PaymentLink",
    cardinality: "1 : N",
    rule: "Đơn hàng dịch vụ thiết kế web và hóa đơn điện tử được đối soát chính xác theo mã số orderCode qua cổng Napas 24/7.",
  },
  {
    from: "AdminAuditLog",
    to: "System Integrity",
    cardinality: "Bất biến (Immutable)",
    rule: "Nhật ký kiểm toán AdminAuditLog chỉ cho phép ghi (INSERT), cấm mọi hành vi UPDATE hoặc DELETE nhằm ngăn chặn lạm quyền quản trị.",
  },
];

export default function DatabaseDiagram() {
  const [selectedEntity, setSelectedEntity] = useState(ENTITIES[0].id);
  const activeData = ENTITIES.find((e) => e.id === selectedEntity) || ENTITIES[0];

  return (
    <div className="my-6 overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/10 bg-card/90 shadow-lg backdrop-blur-md">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/20 px-5 py-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400">
            <span className="material-symbols-outlined text-sm">schema</span>
            <span>Relational Schema & Architecture Model</span>
          </div>
          <h3 className="mt-2 text-base font-bold tracking-tight sm:text-lg text-foreground">
            Sơ đồ Cơ sở Dữ liệu & Mối quan hệ Thực thể (ERD)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Mô hình hóa 7 Collection cốt lõi trong MongoDB. Thiết kế chuẩn hóa theo triết lý bảo mật, phân tách trách nhiệm và đảm bảo tính bất biến của sổ cái điểm thưởng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            MongoDB 7.x Engine
          </span>
        </div>
      </div>

      {/* Entity Selector Pills */}
      <div className="flex flex-wrap gap-1.5 border-b border-border/60 bg-muted/10 p-3 sm:px-5">
        {ENTITIES.map((ent) => {
          const isSelected = selectedEntity === ent.id;
          return (
            <button
              key={ent.id}
              type="button"
              onClick={() => setSelectedEntity(ent.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-sky-500 text-white shadow-xs scale-[1.02]"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {ent.id === "UserProfile" ? "person" : ent.id === "JoyLedger" ? "wallet" : ent.id === "WebAuthnCredential" ? "fingerprint" : "table_chart"}
              </span>
              <span>{ent.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Entity Detail Card */}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.03] p-4.5 dark:bg-sky-500/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-500/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">database</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground font-mono">
                  db.{activeData.collection}
                </h4>
                <p className="text-xs text-muted-foreground">{activeData.role}</p>
              </div>
            </div>
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Collection: {activeData.collection}
            </span>
          </div>
          <p className="mt-2.5 text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
            {activeData.desc}
          </p>

          {/* Fields Table */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-border/80 bg-card shadow-xs">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold text-foreground">
                  <th className="px-3.5 py-2.5">Tên trường (Field)</th>
                  <th className="px-3.5 py-2.5">Kiểu dữ liệu (Type)</th>
                  <th className="px-3.5 py-2.5">Khóa & Chỉ mục (Key/Index)</th>
                  <th className="px-3.5 py-2.5">Ý nghĩa nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {activeData.fields.map((f) => (
                  <tr key={f.name} className="hover:bg-muted/20">
                    <td className="px-3.5 py-2 font-mono font-bold text-sky-600 dark:text-sky-400">{f.name}</td>
                    <td className="px-3.5 py-2 font-mono text-muted-foreground">{f.type}</td>
                    <td className="px-3.5 py-2">
                      {f.key ? (
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold font-mono ${
                          f.key.includes("PK")
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                            : f.key.includes("Unique")
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                              : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                        }`}>
                          {f.key}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-muted-foreground">{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Relations belonging to this entity */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs font-bold text-foreground self-center">Mối quan hệ trực tiếp:</span>
            {activeData.relations.map((rel) => (
              <span key={rel.target} className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-2xs">
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{rel.type}</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                <span className="font-semibold text-foreground">{rel.target}</span>
                <span className="text-[11px] text-muted-foreground/80">({rel.desc})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Global Relationship Matrix */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-sky-500">hub</span>
            <span>Ma trận Toàn vẹn Dữ liệu & Ràng buộc Quan hệ (Integrity Constraints):</span>
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {RELATIONSHIPS.map((rel) => (
              <div key={rel.from + rel.to} className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card/70 p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-xs font-mono">
                  <span className="font-bold text-foreground">{rel.from}</span>
                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    {rel.cardinality}
                  </span>
                  <span className="font-bold text-foreground">{rel.to}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {rel.rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Guarantee */}
      <div className="border-t border-border/80 bg-muted/20 px-5 py-3.5 text-xs text-muted-foreground flex items-center gap-2">
        <span className="material-symbols-outlined text-sky-500 text-base shrink-0">verified</span>
        <span>Cam kết kiến trúc: MongoDB chạy với cơ chế Replica Set đảm bảo dữ liệu ghi bền vững (Write Concern: majority). Mọi dữ liệu nhạy cảm được băm mật mã trước khi chạm ổ đĩa.</span>
      </div>
    </div>
  );
}
