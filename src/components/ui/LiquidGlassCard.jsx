import { useEffect, useRef } from 'react';
import { useLiquidGlass } from '../../hooks/useLiquidGlass';

/**
 * Component LiquidGlassContainer: Container bao bọc nhiều phần tử kính lỏng
 */
export function LiquidGlassContainer({ children, className = '', style = {}, ...props }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let instance = null;
    let isCancelled = false;

    async function setupAll() {
      if (typeof window === 'undefined' || !containerRef.current) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

      try {
        // Chỉ lấy các direct children để tuân thủ kiến trúc LiquidGlass (direct child of root)
        const glassNodes = Array.from(containerRef.current.children).filter((el) =>
          el.matches?.('.liquid-glass-node, .swiftui-liquid-glass, article, [data-liquid-glass]')
        );
        if (!glassNodes.length) return;

        const { LiquidGlass } = await import('@ybouane/liquidglass');
        if (isCancelled || !containerRef.current) return;

        instance = await LiquidGlass.init({
          root: containerRef.current,
          glassElements: glassNodes,
        });
      } catch (err) {
        console.warn('ℹ️ [LiquidGlassContainer] Fallback to CSS glass:', err?.message || err);
      }
    }

    const timer = setTimeout(setupAll, 100);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      try {
        instance?.destroy();
      } catch {}
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

/**
 * Component LiquidGlassCard: Thẻ kính lỏng độc lập dùng trực tiếp @ybouane/liquidglass
 */
export default function LiquidGlassCard({
  children,
  className = '',
  containerClassName = '',
  style = {},
  config = {},
  interactive = false,
  ...props
}) {
  const { rootRef, glassRef, isShaderReady } = useLiquidGlass(config);

  return (
    <div ref={rootRef} className={`relative overflow-visible ${containerClassName}`}>
      <div
        ref={glassRef}
        className={`liquid-glass-node swiftui-liquid-glass relative z-10 transition-all ${
          interactive ? 'hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer' : ''
        } ${className}`}
        style={style}
        {...props}
      >
        {/* Nền phản quang tự nhiên khi chưa nạp xong WebGL shader */}
        {!isShaderReady && (
          <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/20 via-transparent to-primary/5 pointer-events-none" />
        )}
        <div className="relative z-20 w-full h-full">{children}</div>
      </div>
    </div>
  );
}
