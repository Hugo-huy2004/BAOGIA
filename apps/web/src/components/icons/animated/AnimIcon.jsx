import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { AddCircleIcon } from "./add-circle";
import { AlertCircleIcon } from "./alert-circle";
import { ArrowLeft01Icon } from "./arrow-left-01";
import { Cancel01Icon } from "./cancel-01";
import { ChartIncreaseIcon } from "./chart-increase";
import { CheckmarkCircle02Icon } from "./checkmark-circle-02";
import { CodeXmlIcon } from "./code-xml";
import { CrownIcon } from "./crown";
import { Delete02Icon } from "./delete-02";
import { FavouriteIcon } from "./favourite";
import { GiftIcon } from "./gift";
import { GithubIcon } from "./github";
import { Home01Icon } from "./home-01";
import { InformationCircleIcon } from "./information-circle";
import { Link01Icon } from "./link-01";
import { Message01Icon } from "./message-01";
import { Notification03Icon } from "./notification-03";
import { PlayCircleIcon } from "./play-circle";
import { Settings01Icon } from "./settings-01";
import { Shield02Icon } from "./shield-02";
import { ShoppingBag01Icon } from "./shopping-bag-01";
import { SparklesIcon } from "./sparkles";
import { UserIcon } from "./user";
import { UserGroupIcon } from "./user-group";

/**
 * Icon động Hugeicons Animated (MIT, https://hugeicons-animated.com) — mã nguồn chép vào repo
 * theo đúng cách thư viện phát hành (shadcn registry), chạy bằng `motion` đã có sẵn.
 * Thêm icon: tải https://hugeicons-animated.com/r/<tên>.json, lưu `icons/<tên>.tsx` vào thư mục này
 * (đổi import `@/lib/use-icon-animation` → `./useIconAnimation`, bỏ `cn`), rồi khai vào ICONS.
 *
 * Icon tự gắn vào nút/liên kết chứa nó: NHẤN (hoặc rê chuột) là chạy hoạt cảnh.
 * `ref.startAnimation()` để chạy từ code (vd. chuông rung khi có thông báo mới).
 */
const ICONS = {
  add: AddCircleIcon, alert: AlertCircleIcon, back: ArrowLeft01Icon, close: Cancel01Icon, chart: ChartIncreaseIcon,
  check: CheckmarkCircle02Icon, code: CodeXmlIcon, crown: CrownIcon, delete: Delete02Icon, heart: FavouriteIcon,
  gift: GiftIcon, github: GithubIcon, home: Home01Icon, info: InformationCircleIcon, link: Link01Icon,
  message: Message01Icon, bell: Notification03Icon, play: PlayCircleIcon, settings: Settings01Icon,
  shield: Shield02Icon, bag: ShoppingBag01Icon, sparkles: SparklesIcon, user: UserIcon, users: UserGroupIcon,
};

const AnimIcon = forwardRef(function AnimIcon({ name, size = 24, className = "" }, ref) {
  const Icon = ICONS[name] || InformationCircleIcon;
  const icon = useRef(null);
  const box = useRef(null);
  useImperativeHandle(ref, () => ({ startAnimation: () => icon.current?.startAnimation() }), []);
  useEffect(() => {
    const host = box.current?.closest("button, a, [role=button]") || box.current;
    if (!host) return undefined;
    const play = () => icon.current?.startAnimation();
    host.addEventListener("pointerdown", play);
    host.addEventListener("mouseenter", play);
    return () => { host.removeEventListener("pointerdown", play); host.removeEventListener("mouseenter", play); };
  }, []);
  return (
    <span ref={box} className={`anim-icon ${className}`} aria-hidden="true">
      <Icon ref={icon} size={size} />
    </span>
  );
});

export default AnimIcon;
