// Global educational-email heuristic — matches the domain's TLD against the
// common worldwide patterns universities use: .edu (US + many countries that
// reuse it), .edu.xx (VN, AU, MY, SG, ...), and .ac.xx (UK, JP, IN, ID, KR, ...).
// This is a heuristic, not a verified-enrollment check — good enough to gate
// the free student registration without needing a paid verification API.
const EDU_DOMAIN_PATTERN = /\.(edu|ac)(\.[a-z]{2,3})?$/i;

export function isEduEmail(email) {
  const domain = (email || "").split("@")[1] || "";
  return EDU_DOMAIN_PATTERN.test(domain.trim());
}
