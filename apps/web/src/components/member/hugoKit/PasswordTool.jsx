import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ListGroup, ListRow, Toggle } from "../../demos/iosKit";
import notify from "../../../lib/notify";

/**
 * Tạo mật khẩu mạnh — chạy hoàn toàn trong máy.
 *
 * ponytail: lấy ngẫu nhiên bằng `crypto.getRandomValues` chứ không `Math.random`.
 * Math.random không phải nguồn ngẫu nhiên mật mã: sinh mật khẩu bằng nó thì
 * chuỗi đoán được nếu biết trạng thái bộ sinh, mà đây đúng là thứ không được
 * đoán được. Bỏ phần dư của phép chia để mọi ký tự có xác suất bằng nhau.
 */
const SETS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*-_=+?",
};

// Bỏ sẵn l/I/1 và O/0 khỏi các bộ trên: mật khẩu còn phải đọc và gõ lại được.

const pick = (alphabet, count) => {
  const out = [];
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  const buffer = new Uint8Array(count * 2);
  while (out.length < count) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      if (out.length === count) break;
      if (byte < limit) out.push(alphabet[byte % alphabet.length]);
    }
  }
  return out;
};

const shuffle = (items) => {
  const out = [...items];
  const random = new Uint32Array(out.length);
  crypto.getRandomValues(random);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = random[i] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default function PasswordTool() {
  const { t } = useTranslation();
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [value, setValue] = useState("");

  const generate = useCallback(() => {
    const groups = [SETS.lower];
    if (useUpper) groups.push(SETS.upper);
    if (useDigits) groups.push(SETS.digits);
    if (useSymbols) groups.push(SETS.symbols);

    // Mỗi nhóm đã bật phải góp ít nhất một ký tự, nếu không "có chữ số" chỉ là
    // chuyện xác suất và thỉnh thoảng ra mật khẩu không đạt yêu cầu của trang
    // đang cần đặt.
    const required = groups.map((set) => pick(set, 1)[0]);
    const rest = pick(groups.join(""), Math.max(0, length - required.length));
    setValue(shuffle([...required, ...rest]).join(""));
  }, [length, useUpper, useDigits, useSymbols]);

  useEffect(() => { generate(); }, [generate]);

  // Số bit entropy = log2(cỡ bảng chữ) × độ dài. Đây là độ khó đoán thật sự,
  // không phải mấy quy tắc "phải có ký tự đặc biệt".
  const alphabetSize = SETS.lower.length
    + (useUpper ? SETS.upper.length : 0)
    + (useDigits ? SETS.digits.length : 0)
    + (useSymbols ? SETS.symbols.length : 0);
  const bits = Math.round(Math.log2(alphabetSize) * length);
  const strength = bits >= 90 ? "strong" : bits >= 60 ? "fair" : "weak";
  const strengthColor = { strong: "#12A594", fair: "#F76B15", weak: "#E5484D" }[strength];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      notify.success(t("kit.copied"));
    } catch {
      notify.error(t("kit.copyFailed"));
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
        <p className="break-all text-center font-mono text-[20px] leading-snug tracking-tight">{value}</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: strengthColor }} aria-hidden="true" />
          <span className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>
            {t(`kit.password.${strength}`)} · {t("kit.password.bits", { count: bits })}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button full onClick={generate}>{t("kit.password.generate")}</Button>
        <Button variant="gray" onClick={copy} className="shrink-0 px-5">{t("kit.copy")}</Button>
      </div>

      <ListGroup header={t("kit.password.options")}>
        <ListRow
          title={t("kit.password.length")}
          value={String(length)}
          trailing={(
            <input
              type="range"
              min={8}
              max={48}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              aria-label={t("kit.password.length")}
              className="w-[130px]"
              style={{ accentColor: "var(--ax)" }}
            />
          )}
        />
        <ListRow title={t("kit.password.upper")} trailing={<Toggle checked={useUpper} onChange={setUseUpper} />} />
        <ListRow title={t("kit.password.digits")} trailing={<Toggle checked={useDigits} onChange={setUseDigits} />} />
        <ListRow title={t("kit.password.symbols")} trailing={<Toggle checked={useSymbols} onChange={setUseSymbols} />} last />
      </ListGroup>
    </div>
  );
}
