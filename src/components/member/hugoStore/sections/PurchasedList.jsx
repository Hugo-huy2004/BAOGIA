import SectionHead from "../ui/SectionHead";
import { money } from "../storeData";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

/** Lịch sử mua — chỉ hiện khi thật sự có đơn. */
export default function PurchasedList({ section }) {
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="px-4">
        <div className="hgs-card hgs-divide overflow-hidden">
          {section.orders.map(order => (
            <div key={order._id} className="flex items-center gap-3 p-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined text-[21px]">check_circle</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="hgs-ink truncate text-[15px] font-semibold">{order.productName}</p>
                <p className="hgs-dim truncate text-[13.5px]">{formatDate(order.createdAt)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="hgs-ink text-[14px] font-bold tabular-nums">{money(order.priceJoy)} JOY</p>
                <p className="hgs-dim font-mono text-[10.5px]">{order.purchaseCode}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
