/**
 * JOY Token Unit Formatter, Fiat Exchange Rate & Converter Utility
 * Standardizes JOY balances across scales (JOY, kJOY, MJOY) and converts to National Fiat Currencies.
 */

export const JOY_UNITS = {
  JOY: { key: 'JOY', label: 'JOY', multiplier: 1, desc: 'Đơn vị cơ sở' },
  K_JOY: { key: 'kJOY', label: 'kJOY', multiplier: 1000, desc: 'Kilo JOY (1,000 JOY)' },
  M_JOY: { key: 'MJOY', label: 'MJOY', multiplier: 1000000, desc: 'Mega JOY (1,000,000 JOY)' }
};

export const FIAT_EXCHANGE_RATES = {
  VND: { code: 'VND', symbol: '₫', ratePerJoy: 1000, label: 'Việt Nam Đồng (VND)', locale: 'vi-VN' },
  USD: { code: 'USD', symbol: '$', ratePerJoy: 0.04, label: 'Đô la Mỹ (USD)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', ratePerJoy: 0.037, label: 'Euro (EUR)', locale: 'de-DE' },
  JPY: { code: 'JPY', symbol: '¥', ratePerJoy: 6.0, label: 'Yên Nhật (JPY)', locale: 'ja-JP' },
  KRW: { code: 'KRW', symbol: '₩', ratePerJoy: 55.0, label: 'Won Hàn Quốc (KRW)', locale: 'ko-KR' }
};

/**
 * Format a JOY balance with standard thousand separators.
 */
export function formatJoy(amount) {
  const num = Number(amount) || 0;
  return `${num.toLocaleString('vi-VN')} JOY`;
}

/**
 * Format a JOY balance into a compact scale string.
 */
export function formatJoyCompact(amount) {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1000000000) {
    return `${sign}${(abs / 1000000000).toFixed(1).replace(/\.0$/, '')}B JOY`;
  }
  if (abs >= 1000000) {
    return `${sign}${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M JOY`;
  }
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K JOY`;
  }
  return `${num.toLocaleString('vi-VN')} JOY`;
}

/**
 * Format JOY in dual representation: full integer and compact label.
 */
export function formatJoyDual(amount) {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  if (abs < 1000) {
    return formatJoy(num);
  }
  return `${formatJoy(num)} (${formatJoyCompact(num)})`;
}

/**
 * Convert JOY amount to Fiat currency equivalent string.
 */
export function formatJoyFiat(amountJoy, currencyCode = 'VND') {
  const num = Number(amountJoy) || 0;
  const fiatInfo = FIAT_EXCHANGE_RATES[currencyCode] || FIAT_EXCHANGE_RATES.VND;
  const fiatVal = num * fiatInfo.ratePerJoy;

  if (fiatInfo.code === 'VND') {
    return `${Math.round(fiatVal).toLocaleString('vi-VN')} ₫`;
  }
  return `${fiatInfo.symbol}${fiatVal.toLocaleString(fiatInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format JOY in triple representation: Dual JOY + National Fiat Equivalent.
 */
export function formatJoyFullWithFiat(amountJoy, currencyCode = 'VND') {
  const joyStr = formatJoyDual(amountJoy);
  const fiatStr = formatJoyFiat(amountJoy, currencyCode);
  const usdStr = formatJoyFiat(amountJoy, 'USD');
  return `${joyStr} ≈ ${fiatStr} (${usdStr})`;
}

/**
 * Convert an input quantity from a specific unit (JOY, kJOY, MJOY) to base integer JOY.
 */
export function parseJoyInput(value, unitKey = 'JOY') {
  const rawNum = Number(value);
  if (isNaN(rawNum)) return 0;
  const unit = Object.values(JOY_UNITS).find(u => u.key === unitKey) || JOY_UNITS.JOY;
  return Math.round(rawNum * unit.multiplier);
}
