// Whether the floating HBot (Culi) assistant and Donation ("Bonus") widgets
// are visible — members can hide either via the X on its corner if it's in
// their way (settings/utility pages on a small screen), and re-enable both
// from MemberSettingsTab. Defaults to on for both.
const HBOT_KEY = "hugo_widget_hbot_visible";
const DONATION_KEY = "hugo_widget_donation_visible";

function getFlag(key) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? true : v === "1";
  } catch (_) {
    return true;
  }
}

function setFlag(key, visible, eventName) {
  try {
    localStorage.setItem(key, visible ? "1" : "0");
  } catch (_) { /* ignore */ }
  // Same-tab listeners (the widget itself + the Settings toggle) can't rely on
  // the native "storage" event — that only fires in *other* tabs — so we
  // broadcast a custom event too.
  window.dispatchEvent(new CustomEvent(eventName, { detail: { visible } }));
}

export const HBOT_VISIBILITY_EVENT = "hugo-hbot-visibility-changed";
export const DONATION_VISIBILITY_EVENT = "hugo-donation-visibility-changed";

export const isHBotVisible = () => getFlag(HBOT_KEY);
export const setHBotVisible = (visible) => setFlag(HBOT_KEY, visible, HBOT_VISIBILITY_EVENT);

export const isDonationWidgetVisible = () => getFlag(DONATION_KEY);
export const setDonationWidgetVisible = (visible) => setFlag(DONATION_KEY, visible, DONATION_VISIBILITY_EVENT);
