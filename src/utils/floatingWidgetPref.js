// Floating widget visibility. The Donation ("Bonus") widget is now delegated to
// the tri-state autoPrefs brain (default "auto" = kept quiet); its visibility
// event is still broadcast so the live DonationModal reacts in the same tab.
// HBot has been retired but the flag helpers are kept as harmless no-op-ish
// stubs so any lingering importer keeps working.
import { resolvePref, setPref } from "./autoPrefs";

export const HBOT_VISIBILITY_EVENT = "hugo-hbot-visibility-changed";
export const DONATION_VISIBILITY_EVENT = "hugo-donation-visibility-changed";

// HBot retired — always hidden.
export const isHBotVisible = () => false;
export const setHBotVisible = () => {
  try { window.dispatchEvent(new CustomEvent(HBOT_VISIBILITY_EVENT, { detail: { visible: false } })); } catch { /* ignore */ }
};

export const isDonationWidgetVisible = () => resolvePref("donation");
export const setDonationWidgetVisible = (visible) => {
  setPref("donation", visible ? "on" : "off");
  try { window.dispatchEvent(new CustomEvent(DONATION_VISIBILITY_EVENT, { detail: { visible } })); } catch { /* ignore */ }
};
