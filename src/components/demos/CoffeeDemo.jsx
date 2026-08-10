import { useEffect, useMemo, useState } from "react";
import { IosApp, AppShell, SectionTitle, Segmented, ListGroup, ListRow, Card, Button, Stepper, Sheet, Toast, useToast, Chip, ProgressBar, vnd } from "./iosKit";
import { Art, HeroArt, Avatar } from "./demoArt";

const ACCENT = "#B87333";

const MENU = [
  { id: "espresso", art: "espresso", cat: "coffee", name: "Espresso Đậm Vị", price: 45000, kcal: 12, prep: 3, rating: 4.8, sold: 420, desc: "Cà phê nguyên chất pha máy dưới áp suất cao, giữ trọn hương vị." },
  { id: "latte", art: "latte", cat: "coffee", name: "Café Latte Nghệ Thuật", price: 55000, kcal: 180, prep: 5, rating: 4.9, sold: 610, tag: "Bán chạy", desc: "Espresso và sữa nóng đánh bọt mịn, vẽ hình latte art." },
  { id: "coldbrew", art: "coldbrew", cat: "coffee", name: "Cold Brew Cam Sả", price: 60000, kcal: 90, prep: 2, rating: 4.7, sold: 380, tag: "Mới", desc: "Cà phê ủ lạnh 16 tiếng, lát cam tươi và sả thơm." },
  { id: "capu", art: "espresso", cat: "coffee", name: "Cappuccino Bọt Dày", price: 52000, kcal: 150, prep: 4, rating: 4.7, sold: 295, desc: "Tỉ lệ 1:1:1 cà phê, sữa nóng và bọt sữa dày mịn." },
  { id: "peachtea", art: "tea", cat: "tea", name: "Trà Đào Cam Sả", price: 55000, kcal: 150, prep: 4, rating: 4.8, sold: 520, tag: "Bán chạy", desc: "Trà đen đậm vị, đào tươi giòn, lát cam vàng và sả thơm." },
  { id: "matcha", art: "matcha", cat: "tea", name: "Matcha Latte Nhật Bản", price: 65000, kcal: 210, prep: 5, rating: 4.6, sold: 340, desc: "Bột trà xanh Uji nguyên chất hoà cùng sữa tươi không đường." },
  { id: "oolong", art: "tea", cat: "tea", name: "Trà Ô Long Sữa Kem", price: 50000, kcal: 190, prep: 4, rating: 4.5, sold: 210, desc: "Ô long ủ nóng phủ lớp kem sữa mặn nhẹ, ít ngọt." },
  { id: "croissant", art: "croissant", cat: "cakes", name: "Croissant Bơ Tỏi", price: 35000, kcal: 330, prep: 6, rating: 4.9, sold: 720, tag: "Bán chạy", desc: "Bánh sừng bò nướng giòn tan, thơm bơ tỏi và phô mai kéo sợi." },
  { id: "tiramisu", art: "tiramisu", cat: "cakes", name: "Tiramisu Truyền Thống", price: 50000, kcal: 380, prep: 2, rating: 4.8, sold: 410, desc: "Bánh ngọt Ý vị cà phê thơm nồng, hương rượu rum nhẹ." },
  { id: "cheesecake", art: "tiramisu", cat: "cakes", name: "Cheesecake Chanh Dây", price: 48000, kcal: 350, prep: 2, rating: 4.7, sold: 288, desc: "Phô mai kem béo nhẹ, sốt chanh dây chua thanh phủ mặt." },
];

const CATEGORIES = [
  { id: "coffee", label: "Cà phê" },
  { id: "tea", label: "Trà" },
  { id: "cakes", label: "Bánh" },
];

const SIZES = [
  { id: "s", label: "Nhỏ", extra: 0 },
  { id: "m", label: "Vừa", extra: 6000 },
  { id: "l", label: "Lớn", extra: 12000 },
];

const TOPPINGS = [
  { id: "shot", label: "Thêm 1 shot espresso", extra: 10000 },
  { id: "oat", label: "Đổi sữa yến mạch", extra: 12000 },
  { id: "cream", label: "Kem phô mai macchiato", extra: 15000 },
  { id: "pearl", label: "Trân châu trắng", extra: 8000 },
];

