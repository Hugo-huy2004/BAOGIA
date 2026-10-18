import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: "inherit" });

run("npm", ["run", "check:cv"]);
run("npm", ["run", "build:portfolio"]);
run("npm", ["run", "check:seo:portfolio"]);

// Upload only the finished public site, without the service site's API or env files.
const stage = fs.mkdtempSync(path.join(os.tmpdir(), "hugo-portfolio-deploy-"));
try {
  fs.cpSync(path.join(root, "dist-portfolio"), stage, { recursive: true });
  const config = JSON.parse(fs.readFileSync(path.join(root, "deploy/portfolio.vercel.json"), "utf8"));
  Object.assign(config, { framework: null, buildCommand: "", installCommand: "", outputDirectory: "." });
  fs.writeFileSync(path.join(stage, "vercel.json"), JSON.stringify(config, null, 2) + "\n");
  run("vercel", ["deploy", "--prod", "--yes", "--project", "hugo-portfolio", "--scope", "hugo-huy2004s-projects"], stage);
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}
