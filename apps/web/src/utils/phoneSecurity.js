/**
 * Mask Phone Number Utility
 * Transforms '0778099754' into '0778***754' for privacy protection.
 */
export function maskPhone(phoneStr) {
  if (!phoneStr || typeof phoneStr !== 'string') return '';
  const clean = phoneStr.trim();
  if (clean.length < 7) return clean.replace(/./g, '*');
  const head = clean.slice(0, 4);
  const tail = clean.slice(-3);
  return `${head}***${tail}`;
}

export default maskPhone;
