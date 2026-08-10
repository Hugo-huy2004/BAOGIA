import { useMemo, useState } from "react";
import { IosApp, AppShell, SectionTitle, Segmented, ListGroup, ListRow, Card, Button, Sheet, Field, Toast, useToast, Chip, vnd } from "./iosKit";
import { Art, HeroArt, Avatar } from "./demoArt";

const ACCENT = "#FFB340";

const FILTERS = [
  { id: "none", label: "Gốc", css: "none" },
  { id: "noir", label: "Noir", css: "grayscale(1) brightness(0.9) contrast(1.25)" },
  { id: "warm", label: "Ấm", css: "sepia(0.55) saturate(1.1) brightness(0.98)" },
  { id: "vivid", label: "Rực", css: "contrast(1.25) saturate(1.5) brightness(1.05)" },
  { id: "chrome", label: "Chrome", css: "contrast(1.15) saturate(0.5) brightness(0.95)" },
];

const GALLERY = [
  { id: "g1", art: "portrait", title: "Chân dung cửa sổ", cat: "portrait", lens: "85mm f/1.4", iso: "ISO 200" },
  { id: "g2", art: "still", title: "Bàn cà phê buổi sáng", cat: "still", lens: "35mm f/2", iso: "ISO 400" },
  { id: "g3", art: "fashion", title: "Lookbook thu đông", cat: "fashion", lens: "50mm f/1.8", iso: "ISO 100" },
  { id: "g4", art: "portrait", title: "Ánh sáng viền", cat: "portrait", lens: "105mm f/2", iso: "ISO 160" },
  { id: "g5", art: "street", title: "Đường phố đêm", cat: "street", lens: "24mm f/1.4", iso: "ISO 3200" },
  { id: "g6", art: "studio", title: "Studio tối giản", cat: "fashion", lens: "70mm f/2.8", iso: "ISO 100" },
  { id: "g7", art: "nature", title: "Cao nguyên sương sớm", cat: "street", lens: "16mm f/2.8", iso: "ISO 320" },
  { id: "g8", art: "still", title: "Tĩnh vật ánh khối", cat: "still", lens: "60mm macro", iso: "ISO 200" },
];

const GALLERY_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "portrait", label: "Chân dung" },
  { id: "fashion", label: "Thời trang" },
  { id: "street", label: "Phóng sự" },
  { id: "still", label: "Tĩnh vật" },
];

const PACKAGES = [
  { id: "fineart", art: "portrait", title: "Fine Art Portrait", price: 2500000, hours: 2, photos: 25, desc: "Chân dung nghệ thuật trong studio với ánh sáng tối giản.", includes: ["2 giờ chụp studio", "25 ảnh hậu kỳ kỹ", "1 bối cảnh ánh sáng", "Trả ảnh trong 5 ngày"] },
  { id: "editorial", art: "fashion", title: "Editorial & Fashion", price: 5000000, hours: 4, photos: 60, desc: "Concept thời trang cá nhân hoặc lookbook thương hiệu.", includes: ["4 giờ chụp", "60 ảnh hậu kỳ", "Makeup & làm tóc", "3 bộ trang phục", "Moodboard concept"] },
  { id: "couple", art: "nature", title: "Cinematic Couple", price: 3800000, hours: 3, photos: 40, desc: "Chụp đôi phim trường hoặc ngoại cảnh nghệ thuật.", includes: ["3 giờ chụp", "40 ảnh hậu kỳ", "1 phim ngắn 30 giây", "Di chuyển nội thành"] },
  { id: "product", art: "still", title: "Product & Menu", price: 3200000, hours: 3, photos: 45, desc: "Chụp sản phẩm, thực đơn cho cửa hàng và sàn thương mại.", includes: ["Tối đa 15 sản phẩm", "45 ảnh tách nền", "Chuẩn kích thước sàn TMĐT", "Trả ảnh trong 3 ngày"] },
];

