import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { JOY_DENOMS, denomKey } from "../../../shared/joyCurrency.js";
import { languageLabel, persistAppLanguage } from "../../i18n/languages";
import { countryDisplayName, formatFullAddress, RELIGION_LABELS } from "../../lib/profileDisplay";
import { getCachedGeolocation } from "../../utils/geoCache.js";

const apiBase = import.meta.env.VITE_API_URL || "/api";

// Quà khi nhập mã người giới thiệu — khớp với phần server cộng vào.
const REFERRAL_BONUS = 10;
const REFERRAL_BIO_DAYS = 15;

const thisYear = new Date().getFullYear();
const range = (length, map) => Array.from({ length }, (_, index) => map(index));

const FIELD_CLASS =
  "w-full min-h-[52px] rounded-2xl border border-border bg-muted/50 px-4 text-[17px] text-foreground outline-none focus:border-foreground/35 focus:bg-card";
const SELECT_CLASS =
  "w-full min-h-[52px] rounded-2xl border border-border bg-muted/50 px-2 text-[16px] text-foreground outline-none focus:border-foreground/35";

const countryFlag = (code) => String.fromCodePoint(...String(code).split("").map((letter) => 127397 + letter.charCodeAt(0)));

/**
 * Hỏi ĐÚNG những thông tin hồ sơ đang thiếu — danh sách do server trả về
 * (GET /bios/me/profile-gaps), không phải client tự đoán. Ai thiếu gì hỏi nấy;
 * thêm yêu cầu mới sau này chỉ cần khai báo ở server/utils/profileRequirements.js
 * là modal tự biết hỏi.
 *
 * MỖI BƯỚC MỘT CÂU HỎI. Bản trước dồn cả 5 mục vào một khung: ngôn ngữ 9 nút,
 * đơn vị 8 nút, ngày sinh 3 ô chọn, điện thoại, mã giới thiệu — một cột dọc dài
 * hơn màn hình, chữ phải bóp xuống 10px mới vừa, và người dùng không biết còn
 * bao nhiêu nữa mới xong. Một câu hỏi một màn thì chữ để to được, nút để 52px
 * được, và có thanh tiến độ nói rõ còn mấy bước.
 */
