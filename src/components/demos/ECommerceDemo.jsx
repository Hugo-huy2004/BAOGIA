import { useMemo, useState } from "react";
import { IosApp, AppShell, SectionTitle, Segmented, SearchField, ListGroup, ListRow, Card, Button, Stepper, Sheet, Field, Toast, useToast, Chip, vnd } from "./iosKit";
import { Art, HeroArt, Avatar } from "./demoArt";

const ACCENT = "#0A84FF";

const PRODUCTS = [
  { id: "sneaker", art: "sneaker", name: "Hugo Sneaker Pro V2", type: "Giày", price: 1850000, oldPrice: 2050000, colors: ["black", "blue", "gold"], sizes: ["39", "40", "41", "42", "43"], stock: 12, rating: 4.8, sold: 320, tag: "hot", desc: "Sneaker bọt khí siêu nhẹ, đệm nâng tuần hoàn, phối màu thời trang." },
  { id: "bomber", art: "jacket", name: "Áo Khoác Bomber Techwear", type: "Thời trang", price: 1250000, oldPrice: 1500000, colors: ["black", "blue"], sizes: ["M", "L", "XL"], stock: 8, rating: 4.7, sold: 184, tag: "hot", desc: "Dù dệt lỗ khí chống gió, chống thấm nhẹ, nhiều ngăn đa dụng." },
  { id: "hoodie", art: "hoodie", name: "Hoodie Nỉ Bông Oversize", type: "Thời trang", price: 690000, oldPrice: 850000, colors: ["black", "rose"], sizes: ["M", "L", "XL"], stock: 32, rating: 4.6, sold: 410, desc: "Nỉ bông chải lông 380gsm, form rộng, mũ hai lớp giữ phom." },
  { id: "backpack", art: "backpack", name: "Balo Da Chống Nước Carbon", type: "Phụ kiện", price: 950000, oldPrice: 1100000, colors: ["black"], sizes: ["Standard"], stock: 25, rating: 4.9, sold: 512, tag: "best", desc: "Vải da phối sợi carbon chống nước, ngăn laptop 16 inch chuyên biệt." },
  { id: "cap", art: "cap", name: "Nón Lưỡi Trai Thêu Logo", type: "Phụ kiện", price: 320000, oldPrice: 390000, colors: ["black", "mint"], sizes: ["Free size"], stock: 60, rating: 4.5, sold: 780, desc: "Kaki cotton dày dặn, khoá kim loại điều chỉnh, thêu nổi chỉ dày." },
  { id: "glasses", art: "glasses", name: "Kính Mát Polarized UV400", type: "Phụ kiện", price: 540000, oldPrice: 700000, colors: ["black", "gold"], sizes: ["Standard"], stock: 18, rating: 4.7, sold: 233, desc: "Tròng phân cực chống loá, gọng nhựa acetate nhẹ 22g." },
  { id: "smartwatch", art: "watch", name: "Đồng Hồ GPS Smart Sport", type: "Thiết bị", price: 3200000, oldPrice: 3800000, colors: ["black", "gold"], sizes: ["Standard"], stock: 5, rating: 4.6, sold: 96, tag: "new", desc: "AMOLED chống chói, GPS định vị, đo nhịp tim 24/7." },
  { id: "earbuds", art: "earbuds", name: "Tai Nghe Bluetooth Pro Sound", type: "Thiết bị", price: 1500000, oldPrice: 1800000, colors: ["black", "blue", "gold"], sizes: ["Standard"], stock: 18, rating: 4.8, sold: 274, tag: "best", desc: "Chống ồn ANC, bass mạnh, pin liên tục 36 giờ." },
  { id: "speaker", art: "speaker", name: "Loa Di Động Bass Kép", type: "Thiết bị", price: 2100000, oldPrice: 2450000, colors: ["black"], sizes: ["Standard"], stock: 9, rating: 4.7, sold: 141, desc: "Hai màng bass đối xứng, chuẩn kháng nước IPX7, pin 20 giờ." },
  { id: "keyboard", art: "keyboard", name: "Bàn Phím Cơ Không Dây 75%", type: "Thiết bị", price: 1690000, oldPrice: 1950000, colors: ["black", "mint"], sizes: ["Standard"], stock: 14, rating: 4.9, sold: 302, tag: "new", desc: "Switch êm gasket mount, kết nối ba chế độ, hotswap 5 chân." },
  { id: "bottle", art: "bottle", name: "Bình Giữ Nhiệt Thép 600ml", type: "Gia dụng", price: 380000, oldPrice: 450000, colors: ["blue", "mint"], sizes: ["600ml"], stock: 48, rating: 4.6, sold: 654, desc: "Thép 316 hai lớp, giữ nóng 12 giờ, nắp chống rò khi nghiêng." },
  { id: "lamp", art: "lamp", name: "Đèn Bàn LED Chống Cận", type: "Gia dụng", price: 720000, oldPrice: 880000, colors: ["gold"], sizes: ["Standard"], stock: 21, rating: 4.7, sold: 189, desc: "Ba nhiệt màu, không nhấp nháy, cảm biến sáng tự điều chỉnh." },
];

