import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import en from "./en/translation.json";
import { MEMBER_APP_TRANSLATIONS } from "./memberAppTranslations.js";

const traverse = traverseModule.default || traverseModule;

const MEMBER_SOURCE_ROOTS = [
  path.resolve("src/components/member"),
  path.resolve("src/pages/member"),
];

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:js|jsx)$/.test(entry.name) && !entry.name.includes(".test.") ? [target] : [];
  });
}

function valueAtKey(dictionary, key) {
  return key.split(".").reduce((value, part) => value?.[part], dictionary);
}

describe("Member Portal translation key coverage", () => {
  it("defines every literal t() key used by member screens", () => {
    const missing = [];
    for (const file of MEMBER_SOURCE_ROOTS.flatMap(sourceFiles)) {
      const source = fs.readFileSync(file, "utf8");
      const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
      traverse(ast, {
        CallExpression(nodePath) {
          const { callee, arguments: args } = nodePath.node;
          if (callee.type !== "Identifier" || callee.name !== "t" || args[0]?.type !== "StringLiteral") return;
          if (valueAtKey(en, args[0].value) === undefined) {
            missing.push(`${path.relative(process.cwd(), file)}: ${args[0].value}`);
          }
        }
      });
    }
    expect(missing).toEqual([]);
  });
});

describe("Member app catalog", () => {
  const languages = Object.entries(MEMBER_APP_TRANSLATIONS);
  const ids = Object.keys(MEMBER_APP_TRANSLATIONS.en.catalog);

  it("names the same apps in every language", () => {
    for (const [code, pack] of languages) {
      expect(Object.keys(pack.catalog).sort(), code).toEqual([...ids].sort());
      expect(Object.keys(pack.badges).sort(), code)
        .toEqual(Object.keys(MEMBER_APP_TRANSLATIONS.en.badges).sort());
    }
  });

  it("keeps every title short enough for the home-screen label", () => {
    // The label is two lines of ~12 characters under an 84px icon. CJK glyphs
    // are double width, so they get half the budget.
    const tooLong = [];
    for (const [code, pack] of languages) {
      for (const [id, { title }] of Object.entries(pack.catalog)) {
        const budget = /[぀-ヿ一-鿿가-힯]/.test(title) ? 8 : 16;
        if (title.length > budget) tooLong.push(`${code}.${id}: ${title} (${title.length} > ${budget})`);
      }
    }
    expect(tooLong).toEqual([]);
  });
});
