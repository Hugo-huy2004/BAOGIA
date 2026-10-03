
import { sensory } from '../../../lib/sensory';

/**
 * SwiftUIButton - Nút chuẩn SwiftUI với các buttonStyle ('prominent' | 'tinted' | 'bordered' | 'plain')
 */
export default function SwiftUIButton({
  children,
  variant = 'prominent', // 'prominent' | 'tinted' | 'bordered' | 'plain'
  icon,
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const variantClass = {
    prominent: 'swiftui-btn-prominent',
    tinted: 'swiftui-btn-tinted',
    bordered: 'swiftui-btn-bordered',
    plain: 'swiftui-btn-plain',
  }[variant] || 'swiftui-btn-prominent';

  const sizeClass = {
    sm: 'px-2.5 py-1 text-xs min-h-[30px] sm:min-h-[34px] sm:px-3 sm:py-1.5 sm:text-[13px]',
    md: 'px-3 py-1.5 text-xs sm:text-[14px] min-h-[36px] sm:min-h-[44px] sm:px-4 sm:py-2',
    lg: 'px-4 py-2 text-[13px] sm:text-[16px] min-h-[42px] sm:min-h-[50px] sm:px-6 sm:py-3',
  }[size] || 'px-3 py-1.5 text-xs sm:text-[14px] min-h-[36px] sm:min-h-[44px] sm:px-4 sm:py-2';

  const handleClick = (e) => {
    if (disabled) return;
    sensory.tap();
    onClick?.(e);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {icon && (
        typeof icon === 'string' ? (
          <span className="material-symbols-outlined text-[19px]">{icon}</span>
        ) : (
          icon
        )
      )}
      <span>{children}</span>
    </button>
  );
}