const SUGAR = ["Không đường", "30% đường", "70% đường", "100% đường"];
const ICE = ["Không đá", "Ít đá", "Đá bình thường"];
const TRACK_STEPS = ["Quán đã nhận đơn", "Barista đang pha", "Đang mang ra bàn", "Hoàn tất"];

const REVIEWS = [
  { name: "Trần Quốc Hưng", text: "Cold brew cam sả thanh, ngồi làm việc cả buổi vẫn thấy dễ chịu.", stars: 5 },
  { name: "Nguyễn Hương Giang", text: "Croissant nóng giòn, nhân phô mai kéo sợi đúng như mô tả.", stars: 5 },
  { name: "Đỗ Gia Bảo", text: "Gọi món tại bàn tiện, không phải xếp hàng ở quầy.", stars: 4 },
];

export default function CoffeeDemo({ isMobile = false }) {
  const [tab, setTab] = useState("home");
  const [category, setCategory] = useState("coffee");
  const [cart, setCart] = useState([]);
  const [detail, setDetail] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [toast, showToast] = useToast();

  const [size, setSize] = useState("m");
  const [sugar, setSugar] = useState(SUGAR[1]);
  const [ice, setIce] = useState(ICE[2]);
  const [toppings, setToppings] = useState([]);
  const [qty, setQty] = useState(1);

  const totalQty = cart.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.unit * line.qty, 0);

  // Đơn tự chạy qua các bước như quầy pha chế thật đang xử lý
  useEffect(() => {
    if (!order || order.step >= TRACK_STEPS.length - 1) return undefined;
    const id = setTimeout(() => setOrder((prev) => (prev ? { ...prev, step: prev.step + 1 } : prev)), 4000);
    return () => clearTimeout(id);
  }, [order]);

  const openDetail = (item) => {
    setDetail(item);
    setSize("m");
    setSugar(SUGAR[1]);
    setIce(ICE[2]);
    setToppings([]);
    setQty(1);
  };

  const detailUnit = useMemo(() => {
    if (!detail) return 0;
    const sizeExtra = SIZES.find((item) => item.id === size)?.extra || 0;
    const topExtra = toppings.reduce((sum, id) => sum + (TOPPINGS.find((item) => item.id === id)?.extra || 0), 0);
    return detail.price + sizeExtra + topExtra;
  }, [detail, size, toppings]);

  const addToCart = () => {
    const opts = [SIZES.find((item) => item.id === size)?.label, sugar, ice, ...toppings.map((id) => TOPPINGS.find((item) => item.id === id)?.label)].filter(Boolean);
    setCart((prev) => [...prev, { key: `${detail.id}-${Date.now()}`, art: detail.art, name: detail.name, unit: detailUnit, qty, opts }]);
    showToast(`Đã thêm ${qty} ${detail.name}`);
    setDetail(null);
  };

  const setLineQty = (key, next) =>
    setCart((prev) => (next === 0 ? prev.filter((line) => line.key !== key) : prev.map((line) => (line.key === key ? { ...line, qty: next } : line))));

  const placeOrder = () => {
    setOrder({ id: `#${Math.floor(Math.random() * 9000 + 1000)}`, step: 0, items: cart, total: subtotal });
    setCart([]);
    setCartOpen(false);
    setTab("orders");
    showToast("Đã gửi đơn xuống quầy");
  };

  const gridCols = isMobile ? "grid-cols-2" : "grid-cols-4";
  const items = MENU.filter((item) => item.cat === category);
  const title = { home: "Hugo Cafe", menu: "Thực đơn", orders: "Đơn của bạn", store: "Cửa hàng" }[tab];

  const MenuCard = ({ item }) => (
    <Card padded={false} onClick={() => openDetail(item)} className="h-full">
      <span className="relative block">
        <span className="block aspect-square w-full overflow-hidden"><Art kind={item.art} /></span>
        {item.tag && <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">{item.tag}</span>}
      </span>
      <span className="block p-3">
        <span className="block truncate text-[15px] font-semibold">{item.name}</span>
        <span className="mt-0.5 block text-[13px]" style={{ color: "var(--ios-label-2)" }}>★ {item.rating} · {item.kcal} kcal</span>
        <span className="mt-1 block text-[17px] font-semibold" style={{ color: ACCENT }}>{vnd(item.price)}</span>
      </span>
    </Card>
  );

  return (
    <IosApp scheme="light" accent={ACCENT}>
      <AppShell
        isMobile={isMobile}
        title={title}
        subtitle={tab === "home" ? "Bàn 08 · đang phục vụ" : undefined}
        brand={{ name: "Hugo Cafe", icon: "local_cafe", note: "Bàn 08 · Quận 1" }}
        sidebarNote="Gọi món tại bàn, thanh toán khi nhận."
        tabs={[
          { id: "home", label: "Trang chủ", icon: "home" },
          { id: "menu", label: "Thực đơn", icon: "restaurant_menu" },
          { id: "orders", label: "Đơn hàng", icon: "receipt_long", badge: order && order.step < TRACK_STEPS.length - 1 ? 1 : 0 },
          { id: "store", label: "Cửa hàng", icon: "storefront" },
        ]}
        value={tab}
        onChange={setTab}
        actions={
          <button type="button" onClick={() => setCartOpen(true)} className="relative flex h-9 w-9 items-center justify-center" aria-label="Giỏ hàng">
            <span className="material-symbols-outlined text-[24px]" style={{ color: ACCENT }}>shopping_bag</span>
            {totalQty > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[11px] font-semibold text-white">{totalQty}</span>
            )}
          </button>
        }
        bottomBar={
          totalQty > 0 && (tab === "home" || tab === "menu") ? (
            <Button full size="lg" onClick={() => setCartOpen(true)}>Xem giỏ · {totalQty} món · {vnd(subtotal)}</Button>
          ) : null
        }
      >
        {tab === "home" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[18px]">
              <span className="absolute inset-0"><HeroArt from="#4A2C16" to="#B87333" /></span>
              <div className={`relative ${isMobile ? "p-5" : "p-8"}`}>
                <Chip tint="#fff" filled><span style={{ color: "#8A4B18" }}>Ưu đãi sáng 7–9h</span></Chip>
                <p className={`mt-2 font-bold leading-tight text-white ${isMobile ? "text-[26px]" : "text-[34px]"}`}>Combo Espresso<br />&amp; Croissant 29k</p>
                <p className="mt-1.5 max-w-md text-[15px] text-white/75">Hạt rang mộc 100% từ cao nguyên LangBiang, bánh nướng tươi mỗi sáng.</p>
                <Button className="mt-4" onClick={() => setTab("menu")} style={{ background: "#fff", color: "#8A4B18" }}>
                  Gọi món ngay
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((item) => (
                <Card key={item.id} padded={false} onClick={() => { setCategory(item.id); setTab("menu"); }}>
                  <span className="block aspect-[4/3] w-full overflow-hidden">
                    <Art kind={MENU.find((menu) => menu.cat === item.id)?.art} ratio="wide" />
                  </span>
                  <span className="block truncate p-2 text-center text-[13px] font-semibold">{item.label}</span>
                </Card>
              ))}
            </div>

            <section>
              <SectionTitle action={<Button variant="plain" size="sm" onClick={() => setTab("menu")}>Xem thực đơn</Button>}>Món được gọi nhiều</SectionTitle>
              <div className={`grid gap-3 ${gridCols}`}>
                {[...MENU].sort((a, b) => b.sold - a.sold).slice(0, 4).map((item) => <MenuCard key={item.id} item={item} />)}
              </div>
            </section>

            <section>
              <SectionTitle>Giá trị cốt lõi</SectionTitle>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                {[
                  { icon: "eco", tint: "#34C759", title: "Hạt cà phê mộc", desc: "Rang mộc 100%, không tẩm bơ đường." },
                  { icon: "bakery_dining", tint: "#FF9500", title: "Bánh nướng mỗi sáng", desc: "Baker nướng tươi từ bột nhập khẩu." },
                  { icon: "chair", tint: "#8E8E93", title: "Không gian trầm ấm", desc: "Ổ cắm tại bàn, nhạc lo-fi nhẹ." },
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
            </section>

            <section>
              <SectionTitle>Khách nói gì</SectionTitle>
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
          </div>
        )}

        {tab === "menu" && (
          <div className="space-y-4">
            <div className={isMobile ? "" : "w-[320px]"}>
              <Segmented items={CATEGORIES} value={category} onChange={setCategory} />
            </div>
            <p className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>{items.length} món</p>
            <div className={`grid gap-3 ${gridCols}`}>
              {items.map((item) => <MenuCard key={item.id} item={item} />)}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className={isMobile || !order ? "space-y-5" : "grid grid-cols-2 items-start gap-5"}>
            {!order ? (
              <Card className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="material-symbols-outlined text-[44px]" style={{ color: "var(--ios-label-3)" }}>receipt_long</span>
                <p className="text-[17px] font-semibold">Chưa có đơn nào</p>
                <p className="text-[15px]" style={{ color: "var(--ios-label-2)" }}>Chọn món ở tab Thực đơn để bắt đầu.</p>
                <Button variant="tinted" size="sm" className="mt-2" onClick={() => setTab("menu")}>Xem thực đơn</Button>
              </Card>
            ) : (
              <>
                <Card>
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-semibold">Đơn {order.id}</span>
                    <Chip tint={order.step === TRACK_STEPS.length - 1 ? "#34C759" : ACCENT}>{TRACK_STEPS[order.step]}</Chip>
                  </div>
                  <div className="mt-3"><ProgressBar value={((order.step + 1) / TRACK_STEPS.length) * 100} /></div>
                  <ul className="mt-4 space-y-3">
                    {TRACK_STEPS.map((step, index) => (
                      <li key={step} className="flex items-center gap-2.5 text-[15px]">
                        <span className="material-symbols-outlined text-[20px]" style={{ color: index <= order.step ? ACCENT : "var(--ios-label-3)" }}>
                          {index <= order.step ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        <span style={{ color: index <= order.step ? "var(--ios-label)" : "var(--ios-label-2)" }}>{step}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <div className="space-y-4">
                  <ListGroup header="Chi tiết" footer="Bàn 08 · thanh toán tại quầy">
                    {order.items.map((line, index) => (
                      <ListRow
                        key={line.key}
                        title={`${line.qty}× ${line.name}`}
                        subtitle={line.opts.join(" · ")}
                        value={vnd(line.unit * line.qty)}
                        last={index === order.items.length - 1}
                      />
                    ))}
                  </ListGroup>
                  <div className="flex items-center justify-between px-1 text-[17px] font-semibold">
                    <span>Tổng cộng</span>
                    <span style={{ color: ACCENT }}>{vnd(order.total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "store" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-5"}>
            <ListGroup header="Thông tin quán">
              <ListRow icon="schedule" iconBg="#34C759" title="Giờ mở cửa" value="07:00 – 22:00" />
              <ListRow icon="location_on" iconBg="#FF3B30" title="Địa chỉ" subtitle="128 Nguyễn Trãi, Bến Thành, Quận 1, TP.HCM" chevron onClick={() => showToast("Mở bản đồ chỉ đường")} />
              <ListRow icon="call" iconBg="#0A84FF" title="Gọi đặt bàn" value="090 123 4567" chevron onClick={() => showToast("Đang gọi 090 123 4567")} />
              <ListRow icon="mail" iconBg="#8E8E93" title="Email" subtitle="bistro@hugocafe.vn" last />
            </ListGroup>

            <ListGroup header="Đặt chỗ" footer="Phòng workshop có máy chiếu, bảng vẽ, sức chứa 30 người.">
              <ListRow icon="event_seat" title="Giữ bàn trước" subtitle="Xác nhận trong 5 phút" chevron onClick={() => showToast("Đã gửi yêu cầu giữ bàn")} />
              <ListRow icon="groups" title="Đặt phòng workshop" subtitle="Riêng tư, tối đa 30 khách" chevron onClick={() => showToast("Nhân viên sẽ gọi lại")} last />
            </ListGroup>

            <ListGroup header="Thành viên" footer="Tích 1 điểm cho mỗi 10.000đ. Đủ 100 điểm đổi 1 đồ uống.">
              <ListRow icon="loyalty" iconBg="#FF9500" title="Điểm tích luỹ" value="68 điểm" />
              <ListRow icon="redeem" title="Đổi thưởng" subtitle="Cần thêm 32 điểm" chevron last />
            </ListGroup>

            <ListGroup header="Không gian">
              <ListRow icon="wifi" title="Wi-Fi miễn phí" value="hugocafe_5G" />
              <ListRow icon="power" iconBg="#8E8E93" title="Ổ cắm tại bàn" value="24 bàn" />
              <ListRow icon="pets" iconBg="#AF52DE" title="Cho phép thú cưng" value="Tầng trệt" last />
            </ListGroup>
          </div>
        )}
      </AppShell>

      {/* Chi tiết món */}
      <Sheet
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name}
        action={<Button full size="lg" onClick={addToCart}>Thêm {qty} món · {vnd(detailUnit * qty)}</Button>}
      >
        {detail && (
          <div className="space-y-4 pb-2">
            <span className="block h-44 w-full overflow-hidden rounded-[14px]"><Art kind={detail.art} ratio="wide" /></span>
            <p className="text-[15px]" style={{ color: "var(--ios-label-2)" }}>{detail.desc}</p>
            <div className="flex flex-wrap gap-2">
              <Chip>★ {detail.rating}</Chip>
              <Chip tint="#8E8E93">{detail.kcal} kcal</Chip>
              <Chip tint="#8E8E93">~{detail.prep} phút</Chip>
            </div>

            <ListGroup header="Kích cỡ">
              {SIZES.map((option, index) => (
                <ListRow
                  key={option.id}
                  onClick={() => setSize(option.id)}
                  title={option.label}
                  value={option.extra ? `+${vnd(option.extra)}` : "Chuẩn"}
                  last={index === SIZES.length - 1}
                  trailing={size === option.id ? <span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>check</span> : null}
                />
              ))}
            </ListGroup>

            <ListGroup header="Đường">
              {SUGAR.map((option, index) => (
                <ListRow key={option} onClick={() => setSugar(option)} title={option} last={index === SUGAR.length - 1}
                  trailing={sugar === option ? <span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>check</span> : null} />
              ))}
            </ListGroup>

            <ListGroup header="Đá">
              {ICE.map((option, index) => (
                <ListRow key={option} onClick={() => setIce(option)} title={option} last={index === ICE.length - 1}
                  trailing={ice === option ? <span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>check</span> : null} />
              ))}
            </ListGroup>

            <ListGroup header="Thêm topping">
              {TOPPINGS.map((option, index) => (
                <ListRow
                  key={option.id}
                  onClick={() => setToppings((prev) => (prev.includes(option.id) ? prev.filter((item) => item !== option.id) : [...prev, option.id]))}
                  title={option.label}
                  value={`+${vnd(option.extra)}`}
                  last={index === TOPPINGS.length - 1}
                  trailing={toppings.includes(option.id) ? <span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>check_circle</span> : null}
                />
              ))}
            </ListGroup>

            <ListGroup header="Số lượng">
              <ListRow title="Số ly" last trailing={<Stepper value={qty} min={1} max={20} onChange={setQty} />} />
            </ListGroup>
          </div>
        )}
      </Sheet>

      {/* Giỏ hàng */}
      <Sheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Giỏ hàng"
        action={<Button full size="lg" disabled={cart.length === 0} onClick={placeOrder}>Gửi đơn · {vnd(subtotal)}</Button>}
      >
        {cart.length === 0 ? (
          <p className="py-10 text-center text-[15px]" style={{ color: "var(--ios-label-2)" }}>Giỏ hàng đang trống.</p>
        ) : (
          <div className="space-y-4 pb-2">
            <ListGroup>
              {cart.map((line, index) => (
                <ListRow
                  key={line.key}
                  title={line.name}
                  subtitle={`${line.opts.join(" · ")} — ${vnd(line.unit)}`}
                  last={index === cart.length - 1}
                  trailing={<Stepper value={line.qty} min={0} onChange={(next) => setLineQty(line.key, next)} />}
                />
              ))}
            </ListGroup>
            <ListGroup footer="Đơn được gửi thẳng xuống quầy pha chế, thanh toán khi nhận món.">
              <ListRow title="Tạm tính" value={vnd(subtotal)} />
              <ListRow title="Phí phục vụ" value="Miễn phí" />
              <ListRow title="Bàn" value="08" last />
            </ListGroup>
          </div>
        )}
      </Sheet>

      <Toast message={toast} />
    </IosApp>
  );
}
