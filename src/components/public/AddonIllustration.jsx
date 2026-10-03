import "./addonIllustration.css";

/**
 * Hình minh hoạ cho từng gói lẻ — mô phỏng đúng thứ khách nhận được, dựng
 * bằng HTML/CSS thay vì ảnh chụp: không dính bản quyền ảnh, nhẹ, đổi được theo
 * ngôn ngữ (chữ trong hình lấy từ `servicePkg.addonItems.<id>.illo`).
 *
 * Tên, thương hiệu trong hình là VÍ DỤ CHUNG ("Tiệm bánh của bạn"), không mượn
 * tên cửa hàng thật hay giao diện nhận diện của hãng khác.
 */

const Icon = ({ name, className = "" }) => (
  <span aria-hidden className={`material-symbols-outlined ${className}`}>{name}</span>
);
const Bar = ({ w = "100%", className = "" }) => <span className={`block h-2 rounded-full bg-muted ${className}`} style={{ width: w }} />;
const d = (s) => ({ animationDelay: `${s}s` });
const Check = ({ delay }) => (
  <span className="ai-appear grid size-6 place-items-center rounded-full bg-hue-blue text-background" style={d(delay)}>
    <Icon name="check" className="text-[16px]" />
  </span>
);

function Link({ t }) {
  const nodes = [["language", t[0]], ["web", t[1]], ["mail", t[2]]];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-0">
      {nodes.map(([icon, label], i) => (
        <div key={label} className="flex flex-col items-center">
          {i ? (
            <svg width="4" height="34" aria-hidden className="text-hue-blue">
              <line x1="2" y1="0" x2="2" y2="34" stroke="currentColor" strokeWidth="2" className="ai-dash" />
            </svg>
          ) : null}
          <div className="flex items-center gap-3 rounded-full border border-border bg-background px-4 py-2.5 shadow-sm">
            <Icon name={icon} className="text-[20px]" />
            <span className="text-sm font-semibold">{label}</span>
            <Check delay={0.4 + i * 0.5} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Google({ t }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 shadow-sm">
        <Icon name="search" className="text-[20px] text-muted-foreground" />
        <span className="ai-type text-sm">{t[0]}</span>
        <span className="ai-caret h-4 w-px bg-foreground" />
      </div>
      <div className="ai-appear rounded-2xl border-2 border-hue-blue bg-background p-4" style={d(1.4)}>
        <p className="text-sm font-semibold text-hue-blue">{t[1]}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t[2]}</p>
        <Bar w="80%" className="mt-3" />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="ai-appear space-y-2 rounded-2xl border border-border p-4" style={d(1.7 + i * 0.2)}>
          <Bar w="45%" />
          <Bar w="90%" />
        </div>
      ))}
      <Icon name="location_on" className="ai-bounce absolute right-6 bottom-6 text-[40px] text-hue-blue" />
    </div>
  );
}

function Support({ t }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <p className="ai-appear ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-hue-blue px-4 py-2.5 text-sm text-background" style={d(0.3)}>{t[0]}</p>
      <p className="ai-appear max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-background px-4 py-2.5 text-sm" style={d(1.3)}>{t[1]}</p>
      <p className="ai-appear inline-flex max-w-[80%] items-center gap-1.5 self-start rounded-2xl rounded-bl-md border border-border bg-background px-4 py-2.5 text-sm font-semibold" style={d(2.3)}>
        <Icon name="check_circle" className="text-[18px] text-hue-blue" /> {t[2]}
      </p>
    </div>
  );
}

function Maintain({ t }) {
  const rows = [["backup", t[0]], ["monitor_heart", t[1]], ["security", t[2]]];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {rows.map(([icon, label], i) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
          <Icon name={icon} className={`text-[22px] ${i === 1 ? "ai-bounce text-hue-blue" : ""}`} />
          <span className="flex-1 text-sm font-semibold">{label}</span>
          <Check delay={0.4 + i * 0.6} />
        </div>
      ))}
      <div className="flex items-end gap-1.5 px-1 pt-2" aria-hidden>
        {Array.from({ length: 24 }, (_, i) => <span key={i} className="ai-appear h-6 flex-1 rounded-sm bg-hue-blue opacity-70" style={d(i * 0.08)} />)}
      </div>
    </div>
  );
}

const SCENES = { link: Link, seo: Google, maintain: Maintain, support: Support };

export default function AddonIllustration({ id, labels = [] }) {
  const Scene = SCENES[id];
  if (!Scene) return null;
  return (
    <div aria-hidden className="addon-illo relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-border bg-band p-6 sm:p-8">
      <Scene t={labels} />
    </div>
  );
}
