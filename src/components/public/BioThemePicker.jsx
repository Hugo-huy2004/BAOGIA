import { useState } from "react";
import { useTranslation } from "react-i18next";
import BrutalismTheme from "../themes/BrutalismTheme";
import DefaultTheme from "../themes/DefaultTheme";
import FlatTheme from "../themes/FlatTheme";
import { PhoneFrame, studentBioDemo } from "./hwagfu/ServicesStory";

/**
 * Bộ chọn giao diện trang Bio: nhấn một nút, chiếc điện thoại đổi giao diện
 * ngay — đúng thao tác người học sẽ làm trong tài khoản.
 *
 * Danh sách bám đúng những gì `src/components/themes/` đang có, hiện là ba.
 * Thêm tệp theme mới thì thêm một phần tử ở đây, đừng bịa ra biến thể màu để
 * đếm cho nhiều: người ta bấm vào sẽ thấy ngay là không có thật.
 *
 * Bản điện thoại: nút xếp thành hàng cuộn ngang, máy đứng dưới; bản rộng thì
 * nút nằm bên trái, máy bên phải.
 *
 * Giao diện Bio được viết cho màn hình điện thoại thật (~390px). Nhét thẳng
 * vào khung máy rộng hơn 200px một chút thì chữ to bằng nửa màn hình, tỷ lệ vỡ
 * hết. Nên nó dựng ở khổ 390px rồi thu nhỏ nguyên khối: 171.8% × 0.582 = vừa
 * khít khung, và mọi tỷ lệ bên trong giữ đúng 100%.
 */

const THEMES = [
  { id: "default", Component: DefaultTheme, theme: { template: "default", bgColor: "#2B2140", accentColor: "#FF8FB4", pattern: "none" } },
  { id: "flat", Component: FlatTheme, theme: { template: "flat", bgColor: "#F4F1EA", accentColor: "#2F6BE0", pattern: "dots" } },
  { id: "brutalism", Component: BrutalismTheme, theme: { template: "brutalism", bgColor: "#17EAD9", accentColor: "#6078EA", pattern: "dots" } },
];

export default function BioThemePicker() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(THEMES[0].id);
  const active = THEMES.find((item) => item.id === activeId) || THEMES[0];
  const Theme = active.Component;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
      <div>
        <div
          role="tablist"
          aria-label={t("studentPage.themePickerLabel")}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {THEMES.map((item) => {
            const selected = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(item.id)}
                className={`shrink-0 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground/70 hover:border-foreground/40"
                }`}
              >
                {t(`studentPage.themes.${item.id}.name`)}
              </button>
            );
          })}
        </div>

        <p className="mt-6 max-w-md text-base leading-8 text-muted-foreground">{t(`studentPage.themes.${active.id}.note`)}</p>
        <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
          {t("studentPage.themeNote")}
        </p>
      </div>

      <div className="flex justify-center">
        <PhoneFrame compact={false} label={t(`studentPage.themes.${active.id}.name`)}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="relative h-[171.8%] w-[171.8%] origin-top-left scale-[0.582]">
              <Theme bio={{ ...studentBioDemo, theme: active.theme }} isPreview isOnline />
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
