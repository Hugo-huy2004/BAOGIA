
import { sensory } from '../../../lib/sensory';

/**
 * SwiftUISegmentedControl - Segmented Picker chuẩn phong cách Picker của SwiftUI
 */
export default function SwiftUISegmentedControl({
  options = [], // [{ value: '...', label: '...' }]
  value,
  onChange,
  className = '',
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex p-1 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-xl backdrop-blur-md border border-border/40 select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => {
              if (!isSelected) {
                sensory.tap();
                onChange?.(opt.value);
              }
            }}
            className={`relative px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-zinc-700 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
