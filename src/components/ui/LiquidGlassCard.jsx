import LiquidGlass from '@nkzw/liquid-glass';
import { radius as hugoRadius, space as hugoSpace } from 'hugo-music/dist/tokens.js';

/**
 * LiquidGlassCard: Apple-grade liquid glassmorphism card powered by @nkzw/liquid-glass
 * and hugo-music design tokens.
 */
export function LiquidGlassCard({
  children,
  className = '',
  style = {},
  borderRadius = hugoRadius?.card || 24,
  aberrationIntensity = 1.2,
  elasticity = 0.5,
  ...props
}) {
  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      style={{
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
      {...props}
    >
      <LiquidGlass
        aberrationIntensity={aberrationIntensity}
        elasticity={elasticity}
      >
        <div
          className="w-full h-full"
          style={{
            padding: hugoSpace?.sm ? `${hugoSpace.sm}px` : undefined,
          }}
        >
          {children}
        </div>
      </LiquidGlass>
    </div>
  );
}

export default LiquidGlassCard;
