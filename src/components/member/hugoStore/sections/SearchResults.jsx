import SectionHead from "../ui/SectionHead";
import AppRow from "../ui/AppRow";
import PackRow from "../ui/PackRow";

/** Khi đang tìm kiếm, section này chiếm trọn trang. */
export default function SearchResults({ section, onOpenUtility, onPlans, onBuyPack }) {
  const nothing = section.apps.length === 0 && section.packs.length === 0;

  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      {nothing ? (
        <div className="px-4 pb-6 pt-2 text-center">
          <span className="material-symbols-outlined hgs-dim text-[40px]">search_off</span>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {section.apps.length > 0 && (
            <div className="hgs-card hgs-divide overflow-hidden">
              {section.apps.map(({ app, ladder, state }) => (
                <AppRow
                  key={app.id}
                  app={app}
                  ladder={ladder}
                  state={state}
                  onOpen={onOpenUtility}
                  onPlans={onPlans}
                />
              ))}
            </div>
          )}
          {section.packs.length > 0 && (
            <div className="hgs-card hgs-divide overflow-hidden">
              {section.packs.map(pack => (
                <PackRow key={pack._id} pack={pack} onBuy={onBuyPack} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
