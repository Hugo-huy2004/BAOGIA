import { useEffect, useRef, useState } from 'react';

/**
 * Hook useLiquidGlass: Khởi tạo WebGL Shader Liquid Glass từ @ybouane/liquidglass
 * Tự động fall back về CSS Backdrop-filter nếu thiết bị không hỗ trợ WebGL hoặc xảy ra lỗi.
 */
export function useLiquidGlass(config = {}) {
  const rootRef = useRef(null);
  const glassRef = useRef(null);
  const [isShaderReady, setIsShaderReady] = useState(false);
  const configKey = JSON.stringify(config);

  useEffect(() => {
    let instance = null;
    let isCancelled = false;

    async function initShader() {
      // Chỉ chạy ở môi trường trình duyệt và khi có đủ node DOM
      if (typeof window === 'undefined' || !rootRef.current || !glassRef.current) return;

      // Tôn trọng prefers-reduced-motion
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

      try {
        const { LiquidGlass } = await import('@ybouane/liquidglass');
        if (isCancelled || !rootRef.current || !glassRef.current) return;

        glassRef.current.dataset.config = JSON.stringify({
          blurAmount: 0.25,
          refraction: 0.65,
          chromAberration: 0.05,
          edgeHighlight: 0.1,
          specular: 0.2,
          fresnel: 0.85,
          cornerRadius: config.cornerRadius || 24,
          ...config,
        });

        // The library STRICTLY requires every glass element to be a direct child of root:
        // el.parentElement === root
        const rootNode = config.root || glassRef.current.parentElement || rootRef.current;
        if (!rootNode) return;

        // Ensure rootNode is a positioned container if not already positioned
        if (typeof window !== 'undefined' && rootNode.style) {
          const compPos = window.getComputedStyle(rootNode).position;
          if (compPos === 'static') {
            rootNode.style.position = 'relative';
          }
        }

        instance = await LiquidGlass.init({
          root: rootNode,
          glassElements: [glassRef.current],
          defaults: config,
        });

        if (!isCancelled) {
          setIsShaderReady(true);
        }
      } catch (err) {
        // Fallback âm thầm về CSS backdrop-filter để không bao giờ làm crash UI
        console.warn('ℹ️ [LiquidGlass] WebGL shader fallback to CSS backdrop:', err?.message || err);
      }
    }

    // Delay 1 tick để DOM render hoàn chỉnh trước khi capture
    const timer = setTimeout(initShader, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      try {
        instance?.destroy();
      } catch {}
    };
  }, [configKey, config]);

  return { rootRef, glassRef, isShaderReady };
}

export default useLiquidGlass;
