import { Verifier } from 'academic-email-verifier';

// Global educational-email heuristic — matches the domain's TLD against the
// common worldwide patterns universities use: .edu (US + many countries that
// reuse it), .edu.xx (VN, AU, MY, SG, ...), and .ac.xx (UK, JP, IN, ID, KR, ...).
const EDU_DOMAIN_PATTERN = /\.(edu|ac)(\.[a-z]{2,3})?$/i;

export async function isEduEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim();

  try {
    const isAcademic = await Verifier.isAcademic(cleanEmail);
    if (isAcademic) return true;
  } catch (err) {
    // Fall back to regex heuristic if verifier fails or throws
  }

  const domain = cleanEmail.split('@')[1] || '';
  return EDU_DOMAIN_PATTERN.test(domain.trim());
}
