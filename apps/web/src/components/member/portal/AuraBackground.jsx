import { getAuraTheme } from "../../../data/auraThemes";

/**
 * A composited, context-aware color field.
 *
 * The previous canvas repainted blurred gradients at 30fps. This version lets
 * the browser compositor move four lightweight layers and pauses completely
 * for Reduce Motion, saving main-thread work while keeping the depth that
 * modern Liquid Glass controls need behind them.
 */
export default function AuraBackground({ theme = "default", area = "today" }) {
  const themeConfig = getAuraTheme(theme);
  const palette = themeConfig.palette;
  const isPlain = themeConfig.pattern === "plain";

  return (
    <div
      className="portal-chromatic-field"
      data-area={area}
      data-theme={theme}
      data-pattern={themeConfig.pattern}
      aria-hidden="true"
      style={{
        "--portal-spectrum-1": palette[0],
        "--portal-spectrum-2": palette[1],
        "--portal-spectrum-3": palette[2],
        "--portal-spectrum-4": palette[3],
      }}
    >
      {!isPlain && <><span /><span /><span /><span /></>}
    </div>
  );
}
