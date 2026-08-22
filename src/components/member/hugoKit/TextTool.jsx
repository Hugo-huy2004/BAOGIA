import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Segmented } from "../../demos/iosKit";
import notify from "../../../lib/notify";

/**
 * Công cụ văn bản: Base64, mã hoá URL và đếm chữ. Tất cả chạy trong máy.
 *
 * ponytail: `btoa` chỉ nhận byte 0–255 nên gõ tiếng Việt vào là ném
 * InvalidCharacterError. Đi vòng qua TextEncoder/TextDecoder để UTF-8 ra đúng —
 * đây là lỗi kinh điển của mọi bộ chuyển Base64 viết vội.
 */
const toBase64 = (input) => {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const fromBase64 = (input) => {
  const binary = atob(input.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const MODES = {
  base64: { encode: toBase64, decode: fromBase64 },
  url: { encode: encodeURIComponent, decode: decodeURIComponent },
};

export default function TextTool() {
  const { t } = useTranslation();
  const [mode, setMode] = useState("base64");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const stats = useMemo(() => ({
    chars: [...input].length,
    words: input.trim() ? input.trim().split(/\s+/).length : 0,
    lines: input ? input.split("\n").length : 0,
  }), [input]);

  const run = (direction) => {
    if (!input.trim()) return;
    try {
      setOutput(MODES[mode][direction](input));
    } catch {
      setOutput("");
      notify.error(t("kit.text.invalid"));
    }
  };

  const copy = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notify.success(t("kit.copied"));
    } catch {
      notify.error(t("kit.copyFailed"));
    }
  };

  const fieldStyle = { background: "var(--ios-surface)", color: "var(--ios-label)" };

  return (
    <div className="space-y-5">
      <Segmented
        items={[
          { id: "base64", label: t("kit.text.base64") },
          { id: "url", label: t("kit.text.url") },
          { id: "count", label: t("kit.text.count") },
        ]}
        value={mode}
        onChange={(next) => { setMode(next); setOutput(""); }}
      />

      <div>
        <label className="mb-1.5 block px-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
          {t("kit.text.input")}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          className="w-full resize-none rounded-[12px] p-3.5 text-[16px] leading-snug outline-none"
          style={fieldStyle}
        />
      </div>

      {mode === "count" ? (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: "chars", value: stats.chars },
            { id: "words", value: stats.words },
            { id: "lines", value: stats.lines },
          ].map((item) => (
            <div key={item.id} className="rounded-[12px] p-3 text-center" style={{ background: "var(--ios-surface)" }}>
              <p className="text-[22px] font-bold tabular-nums leading-tight">{item.value}</p>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--ios-label-2)" }}>{t(`kit.text.${item.id}`)}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Button full onClick={() => run("encode")}>{t("kit.text.encode")}</Button>
            <Button full variant="gray" onClick={() => run("decode")}>{t("kit.text.decode")}</Button>
          </div>

          {output && (
            <div>
              <label className="mb-1.5 block px-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
                {t("kit.result")}
              </label>
              <textarea
                value={output}
                readOnly
                rows={5}
                className="w-full resize-none rounded-[12px] p-3.5 font-mono text-[14px] leading-snug outline-none"
                style={fieldStyle}
              />
              <Button full variant="gray" className="mt-2" onClick={() => copy(output)}>{t("kit.copy")}</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
