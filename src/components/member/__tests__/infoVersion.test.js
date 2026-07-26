import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";

import en from "../../../i18n/locales/en/translation.json";
import vi from "../../../i18n/locales/vi/translation.json";
import rootPkg from "../../../../package.json";
import { MembershipFactory } from "../../../models/membershipTier";
import { isCampaignLive } from "../portal/VersionAnnouncement";

const here = dirname(fileURLToPath(import.meta.url));
const serverPkg = JSON.parse(readFileSync(resolve(here, "../../../../server/package.json"), "utf8"));
const tabSource = readFileSync(resolve(here, "../MemberInfoVersionTab.jsx"), "utf8");

const keyTree = (o, p = "") =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keyTree(v, `${p}${k}.`) : [`${p}${k}`]
  );

describe("system version", () => {
  it("uses the same version on the frontend and the server", () => {
    expect(serverPkg.version).toBe(rootPkg.version);
  });

  it("is a three-part semver, which is what the info tab explains", () => {
    expect(rootPkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    // The tab renders one coloured digit per part; a two- or four-part version
    // would leave a digit unlabelled or drop one silently.
    expect(rootPkg.version.split(".")).toHaveLength(3);
  });
});

// Quảng cáo 2.0 phải tự tắt sau 10/08/2026. Nếu cửa sổ ngày sai thì hoặc là
// nó không bao giờ hiện, hoặc là nó bám lại mãi — cả hai đều không ai để ý
// cho tới khi người dùng phàn nàn.
describe("chiến dịch quảng cáo 2.0", () => {
  it.each([
    ["2026-07-25", false, "trước ngày mở"],
    ["2026-07-26", true, "ngày đầu, tính cả ngày"],
    ["2026-08-01", true, "giữa chiến dịch"],
    ["2026-08-10", true, "ngày cuối, tính trọn ngày"],
    ["2026-08-11", false, "hết hạn, phải tự ẩn"],
    ["2027-07-26", false, "cùng ngày nhưng năm sau"],
  ])("%s → %s (%s)", (day, expected) => {
    expect(isCampaignLive(day)).toBe(expected);
  });
});

describe("info tab content", () => {
  it("keeps every infoVersion string present in both locales", () => {
    expect(keyTree(vi.memberPortal.infoVersion).sort()).toEqual(
      keyTree(en.memberPortal.infoVersion).sort()
    );
  });

  // Mục "Bộ thẻ thành viên" render thẳng từ MembershipFactory nên nội dung
  // không thể lệch khỏi dữ liệu thật — nhưng nó VẪN hỏng nếu một hạng bị bỏ
  // trống quyền lợi hoặc ngưỡng giới thiệu bị đảo thứ tự.
  it("keeps every membership tier presentable: name, colour and rewards", () => {
    const tiers = MembershipFactory.getAllTiers();
    expect(tiers.length).toBeGreaterThanOrEqual(2);

    let previousThreshold = -1;
    for (const tier of tiers) {
      expect(tier.name, `${tier.id} thiếu tên`).toBeTruthy();
      expect(tier.colorHex, `${tier.id} thiếu colorHex`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(tier.cardBgStyle, `${tier.id} thiếu nền thẻ`).toBeTruthy();
      expect(tier.getPrivileges().length, `${tier.id} không có quyền lợi nào`).toBeGreaterThan(0);
      for (const perk of tier.getPrivileges()) {
        expect(perk.title, `${tier.id}/${perk.id} thiếu tiêu đề`).toBeTruthy();
        expect(perk.icon, `${tier.id}/${perk.id} thiếu icon`).toBeTruthy();
      }
      // Ngưỡng phải tăng dần, nếu không thanh tiến độ và "còn N người nữa"
      // sẽ tính ra số âm.
      expect(tier.minReferrals, `${tier.id} phá vỡ thứ tự ngưỡng`).toBeGreaterThan(previousThreshold);
      previousThreshold = tier.minReferrals;
    }

    expect(tiers[0].minReferrals, "hạng đầu phải mở sẵn cho tài khoản mới").toBe(0);
  });

  it("only lists ecosystem apps that really exist in the store catalog", () => {
    // Khớp thẳng khối ECOSYSTEM, không dựa vào hằng số đứng cạnh — đổi thứ tự
    // khai báo trong file không được làm hỏng phép kiểm tra này.
    const block = tabSource.match(/const ECOSYSTEM = \[([\s\S]*?)\n\];/);
    expect(block, "không tìm thấy khối ECOSYSTEM").toBeTruthy();
    const listed = [...block[1].matchAll(/\["([\w_]+)"/g)].map((m) => m[1]);

    expect(listed.length).toBeGreaterThan(10);
    for (const id of listed) {
      for (const [label, dict] of [["vi", vi], ["en", en]]) {
        const entry = dict.utilities.catalog[id];
        expect(entry?.title, `${label} utilities.catalog.${id}.title`).toBeTruthy();
        expect(entry?.description, `${label} utilities.catalog.${id}.description`).toBeTruthy();
      }
    }
  });
});
