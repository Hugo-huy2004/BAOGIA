/**
 * liveActivitiesEngine.js
 * Dynamic Island & Live Activities Engine for iOS / Android.
 * Controls lockscreen widgets, media session controls, and background status indicators.
 */

export const LiveActivitiesEngine = {
  setActiveRadioState(trackTitle = "Lofi Code Radio 24/7", artistName = "HugoStudio Ambient") {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackTitle,
        artist: artistName,
        album: "HugoStudio Dynamic Island",
        artwork: [
          { src: "/favicon/apple-touch-icon.png", sizes: "192x192", type: "image/png" }
        ]
      });

      navigator.mediaSession.setActionHandler("play", () => {
        window.dispatchEvent(new CustomEvent("hugo:radio-play"));
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        window.dispatchEvent(new CustomEvent("hugo:radio-pause"));
      });
    } catch (_) { /* ignore */ }
  },

  updateFocusTimerActivity(secondsLeft) {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `⏱️ Đang Tập Trung: ${timeStr}`,
        artist: "HugoStudio Pomodoro Timer",
        album: "Dynamic Island Focus"
      });
    } catch (_) { /* ignore */ }
  },

  clearActivity() {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
    } catch (_) { /* ignore */ }
  }
};
