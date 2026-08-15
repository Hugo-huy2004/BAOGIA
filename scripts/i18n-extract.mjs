// Moves hardcoded Vietnamese copy out of a component and into the locale
// dictionary. Companion to check-i18n-hardcoded.mjs, which finds the work.
//
//   node scripts/i18n-extract.mjs <file.jsx> <key.prefix> [--write]
//
// Without --write it only reports what it would change. Replacements are
// applied to the raw source by byte offset, so the file keeps its formatting.
//
// Two rules keep this safe to run unattended:
//   * a literal is only replaced when `t` is actually bound in its scope, so a
//     module-level constant never turns into a ReferenceError at import time;
//   * only Vietnamese literals are touched, and never inside an existing t().
import fs from "node:fs";
import process from "node:process";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default || traverseModule;
const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const TEXT_ATTRIBUTES = new Set(["placeholder", "title", "alt", "aria-label", "label", "aria-description"]);

const [file, prefix, ...flags] = process.argv.slice(2);
if (!file || !prefix) {
  console.error("usage: node scripts/i18n-extract.mjs <file.jsx> <key.prefix> [--write]");
  process.exit(1);
}
const write = flags.includes("--write");

/**
 * Most components have no `t` in scope, so the extractor used to skip the whole
 * file. This pass hands them one first: `const { t } = useTranslation();` at the
 * top of every capitalised function that renders JSX and holds Vietnamese copy.
 * Restricting it to those two facts is what keeps it from putting a hook inside
 * a plain helper, which would break the rules of hooks.
 */
function addTranslationHook(code) {
  const tree = parse(code, { sourceType: "module", plugins: ["jsx"] });
  const inserts = [];
  const seen = new Set();

  traverse(tree, {
    "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression"(path) {
      const name = path.node.id?.name || path.parent?.id?.name;
      if (!name || !/^[A-Z]/.test(name)) return;
      if (path.node.body.type !== "BlockStatement" || seen.has(path.node.body.start)) return;
      if (path.scope.hasBinding("t")) return;

      let rendersJsx = false;
      let hasVietnamese = false;
      path.traverse({
        JSXElement() { rendersJsx = true; },
        JSXText(inner) { if (VIETNAMESE.test(inner.node.value)) hasVietnamese = true; },
        StringLiteral(inner) { if (VIETNAMESE.test(inner.node.value)) hasVietnamese = true; },
      });
      if (!rendersJsx || !hasVietnamese) return;

      seen.add(path.node.body.start);
      inserts.push(path.node.body.start + 1);
    },
  });

  if (!inserts.length) return code;
  let patched = inserts
    .sort((a, b) => b - a)
    .reduce((text, at) => `${text.slice(0, at)}\n  const { t } = useTranslation();${text.slice(at)}`, code);
  if (!/from "react-i18next"/.test(patched)) {
    patched = patched.replace(/^(import .*\n)/, '$1import { useTranslation } from "react-i18next";\n');
  }
  return patched;
}

const original = fs.readFileSync(file, "utf8");
const source = write ? addTranslationHook(original) : original;
const hooksAdded = source !== original;
const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });

const used = new Set();
function keyFor(text) {
  const slug = text
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean).slice(0, 4)
    .map((word, index) => (index
      ? word[0].toUpperCase() + word.slice(1).toLowerCase()
      : word.toLowerCase()))
    .join("") || "text";
  let key = slug;
  for (let n = 2; used.has(key); n += 1) key = `${slug}${n}`;
  used.add(key);
  return key;
}

const edits = [];
const messages = {};
const skipped = [];

const keyByText = new Map();
function record(node, text, replacement) {
  // The same sentence appears on several branches; give it one key.
  const key = keyByText.get(text) || keyFor(text);
  keyByText.set(text, key);
  messages[key] = text;
  edits.push({ start: node.start, end: node.end, text: replacement(`${prefix}.${key}`) });
}

// A literal only counts as interface copy when it is rendered. Anything else —
// a crisis keyword list, a config map, an analytics label — must stay untouched:
// HugoPSY matches Vietnamese words such as "sợ" against what the user typed,
// and routing those through t() would silently break the detection.
function isRendered(path) {
  return Boolean(path.findParent((parent) => parent.isJSXExpressionContainer() || parent.isJSXAttribute()));
}

traverse(ast, {
  JSXText(path) {
    const raw = path.node.value;
    if (!VIETNAMESE.test(raw) || !raw.trim()) return;
    // Keep the surrounding whitespace: it carries the JSX line layout.
    const [, lead, body, tail] = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!path.scope.hasBinding("t")) {
      skipped.push(body);
      return;
    }
    record(path.node, body, (key) => `${lead}{t("${key}")}${tail}`);
  },
  StringLiteral(path) {
    const text = path.node.value;
    if (!VIETNAMESE.test(text)) return;
    const { parent } = path;
    if (parent.type === "ImportDeclaration" || parent.type === "TSLiteralType") return;
    // Already localised: the second argument of t() is a fallback, not a leak.
    if (parent.type === "CallExpression" && parent.callee.name === "t") return;
    if (parent.type === "ObjectProperty" && parent.key === path.node && !parent.computed) return;
    if (!path.scope.hasBinding("t") || !isRendered(path)) {
      skipped.push(text);
      return;
    }
    if (parent.type === "JSXAttribute") {
      if (TEXT_ATTRIBUTES.has(parent.name.name)) record(path.node, text, (key) => `{t("${key}")}`);
      else skipped.push(text);
      return;
    }
    record(path.node, text, (key) => `t("${key}")`);
  },
});

const patched = edits
  .sort((a, b) => b.start - a.start)
  .reduce((text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end), source);

console.log(`${file}: ${edits.length} replaced, ${skipped.length} skipped (no t in scope or non-text prop)`);
if (!write) {
  console.log(JSON.stringify(messages, null, 2));
  process.exit(0);
}
fs.writeFileSync(file, patched, "utf8");
fs.writeFileSync(`${file}.i18n.json`, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
console.log(`wrote ${file} and ${file}.i18n.json`);
