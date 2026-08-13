import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import en from "./en/translation.json";

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
