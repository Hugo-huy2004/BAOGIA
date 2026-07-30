import UtilityAppIcon from "../../utilities/UtilityAppIcon";
import SectionHead from "../ui/SectionHead";
import { GRADIENTS, money } from "../storeData";

/** Rail cuộn ngang các ứng dụng khác. */
export default function AppRail({ section, onOpenUtility, onPlans }) {
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="hgs-rail gap-3 px-4 pb-1">
        {section.apps.map(({ app, ladder, state }) => {
          const locked = ladder && !state?.unlocked;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => (locked ? onPlans?.(app.id) : onOpenUtility?.(app.id))}
              className="hgs-card w-[170px] p-4 text-left transition-transform active:scale-[0.97]"
            >
              <UtilityAppIcon app={app} gradient={GRADIENTS[app.color]} size="large" />
              <p className="hgs-ink mt-3 truncate text-[15px] font-bold">{app.label}</p>
              <p className="hgs-dim mt-0.5 line-clamp-2 h-[34px] text-[13.5px] leading-snug">
                {app.tagline}
              </p>
              <span className="hgs-pill mt-3 w-full">
                {!ladder ? "Mở"
                  : state?.tier === "own" ? "Đã sở hữu"
                    : state?.unlocked ? "Mở"
                      : `${money(ladder.rent.total)} JOY`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
