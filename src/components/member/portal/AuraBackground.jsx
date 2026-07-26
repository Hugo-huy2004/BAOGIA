const THEME_PALETTES = Object.freeze({
  sunset: ["#ff9f0a", "#ff375f", "#ffd60a", "#ff453a"],
  cyberpunk: ["#64d2ff", "#ff2d55", "#bf5af2", "#5e5ce6"],
  emerald: ["#30d158", "#63e6be", "#0a84ff", "#ffd60a"],
  obsidian: ["#5e5ce6", "#2c2c2e", "#8e8e93", "#64d2ff"],
});

const AREA_PALETTES = Object.freeze({
  today: ["#0a84ff", "#64d2ff", "#30d158", "#ffd60a"],
  apps: ["#5e5ce6", "#bf5af2", "#64d2ff", "#ff9f0a"],
  activity: ["#ff375f", "#ff9f0a", "#bf5af2", "#0a84ff"],
  account: ["#30d158", "#64d2ff", "#0a84ff", "#bf5af2"],
});

/**
 * A composited, context-aware color field.
 *
 * The previous canvas repainted blurred gradients at 30fps. This version lets
 * the browser compositor move four lightweight layers and pauses completely
 * for Reduce Motion, saving main-thread work while keeping the depth that
 * modern Liquid Glass controls need behind them.
 */
export default function AuraBackground({ theme = "default", area = "today" }) {
  const palette = theme !== "default"
    ? (THEME_PALETTES[theme] || AREA_PALETTES.today)
    : (AREA_PALETTES[area] || AREA_PALETTES.today);

  return (
    <div
      className="portal-chromatic-field"
      data-area={area}
      data-theme={theme}
      aria-hidden="true"
      style={{
        "--portal-spectrum-1": palette[0],
        "--portal-spectrum-2": palette[1],
        "--portal-spectrum-3": palette[2],
        "--portal-spectrum-4": palette[3],
      }}
    >
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
