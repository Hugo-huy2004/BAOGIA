import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  buildLessonEvidence,
  buildPreviewHtml,
  createWorkspaceZipBlob,
  scoreScreenshotSubmission,
  stripCodeComments
} from "./workspaceUtils";

function installLocalStorageMock() {
  const store = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: vi.fn(key => (store.has(key) ? store.get(key) : null)),
      setItem: vi.fn((key, value) => store.set(key, String(value))),
      removeItem: vi.fn(key => store.delete(key)),
      clear: vi.fn(() => store.clear())
    },
    configurable: true
  });
}

describe("HugoCoder workspace utils", () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-03T10:00:00.000Z"));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("inlines relative CSS and JS into an HTML preview", () => {
    const files = [
      {
        path: "src/index.html",
        content: '<link rel="stylesheet" href="./style.css"><h1>Hi</h1><script src="script.js"></script>'
      },
      { path: "src/style.css", content: "h1 { color: red; }" },
      { path: "src/script.js", content: "document.body.dataset.ok = '1';" }
    ];

    const html = buildPreviewHtml(files[0], files);

    expect(html).toContain("<style");
    expect(html).toContain("h1 { color: red; }");
    expect(html).toContain("<script");
    expect(html).toContain("document.body.dataset.ok");
    expect(html).not.toContain('href="./style.css"');
    expect(html).not.toContain('src="script.js"');
  });

  it("builds lesson evidence from the local study timer", () => {
    localStorage.setItem("student_ide_start_lesson3", String(Date.now() - 11 * 60 * 1000));

    const evidence = buildLessonEvidence(
      { id: "lesson3", practiceType: "js_button" },
      { channel: "mobile", score: 88 }
    );

    expect(evidence).toMatchObject({
      lessonId: "lesson3",
      practiceType: "js_button",
      channel: "mobile",
      score: 88
    });
    expect(evidence.timeSpentMs).toBe(11 * 60 * 1000);
  });

  it("scores valid screenshots deterministically without pretending to use AI", () => {
    const file = new File(["x".repeat(200000)], "profile-screenshot.png", { type: "image/png" });

    expect(scoreScreenshotSubmission(file)).toBe(scoreScreenshotSubmission(file));
    expect(scoreScreenshotSubmission(file)).toBeGreaterThanOrEqual(60);
    expect(scoreScreenshotSubmission(new File(["nope"], "note.txt", { type: "text/plain" }))).toBe(0);
  });

  it("strips every comment style so TODO hints can't pass lesson verify", () => {
    const html = "<!-- TODO: viết <header> tại đây -->\n<main>ok</main>";
    expect(stripCodeComments(html)).not.toContain("header");
    expect(stripCodeComments(html)).toContain("<main>ok</main>");

    const js = "// TODO: dùng addEventListener\nconst url = \"http://a.vn\";\n/* prepare() */\nfetch(url);";
    const strippedJs = stripCodeComments(js);
    expect(strippedJs).not.toContain("addEventListener");
    expect(strippedJs).not.toContain("prepare()");
    expect(strippedJs).toContain("http://a.vn");

    const sql = "-- TODO: SELECT * FROM users\nINSERT INTO logs VALUES (1);";
    expect(stripCodeComments(sql)).not.toContain("SELECT");
    expect(stripCodeComments(sql)).toContain("INSERT INTO logs");

    const css = "/* TODO: box-sizing */\n.card { color: #0056b3; }";
    expect(stripCodeComments(css)).not.toContain("box-sizing");
    expect(stripCodeComments(css)).toContain("#0056b3");
  });

  it("exports a readable zip blob", async () => {
    const blob = await createWorkspaceZipBlob([
      { path: "README.md", content: "# HugoCoder" },
      { path: "src/index.html", content: "<h1>Hi</h1>" }
    ]);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(blob.type).toBe("application/zip");
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