export default function OnboardingProfileModal({ email, onDone, onSkip }) {
  const { t, i18n } = useTranslation();
  const [missing, setMissing] = useState(null);
  const [values, setValues] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [referrerCode, setReferrerCode] = useState(() => {
    try {
      return (new URLSearchParams(window.location.search).get("ref") || "").toUpperCase();
    } catch {
      return "";
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ethnicityOptions, setEthnicityOptions] = useState([]);
  const [loadingEthnicities, setLoadingEthnicities] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${apiBase}/bios/me/profile-gaps`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const gaps = Array.isArray(data.missing) ? data.missing : [];
        setMissing(gaps);
        // Không thiếu gì và cũng không có mã giới thiệu chờ áp → không việc gì
        // phải chặn người dùng lại.
        if (!gaps.length && !referrerCode) onSkip?.();
      })
      .catch(() => alive && setMissing([]));
    return () => { alive = false; };
  }, [onSkip, referrerCode]);

  // Mã giới thiệu là bước CUỐI và không bắt buộc — gộp nó vào danh sách bước để
  // thanh tiến độ đếm đúng, thay vì treo thêm một ô ở đáy mọi bước.
  const steps = useMemo(
    () => [...(missing || []), { key: "referral", type: "referral" }],
    [missing],
  );
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    if (step?.type !== "ethnicity" || !values.countryCode) return;
    let alive = true;
    setLoadingEthnicities(true);
    fetch(`${apiBase}/bios/me/profile-options/ethnicities?country=${encodeURIComponent(values.countryCode)}`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => alive && setEthnicityOptions(Array.isArray(data.options) ? data.options : []))
      .catch(() => alive && setEthnicityOptions([]))
      .finally(() => alive && setLoadingEthnicities(false));
    return () => { alive = false; };
  }, [step?.type, values.countryCode]);

  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  // Nhãn của các lựa chọn do CLIENT dựng: tên ngôn ngữ viết bằng chính tiếng đó
  // (`languageLabel`) và đơn vị JOY lấy từ shared/joyCurrency. Server chỉ gửi mã
  // xuống, nên không có chuỗi giao diện nào nằm ở backend.
  const optionLabel = (fieldKey, value) => {
    if (fieldKey === "language") return languageLabel(value);
    if (fieldKey === "religion") {
      const labels = i18n.language?.startsWith("vi") ? RELIGION_LABELS.vi : RELIGION_LABELS.en;
      return labels[value] || value;
    }
    const denom = JOY_DENOMS[value];
    return denom ? `${denom.code} — ${denom.name} · ${languageLabel(value)}` : value;
  };

  const countryName = (code) => {
    return countryDisplayName(code, i18n.resolvedLanguage || "en");
  };

  // Chọn ngôn ngữ là đổi giao diện NGAY (thấy liền kết quả, không phải đoán), và
  // gợi ý luôn đơn vị JOY của nước đó — vẫn đổi được, chỉ là mặc định hợp lý.
  const chooseLanguage = (code) => {
    setValues((current) => ({
      ...current,
      language: code,
      joyDenom: current.joyDenom || denomKey(code),
    }));
    persistAppLanguage(code);
    i18n.changeLanguage(code);
  };

  const locateMember = async () => {
    setLocating(true);
    setError("");
    try {
      const pos = await getCachedGeolocation({ fresh: true, ask: true });
      setValues((current) => ({
        ...current,
        verifiedLatitude: pos.coords.latitude,
        verifiedLongitude: pos.coords.longitude,
        locationAccuracy: Math.round(pos.coords.accuracy),
        locationConfirmed: false,
      }));
    } catch {
      setError(i18n.language?.startsWith("vi") ? "Không thể lấy vị trí. Hãy cấp quyền định vị rồi thử lại." : "Could not get your location. Allow location access and try again.");
    } finally {
      setLocating(false);
    }
  };

  const isFilled = (field) => {
    if (!field) return false;
    if (field.type === "referral") return true;            // không bắt buộc
    if (field.type === "birthDate") return Boolean(values.birthDay && values.birthMonth && values.birthYear);
    if (field.type === "checkbox") return values[field.key] === true;
    if (field.type === "locationVerification") return values.locationConfirmed === true && Number.isFinite(values.verifiedLatitude) && Number.isFinite(values.verifiedLongitude);
    if (field.key === "religion" && values.religion === "self_describe") return Boolean(String(values.religionDetail || "").trim());
    if (field.key === "ethnicity" && values.ethnicity === "self_describe") return Boolean(String(values.ethnicityDetail || "").trim());
    return Boolean(String(values[field.key] || "").trim());
  };

  const goNext = () => {
    if (!isFilled(step)) {
      setError(t("memberPortal.onboarding.completeRequired"));
      return;
    }
    setError("");
    if (isLastStep) handleSubmit();
    else setStepIndex((index) => index + 1);
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${apiBase}/bios/me/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          referrerCode,
          ...values,
          religion: values.religion === "self_describe" ? `self:${String(values.religionDetail || "").trim()}` : values.religion,
          ethnicity: values.ethnicity === "self_describe" ? `self:${String(values.ethnicityDetail || "").trim()}` : values.ethnicity,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.onboarding.genericError"));
      // Server vẫn báo thiếu thì hỏi tiếp đúng phần còn thiếu, quay về bước đầu.
      if (Array.isArray(data.missing) && data.missing.length) {
        setMissing(data.missing);
        setStepIndex(0);
        setError(t("memberPortal.onboarding.invalidFields"));
        setSubmitting(false);
        return;
      }
      if (data.referralError) setError(data.referralError);
      onDone?.(data);
    } catch (err) {
      setError(err.message || t("memberPortal.onboarding.genericError"));
      setSubmitting(false);
    }
  }

  if (missing === null) return null;

  const label = step.type === "referral"
    ? t("memberPortal.onboarding.referralLabel")
    : t(`memberPortal.onboarding.fields.${step.key}.label`, { defaultValue: step.label });
  const hint = step.type === "referral"
    ? t("memberPortal.onboarding.referralHint", { amount: REFERRAL_BONUS, days: REFERRAL_BIO_DAYS })
    : t(`memberPortal.onboarding.fields.${step.key}.hint`, { defaultValue: step.hint || "" });
  const fullAddress = formatFullAddress(values, i18n.resolvedLanguage || "vi");

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center overflow-hidden bg-black/55 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[calc(100dvh-8px)] w-full max-w-sm flex-col rounded-t-[28px] bg-card shadow-2xl sm:m-4 sm:max-h-[calc(100dvh-32px)] sm:rounded-[28px]">
        <div className="flex min-h-0 flex-1 flex-col px-6 pt-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)" }}>

          {/* Thanh tiến độ: một vạch cho mỗi bước, vạch đã qua tô đậm. Người dùng
              phải biết còn bao nhiêu nữa mới xong, không thì mỗi bước là một
              cánh cửa không biết dẫn tới đâu. */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((item, index) => (
              <span
                key={item.key}
                className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-foreground" : "bg-muted"}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => { setError(""); setStepIndex((index) => index - 1); }}
                disabled={submitting}
                aria-label={t("memberPortal.joy.particle.back")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
              </button>
            )}
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("memberPortal.onboarding.stepOf", { current: stepIndex + 1, total: steps.length })}
            </p>
          </div>

          <h2 className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight text-foreground">
            {label}
          </h2>
          {hint && <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{hint}</p>}

          {/* ── Nội dung của đúng bước này ── */}
          <div className="mt-5 min-h-0 flex-1 space-y-2.5 overflow-y-auto">
            {step.type === "choice" && (step.options || []).map((option) => {
              const active = values[step.key] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => (step.key === "language"
                    ? chooseLanguage(option.value)
                    : setValue(step.key, option.value))}
                  aria-pressed={active}
                  className={`flex w-full min-h-[56px] items-center justify-between gap-3 rounded-2xl border px-4 text-left text-[17px] font-semibold transition-colors ${
                    active ? "border-foreground bg-muted text-foreground" : "border-border bg-card text-foreground"
                  }`}
                >
                  <span className="min-w-0 truncate">{optionLabel(step.key, option.value)}</span>
                  <span className="material-symbols-outlined shrink-0 text-[22px] text-muted-foreground">
                    {active ? "radio_button_checked" : "radio_button_unchecked"}
                  </span>
                </button>
              );
            })}

            {step.type === "birthDate" && (
              <div className="grid grid-cols-3 gap-2">
                <select className={SELECT_CLASS} value={values.birthDay || ""} onChange={(e) => setValue("birthDay", e.target.value)} aria-label={t("memberPortal.onboarding.dayAria")}>
                  <option value="">{t("memberPortal.onboarding.day")}</option>
                  {range(31, (i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className={SELECT_CLASS} value={values.birthMonth || ""} onChange={(e) => setValue("birthMonth", e.target.value)} aria-label={t("memberPortal.onboarding.monthAria")}>
                  <option value="">{t("memberPortal.onboarding.month")}</option>
                  {range(12, (i) => i + 1).map((m) => <option key={m} value={m}>{t("memberPortal.onboarding.monthOption", { month: m })}</option>)}
                </select>
                <select className={SELECT_CLASS} value={values.birthYear || ""} onChange={(e) => setValue("birthYear", e.target.value)} aria-label={t("memberPortal.onboarding.yearAria")}>
                  <option value="">{t("memberPortal.onboarding.year")}</option>
                  {range(80, (i) => thisYear - 14 - i).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {step.type === "country" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-muted/55 px-4 py-3">
                  {values.countryCode
                    ? <span className="text-[28px] leading-none" aria-hidden="true">{countryFlag(values.countryCode)}</span>
                    : <span className="material-symbols-outlined text-[26px] text-muted-foreground" aria-hidden="true">public</span>}
                  <span className="min-w-0 truncate text-[15px] font-semibold text-foreground">
                    {values.countryCode ? countryName(values.countryCode) : (i18n.language?.startsWith("vi") ? "Chọn nơi bạn đang sinh sống" : "Choose where you live")}
                  </span>
                </div>
                <select
                  className={SELECT_CLASS}
                  value={values.countryCode || ""}
                  onChange={(event) => setValue("countryCode", event.target.value)}
                  aria-label={label}
                  autoFocus
                >
                  <option value="">{i18n.language?.startsWith("vi") ? "Chọn quốc gia / vùng lãnh thổ" : "Choose a country or territory"}</option>
                  {(step.options || [])
                    .map((option) => ({ ...option, label: countryName(option.value) }))
                    .sort((a, b) => a.label.localeCompare(b.label, i18n.resolvedLanguage || "en"))
                    .map((option) => <option key={option.value} value={option.value}>{countryFlag(option.value)} {option.label}</option>)}
                </select>
              </div>
            )}

            {(step.type === "addressPart" || step.type === "addressDetail") && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">lock</span>
                  <span>{i18n.language?.startsWith("vi") ? "Lưu một lần · Muốn đổi cần liên hệ admin" : "Saved once · Contact admin to change"}</span>
                </div>
                {step.type === "addressDetail" ? (
                  <textarea
                    value={values[step.key] || ""}
                    onChange={(event) => setValue(step.key, event.target.value)}
                    rows={3}
                    maxLength={500}
                    autoComplete="street-address"
                    className={`${FIELD_CLASS} resize-none py-3 leading-relaxed`}
                    placeholder={i18n.language?.startsWith("vi") ? "Số nhà, tên đường, toà nhà…" : "House number, street, building…"}
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={values[step.key] || ""}
                    onChange={(event) => setValue(step.key, event.target.value)}
                    maxLength={120}
                    className={FIELD_CLASS}
                    autoFocus
                  />
                )}
              </div>
            )}

            {step.type === "locationVerification" && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/45 p-4">
                  <span className="material-symbols-outlined mt-0.5 text-[22px] text-muted-foreground" aria-hidden="true">home_pin</span>
                  <span className="min-w-0">
                    <small className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {i18n.language?.startsWith("vi") ? "Địa chỉ sẽ được lưu" : "Address to be saved"}
                    </small>
                    <strong className="mt-1 block text-[14px] leading-relaxed text-foreground">{fullAddress}</strong>
                  </span>
                </div>
                {!Number.isFinite(values.verifiedLatitude) ? (
                  <button type="button" onClick={locateMember} disabled={locating} className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-[16px] font-bold text-background disabled:opacity-50">
                    <span className="material-symbols-outlined" aria-hidden="true">my_location</span>
                    {locating
                      ? (i18n.language?.startsWith("vi") ? "Đang lấy vị trí…" : "Getting location…")
                      : (i18n.language?.startsWith("vi") ? "Định vị vị trí hiện tại" : "Locate me")}
                  </button>
                ) : (
                  <>
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
                      <iframe
                        title={i18n.language?.startsWith("vi") ? "Bản đồ vị trí xác minh" : "Location verification map"}
                        className="h-52 w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${values.verifiedLongitude - 0.005}%2C${values.verifiedLatitude - 0.005}%2C${values.verifiedLongitude + 0.005}%2C${values.verifiedLatitude + 0.005}&layer=mapnik&marker=${values.verifiedLatitude}%2C${values.verifiedLongitude}`}
                      />
                      <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
                        {Number(values.verifiedLatitude).toFixed(6)}, {Number(values.verifiedLongitude).toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">© OpenStreetMap</a>
                      <button type="button" onClick={locateMember} className="font-bold text-foreground">{i18n.language?.startsWith("vi") ? "Định vị lại" : "Locate again"}</button>
                    </div>
                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/45 p-4">
                      <input type="checkbox" checked={values.locationConfirmed === true} onChange={(event) => setValue("locationConfirmed", event.target.checked)} className="mt-0.5 h-5 w-5 accent-primary" />
                      <span className="text-[14px] font-medium leading-relaxed text-foreground">
                        {i18n.language?.startsWith("vi") ? "Tôi xác nhận địa chỉ trên và điểm ghim trên bản đồ đều chính xác." : "I confirm both the address above and the map pin are accurate."}
                      </span>
                    </label>
                  </>
                )}
              </div>
            )}

            {step.type === "ethnicity" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-muted/55 px-4 py-3">
                  <span className="material-symbols-outlined text-[24px] text-muted-foreground" aria-hidden="true">diversity_3</span>
                  <span className="text-[14px] font-semibold text-foreground">
                    {loadingEthnicities
                      ? (i18n.language?.startsWith("vi") ? "Đang lọc theo quốc gia…" : "Filtering by country…")
                      : `${countryName(values.countryCode)} · ${ethnicityOptions.length} ${i18n.language?.startsWith("vi") ? "gợi ý" : "suggestions"}`}
                  </span>
                </div>
                <select className={SELECT_CLASS} value={values.ethnicity || ""} onChange={(event) => setValue("ethnicity", event.target.value)}>
                  <option value="">{i18n.language?.startsWith("vi") ? "Chọn dân tộc / bản sắc sắc tộc" : "Choose ethnicity"}</option>
                  {ethnicityOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  <option value="self_describe">{i18n.language?.startsWith("vi") ? "Tự ghi tên chính xác" : "Enter the exact name"}</option>
                  <option value="prefer_not_to_say">{i18n.language?.startsWith("vi") ? "Không muốn tiết lộ" : "Prefer not to say"}</option>
                </select>
                {values.ethnicity === "self_describe" && <input type="text" value={values.ethnicityDetail || ""} onChange={(event) => setValue("ethnicityDetail", event.target.value)} maxLength={115} className={FIELD_CLASS} autoFocus />}
              </div>
            )}

            {step.type === "religion" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-muted/55 px-4 py-3">
                  <span className="material-symbols-outlined text-[24px] text-muted-foreground" aria-hidden="true">account_balance</span>
                  <span className="text-[14px] font-semibold text-foreground">{i18n.language?.startsWith("vi") ? "Tên truyền thống và hệ phái được ghi riêng" : "Traditions and denominations are listed separately"}</span>
                </div>
                <select className={SELECT_CLASS} value={values.religion || ""} onChange={(event) => setValue("religion", event.target.value)}>
                  <option value="">{i18n.language?.startsWith("vi") ? "Chọn tôn giáo / hệ phái" : "Choose a religion / denomination"}</option>
                  {(step.options || []).map((option) => <option key={option.value} value={option.value}>{optionLabel("religion", option.value)}</option>)}
                </select>
                {values.religion === "self_describe" && <input type="text" value={values.religionDetail || ""} onChange={(event) => setValue("religionDetail", event.target.value)} maxLength={150} className={FIELD_CLASS} autoFocus />}
              </div>
            )}

            {step.type === "checkbox" && (
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
                <input
                  type="checkbox"
                  checked={values[step.key] === true}
                  onChange={(e) => setValue(step.key, e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                />
                <span className="text-[15px] leading-relaxed text-foreground">
                  {t(`memberPortal.onboarding.fields.${step.key}.checkboxLabel`, {
                    defaultValue: step.checkboxLabel || label,
                  })}
                </span>
              </label>
            )}

            {(step.type === "tel" || step.type === "text") && (
              <input
                type={step.type === "tel" ? "tel" : "text"}
                inputMode={step.type === "tel" ? "tel" : undefined}
                value={values[step.key] || ""}
                onChange={(e) => setValue(step.key, e.target.value)}
                placeholder={t("memberPortal.onboarding.phonePlaceholder", { defaultValue: "" })}
                className={FIELD_CLASS}
                autoFocus
              />
            )}

            {step.type === "referral" && (
              <input
                type="text"
                value={referrerCode}
                onChange={(e) => setReferrerCode(e.target.value.toUpperCase())}
                placeholder={t("memberPortal.onboarding.referralPlaceholder")}
                className={`${FIELD_CLASS} font-mono tracking-widest`}
              />
            )}
          </div>

          {error && <p className="mt-3 text-center text-[13px] text-destructive">{error}</p>}

          <button
            onClick={goNext}
            disabled={submitting}
            className="mt-5 min-h-[52px] w-full shrink-0 rounded-2xl bg-foreground text-[17px] font-bold text-background active:scale-[.99] disabled:opacity-50"
          >
            {submitting
              ? t("memberPortal.onboarding.submitting")
              : isLastStep
                ? t("memberPortal.onboarding.submitButton")
                : t("memberPortal.onboarding.next")}
          </button>

          {/* Chỉ cho để sau khi không còn mục bắt buộc nào thiếu. */}
          {!missing.length && onSkip && (
            <button
              onClick={onSkip}
              disabled={submitting}
              className="mt-2 w-full py-2 text-[14px] font-medium text-muted-foreground disabled:opacity-50"
            >
              {t("memberPortal.onboarding.skipButton")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
