import { useMemo, useState } from "react";
import { IosApp, AppShell, Segmented, ListGroup, ListRow, Card, Button, Toggle, Sheet, Toast, useToast, Chip, vnd } from "./iosKit";

const ACCENT = "#30D158";

const CHART = [
  { day: "T2", value: 12 },
  { day: "T3", value: 19 },
  { day: "T4", value: 15 },
  { day: "T5", value: 27 },
  { day: "T6", value: 22 },
  { day: "T7", value: 34 },
  { day: "CN", value: 42 },
];

const CHANNELS = {
  jewelry: { label: "Trang sức", tint: "#B08D3F", icon: "diamond" },
  ecommerce: { label: "Cửa hàng", tint: "#0A84FF", icon: "storefront" },
  photography: { label: "Studio", tint: "#FFB340", icon: "photo_camera" },
  cafe: { label: "Cafe", tint: "#B87333", icon: "local_cafe" },
};

const INITIAL_SALES = [
  { id: 1, name: "Nguyễn Văn Tuấn", product: "Thỏi Vàng 1 Chỉ SJC 9999", channel: "jewelry", amount: 7650000, time: "5 phút trước", status: "completed" },
  { id: 2, name: "Lê Thu Duyên", product: "Hugo Sneaker Pro V2", channel: "ecommerce", amount: 1850000, time: "15 phút trước", status: "completed" },
  { id: 3, name: "Phạm Thị Mai", product: "Gói Fine Art Portrait", channel: "photography", amount: 2500000, time: "30 phút trước", status: "pending" },
  { id: 4, name: "Trần Quốc Hưng", product: "Combo Cafe & Croissant", channel: "cafe", amount: 80000, time: "1 giờ trước", status: "completed" },
  { id: 5, name: "Hoàng Văn Nam", product: "Balo Da Carbon Waterproof", channel: "ecommerce", amount: 950000, time: "2 giờ trước", status: "completed" },
];

const POOL = [
  { name: "Trần Minh Khôi", product: "Thỏi Vàng SJC 2 Chỉ 9999", channel: "jewelry", amount: 15200000 },
  { name: "Phạm Khánh Huyền", product: "Đồng Hồ GPS Smart Sport", channel: "ecommerce", amount: 3200000 },
  { name: "Đỗ Gia Bảo", product: "Tai Nghe Bluetooth Pro Sound", channel: "ecommerce", amount: 1500000 },
  { name: "Nguyễn Hương Giang", product: "Gói Cinematic Couple", channel: "photography", amount: 3800000 },
  { name: "Lê Tuấn Kiệt", product: "Đơn E-Menu Bàn Số 5", channel: "cafe", amount: 245000 },
];

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "jewelry", label: "Trang sức" },
  { id: "ecommerce", label: "Cửa hàng" },
  { id: "photography", label: "Studio" },
];

/** Biểu đồ cột SVG — không kéo thêm thư viện chart cho 7 điểm dữ liệu. */
function BarChart({ data, onSelect, selected }) {
  const max = Math.max(...data.map((point) => point.value));
  return (
    <div className="flex h-[132px] items-end gap-1.5">
      {data.map((point, index) => (
        <button
          key={point.day}
          type="button"
          onClick={() => onSelect(selected === index ? null : index)}
          className="flex flex-1 flex-col items-center gap-1.5"
          aria-label={`${point.day}: ${point.value} đơn`}
        >
          <span className="text-[11px] tabular-nums" style={{ color: selected === index ? ACCENT : "transparent" }}>{point.value}</span>
          <span
            className="w-full rounded-[6px] transition-all duration-300"
            style={{
              height: `${(point.value / max) * 84}px`,
              background: selected === index ? ACCENT : "color-mix(in srgb, " + ACCENT + " 35%, transparent)",
            }}
          />
          <span className="text-[11px]" style={{ color: "var(--ios-label-2)" }}>{point.day}</span>
        </button>
      ))}
    </div>
  );
}

