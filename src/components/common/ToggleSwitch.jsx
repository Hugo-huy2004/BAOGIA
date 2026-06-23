import React from "react";

// Apple-style on/off switch — sliding knob over a pill track, green when on.
// Used wherever a setting is a strict boolean (push notifications, etc.)
// instead of a text button, per explicit request to match iOS conventions.
export default function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out disabled:opacity-50 ${
        checked ? "bg-success" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
    >
      <span
        className="inline-block h-[27px] w-[27px] rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}
