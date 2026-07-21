/**
 * Shared Vietnamese voice selector for Speech Synthesis.
 * Used by BreathingTherapy, MeditationTherapy, ReadingTherapy.
 *
 * @param {SpeechSynthesisVoice[]} voices - from window.speechSynthesis.getVoices()
 * @returns {SpeechSynthesisVoice|null}
 */
export function getBestViVoice(voices) {
  const viVoices = voices.filter(
    (v) => v.lang.startsWith("vi") || v.lang.includes("vi-VN")
  );
  if (viVoices.length === 0) return null;

  // Prioritize male Vietnamese voice
  const maleVoice = viVoices.find(
    (v) =>
      v.name.toLowerCase().includes("nam") ||
      v.name.toLowerCase().includes("male") ||
      v.name.includes("Voice 2")
  );
  if (maleVoice) return maleVoice;

  // Fallback to premium/natural voices
  const premiumVoice = viVoices.find(
    (v) =>
      v.name.includes("Siri") ||
      v.name.includes("Premium") ||
      v.name.includes("Natural")
  );
  if (premiumVoice) return premiumVoice;

  // Fallback to Google translator
  const googleVoice = viVoices.find((v) => v.name.includes("Google"));
  if (googleVoice) return googleVoice;

  return viVoices[0];
}
