export const MIN_LESSON_STUDY_MS = 0;

export const CODER_STORAGE_KEYS = {
  workspace: "student_ide_workspace",
  folders: "student_ide_folders",
  progress: "student_ide_progress",
  analytics: "student_ide_lesson_events"
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeBytes(view, offset, bytes) {
  for (let i = 0; i < bytes.length; i += 1) {
    view.setUint8(offset + i, bytes[i]);
  }
}

function normalizeZipPath(path) {
  return String(path || "file.txt").replace(/^\/+/, "").replace(/\\/g, "/");
}

export function makeSerializableWorkspace(files) {
  return files.map((file) => {
    const serializable = { ...file };
    delete serializable.handle;
    return serializable;
  });
}

function dirname(path) {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? "" : path.slice(0, idx);
}

function resolveRelativePath(basePath, href) {
  if (!href || /^(https?:|data:|blob:|#|\/)/i.test(href)) return null;
  const parts = `${dirname(basePath)}/${href}`.split("/");
  const out = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

function escapeScriptContent(content) {
  return String(content || "").replace(/<\/script/gi, "<\\/script");
}

export function buildPreviewHtml(activeFile, workspaceFiles) {
  if (!activeFile?.content) return "";

  let html = activeFile.content;
  const findFile = (path) => workspaceFiles.find(file => file.path === path);

  html = html.replace(
    /<link\b([^>]*?)href=(["'])([^"']+)\2([^>]*?)>/gi,
    (match, before, quote, href, after) => {
      if (!/\brel=(["'])stylesheet\1/i.test(`${before} ${after}`)) return match;
      const resolvedPath = resolveRelativePath(activeFile.path, href);
      const cssFile = resolvedPath ? findFile(resolvedPath) : null;
      if (!cssFile) return match;
      return `<style data-hugo-preview="${href}">\n${cssFile.content || ""}\n</style>`;
    }
  );

  html = html.replace(
    /<script\b([^>]*?)src=(["'])([^"']+)\2([^>]*)>\s*<\/script>/gi,
    (match, before, quote, src) => {
      const resolvedPath = resolveRelativePath(activeFile.path, src);
      const jsFile = resolvedPath ? findFile(resolvedPath) : null;
      if (!jsFile) return match;
      return `<script data-hugo-preview="${src}">\n${escapeScriptContent(jsFile.content)}\n</script>`;
    }
  );

  return html;
}

export function getLessonStudyMs(courseId) {
  const startedAt = Number(localStorage.getItem(`student_ide_start_${courseId}`));
  return startedAt ? Math.max(0, Date.now() - startedAt) : 0;
}

export function buildLessonEvidence(course, extras = {}) {
  return {
    lessonId: course.id,
    practiceType: course.practiceType || "code",
    score: Number.isFinite(extras.score) ? extras.score : undefined,
    timeSpentMs: getLessonStudyMs(course.id),
    completedAt: new Date().toISOString(),
    channel: extras.channel || "desktop"
  };
}

export function recordCoderLessonEvent(event) {
  try {
    const current = JSON.parse(localStorage.getItem(CODER_STORAGE_KEYS.analytics) || "[]");
    const next = [
      ...current.slice(-79),
      { ...event, at: new Date().toISOString() }
    ];
    localStorage.setItem(CODER_STORAGE_KEYS.analytics, JSON.stringify(next));
  } catch {
    // Analytics is best-effort local telemetry only.
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function scoreScreenshotSubmission(file) {
  if (!file || !file.type?.startsWith("image/")) return 0;
  const sizeScore = Math.min(28, Math.floor(file.size / 25000));
  const nameScore = /screen|shot|screenshot|web|site|profile|shop|page|anh|chup/i.test(file.name) ? 7 : 0;
  const typeScore = file.type === "image/png" || file.type === "image/jpeg" ? 8 : 4;
  return Math.max(60, Math.min(92, 52 + sizeScore + nameScore + typeScore));
}

export async function createWorkspaceZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const filename = normalizeZipPath(file.path || file.name);
    const nameBytes = encoder.encode(filename);
    const data = encoder.encode(file.content || "");
    const checksum = crc32(data);

    const local = new ArrayBuffer(30 + nameBytes.length);
    const localView = new DataView(local);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    writeBytes(localView, 30, nameBytes);

    localParts.push(local, data);

    const central = new ArrayBuffer(46 + nameBytes.length);
    const centralView = new DataView(central);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    writeBytes(centralView, 46, nameBytes);
    centralParts.push(central);

    offset += local.byteLength + data.byteLength;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
  const end = new ArrayBuffer(22);
  const endView = new DataView(end);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}