const SLOTS = ["09:00", "11:00", "14:00", "16:00", "18:00"];

const REVIEWS = [
  { name: "Phạm Thị Mai", text: "Ảnh trả đúng hẹn, hậu kỳ giữ được màu da tự nhiên.", stars: 5 },
  { name: "Nguyễn Hương Giang", text: "Ekip vui, chỉ dáng tận tình nên chụp đôi không bị gượng.", stars: 5 },
];

export default function PhotographyDemo({ isMobile = false }) {
  const [tab, setTab] = useState("home");
  const [galleryTab, setGalleryTab] = useState("all");
  const [filter, setFilter] = useState("none");
  const [lightbox, setLightbox] = useState(null);
  const [packageId, setPackageId] = useState("fineart");
  const [packageSheet, setPackageSheet] = useState(null);
  const [booking, setBooking] = useState({ name: "", email: "", date: "", slot: "", note: "" });
  const [confirmed, setConfirmed] = useState(null);
  const [toast, showToast] = useToast();

  const photos = useMemo(() => (galleryTab === "all" ? GALLERY : GALLERY.filter((photo) => photo.cat === galleryTab)), [galleryTab]);
  const activePackage = PACKAGES.find((item) => item.id === packageId) || PACKAGES[0];
  const filterCss = FILTERS.find((item) => item.id === filter)?.css;
  const gridCols = isMobile ? "grid-cols-2" : "grid-cols-4";
  const title = { home: "Hugo Studio", gallery: "Tác phẩm", packages: "Gói chụp", booking: "Đặt lịch" }[tab];

  const submitBooking = (event) => {
    event.preventDefault();
    if (!booking.name.trim() || !booking.date || !booking.slot) {
      showToast("Chọn ngày, khung giờ và nhập tên");
      return;
    }
    setConfirmed({
      code: `BK${Math.floor(Math.random() * 9000 + 1000)}`,
      pack: activePackage.title,
      date: booking.date,
      slot: booking.slot,
      deposit: Math.round(activePackage.price * 0.3),
    });
    showToast("Đã giữ lịch chụp");
  };

  const PhotoTile = ({ photo }) => (
    <button type="button" onClick={() => setLightbox(photo)} className="relative overflow-hidden rounded-[14px] transition-transform active:scale-[0.98]">
      <span className="block aspect-[4/5] w-full overflow-hidden" style={{ filter: filterCss }}>
        <Art kind={photo.art} ratio="tall" />
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pb-2 pt-6 text-left">
        <span className="block truncate text-[13px] font-semibold text-white">{photo.title}</span>
        <span className="block text-[11px] text-white/70">{photo.lens}</span>
      </span>
    </button>
  );

  return (
    <IosApp scheme="dark" accent={ACCENT}>
      <AppShell
        isMobile={isMobile}
        title={title}
        subtitle={tab === "home" ? "Nhiếp ảnh chân dung & thời trang" : undefined}
        brand={{ name: "Hugo Studio", icon: "photo_camera", note: "Quận 1, TP.HCM" }}
        sidebarNote="Ảnh minh hoạ được dựng bằng mã, không dùng ảnh chụp thật."
        tabs={[
          { id: "home", label: "Trang chủ", icon: "home" },
          { id: "gallery", label: "Tác phẩm", icon: "photo_library" },
          { id: "packages", label: "Gói chụp", icon: "sell" },
          { id: "booking", label: "Đặt lịch", icon: "calendar_month", badge: confirmed ? 1 : 0 },
        ]}
        value={tab}
        onChange={setTab}
      >
        {tab === "home" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[18px]">
              <span className="absolute inset-0"><HeroArt from="#141821" to="#6A5326" /></span>
              <div className={`relative ${isMobile ? "p-5" : "p-8"}`}>
                <Chip tint="#fff" filled><span style={{ color: "#6A5326" }}>Ưu đãi cuối tuần</span></Chip>
                <p className={`mt-2 font-bold leading-tight text-white ${isMobile ? "text-[26px]" : "text-[34px]"}`}>Giảm 20% gói<br />Cinematic Couple</p>
                <p className="mt-1.5 max-w-md text-[15px] text-white/75">Tặng kèm tư vấn moodboard và bảng phối trang phục miễn phí.</p>
                <Button className="mt-4" onClick={() => setTab("booking")} style={{ background: "#fff", color: "#6A5326" }}>
                  Đặt lịch chụp
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Button>
              </div>
            </div>

            <section>
              <SectionTitle action={<Button variant="plain" size="sm" onClick={() => setTab("gallery")}>Xem tất cả</Button>}>Tác phẩm mới</SectionTitle>
              <div className={`grid gap-3 ${gridCols}`}>
                {GALLERY.slice(0, 4).map((photo) => <PhotoTile key={photo.id} photo={photo} />)}
              </div>
            </section>

            <section>
              <SectionTitle action={<Button variant="plain" size="sm" onClick={() => setTab("packages")}>Bảng giá</Button>}>Gói chụp phổ biến</SectionTitle>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                {PACKAGES.slice(0, 2).map((pack) => (
                  <Card key={pack.id} padded={false} onClick={() => setPackageSheet(pack)}>
                    <span className="block h-28 w-full overflow-hidden"><Art kind={pack.art} ratio="wide" /></span>
                    <span className="block p-4">
                      <span className="block text-[17px] font-semibold">{pack.title}</span>
                      <span className="mt-0.5 block text-[15px]" style={{ color: "var(--ios-label-2)" }}>{pack.hours} giờ · {pack.photos} ảnh</span>
                      <span className="mt-1.5 block text-[20px] font-bold" style={{ color: ACCENT }}>{vnd(pack.price)}</span>
                    </span>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Quy trình</SectionTitle>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-4"}`}>
                {[
                  { icon: "chat", title: "1. Tư vấn concept", desc: "Chốt moodboard, trang phục" },
                  { icon: "photo_camera", title: "2. Buổi chụp", desc: "Studio hoặc ngoại cảnh" },
                  { icon: "auto_fix_high", title: "3. Hậu kỳ", desc: "Chọn ảnh và retouch" },
                  { icon: "cloud_download", title: "4. Trả ảnh", desc: "Link tải riêng 30 ngày" },
                ].map((step) => (
                  <Card key={step.title} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]" style={{ background: ACCENT }}>
                      <span className="material-symbols-outlined text-[22px] text-black">{step.icon}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold">{step.title}</span>
                      <span className="block truncate text-[13px]" style={{ color: "var(--ios-label-2)" }}>{step.desc}</span>
                    </span>
                  </Card>
                ))}
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

        {tab === "gallery" && (
          <div className="space-y-4">
            <div className={isMobile ? "" : "w-[420px]"}>
              <Segmented items={GALLERY_TABS} value={galleryTab} onChange={setGalleryTab} />
            </div>

            <div>
              <p className="px-1 pb-2 text-[13px] uppercase" style={{ color: "var(--ios-label-2)" }}>Bộ lọc màu</p>
              <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
                {FILTERS.map((item) => (
                  <button key={item.id} type="button" onClick={() => setFilter(item.id)} className="shrink-0 text-center" aria-pressed={filter === item.id}>
                    <span className="block h-[54px] w-[54px] overflow-hidden rounded-[12px] border-2" style={{ borderColor: filter === item.id ? ACCENT : "transparent" }}>
                      <span className="block h-full w-full" style={{ filter: item.css }}><Art kind="portrait" /></span>
                    </span>
                    <span className="mt-1 block text-[12px]" style={{ color: filter === item.id ? ACCENT : "var(--ios-label-2)" }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>{photos.length} ảnh</p>
            <div className={`grid gap-3 ${gridCols}`}>
              {photos.map((photo) => <PhotoTile key={photo.id} photo={photo} />)}
            </div>
          </div>
        )}

        {tab === "packages" && (
          <div className="space-y-5">
            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {PACKAGES.map((pack) => (
                <Card key={pack.id} padded={false} onClick={() => setPackageSheet(pack)}>
                  <span className="block h-28 w-full overflow-hidden"><Art kind={pack.art} ratio="wide" /></span>
                  <span className="block p-4">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-[17px] font-semibold">{pack.title}</span>
                        <span className="mt-0.5 block text-[15px]" style={{ color: "var(--ios-label-2)" }}>{pack.desc}</span>
                      </span>
                      {packageId === pack.id && <Chip>Đang chọn</Chip>}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-2">
                      <Chip tint="#8E8E93">{pack.hours} giờ</Chip>
                      <Chip tint="#8E8E93">{pack.photos} ảnh</Chip>
                    </span>
                    <span className="mt-3 block text-[22px] font-bold" style={{ color: ACCENT }}>{vnd(pack.price)}</span>
                  </span>
                </Card>
              ))}
            </div>

            <ListGroup header="Ưu đãi đang chạy">
              <ListRow icon="local_offer" title="Giảm 20% gói Cinematic Couple" subtitle="Áp dụng cho lịch chụp cuối tuần" />
              <ListRow icon="brush" iconBg="#AF52DE" title="Tặng makeup 800.000đ" subtitle="Kèm gói Editorial & Fashion" last />
            </ListGroup>
          </div>
        )}

        {tab === "booking" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-6"}>
            <form onSubmit={submitBooking} className="space-y-5">
              <ListGroup header="Gói chụp">
                {PACKAGES.map((pack, index) => (
                  <ListRow
                    key={pack.id}
                    onClick={() => setPackageId(pack.id)}
                    title={pack.title}
                    value={vnd(pack.price)}
                    last={index === PACKAGES.length - 1}
                    trailing={packageId === pack.id ? <span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>check</span> : null}
                  />
                ))}
              </ListGroup>

              <ListGroup header="Thông tin">
                <Field label="Họ tên" required value={booking.name} onChange={(event) => setBooking({ ...booking, name: event.target.value })} placeholder="Tên của bạn" />
                <Field label="Email" type="email" value={booking.email} onChange={(event) => setBooking({ ...booking, email: event.target.value })} placeholder="ban@email.com" />
                <Field label="Ngày chụp" type="date" required value={booking.date} onChange={(event) => setBooking({ ...booking, date: event.target.value })} />
              </ListGroup>

              <div>
                <p className="px-1 pb-1.5 text-[13px] uppercase" style={{ color: "var(--ios-label-2)" }}>Khung giờ</p>
                <div className="flex flex-wrap gap-2">
                  {SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBooking({ ...booking, slot })}
                      className="min-h-[40px] rounded-[10px] px-4 text-[15px] font-semibold transition-transform active:scale-95"
                      style={booking.slot === slot ? { background: ACCENT, color: "#000" } : { background: "var(--ios-fill)", color: "var(--ios-label)" }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <ListGroup header="Ghi chú" footer="Studio sẽ gửi moodboard gợi ý trước buổi chụp.">
                <textarea
                  rows={3}
                  value={booking.note}
                  onChange={(event) => setBooking({ ...booking, note: event.target.value })}
                  placeholder="Concept mong muốn, trang phục, số người…"
                  className="w-full resize-none border-0 bg-transparent p-4 text-[17px] outline-none placeholder:text-[var(--ios-label-3)] focus:ring-0"
                />
              </ListGroup>

              <Button full size="lg" type="submit">Giữ lịch · cọc {vnd(Math.round(activePackage.price * 0.3))}</Button>
            </form>

            <div className="space-y-4">
              {confirmed ? (
                <Card>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#34C759]">
                      <span className="material-symbols-outlined text-[24px] text-white">event_available</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[17px] font-semibold">Đã giữ lịch {confirmed.code}</span>
                      <span className="block text-[13px]" style={{ color: "var(--ios-label-2)" }}>{confirmed.pack} · {confirmed.date} lúc {confirmed.slot}</span>
                    </span>
                  </div>
                  <p className="mt-3 text-[15px]" style={{ color: "var(--ios-label-2)" }}>
                    Đặt cọc 30% (<span className="font-semibold" style={{ color: ACCENT }}>{vnd(confirmed.deposit)}</span>) để chốt lịch. Studio sẽ gọi xác nhận trong 2 giờ.
                  </p>
                </Card>
              ) : (
                <Card>
                  <p className="text-[17px] font-semibold">Lịch trống tuần này</p>
                  <p className="mt-1 text-[15px]" style={{ color: "var(--ios-label-2)" }}>Khung 09:00 và 16:00 còn nhiều chỗ nhất.</p>
                </Card>
              )}

              <ListGroup header="Chính sách">
                <ListRow icon="event_repeat" title="Đổi lịch miễn phí" subtitle="Báo trước 48 giờ" />
                <ListRow icon="payments" iconBg="#34C759" title="Cọc 30%" subtitle="Phần còn lại thanh toán sau buổi chụp" />
                <ListRow icon="cloud_download" iconBg="#0A84FF" title="Trả ảnh qua cloud" subtitle="Link riêng, hết hạn sau 30 ngày" last />
              </ListGroup>
            </div>
          </div>
        )}
      </AppShell>

      {/* Lightbox */}
      <Sheet
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        title={lightbox?.title}
        action={<Button full size="lg" variant="gray" onClick={() => showToast("Đã lưu vào bộ sưu tập")}>Lưu ảnh</Button>}
      >
        {lightbox && (
          <div className="space-y-4 pb-2">
            <span className="block h-64 w-full overflow-hidden rounded-[14px]" style={{ filter: filterCss }}>
              <Art kind={lightbox.art} ratio="wide" />
            </span>
            <ListGroup header="Thông số">
              <ListRow title="Ống kính" value={lightbox.lens} />
              <ListRow title="ISO" value={lightbox.iso} />
              <ListRow title="Bộ lọc" value={FILTERS.find((item) => item.id === filter)?.label} last />
            </ListGroup>
          </div>
        )}
      </Sheet>

      {/* Chi tiết gói chụp */}
      <Sheet
        open={Boolean(packageSheet)}
        onClose={() => setPackageSheet(null)}
        title={packageSheet?.title}
        action={<Button full size="lg" onClick={() => { setPackageId(packageSheet.id); setPackageSheet(null); setTab("booking"); }}>Chọn gói này</Button>}
      >
        {packageSheet && (
          <div className="space-y-4 pb-2">
            <span className="block h-40 w-full overflow-hidden rounded-[14px]"><Art kind={packageSheet.art} ratio="wide" /></span>
            <p className="text-[28px] font-bold" style={{ color: ACCENT }}>{vnd(packageSheet.price)}</p>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>{packageSheet.desc}</p>
            <ListGroup header="Bao gồm">
              {packageSheet.includes.map((item, index) => (
                <ListRow key={item} title={item} last={index === packageSheet.includes.length - 1} />
              ))}
            </ListGroup>
            <ListGroup header="Thanh toán" footer="Cọc 30% khi giữ lịch, phần còn lại thanh toán sau buổi chụp.">
              <ListRow title="Đặt cọc" value={vnd(Math.round(packageSheet.price * 0.3))} />
              <ListRow title="Còn lại" value={vnd(packageSheet.price - Math.round(packageSheet.price * 0.3))} last />
            </ListGroup>
          </div>
        )}
      </Sheet>

      <Toast message={toast} />
    </IosApp>
  );
}
