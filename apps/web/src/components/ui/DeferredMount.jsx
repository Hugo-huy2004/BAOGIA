import { useState, useEffect } from 'react';
import { sensory } from '../../lib/sensory';

/**
 * DEFERRED MOUNT CONTAINER (Trì hoãn render theo yêu cầu)
 * 
 * Mục đích chuẩn Humantality Design:
 * - Tránh render ồ ạt hàng loạt component nặng (biểu đồ, bảng tính, trình đọc, media) trong lần tải đầu.
 * - Chỉ mount và khởi chạy tính toán khi người dùng chủ động "nhấn để chuyển sang" (isActive = true).
 * - Tùy chọn keepAlive: Giữ component trong DOM sau khi đã mount lần đầu để giữ nguyên trạng thái biểu mẫu/cuộn.
 */
export function DeferredMount({
  isActive = false,
  keepAlive = true,
  fallback = null,
  enableSensory = true,
  className = '',
  children,
}) {
  const [hasMounted, setHasMounted] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      if (!hasMounted) {
        setHasMounted(true);
        if (enableSensory) {
          sensory.tap();
        }
      }
    } else if (!keepAlive) {
      setHasMounted(false);
    }
  }, [isActive, keepAlive, hasMounted, enableSensory]);

  if (!hasMounted) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return (
    <div
      className={className}
      style={{ display: isActive ? undefined : 'none' }}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}

export default DeferredMount;
