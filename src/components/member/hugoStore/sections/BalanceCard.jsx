import JoyCoinBadge from "../../../shared/JoyCoinBadge";

/** Số dư đóng trang — nhắc nguồn JOY chứ không thúc mua thêm. */
export default function BalanceCard({ section }) {
  return (
    <section className="px-4">
      <div className="hgs-card flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="hgs-dim text-[13px]">Số dư của bạn</p>
          <JoyCoinBadge amount={section.balance} size="md" className="mt-1" />
        </div>
        <p className="hgs-dim max-w-[46%] text-right text-[13px] leading-snug">
          JOY tích được từ học tập, game và điểm danh — không nạp bằng tiền.
        </p>
      </div>
    </section>
  );
}
