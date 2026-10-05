import LiquidGlassCard from '../LiquidGlassCard';

/**
 * SwiftUIGlass - Khung Liquid Glass với WebGL shader thực thụ từ @ybouane/liquidglass
 * Hỗ trợ các biến thể: 'clear', 'regular', 'liquid'
 */
export default function SwiftUIGlass({
  children,
  variant = 'regular', // 'clear' | 'regular' | 'liquid'
  interactive = false,
  className = '',
  style = {},
  config = {},
  ...props
}) {
  if (variant === 'liquid') {
    return (
      <LiquidGlassCard
        className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 ${className}`}
        style={style}
        interactive={interactive}
        config={config}
        {...props}
      >
        {children}
      </LiquidGlassCard>
    );
  }

  const variantClass = 'swiftui-glass';
  const interactiveClass = interactive
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]'
    : '';

  return (
    <div
      className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 ${variantClass} ${interactiveClass} ${className}`}
      style={style}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
