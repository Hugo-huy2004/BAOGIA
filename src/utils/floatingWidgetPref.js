// Floating widget visibility. The Donation ("Bonus") widget is now delegated to
// the tri-state autoPrefs brain (default "auto" = kept quiet); its visibility
// event is still broadcast so the live DonationModal reacts in the same tab.
import { resolvePref, setPref } from "./autoPrefs";

export const DONATION_VISIBILITY_EVENT = "hugo-donation-visibility-changed";

export const isDonationWidgetVisible = () => resolvePref("donation");
export const setDonationWidgetVisible = (visible) => {
  setPref("donation", visible ? "on" : "off");
  try { window.dispatchEvent(new CustomEvent(DONATION_VISIBILITY_EVENT, { detail: { visible } })); } catch { /* ignore */ }
};
