import { useEffect, useState } from "react";
import { IosApp, AppShell, SectionTitle, ListGroup, ListRow, Card, Button, Stepper, Sheet, Toast, useToast, Chip, Segmented, vnd } from "./iosKit";
import { Art, HeroArt, Avatar } from "./demoArt";

const ACCENT = "#B08D3F";
const BASE_RATE = 7500000; // giá tham chiếu mỗi chỉ

const BARS = [
  { id: "sjc_1chi", art: "goldbar", cat: "bar", name: "Thỏi Vàng SJC 1 Chỉ 9999", weight: 1, fee: 150000, desc: "Đúc nguyên khối, bọc vỉ nhựa bảo an, tiện tích luỹ cá nhân." },
  { id: "sjc_2chi", art: "goldbar", cat: "bar", name: "Thỏi Vàng SJC 2 Chỉ 9999", weight: 2, fee: 200000, desc: "Lựa chọn tiết kiệm cho gia đình nhỏ, dễ bảo quản." },
  { id: "sjc_5chi", art: "goldbar", cat: "bar", name: "Thỏi Vàng SJC 5 Chỉ 9999", weight: 5, fee: 350000, desc: "Phù hợp làm quà cưới cao cấp hoặc tích luỹ trung hạn." },
  { id: "sjc_1luong", art: "goldbar", cat: "bar", name: "Thỏi Vàng SJC 1 Lượng", weight: 10, fee: 600000, desc: "Miếng vàng tiêu chuẩn lưu thông quốc gia, thanh khoản nhanh." },
  { id: "gold_10luong", art: "coin", cat: "bar", name: "Bánh Vàng Hoàng Gia 10 Lượng", weight: 100, fee: 2500000, desc: "Đúc khối nguyên bản 99.99% cho quỹ đầu tư lớn." },
];

const JEWELS = [
  { id: "ring_eternal", art: "ring", cat: "jewel", name: "Nhẫn Cưới Eternal Love", price: 12800000, desc: "Vàng 18K đính kim cương tấm, khắc chữ chìm bên trong lòng nhẫn.", stone: "Kim cương 3.0mm" },
  { id: "ring_solitaire", art: "ring", cat: "jewel", name: "Nhẫn Kim Cương Solitaire", price: 28500000, desc: "Ổ chấu sáu ngạnh cổ điển tôn tối đa độ tán sắc của viên chủ.", stone: "Kim cương 4.5mm" },
  { id: "necklace_lotus", art: "necklace", cat: "jewel", name: "Dây Chuyền Sen Vàng 18K", price: 9600000, desc: "Mặt sen chạm tay, dây bi tròn 45cm, khoá móc an toàn hai lớp.", stone: "Vàng 18K" },
  { id: "earring_drop", art: "earring", cat: "jewel", name: "Bông Tai Giọt Ngọc Trai", price: 6400000, desc: "Ngọc trai Akoya 8mm, chuôi vàng trắng chống dị ứng.", stone: "Ngọc trai Akoya" },
  { id: "bracelet_beads", art: "bracelet", cat: "jewel", name: "Lắc Tay Charm Vàng Ta", price: 15200000, desc: "Chuỗi bi vàng 24K, có thể thêm charm theo dịp kỷ niệm.", stone: "Vàng 24K" },
];

const CATALOG = [...BARS, ...JEWELS];

const FONTS = [
  { id: "serif", label: "Cổ điển", css: "'Times New Roman', serif" },
  { id: "script", label: "Thư pháp", css: "'Brush Script MT', cursive" },
  { id: "mono", label: "Khắc máy", css: "'SF Mono', ui-monospace, monospace" },
];

const POLICIES = [
  { icon: "verified", tint: "#34C759", title: "Bảo hành trọn đời", desc: "Đánh bóng, xi mạ, làm mới miễn phí không giới hạn." },
  { icon: "local_shipping", tint: "#0A84FF", title: "Giao hàng bảo hiểm 100%", desc: "Niêm phong bởi đối tác vận tải an ninh, đền bù tuyệt đối." },
  { icon: "handshake", tint: "#FF9500", title: "Thu đổi minh bạch", desc: "Thu lại theo giá niêm yết cùng ngày, trừ phí gia công." },
  { icon: "workspace_premium", tint: "#8E8E93", title: "Kiểm định SJC", desc: "Mỗi sản phẩm kèm giấy kiểm định và mã seri riêng." },
];

const REVIEWS = [
  { name: "Nguyễn Văn Tuấn", text: "Mua thỏi 1 chỉ, nhân viên tư vấn kỹ, giấy kiểm định đầy đủ.", stars: 5 },
  { name: "Phạm Thị Mai", text: "Khắc chữ lên nhẫn cưới rất sắc nét, đúng kiểu chữ đã chọn.", stars: 5 },
];

