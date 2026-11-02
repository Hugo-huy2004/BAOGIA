import { createElement, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { EDU_COPY } from "./eduCopy";

/**
 * Đọc chữ Education Hugo theo ngôn ngữ của app (cùng khoá "hugo-language" với Hugo Studio).
 * Bộ chữ nằm sẵn trong bundle nên không có lúc nào lộ khoá thô như "a.b.c".
 * Chữ Nôm và mọi ngôn ngữ khác rơi về tiếng Việt.
 */
export const eduLang = (language) => {
  const code = String(language || "vi").toLowerCase().split("-")[0];
  return code === "en" || code === "zh" ? code : "vi";
};

const pick = (source, key) => key.split(".").reduce((node, part) => (node == null ? node : node[part]), source);

export function eduT(lang, key, vars) {
  let value = pick(EDU_COPY[lang], key) ?? pick(EDU_COPY.vi, key) ?? key;
  if (typeof value === "string" && vars) value = value.replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match));
  return value;
}

/** Chuỗi có <b>…</b> → mảng node React (không dùng innerHTML). */
export function rich(text) {
  return String(text).split(/<b>(.*?)<\/b>/).map((part, i) => (i % 2 ? createElement("b", { key: i }, part) : createElement(Fragment, { key: i }, part)));
}

export function useEduText() {
  const { i18n } = useTranslation();
  const lang = eduLang(i18n.resolvedLanguage || i18n.language);
  return { lang, t: (key, vars) => eduT(lang, key, vars) };
}

/**
 * Tên + giới thiệu chặng theo ngôn ngữ. Tiếng Việt giữ dữ liệu gốc của giáo trình;
 * en/zh thay phần đã dịch và giữ mã "CODE 101 · " ở đầu tên.
 */
export function localizeStage(stage, lang) {
  const copy = lang === "vi" ? null : EDU_COPY[lang]?.curriculum?.stages?.[stage?.id];
  if (!copy) return stage;
  const { title, ...intro } = copy;
  return { ...stage, title: stage.code ? `${stage.code} · ${title}` : title, intro: { ...stage.intro, ...intro } };
}

/** "3. Tên step" → tên đã dịch, giữ số thứ tự. `index` đếm từ 0. */
export function localizeStepTitle(title, index, lang, course = "coding") {
  const translated = lang === "vi" ? null : EDU_COPY[lang]?.curriculum?.[course === "sql" ? "sqlSteps" : "steps"]?.[index];
  return translated ? `${index + 1}. ${translated}` : title;
}
