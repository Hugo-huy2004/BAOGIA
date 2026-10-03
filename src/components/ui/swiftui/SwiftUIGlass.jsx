
/**
 * SwiftUIGlass - Khung Liquid Glass với specular reflection theo phong cách SwiftUI (@expo/ui/swift-ui)
 * Hỗ trợ các biến thể: 'clear', 'regular', 'liquid'
 */
export default function SwiftUIGlass({
  children,
  variant = 'regular', // 'clear' | 'regular' | 'liquid'
  interactive = false,
  className = '',
  style = {},
  ...props
}) {
  const variantClass = variant === 'liquid'
    ? 'swiftui-liquid-glass'
    : 'swiftui-glass';

  const interactiveClass = interactive
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]'
    : '';

  return (
    <div
      className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 ${variantClass} ${interactiveClass} ${className}`}
      style={style}
      {...props}
    >
      {variant === 'liquid' && (
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-primary/5 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
