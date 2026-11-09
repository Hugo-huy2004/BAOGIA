
export function countryDisplayName(code, language = "vi") {
  if (!code) return "";
  try {
    return new Intl.DisplayNames([language], { type: "region" }).of(String(code).toUpperCase()) || code;
  } catch {
    return code;
  }
}

export function formatFullAddress(profile, language = "vi") {
  const parts = [
    profile?.exactAddress,
    profile?.locality,
    profile?.adminArea,
    countryDisplayName(profile?.countryCode, language),
  ].map((part) => String(part || "").trim()).filter(Boolean);

  return parts.filter((part, index) => {
    const normalized = part.toLocaleLowerCase(language);
    return !parts.slice(0, index).some((earlier) => earlier.toLocaleLowerCase(language).includes(normalized));
  }).join(", ");
}
