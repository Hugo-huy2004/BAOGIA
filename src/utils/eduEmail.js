// Global educational-email heuristic — matches the domain's TLD against the
// common worldwide patterns universities use: .edu (US + many countries that
// reuse it), .edu.xx (VN, AU, MY, SG, ...), and .ac.xx (UK, JP, IN, ID, KR, ...).
const EDU_DOMAIN_PATTERN = /\.(edu|ac)(\.[a-z]{2,3})?$/i;

export async function isEduEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const domain = (email || "").split("@")[1] || "";
  const isLocalEdu = EDU_DOMAIN_PATTERN.test(domain.trim());
  if (isLocalEdu) return true;

  try {
    const response = await fetch(`/api/auth/verify-edu?email=${encodeURIComponent(email)}`);
    if (!response.ok) return false;
    const data = await response.json();
    return !!data.isEduEmail;
  } catch (error) {
    return false;
  }
}
