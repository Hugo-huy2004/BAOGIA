
/**
 * SwiftUIRow - Dòng danh sách chuẩn iOS theo phong cách List Row trong SwiftUI (@expo/ui/swift-ui)
 */
export default function SwiftUIRow({
  icon,
  iconBg,
  iconColor = 'text-white',
  title,
  subtitle,
  value,
  action,
  showChevron = false,
  onClick,
  disabled = false,
  className = '',
  ...props
}) {
  const isClickable = Boolean(onClick) && !disabled;
  const Component = isClickable ? 'button' : 'div';

  return (
    <Component
      type={isClickable ? 'button' : undefined}
      onClick={isClickable ? onClick : undefined}
      disabled={disabled}
      className={`w-full flex items-center px-4 py-3.5 text-left transition-colors ${
        isClickable ? 'hover:bg-muted/40 active:bg-muted/70 cursor-pointer' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {/* Icon Badge */}
      {icon && (
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3.5 shadow-xs ${
            iconBg || 'bg-primary'
          } ${iconColor}`}
        >
          {typeof icon === 'string' ? (
            <span className="material-symbols-outlined text-[19px]">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}

      {/* Label / Subtitle */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="text-[15px] font-semibold text-foreground truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-[13px] text-muted-foreground truncate mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      {/* Trailing Value / Action */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {value && (
          <span className="text-[14px] text-muted-foreground font-normal">
            {value}
          </span>
        )}

        {action}

        {showChevron && (
          <span className="material-symbols-outlined text-muted-foreground/60 text-[20px]">
            chevron_right
          </span>
        )}
      </div>
    </Component>
  );
}