export default function JewelryDemo({ isMobile = false }) {
  const [tab, setTab] = useState("home");
  const [catalogTab, setCatalogTab] = useState("bar");
  const [barId, setBarId] = useState("sjc_1chi");
  const [qty, setQty] = useState(1);
  const [engraving, setEngraving] = useState("");
  const [font, setFont] = useState("serif");
  const [detail, setDetail] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [toast, showToast] = useToast();

  // Giá vàng nhích nhẹ theo thời gian như bảng điện tử ngoài tiệm
  const [rate, setRate] = useState(BASE_RATE);
  const [trend, setTrend] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setRate((prev) => {
        const delta = Math.round((Math.random() - 0.45) * 20000);
        setTrend(Math.sign(delta) || 1);
        return Math.max(BASE_RATE * 0.98, Math.min(BASE_RATE * 1.02, prev + delta));
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const priceOf = (item) => (item.cat === "bar" ? rate * item.weight + item.fee : item.price);
  const bar = BARS.find((item) => item.id === barId) || BARS[0];
  const engravingFee = engraving.trim() ? 250000 : 0;
  const total = (rate * bar.weight + bar.fee + engravingFee) * qty;

  const gridCols = isMobile ? "grid-cols-2" : "grid-cols-4";
  const list = CATALOG.filter((item) => item.cat === catalogTab);
  const title = { home: "Hugo Jewelry", shop: "Cửa hàng", engrave: "Khắc chữ", policy: "Chính sách" }[tab];

  const ItemCard = ({ item }) => (
    <Card padded={false} onClick={() => setDetail(item)} className="h-full">
      <span className="block aspect-square w-full overflow-hidden"><Art kind={item.art} /></span>
      <span className="block p-3">
        <span className="block truncate text-[15px] font-semibold">{item.name}</span>
        <span className="mt-0.5 block text-[13px]" style={{ color: "var(--ios-label-2)" }}>
          {item.cat === "bar" ? `${item.weight} chỉ · SJC 9999` : item.stone}
        </span>
        <span className="mt-1 block text-[17px] font-semibold" style={{ color: ACCENT }}>{vnd(priceOf(item))}</span>
      </span>
    </Card>
  );

  return (
    <IosApp scheme="light" accent={ACCENT}>
      <AppShell
        isMobile={isMobile}
        title={title}
        subtitle={tab === "home" ? "Vàng miếng & trang sức · kiểm định SJC" : undefined}
        brand={{ name: "Hugo Jewelry", icon: "diamond", note: "Boutique Quận 1" }}
        sidebarNote="Giá vàng cập nhật mỗi 5 giây trong bản demo."
        tabs={[
          { id: "home", label: "Trang chủ", icon: "home" },
          { id: "shop", label: "Cửa hàng", icon: "diamond" },
          { id: "engrave", label: "Khắc chữ", icon: "edit" },
          { id: "policy", label: "Chính sách", icon: "shield" },
        ]}
        value={tab}
        onChange={setTab}
        actions={
          <span className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "var(--ios-fill)" }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: trend >= 0 ? "#34C759" : "#FF3B30" }}>
              {trend >= 0 ? "trending_up" : "trending_down"}
            </span>
            <span className="text-[13px] font-semibold tabular-nums">{vnd(rate)}/chỉ</span>
          </span>
        }
      >
        {tab === "home" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[18px]">
              <span className="absolute inset-0"><HeroArt from="#6B5418" to="#D9B44A" /></span>
              <div className={`relative ${isMobile ? "p-5" : "p-8"}`}>
                <Chip tint="#fff" filled><span style={{ color: "#6B5418" }}>Eternal Love 2026</span></Chip>
                <p className={`mt-2 font-bold leading-tight text-white ${isMobile ? "text-[26px]" : "text-[34px]"}`}>Khắc tên lên<br />kỷ vật của bạn</p>
                <p className="mt-1.5 max-w-md text-[15px] text-white/80">Tặng gói khắc chữ chìm nghệ thuật cho 50 cặp đôi đăng ký đầu tiên.</p>
                <Button className="mt-4" onClick={() => setTab("engrave")} style={{ background: "#fff", color: "#6B5418" }}>
                  Thử khắc chữ
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Button>
              </div>
            </div>

            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] uppercase tracking-wide" style={{ color: "var(--ios-label-2)" }}>Giá tham chiếu / chỉ</p>
                  <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">{vnd(rate)}</p>
                </div>
                <Chip tint={trend >= 0 ? "#34C759" : "#FF3B30"}>
                  <span className="material-symbols-outlined text-[16px]">{trend >= 0 ? "trending_up" : "trending_down"}</span>
                  {trend >= 0 ? "+" : "−"}{Math.abs(Math.round(((rate - BASE_RATE) / BASE_RATE) * 1000) / 10)}%
                </Chip>
              </div>
              <p className="mt-2 text-[13px]" style={{ color: "var(--ios-label-2)" }}>Cập nhật mỗi 5 giây · chỉ mang tính minh hoạ trong bản demo.</p>
            </Card>

            <section>
              <SectionTitle action={<Button variant="plain" size="sm" onClick={() => { setCatalogTab("bar"); setTab("shop"); }}>Xem tất cả</Button>}>Vàng miếng SJC</SectionTitle>
              <div className={`grid gap-3 ${gridCols}`}>
                {BARS.slice(0, 4).map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            </section>

            <section>
              <SectionTitle action={<Button variant="plain" size="sm" onClick={() => { setCatalogTab("jewel"); setTab("shop"); }}>Xem tất cả</Button>}>Trang sức chế tác</SectionTitle>
              <div className={`grid gap-3 ${gridCols}`}>
                {JEWELS.slice(0, 4).map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            </section>

            <section>
              <SectionTitle>Khách hàng</SectionTitle>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                {REVIEWS.map((review) => (
                  <Card key={review.name}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={review.name} tint={ACCENT} />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{review.name}</p>
                        <p className="text-[13px]" style={{ color: "#FF9F0A" }}>{"★".repeat(review.stars)}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>{review.text}</p>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "shop" && (
          <div className="space-y-4">
            <div className={isMobile ? "" : "w-[280px]"}>
              <Segmented
                items={[{ id: "bar", label: "Vàng miếng" }, { id: "jewel", label: "Trang sức" }]}
                value={catalogTab}
                onChange={setCatalogTab}
              />
            </div>
            <p className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>{list.length} sản phẩm</p>
            <div className={`grid gap-3 ${gridCols}`}>
              {list.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          </div>
        )}

        {tab === "engrave" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-6"}>
            <div className="space-y-4">
              <div
                className="flex h-[200px] items-center justify-center rounded-[16px] p-5"
                style={{ background: "linear-gradient(135deg,#F3E3B3,#C9A227 45%,#8C6D1F)" }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-[10px] border border-black/15 px-4 text-center" style={{ background: "rgba(255,255,255,0.14)" }}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">SJC 9999</span>
                  <span
                    className="mt-1.5 line-clamp-2 break-words text-[22px] font-bold leading-tight text-black/75"
                    style={{ fontFamily: FONTS.find((item) => item.id === font)?.css }}
                  >
                    {engraving.trim() || "Nội dung khắc"}
                  </span>
                  <span className="mt-1.5 text-[11px] tracking-[0.12em] text-black/40">{bar.weight} CHỈ · {bar.id.toUpperCase()}</span>
                </div>
              </div>

              <ListGroup header="Nội dung" footer={`${engraving.length}/24 ký tự · phí khắc ${vnd(250000)} nếu có nội dung.`}>
                <div className="p-3">
                  <input
                    value={engraving}
                    maxLength={24}
                    onChange={(event) => setEngraving(event.target.value)}
                    placeholder="Ví dụ: Gia đình an khang"
                    className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[17px] outline-none focus:ring-0"
                    style={{ background: "var(--ios-fill)" }}
                  />
                </div>
              </ListGroup>

              <div>
                <p className="px-1 pb-1.5 text-[13px] uppercase" style={{ color: "var(--ios-label-2)" }}>Kiểu chữ</p>
                <Segmented items={FONTS.map((item) => ({ id: item.id, label: item.label }))} value={font} onChange={setFont} />
              </div>
            </div>

            <div className="space-y-4">
              <ListGroup header="Sản phẩm nền">
                {BARS.slice(0, 4).map((item, index) => (
                  <ListRow
                    key={item.id}
                    onClick={() => setBarId(item.id)}
                    last={index === 3}
                    title={item.name}
                    value={`${item.weight} chỉ`}
                    trailing={barId === item.id ? <span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>check</span> : null}
                  />
                ))}
              </ListGroup>

              <ListGroup header="Tạm tính">
                <ListRow title="Giá vàng" value={vnd(rate * bar.weight)} />
                <ListRow title="Phí gia công" value={vnd(bar.fee)} />
                <ListRow title="Phí khắc chữ" value={engravingFee ? vnd(engravingFee) : "—"} />
                <ListRow title="Số lượng" trailing={<Stepper value={qty} min={1} max={10} onChange={setQty} />} last />
              </ListGroup>

              <Button full size="lg" onClick={() => setQrOpen(true)}>Đặt cọc · {vnd(total)}</Button>
            </div>
          </div>
        )}

        {tab === "policy" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-5"}>
            <ListGroup header="Đặc quyền khách hàng">
              {POLICIES.map((policy, index) => (
                <ListRow key={policy.title} icon={policy.icon} iconBg={policy.tint} title={policy.title} subtitle={policy.desc} last={index === POLICIES.length - 1} />
              ))}
            </ListGroup>

            <ListGroup header="Cửa hàng">
              <ListRow icon="location_on" iconBg="#FF3B30" title="Boutique Quận 1" subtitle="128 Nguyễn Trãi, TP.HCM" chevron onClick={() => showToast("Mở bản đồ")} />
              <ListRow icon="schedule" iconBg="#8E8E93" title="Giờ mở cửa" value="08:00 – 20:00" />
              <ListRow icon="call" iconBg="#34C759" title="Tư vấn viên" value="1900 6868" chevron onClick={() => showToast("Đang gọi 1900 6868")} last />
            </ListGroup>

            <ListGroup header="Kiểm định" footer="Mỗi sản phẩm có mã seri tra cứu trên hệ thống SJC.">
              <ListRow icon="qr_code_scanner" title="Tra cứu mã seri" chevron onClick={() => showToast("Mở trình quét mã")} last />
            </ListGroup>

            <ListGroup header="Thanh toán">
              <ListRow icon="account_balance" title="Chuyển khoản ngân hàng" subtitle="Vietcombank · 0071 0007 8899" />
              <ListRow icon="credit_card" iconBg="#8E8E93" title="Trả góp 0%" subtitle="Kỳ hạn 3 – 12 tháng" last />
            </ListGroup>
          </div>
        )}
      </AppShell>

      {/* Chi tiết sản phẩm */}
      <Sheet
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name}
        action={
          <Button full size="lg" onClick={() => { if (detail?.cat === "bar") setBarId(detail.id); setDetail(null); setTab(detail?.cat === "bar" ? "engrave" : "policy"); }}>
            {detail?.cat === "bar" ? "Tuỳ chỉnh khắc chữ" : "Xem chính sách bảo hành"}
          </Button>
        }
      >
        {detail && (
          <div className="space-y-4 pb-2">
            <span className="block h-44 w-full overflow-hidden rounded-[16px]"><Art kind={detail.art} ratio="wide" /></span>
            <p className="text-[24px] font-bold" style={{ color: ACCENT }}>{vnd(priceOf(detail))}</p>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>{detail.desc}</p>

            <ListGroup header="Thông số">
              {detail.cat === "bar" ? (
                <>
                  <ListRow title="Trọng lượng" value={`${detail.weight} chỉ`} />
                  <ListRow title="Tuổi vàng" value="9999 (24K)" />
                  <ListRow title="Giá vàng hiện tại" value={vnd(rate * detail.weight)} />
                  <ListRow title="Phí gia công" value={vnd(detail.fee)} last />
                </>
              ) : (
                <>
                  <ListRow title="Chất liệu" value={detail.stone} />
                  <ListRow title="Bảo hành" value="Trọn đời" />
                  <ListRow title="Kiểm định" value="Kèm giấy SJC" last />
                </>
              )}
            </ListGroup>

            {detail.cat === "bar" && (
              <ListGroup header="Số lượng">
                <ListRow title="Số miếng" last trailing={<Stepper value={qty} min={1} max={10} onChange={setQty} />} />
              </ListGroup>
            )}
          </div>
        )}
      </Sheet>

      {/* Thanh toán QR */}
      <Sheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Chuyển khoản đặt cọc"
        action={<Button full size="lg" onClick={() => { setQrOpen(false); showToast("Đã ghi nhận đặt cọc"); }}>Tôi đã chuyển khoản</Button>}
      >
        <div className="space-y-4 pb-2">
          <Card className="flex flex-col items-center gap-3 py-6">
            {/* ponytail: mã QR vẽ bằng lưới ô vuông tất định — demo không cần thư viện QR thật */}
            <div className="grid h-[132px] w-[132px] grid-cols-11 gap-px rounded-[10px] bg-white p-2">
              {Array.from({ length: 121 }, (_, index) => (
                <span key={index} className="rounded-[1px]" style={{ background: (index * 7 + (index % 11) * 3) % 5 < 2 ? "#000" : "transparent" }} />
              ))}
            </div>
            <p className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>Quét bằng ứng dụng ngân hàng bất kỳ</p>
          </Card>

          <ListGroup header="Thông tin chuyển khoản">
            <ListRow title="Ngân hàng" value="Vietcombank" />
            <ListRow title="Chủ tài khoản" value="HUGO JEWELRY" />
            <ListRow title="Số tài khoản" value="0071 0007 8899" />
            <ListRow title="Nội dung" value={`COC ${bar.id.toUpperCase()}`} />
            <ListRow title="Số tiền cọc (20%)" value={vnd(Math.round(total * 0.2))} last />
          </ListGroup>

          <p className="px-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
            Phần còn lại thanh toán khi nhận hàng tại boutique hoặc qua đối tác vận chuyển bảo hiểm.
          </p>
        </div>
      </Sheet>

      <Toast message={toast} />
    </IosApp>
  );
}
