// Global educational-email heuristic — matches the domain's TLD against the
// common worldwide patterns universities use: .edu (US + many countries that
// reuse it), .edu.xx (VN, AU, MY, SG, ...), and .ac.xx (UK, JP, IN, ID, KR, ...).
// ponytail: was academic-email-verifier (29MB domain list) — regex covers the
// vast majority; add a curated allowlist here if a non-.edu campus is reported.
const EDU_DOMAIN_PATTERN = /\.(edu|ac)(\.[a-z]{2,3})?$/i;

export async function isEduEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const domain = email.trim().split('@')[1] || '';
  return EDU_DOMAIN_PATTERN.test(domain.trim());
}
