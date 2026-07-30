import SpotlightCard from "./sections/SpotlightCard";
import ExpiringNudge from "./sections/ExpiringNudge";
import PlanLadder from "./sections/PlanLadder";
import AppRail from "./sections/AppRail";
import PackList from "./sections/PackList";
import SearchResults from "./sections/SearchResults";
import GiftBanner from "./sections/GiftBanner";
import PurchasedList from "./sections/PurchasedList";
import BalanceCard from "./sections/BalanceCard";

/**
 * Lớp vẽ của cửa hàng: một `kind` ↔ một component.
 *
 * Cố ý không có `if` nào ở đây về việc "có nên hiện không" — đó là việc của
 * `storeFeed.js`. Thêm mảng nội dung mới = thêm một Section con + một dòng vào
 * bảng dưới đây.
 */
const RENDERERS = {
  spotlight: ({ section, ...rest }) => (
    <SpotlightCard app={section.app} ladder={section.ladder} state={section.state} {...rest} />
  ),
  expiring: ExpiringNudge,
  ladder: PlanLadder,
  appRail: AppRail,
  packList: PackList,
  search: SearchResults,
  gift: GiftBanner,
  orders: PurchasedList,
  balance: BalanceCard,
};

export default function StoreFeedView({ sections, ...handlers }) {
  return (
    <div className="space-y-7">
      {sections.map(section => {
        const Renderer = RENDERERS[section.kind];
        return Renderer ? <Renderer key={section.id} section={section} {...handlers} /> : null;
      })}
    </div>
  );
}
