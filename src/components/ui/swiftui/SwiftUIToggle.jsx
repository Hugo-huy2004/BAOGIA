
import { sensory } from '../../../lib/sensory';

/**
 * SwiftUIToggle - Switch chuẩn phong cách Toggle của SwiftUI / iOS 18
 */
export default function SwiftUIToggle({
  isOn = false,
  onIsOnChange,
  disabled = false,
  label,
  className = '',
  ...props
}) {
  const handleClick = () => {
    if (disabled) return;
    sensory.toggle(!isOn);
    onIsOnChange?.(!isOn);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      className={`relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full transition-colors duration-250 ease-in-out cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        isOn ? 'bg-[#34c759]' : 'bg-zinc-300 dark:bg-zinc-700'
      } ${className}`}
      {...props}
    >
      <span
        className="inline-block h-[27px] w-[27px] rounded-full bg-white shadow-md transform transition-transform duration-250 ease-in-out"
        style={{
          transform: isOn ? 'translateX(22px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}