export default function DashboardDemo({ isMobile = false }) {
  const [tab, setTab] = useState("overview");
  const [scheme, setScheme] = useState("dark");
  const [revenue, setRevenue] = useState(148500000);
  const [orders, setOrders] = useState(382);
  const [sales, setSales] = useState(INITIAL_SALES);
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("7days");
  const [point, setPoint] = useState(null);
  const [detail, setDetail] = useState(null);
  const [soundNotify, setSoundNotify] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(false);
  const [toast, showToast] = useToast();

  const visibleSales = useMemo(
    () => (filter === "all" ? sales : sales.filter((sale) => sale.channel === filter)),
    [filter, sales],
  );

  const pending = sales.filter((sale) => sale.status === "pending").length;

  const simulateSale = () => {
    const pick = POOL[Math.floor(Math.random() * POOL.length)];
    setRevenue((prev) => prev + pick.amount);
    setOrders((prev) => prev + 1);
    setSales((prev) => [{ id: Date.now(), ...pick, time: "Vừa xong", status: "completed" }, ...prev.slice(0, 7)]);
    showToast(`${pick.name} · +${vnd(pick.amount)}`);
    if (soundNotify) beep();
  };

  const markPaid = (id) => {
    setSales((prev) => prev.map((sale) => (sale.id === id ? { ...sale, status: "completed" } : sale)));
    setDetail(null);
    showToast("Đã xác nhận thanh toán");
  };

  return (
    <IosApp scheme={scheme} accent={ACCENT}>
      <AppShell
        isMobile={isMobile}
        title={tab === "overview" ? "Tổng quan" : tab === "orders" ? "Đơn hàng" : "Cài đặt"}
        subtitle={tab === "overview" ? "Hugo Business · 4 kênh bán" : undefined}
        brand={{ name: "Hugo Business", icon: "monitoring", note: "Bảng điều khiển" }}
        sidebarNote="Số liệu giả lập trong trình duyệt, không nối cơ sở dữ liệu."
        tabs={[
          { id: "overview", label: "Tổng quan", icon: "monitoring" },
          { id: "orders", label: "Đơn hàng", icon: "receipt_long", badge: pending },
          { id: "settings", label: "Cài đặt", icon: "settings" },
        ]}
        value={tab}
        onChange={setTab}
        actions={
          <button
            type="button"
            onClick={() => setScheme(scheme === "dark" ? "light" : "dark")}
            aria-label="Đổi giao diện sáng tối"
            className="flex h-9 w-9 items-center justify-center"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ color: ACCENT }}>
              {scheme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
        }
      >
        {tab === "overview" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-5"}>
            <Card>
              <p className="text-[13px] uppercase tracking-wide" style={{ color: "var(--ios-label-2)" }}>Doanh thu tháng này</p>
              <p className="mt-1 text-[32px] font-bold leading-none tabular-nums">{vnd(revenue)}</p>
              <div className="mt-2 flex items-center gap-2">
                <Chip tint="#34C759"><span className="material-symbols-outlined text-[16px]">trending_up</span>+12,4%</Chip>
                <span className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>so với tháng trước</span>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>Đơn hàng</p>
                <p className="mt-1 text-[24px] font-bold tabular-nums">{orders}</p>
              </Card>
              <Card>
                <p className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>Giá trị TB</p>
                <p className="mt-1 text-[24px] font-bold tabular-nums">{vnd(Math.round(revenue / orders))}</p>
              </Card>
            </div>

            <Card className={isMobile ? "" : "col-span-2"}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[17px] font-semibold">Đơn theo ngày</p>
                <Segmented
                  className="w-[132px]"
                  value={period}
                  onChange={setPeriod}
                  items={[{ id: "7days", label: "7 ngày" }, { id: "30days", label: "30 ngày" }]}
                />
              </div>
              <BarChart
                data={period === "7days" ? CHART : CHART.map((p) => ({ ...p, value: Math.round(p.value * 3.4) }))}
                selected={point}
                onSelect={setPoint}
              />
            </Card>

            <ListGroup header="Theo kênh bán">
              {Object.entries(CHANNELS).map(([id, channel], index, list) => {
                const total = sales.filter((sale) => sale.channel === id).reduce((sum, sale) => sum + sale.amount, 0);
                return (
                  <ListRow
                    key={id}
                    icon={channel.icon}
                    iconBg={channel.tint}
                    title={channel.label}
                    value={vnd(total)}
                    last={index === list.length - 1}
                  />
                );
              })}
            </ListGroup>

            <div className={isMobile ? "" : "col-span-2"}>
              <Button full size="lg" onClick={simulateSale}>
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                Giả lập đơn hàng mới
              </Button>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className={isMobile ? "space-y-5" : "max-w-[860px] space-y-5"}>
            <div className={isMobile ? "" : "w-[420px]"}>
              <Segmented items={FILTERS} value={filter} onChange={setFilter} />
            </div>

            <ListGroup header={`${visibleSales.length} giao dịch gần nhất`} footer={pending ? `${pending} đơn đang chờ thanh toán.` : undefined}>
              {visibleSales.map((sale, index) => (
                <ListRow
                  key={sale.id}
                  onClick={() => setDetail(sale)}
                  last={index === visibleSales.length - 1}
                  icon={CHANNELS[sale.channel]?.icon}
                  iconBg={CHANNELS[sale.channel]?.tint}
                  title={sale.name}
                  subtitle={`${sale.product} · ${sale.time}`}
                  chevron
                  trailing={
                    <span className="shrink-0 text-right">
                      <span className="block text-[15px] font-semibold tabular-nums">{vnd(sale.amount)}</span>
                      <span className="block text-[12px]" style={{ color: sale.status === "pending" ? "#FF9500" : "#34C759" }}>
                        {sale.status === "pending" ? "Chờ thanh toán" : "Hoàn tất"}
                      </span>
                    </span>
                  }
                />
              ))}
            </ListGroup>
          </div>
        )}

        {tab === "settings" && (
          <div className={isMobile ? "space-y-5" : "grid grid-cols-2 items-start gap-5"}>
            <ListGroup header="Thông báo">
              <ListRow icon="notifications_active" title="Âm báo đơn mới" trailing={<Toggle checked={soundNotify} onChange={setSoundNotify} label="Âm báo đơn mới" />} />
              <ListRow icon="sync" iconBg="#0A84FF" title="Tự đồng bộ kho" trailing={<Toggle checked={autoSync} onChange={setAutoSync} label="Tự đồng bộ kho" />} />
              <ListRow icon="inventory" iconBg="#FF9500" title="Cảnh báo sắp hết hàng" trailing={<Toggle checked={lowStockAlert} onChange={setLowStockAlert} label="Cảnh báo sắp hết hàng" />} last />
            </ListGroup>

            <ListGroup header="Cửa hàng">
              <ListRow icon="storefront" title="Kênh bán đang bật" value="4" chevron />
              <ListRow icon="group" iconBg="#AF52DE" title="Nhân sự" value="6 tài khoản" chevron />
              <ListRow icon="receipt_long" iconBg="#8E8E93" title="Mẫu hoá đơn" subtitle="A5 · in nhiệt 80mm" chevron last />
            </ListGroup>

            <ListGroup header="Dữ liệu" footer="Bản demo không kết nối cơ sở dữ liệu thật.">
              <ListRow icon="download" title="Xuất báo cáo CSV" chevron onClick={() => showToast("Đang tạo file báo cáo")} />
              <ListRow
                icon="restart_alt"
                iconBg="#FF3B30"
                title="Đặt lại số liệu demo"
                danger
                onClick={() => { setSales(INITIAL_SALES); setRevenue(148500000); setOrders(382); showToast("Đã đặt lại số liệu"); }}
                last
              />
            </ListGroup>
          </div>
        )}
      </AppShell>


      <Sheet
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Chi tiết giao dịch"
        action={
          detail?.status === "pending" ? (
            <Button full size="lg" onClick={() => markPaid(detail.id)}>Xác nhận đã thanh toán</Button>
          ) : (
            <Button full size="lg" variant="gray" onClick={() => showToast("Đã gửi hoá đơn qua email")}>Gửi lại hoá đơn</Button>
          )
        }
      >
        {detail && (
          <div className="space-y-4 pb-2">
            <Card className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px]" style={{ background: CHANNELS[detail.channel]?.tint }}>
                <span className="material-symbols-outlined text-[22px] text-white">{CHANNELS[detail.channel]?.icon}</span>
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-semibold">{detail.name}</span>
                <span className="block text-[13px]" style={{ color: "var(--ios-label-2)" }}>{CHANNELS[detail.channel]?.label} · {detail.time}</span>
              </span>
            </Card>

            <ListGroup header="Đơn hàng">
              <ListRow title="Sản phẩm" subtitle={detail.product} />
              <ListRow title="Giá trị" value={vnd(detail.amount)} />
              <ListRow title="Trạng thái" value={detail.status === "pending" ? "Chờ thanh toán" : "Hoàn tất"} />
              <ListRow title="Mã giao dịch" value={`#${String(detail.id).slice(-6)}`} last />
            </ListGroup>
          </div>
        )}
      </Sheet>

      <Toast message={toast} />
    </IosApp>
  );
}

/** Tiếng "ting" báo đơn mới bằng Web Audio, không cần file âm thanh. */
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(920, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* trình duyệt chặn autoplay audio — bỏ qua */
  }
}
