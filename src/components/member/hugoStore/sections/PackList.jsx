import SectionHead from "../ui/SectionHead";
import PackRow from "../ui/PackRow";

/** Kệ vật phẩm tiêu hao theo loại. */
export default function PackList({ section, onBuyPack }) {
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="px-4">
        <div className="hgs-card hgs-divide overflow-hidden">
          {section.packs.map(pack => (
            <PackRow key={pack._id} pack={pack} onBuy={onBuyPack} />
          ))}
        </div>
      </div>
    </section>
  );
}
