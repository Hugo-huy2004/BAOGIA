import SectionHead from "../ui/SectionHead";
import { money } from "../storeData";

/**
 * Tặng ứng dụng cho bạn bè.
 *
 * Đây là chỗ "đưa người dùng đến gần nhau": JOY của mình mở quyền cho người
 * khác, và người nhận không cần có JOY. Không hứa thưởng gì cho người tặng —
 * phần thưởng bịa ra sẽ thành lời hứa hệ thống không giữ được.
 */
export default function GiftBanner({ section, onGift }) {
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="px-4">
        <div className="hgs-violet p-5">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/16">
            <span className="material-symbols-outlined text-[26px]">redeem</span>
          </span>
          <h3 className="text-[19px] font-bold leading-snug">Tặng một ứng dụng</h3>
          <p className="mt-1 max-w-[30ch] text-[13.5px] leading-snug text-white/80">
            Bạn trả JOY, người nhận dùng được ngay — không cần họ có JOY. Gửi bằng
            mã giới thiệu, email hoặc số điện thoại.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {section.options.map(({ appId, label, total }) => (
              <button
                key={appId}
                type="button"
                onClick={() => onGift?.(appId)}
                className="flex h-11 items-center gap-2 rounded-full bg-white/16 px-4 text-[13.5px] font-semibold"
              >
                {label}
                <span className="text-white/70">{money(total)} JOY</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