const COLOR_NAMES = { black: "Carbon Black", blue: "Navy Blue", gold: "Rich Gold", rose: "Dusty Rose", mint: "Sage Mint" };
const COLOR_HEX = { black: "#1C1C1E", blue: "#0A84FF", gold: "#D4A017", rose: "#E8A0AC", mint: "#7FC8A9" };

const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "Thời trang", label: "Thời trang" },
  { id: "Phụ kiện", label: "Phụ kiện" },
  { id: "Thiết bị", label: "Thiết bị" },
  { id: "Gia dụng", label: "Gia dụng" },
];

const SORTS = [
  { id: "hot", label: "Phổ biến" },
  { id: "low", label: "Giá thấp" },
  { id: "high", label: "Giá cao" },
];

const REVIEWS = [
  { name: "Lê Thu Duyên", text: "Giày nhẹ hơn mình tưởng, đi cả ngày không mỏi. Đóng gói kỹ.", stars: 5 },
  { name: "Hoàng Văn Nam", text: "Balo chống nước thật, đi mưa 20 phút laptop vẫn khô ráo.", stars: 5 },
  { name: "Phạm Khánh Huyền", text: "Tai nghe chống ồn tốt trong tầm giá, pin dùng gần một tuần.", stars: 4 },
];

const COUPONS = { FREESHIP: 0, HUGO10: 10, SUMMER50: 50 };
const SHIPPING_FEE = 30000;
const TAG_LABEL = { hot: "Bán chạy", new: "Mới về", best: "Yêu thích" };

