const enabled = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

const pilotIds = () => new Set(
  String(process.env.HUGO_V1_PILOT_MEMBER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

/**
 * V1 mặc định đóng. Ngoài production, bật flag là đủ; production còn phải có
 * member id trong allowlist. Dùng `*` chỉ khi chủ động mở toàn bộ staging.
 */
export function isLearningEvidenceEnabledFor(bio) {
  if (!enabled(process.env.HUGO_LEARNING_EVIDENCE_V1)) return false;
  if (process.env.NODE_ENV !== 'production') return true;

  const pilots = pilotIds();
  return pilots.has('*') || pilots.has(String(bio?._id || ''));
}
