import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { APP_GRADIENTS } from "../../../../../../packages/shared/appRegistry";
import AppGlyph from "../utilities/AppGlyph";
import { currentLaunch, LAUNCH_TOTAL_MS, onAppLaunch } from "./appLaunch";

/**
 * HugoOS — hiệu ứng mở app như iOS: ô màu của app phóng từ đúng chỗ icon ra
 * toàn màn hình, giữ hình icon ở giữa, rồi mờ đi khi app đã vẽ xong bên dưới.
 *
 * Lớp này chỉ là lớp phủ: app vẫn được mở ngay lúc bấm, không chờ hiệu ứng.
 * Chunk đã được tải trước (os/appIndex), nên phần lớn lần mở app đã sẵn sàng
 * khi ô màu vừa phủ kín — người dùng thấy một chuyển cảnh liền, không thấy
 * khung xương tải.
 */
const EXPAND_MS = 340;

export default function AppLaunchLayer() {
  const [launch, setLaunch] = useState(currentLaunch);

  useEffect(() => onAppLaunch(setLaunch), []);

  useEffect(() => {
    if (!launch) return undefined;
    const left = LAUNCH_TOTAL_MS - (Date.now() - launch.at);
    const timer = window.setTimeout(() => setLaunch(null), Math.max(0, left));
    return () => window.clearTimeout(timer);
  }, [launch]);

  const gradient = launch ? APP_GRADIENTS[launch.app.tint] || APP_GRADIENTS.indigo : "";
  const radius = launch ? Math.min(launch.rect.width, launch.rect.height) * 0.3 : 0;
  // Gắn lại giữa chừng: đi tiếp từ chỗ đáng lẽ đang tới, không phóng lại từ icon.
  const resumed = launch ? Date.now() - launch.at > 60 : false;

  // Cổng ra thẳng <body>: tổ tiên có `transform` (hiệu ứng fadeIn của tab) biến
  // `position: fixed` thành tương đối với nó, và lớp phủ sẽ kẹt trong khung tab.
  return createPortal(
    <AnimatePresence>
      {launch && (
        <motion.div
          key={launch.at}
          aria-hidden="true"
          className={`pointer-events-none fixed left-0 top-0 z-[9998] flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}
          initial={resumed ? false : {
            x: launch.rect.x,
            y: launch.rect.y,
            width: launch.rect.width,
            height: launch.rect.height,
            borderRadius: radius,
            opacity: 1,
          }}
          animate={{
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            borderRadius: 0,
            opacity: 1,
          }}
          exit={{ opacity: 0, transition: { duration: 0.22, ease: "easeOut" } }}
          transition={{ duration: EXPAND_MS / 1000, ease: [0.32, 0.72, 0, 1] }}
        >
          <motion.span
            className="flex h-16 w-16 items-center justify-center"
            initial={resumed ? false : { scale: 1, opacity: 1 }}
            animate={{ scale: 1.25, opacity: 0.95 }}
            transition={{ duration: EXPAND_MS / 1000, ease: [0.32, 0.72, 0, 1] }}
          >
            <AppGlyph appId={launch.app.id} />
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