export default function ECommerceDemo({ isMobile = false }) {
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("hot");
  const [cart, setCart] = useState([]);
  const [saved, setSaved] = useState(["backpack"]);
  const [detail, setDetail] = useState(null);
  const [variant, setVariant] = useState({ color: "", size: "", qty: 1 });
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ship, setShip] = useState({ name: "", phone: "", address: "" });
  const [placedOrder, setPlacedOrder] = useState(null);
  const [toast, showToast] = useToast();

  const visible = useMemo(() => {
    const list = PRODUCTS.filter(
      (product) =>
        (category === "all" || product.type === category) &&
        product.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    return [...list].sort((a, b) => b.sold - a.sold);
  }, [category, query, sort]);

  const cartQty = cart.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discountAmount = Math.round((subtotal * discount) / 100);
  const shippingFee = subtotal >= 500000 || coupon.toUpperCase() === "FREESHIP" ? 0 : SHIPPING_FEE;
  const grandTotal = Math.max(0, subtotal - discountAmount + (subtotal > 0 ? shippingFee : 0));

  const openDetail = (product) => {
    setDetail(product);
    setVariant({ color: product.colors[0], size: product.sizes[0], qty: 1 });
  };

  const addToCart = () => {
    const key = `${detail.id}-${variant.color}-${variant.size}`;
    setCart((prev) => {
      const found = prev.find((line) => line.key === key);
      if (found) return prev.map((line) => (line.key === key ? { ...line, qty: line.qty + variant.qty } : line));
      return [...prev, { key, id: detail.id, art: detail.art, name: detail.name, price: detail.price, color: variant.color, size: variant.size, qty: variant.qty }];
    });
    showToast(`Đã thêm ${detail.name}`);
    setDetail(null);
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code in COUPONS) {
      setDiscount(COUPONS[code]);
      showToast(code === "FREESHIP" ? "Áp dụng miễn phí vận chuyển" : `Giảm ${COUPONS[code]}%`);
    } else {
      setDiscount(0);
      showToast("Mã không hợp lệ");
    }
  };

  const checkout = () => {
    if (!ship.name.trim() || !ship.phone.trim() || !ship.address.trim()) {
      showToast("Điền đủ thông tin nhận hàng");
      return;
    }
    setPlacedOrder({ id: `HG${Math.floor(Math.random() * 900000 + 100000)}`, total: grandTotal, items: cart.length, eta: "2 – 4 ngày" });
    setCart([]);
    setDiscount(0);
    setCoupon("");
    setCheckoutOpen(false);
    setTab("account");
  };

  const toggleSaved = (id) => setSaved((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const gridCols = isMobile ? "grid-cols-2" : "grid-cols-4";

  const ProductCard = ({ product }) => (
    <Card padded={false} onClick={() => openDetail(product)} className="h-full">
      <span className="relative block">
        <span className="block aspect-square w-full overflow-hidden">
          <Art kind={product.art} />
        </span>
        {product.tag && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">{TAG_LABEL[product.tag]}</span>
        )}
        {product.oldPrice > product.price && (
          <span className="absolute right-2 top-2 rounded-full bg-[#FF3B30] px-2 py-0.5 text-[11px] font-semibold text-white">
            -{Math.round(100 - (product.price / product.oldPrice) * 100)}%
          </span>
        )}
      </span>
      <span className="block p-3">
        <span className="block truncate text-[15px] font-semibold">{product.name}</span>
        <span className="mt-0.5 block text-[13px]" style={{ color: "var(--ios-label-2)" }}>★ {product.rating} · đã bán {product.sold}</span>
        <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[17px] font-semibold" style={{ color: ACCENT }}>{vnd(product.price)}</span>
          <span className="text-[13px] line-through" style={{ color: "var(--ios-label-3)" }}>{vnd(product.oldPrice)}</span>
        </span>
      </span>
    </Card>
  );

  const title = { home: "Hugo Store", shop: "Cửa hàng", cart: "Giỏ hàng", saved: "Đã lưu", account: "Tài khoản" }[tab];

  return (
    <IosApp scheme="light" accent={ACCENT}>
      <AppShell
        isMobile={isMobile}
        title={title}
        subtitle={tab === "home" ? `${PRODUCTS.length} sản phẩm · giao toàn quốc` : undefined}
        brand={{ name: "Hugo Store", icon: "storefront", note: "Thời trang & thiết bị" }}
        sidebarNote="Demo tương tác — dữ liệu chỉ nằm trong trình duyệt của bạn."
        tabs={[
          { id: "home", label: "Trang chủ", icon: "home" },
          { id: "shop", label: "Cửa hàng", icon: "storefront" },
          { id: "saved", label: "Đã lưu", icon: "favorite", badge: saved.length },
          { id: "cart", label: "Giỏ", icon: "shopping_cart", badge: cartQty },
          { id: "account", label: "Tài khoản", icon: "person" },
        ]}
        value={tab}
        onChange={setTab}
        actions={
          <button type="button" onClick={() => setTab("cart")} className="relative flex h-9 w-9 items-center justify-center" aria-label="Giỏ hàng">
            <span className="material-symbols-outlined text-[24px]" style={{ color: ACCENT }}>shopping_bag</span>
            {cartQty > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[11px] font-semibold text-white">{cartQty}</span>
            )}
          </button>
        }
      >
        {/* ------------------------------------------------------ TRANG CHỦ */}
        {tab === "home" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[18px]">
              <span className="absolute inset-0"><HeroArt from="#0A84FF" to="#0B2E63" /></span>
              <div className={`relative ${isMobile ? "p-5" : "p-8"}`}>
                <Chip tint="#fff" filled><span style={{ color: "#0A84FF" }}>Summer Sale 2026</span></Chip>
                <p className={`mt-2 font-bold leading-tight text-white ${isMobile ? "text-[26px]" : "text-[34px]"}`}>Giảm đến 50%<br />toàn bộ sneaker</p>
                <p className="mt-1.5 max-w-md text-[15px] text-white/75">Miễn phí vận chuyển cho đơn từ 500.000đ, đổi trả trong 7 ngày.</p>
                <Button className="mt-4" onClick={() => setTab("shop")} style={{ background: "#fff", color: "#0A84FF" }}>
                  Mua ngay
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Button>
              </div>
            </div>

            <div className={`grid gap-3 ${isMobile ? "grid-cols-3" : "grid-cols-5"}`}>
              {CATEGORIES.filter((item) => item.id !== "all").map((item) => (
                <Card key={item.id} padded={false} onClick={() => { setCategory(item.id); setTab("shop"); }}>
                  <span className="block aspect-[4/3] w-full overflow-hidden">
                    <Art kind={PRODUCTS.find((product) => product.type === item.id)?.art || "cart"} ratio="wide" />
                  </span>
                  <span className="block truncate p-2 text-center text-[13px] font-semibold">{item.label}</span>
                </Card>
              ))}
            </div>

            <section>
              <SectionTitle action={<Button variant="plain" size="sm" onClick={() => setTab("shop")}>Xem tất cả</Button>}>Bán chạy nhất</SectionTitle>
              <div className={`grid gap-3 ${gridCols}`}>
                {[...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, isMobile ? 4 : 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Mới về</SectionTitle>
              <div className={`grid gap-3 ${gridCols}`}>
                {PRODUCTS.filter((product) => product.tag === "new" || product.tag === "best").slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Khách hàng nói gì</SectionTitle>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
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

            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              {[
                { icon: "local_shipping", tint: "#FF9500", title: "Giao 2 – 4 ngày", desc: "Đối tác Viettel Post toàn quốc" },
                { icon: "assignment_return", tint: "#34C759", title: "Đổi trả 7 ngày", desc: "Miễn phí nếu lỗi từ nhà sản xuất" },
                { icon: "verified_user", tint: "#0A84FF", title: "Bảo hành 12 tháng", desc: "Áp dụng cho nhóm thiết bị" },
              ].map((item) => (
                <Card key={item.title} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]" style={{ background: item.tint }}>
                    <span className="material-symbols-outlined text-[22px] text-white">{item.icon}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{item.title}</span>
                    <span className="block truncate text-[13px]" style={{ color: "var(--ios-label-2)" }}>{item.desc}</span>
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- CỬA HÀNG */}
        {tab === "shop" && (
          <div className="space-y-4">
            <div className={isMobile ? "space-y-3" : "flex items-center gap-3"}>
              <div className={isMobile ? "" : "w-[280px]"}><SearchField value={query} onChange={setQuery} placeholder="Tìm sản phẩm" /></div>
              <div className={isMobile ? "" : "ml-auto w-[240px]"}><Segmented items={SORTS} value={sort} onChange={setSort} /></div>
            </div>

            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
              {CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className="min-h-[34px] shrink-0 rounded-full px-4 text-[15px] font-medium transition-transform active:scale-95"
                  style={category === item.id ? { background: ACCENT, color: "#fff" } : { background: "var(--ios-fill)", color: "var(--ios-label)" }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>{visible.length} sản phẩm</p>

            {visible.length === 0 ? (
              <p className="py-10 text-center text-[15px]" style={{ color: "var(--ios-label-2)" }}>Không tìm thấy sản phẩm nào.</p>
            ) : (
              <div className={`grid gap-3 ${gridCols}`}>
                {visible.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- GIỎ HÀNG */}
        {tab === "cart" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-[1fr_320px] items-start gap-5"}>
            {cart.length === 0 ? (
              <Card className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="material-symbols-outlined text-[44px]" style={{ color: "var(--ios-label-3)" }}>shopping_bag</span>
                <p className="text-[17px] font-semibold">Giỏ hàng trống</p>
                <Button variant="tinted" size="sm" className="mt-1" onClick={() => setTab("shop")}>Tiếp tục mua sắm</Button>
              </Card>
            ) : (
              <>
                <ListGroup header={`${cartQty} sản phẩm`}>
                  {cart.map((line, index) => (
                    <ListRow
                      key={line.key}
                      last={index === cart.length - 1}
                      title={line.name}
                      subtitle={`${COLOR_NAMES[line.color] || line.color} · Size ${line.size} · ${vnd(line.price)}`}
                      icon={null}
                      trailing={
                        <span className="flex items-center gap-2">
                          <span className="hidden h-11 w-11 shrink-0 overflow-hidden rounded-[10px] sm:block"><Art kind={line.art} /></span>
                          <Stepper
                            value={line.qty}
                            min={0}
                            onChange={(next) =>
                              setCart((prev) => (next === 0 ? prev.filter((l) => l.key !== line.key) : prev.map((l) => (l.key === line.key ? { ...l, qty: next } : l))))
                            }
                          />
                        </span>
                      }
                    />
                  ))}
                </ListGroup>

                <div className="space-y-4">
                  <ListGroup header="Mã giảm giá" footer="Thử FREESHIP, HUGO10 hoặc SUMMER50.">
                    <div className="flex items-center gap-2 p-3">
                      <input
                        value={coupon}
                        onChange={(event) => setCoupon(event.target.value)}
                        placeholder="Nhập mã"
                        className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[17px] uppercase outline-none focus:ring-0"
                        style={{ background: "var(--ios-fill)" }}
                      />
                      <Button size="sm" variant="tinted" onClick={applyCoupon}>Áp dụng</Button>
                    </div>
                  </ListGroup>

                  <ListGroup header="Tạm tính">
                    <ListRow title="Tiền hàng" value={vnd(subtotal)} />
                    <ListRow title="Giảm giá" value={discountAmount ? `-${vnd(discountAmount)}` : "—"} />
                    <ListRow title="Vận chuyển" value={shippingFee ? vnd(shippingFee) : "Miễn phí"} />
                    <ListRow title="Tổng thanh toán" value={vnd(grandTotal)} last />
                  </ListGroup>

                  <Button full size="lg" onClick={() => setCheckoutOpen(true)}>Thanh toán · {vnd(grandTotal)}</Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* --------------------------------------------------------- ĐÃ LƯU */}
        {tab === "saved" && (
          saved.length === 0 ? (
            <p className="py-10 text-center text-[15px]" style={{ color: "var(--ios-label-2)" }}>Chưa lưu sản phẩm nào.</p>
          ) : (
            <div className={`grid gap-3 ${gridCols}`}>
              {PRODUCTS.filter((product) => saved.includes(product.id)).map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )
        )}

        {/* ------------------------------------------------------ TÀI KHOẢN */}
        {tab === "account" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-5"}>
            {placedOrder && (
              <Card className={isMobile ? "" : "col-span-2"}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#34C759]">
                    <span className="material-symbols-outlined text-[24px] text-white">check</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold">Đặt hàng thành công</span>
                    <span className="block text-[13px]" style={{ color: "var(--ios-label-2)" }}>Mã đơn {placedOrder.id} · giao {placedOrder.eta}</span>
                  </span>
                  <span className="ml-auto text-[17px] font-semibold" style={{ color: ACCENT }}>{vnd(placedOrder.total)}</span>
                </div>
              </Card>
            )}

            <ListGroup header="Hugo Club">
              <ListRow icon="workspace_premium" iconBg="#FF9500" title="Hạng thành viên" value="Vàng" />
              <ListRow icon="stars" title="Điểm tích luỹ" value="1.240" subtitle="Tích 5% mỗi đơn" last />
            </ListGroup>

            <ListGroup header="Đơn hàng">
              <ListRow icon="local_shipping" title="Đang giao" value={placedOrder ? "1" : "0"} chevron />
              <ListRow icon="inventory_2" iconBg="#8E8E93" title="Lịch sử mua" value="14" chevron />
              <ListRow icon="assignment_return" iconBg="#FF3B30" title="Đổi trả" subtitle="Miễn phí trong 7 ngày" chevron last />
            </ListGroup>

            <ListGroup header="Địa chỉ">
              <ListRow icon="home" title="Nhà riêng" subtitle="128 Nguyễn Trãi, Quận 1, TP.HCM" chevron />
              <ListRow icon="apartment" iconBg="#8E8E93" title="Văn phòng" subtitle="Toà Bitexco, Quận 1, TP.HCM" chevron last />
            </ListGroup>

            <ListGroup header="Hỗ trợ">
              <ListRow icon="support_agent" title="Chat với tư vấn viên" chevron onClick={() => showToast("Đang kết nối tư vấn viên")} />
              <ListRow icon="help" iconBg="#8E8E93" title="Câu hỏi thường gặp" chevron last />
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
          <div className="flex gap-2">
            <Button variant="gray" size="lg" onClick={() => toggleSaved(detail.id)} aria-label="Lưu sản phẩm">
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: saved.includes(detail?.id) ? "'FILL' 1" : "'FILL' 0", color: saved.includes(detail?.id) ? "#FF3B30" : undefined }}
              >
                favorite
              </span>
            </Button>
            <Button size="lg" className="flex-1" onClick={addToCart}>
              Thêm vào giỏ · {vnd(detail ? detail.price * variant.qty : 0)}
            </Button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-4 pb-2">
            <span className="block h-48 w-full overflow-hidden rounded-[14px]"><Art kind={detail.art} ratio="wide" /></span>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-bold" style={{ color: ACCENT }}>{vnd(detail.price)}</span>
              <span className="text-[15px] line-through" style={{ color: "var(--ios-label-3)" }}>{vnd(detail.oldPrice)}</span>
              <Chip tint="#FF3B30" filled>-{Math.round(100 - (detail.price / detail.oldPrice) * 100)}%</Chip>
            </div>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>{detail.desc}</p>
            <div className="flex flex-wrap gap-2">
              <Chip>★ {detail.rating}</Chip>
              <Chip tint="#8E8E93">Đã bán {detail.sold}</Chip>
              <Chip tint={detail.stock < 10 ? "#FF9500" : "#34C759"}>Còn {detail.stock}</Chip>
            </div>

            <ListGroup header="Màu sắc">
              {detail.colors.map((color, index) => (
                <ListRow
                  key={color}
                  onClick={() => setVariant({ ...variant, color })}
                  title={COLOR_NAMES[color] || color}
                  last={index === detail.colors.length - 1}
                  trailing={
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full border" style={{ background: COLOR_HEX[color], borderColor: "var(--ios-sep)" }} />
                      {variant.color === color && <span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>check</span>}
                    </span>
                  }
                />
              ))}
            </ListGroup>

            <ListGroup header="Kích cỡ">
              <div className="flex flex-wrap gap-2 p-3">
                {detail.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setVariant({ ...variant, size })}
                    className="min-h-[38px] min-w-[52px] rounded-[10px] px-3 text-[15px] font-semibold transition-transform active:scale-95"
                    style={variant.size === size ? { background: ACCENT, color: "#fff" } : { background: "var(--ios-fill)", color: "var(--ios-label)" }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </ListGroup>

            <ListGroup header="Số lượng">
              <ListRow title="Số lượng" last trailing={<Stepper value={variant.qty} min={1} max={detail.stock} onChange={(qty) => setVariant({ ...variant, qty })} />} />
            </ListGroup>

            <ListGroup header="Vận chuyển">
              <ListRow icon="local_shipping" iconBg="#FF9500" title="Giao 2 – 4 ngày" subtitle="Miễn phí cho đơn từ 500.000đ" />
              <ListRow icon="verified_user" iconBg="#34C759" title="Bảo hành 12 tháng" last />
            </ListGroup>
          </div>
        )}
      </Sheet>

      {/* Thanh toán */}
      <Sheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Thanh toán"
        action={<Button full size="lg" onClick={checkout}>Đặt hàng · {vnd(grandTotal)}</Button>}
      >
        <div className="space-y-4 pb-2">
          <ListGroup header="Thông tin nhận hàng">
            <Field label="Họ tên" value={ship.name} onChange={(event) => setShip({ ...ship, name: event.target.value })} placeholder="Nguyễn Văn A" />
            <Field label="Điện thoại" value={ship.phone} onChange={(event) => setShip({ ...ship, phone: event.target.value })} placeholder="09xx xxx xxx" inputMode="tel" />
            <Field label="Địa chỉ" value={ship.address} onChange={(event) => setShip({ ...ship, address: event.target.value })} placeholder="Số nhà, phường, quận" />
          </ListGroup>

          <ListGroup header="Phương thức" footer="Demo không thu tiền thật.">
            <ListRow icon="qr_code_2" title="Chuyển khoản VietQR" subtitle="Xác nhận tự động" trailing={<span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>check</span>} />
            <ListRow icon="payments" iconBg="#34C759" title="Thanh toán khi nhận hàng" last />
          </ListGroup>

          <ListGroup header="Tổng kết">
            <ListRow title="Tiền hàng" value={vnd(subtotal)} />
            <ListRow title="Giảm giá" value={discountAmount ? `-${vnd(discountAmount)}` : "—"} />
            <ListRow title="Vận chuyển" value={shippingFee ? vnd(shippingFee) : "Miễn phí"} />
            <ListRow title="Tổng cộng" value={vnd(grandTotal)} last />
          </ListGroup>
        </div>
      </Sheet>

      <Toast message={toast} />
    </IosApp>
  );
}
