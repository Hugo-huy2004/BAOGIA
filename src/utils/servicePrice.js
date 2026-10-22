export function formatServicePrice(price, language) {
  const formatAmount = (value = "") => {
    if (language?.startsWith("zh")) return value.replace(/\s*起$/u, "");
    return value.replace(/^(?:Từ|From)\s+/iu, "");
  };

  const from = formatAmount(price?.from);
  const to = formatAmount(price?.to);
  return to ? `${from} – ${to}` : from;
}
