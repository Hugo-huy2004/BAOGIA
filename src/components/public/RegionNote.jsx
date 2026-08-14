import { useTranslation } from "react-i18next";
import { languageCode } from "../../i18n/languages";

/**
 * Ghi chú cho phần chỉ phục vụ được ở Việt Nam: báo giá bằng đồng, thanh toán
 * qua PayOS và ngân hàng trong nước, trao đổi qua Zalo.
 *
 * Chỉ hiện với người đọc ngôn ngữ khác — với người Việt thì đó là điều hiển
 * nhiên, thêm dòng này chỉ tổ rườm rà. Đặt ngay dưới khối liên quan để người
 * đọc thấy trước khi kịp tưởng dịch vụ có ở nước mình.
 */
export default function RegionNote({ scope = "service", className = "" }) {
  const { t, i18n } = useTranslation();
  if (languageCode(i18n.resolvedLanguage || i18n.language) === "vi") return null;

  return (
    <p
      className={`mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5 text-[12px] leading-relaxed text-muted-foreground ${className}`}
      role="note"
    >
      <span className="material-symbols-outlined mt-[1px] shrink-0 text-[15px]" aria-hidden="true">
        public
      </span>
      <span>
        <strong className="font-semibold text-foreground">{t("common.regionVietnamOnly.title")}</strong>{" "}
        {t(`common.regionVietnamOnly.${scope}`)}
      </span>
    </p>
  );
}
