import { useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useInView } from "framer-motion";

/**
 * Bốn thẻ quyền lợi của trang chiến dịch — mỗi thẻ có một thứ để chạm:
 *   signup   : ba bước đăng ký, sáng lần lượt khi lướt tới
 *   days     : công tắc "học sinh, sinh viên" — tổng số ngày và hạn dùng đổi theo
 *   services : chạm từng dịch vụ để xem nhanh
 *   joy      : số JOY đếm lên khi thẻ hiện ra, chạm để đếm lại
 * Thẻ nào cũng có quầng sáng đi theo con trỏ. Màu lấy từ token của .collab nên
 * tự theo chế độ sáng/tối.
 */

const EASE = [0.22, 1, 0.36, 1];

const formatDate = (date, lang) =>
  date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

function SignupSteps({ steps, reduced }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  return (
    <ol ref={ref} className="collab-perk__steps">
      {steps.map((step, index) => (
        <motion.li
          key={step}
          initial={reduced ? false : { opacity: 0.35 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={{ delay: 0.25 + index * 0.35, duration: 0.6, ease: EASE }}
        >
          <span className="collab-perk__dot" aria-hidden="true">{index + 1}</span>
          {step}
        </motion.li>
      ))}
    </ol>
  );
}

function DaysCalculator({ campaign, ui, lang }) {
  const [edu, setEdu] = useState(false);
  const total = campaign.bioDays + (edu ? campaign.eduBonusDays : 0);
  const until = new Date(Date.now() + total * 86400000);
  const share = (campaign.bioDays / (campaign.bioDays + campaign.eduBonusDays)) * 100;
  return (
    <div className="collab-perk__days">
      <div className="collab-perk__total" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.strong key={total} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            {total}
          </motion.strong>
        </AnimatePresence>
        <span>{ui.perk.days}</span>
      </div>
      <div className="collab-perk__bar" aria-hidden="true">
        <span style={{ width: `${share}%` }} />
        <motion.span className="collab-perk__bar-edu" animate={{ width: edu ? `${100 - share}%` : "0%" }} transition={{ duration: 0.6, ease: EASE }} />
      </div>
      <p className="collab-perk__until">{ui.perk.until(formatDate(until, lang))}</p>
      <button type="button" role="switch" aria-checked={edu} className="collab-switch" onClick={() => setEdu((value) => !value)}>
        <span className="collab-switch__track" aria-hidden="true"><span className="collab-switch__thumb" /></span>
        {ui.perk.eduSwitch}
      </button>
    </div>
  );
}

function ServicePicker({ ui }) {
  const services = ui.features.filter((feature) => feature.id !== "joy" && feature.id !== "team");
  const [active, setActive] = useState(services[0].id);
  const current = services.find((service) => service.id === active);
  return (
    <div className="collab-perk__services">
      <div className="collab-perk__chips" role="tablist" aria-label={ui.perk.servicesHint}>
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            role="tab"
            aria-selected={service.id === active}
            className="collab-perk__chip"
            onClick={() => setActive(service.id)}
            onPointerEnter={(event) => event.pointerType === "mouse" && setActive(service.id)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{service.icon}</span>
            {service.title}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={current.id} role="tabpanel" className="collab-perk__service-body"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }}>
          {current.body}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function JoyCounter({ joy, ui, lang, reduced }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(reduced ? joy : 0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduced || !inView) return undefined;
    const controls = animate(0, joy, { duration: 1.6, ease: EASE, onUpdate: (latest) => setValue(Math.round(latest)) });
    return () => controls.stop();
  }, [inView, joy, reduced, run]);

  return (
    <div ref={ref} className="collab-perk__joy">
      <button type="button" className="collab-perk__joy-count" onClick={() => setRun((n) => n + 1)} aria-label={`${joy} JOY — ${ui.perk.joyReplay}`}>
        <strong>{value.toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}</strong>
        <span>JOY</span>
      </button>
      <p className="collab-perk__team">
        <span className="material-symbols-outlined" aria-hidden="true">groups</span>{ui.perk.team}
      </p>
    </div>
  );
}

function PerkCard({ frame, index, children, reduced }) {
  const ref = useRef(null);
  // Quầng sáng theo con trỏ: chỉ ghi biến CSS, không render lại React.
  const onPointerMove = (event) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    ref.current.style.setProperty("--mx", `${event.clientX - box.left}px`);
    ref.current.style.setProperty("--my", `${event.clientY - box.top}px`);
  };
  return (
    <motion.li
      ref={ref}
      className={`collab-frame collab-frame--${frame.id}`}
      onPointerMove={onPointerMove}
      initial={reduced ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.08, duration: 0.9, ease: EASE }}
    >
      <span className="collab-frame__no collab-type">{String(index + 1).padStart(2, "0")}</span>
      <span className="material-symbols-outlined collab-frame__icon" aria-hidden="true">{frame.icon}</span>
      <h3>{frame.title}</h3>
      <p>{frame.body}</p>
      <div className="collab-perk">{children}</div>
    </motion.li>
  );
}

export default function PerkCards({ campaign, ui, lang, reduced }) {
  const widgets = {
    signup: <SignupSteps steps={ui.perk.steps} reduced={reduced} />,
    days: <DaysCalculator campaign={campaign} ui={ui} lang={lang} />,
    services: <ServicePicker ui={ui} />,
    joy: <JoyCounter joy={campaign.joy} ui={ui} lang={lang} reduced={reduced} />,
  };
  return (
    <ol className="collab-strip">
      {ui.frames(campaign).map((frame, index) => (
        <PerkCard key={frame.id} frame={frame} index={index} reduced={reduced}>
          {widgets[frame.id]}
        </PerkCard>
      ))}
    </ol>
  );
}
