import { useEffect, useRef, useState } from "react";
import initSqlJs from "sql.js/dist/sql-wasm.js";
import { HAT_SEED } from "../../../../../../packages/courses/sql/seed.js";
import { playEduSound } from "../../../education/eduSound";
import "./sqlPlayground.css";

/**
 * Ô chạy SQL thật ngay trong trình duyệt (SQLite biên dịch sang WebAssembly, sql.js — MIT).
 * Mỗi ô một cơ sở dữ liệu riêng nạp từ HAT_SEED (+ `setup` của slide): không gọi máy chủ.
 * Tệp wasm tự phục vụ ở /edu/sql/ vì CSP chỉ cho script 'self'.
 *
 * Bài tập (slide có `solution`): chạy lời giải trên một bản dữ liệu SẠCH rồi so kết quả —
 * đúng bảng là đạt, không bắt chép đúng từng chữ. `ordered` = thứ tự dòng cũng phải khớp.
 * Gợi ý mở dần theo số lần sai. Bài đang viết dở được giữ trên máy (localStorage).
 * ponytail: chấm ở máy học viên chỉ để luyện tập — không cộng JOY, nên không cần chấm lại ở máy chủ.
 */
let engine;
const loadEngine = () => (engine ||= initSqlJs({ locateFile: () => "/edu/sql/sql-wasm.wasm" }));
const MAX_ROWS = 200;
const DRAFT = "edu.sql.";

const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* riêng tư */ } };

const freshDb = (SQL, setup) => {
  const db = new SQL.Database();
  db.exec(HAT_SEED + setup);
  return db;
};

// So hai kết quả: cùng số cột, cùng các dòng (bỏ qua tên cột — bí danh khác vẫn đúng).
function sameResult(got, want, ordered) {
  if (!got || !want) return got === want;
  if (got.columns.length !== want.columns.length || got.values.length !== want.values.length) return false;
  const rows = (r) => r.values.map((row) => JSON.stringify(row));
  const a = rows(got);
  const b = rows(want);
  if (!ordered) { a.sort(); b.sort(); }
  return a.every((row, i) => row === b[i]);
}

export default function SqlPlayground({ id = "", query = "", setup = "", solution, hints = [], ordered = false }) {
  const db = useRef(null);
  const SQL = useRef(null);
  const draftKey = id ? `${DRAFT}${id}` : null;
  const [text, setText] = useState(() => (draftKey && read(draftKey)) || query);
  const [out, setOut] = useState(null);
  const [ready, setReady] = useState(false);
  const [misses, setMisses] = useState(0);
  const [solved, setSolved] = useState(() => Boolean(draftKey && read(`${draftKey}.ok`)));

  useEffect(() => {
    let alive = true;
    loadEngine().then((engineModule) => {
      if (!alive) return;
      SQL.current = engineModule;
      db.current = freshDb(engineModule, setup);
      setReady(true);
    }).catch(() => alive && setOut({ error: "Không tải được SQLite. Kiểm tra mạng rồi mở lại slide." }));
    return () => { alive = false; db.current?.close(); };
  }, [setup]);

  const edit = (value) => {
    setText(value);
    if (draftKey) write(draftKey, value === query ? null : value);
  };

  const run = () => {
    let results;
    try {
      results = db.current.exec(text);
    } catch (error) {
      setOut({ error: error.message });
      if (solution) { setMisses((n) => n + 1); playEduSound("thud"); }
      return;
    }
    setOut({ results, changes: db.current.getRowsModified() });
    if (!solution) return;
    const clean = freshDb(SQL.current, setup);
    let want;
    try { want = clean.exec(solution).at(-1); } finally { clean.close(); }
    if (sameResult(results.at(-1), want, ordered)) {
      setSolved(true);
      if (draftKey) write(`${draftKey}.ok`, "1");
      playEduSound("success");
    } else {
      setMisses((n) => n + 1);
      playEduSound("thud");
    }
  };

  const reset = () => {
    edit(query);
    setOut(null);
    // Làm lại từ dữ liệu gốc: câu UPDATE/DELETE lúc trước không còn ảnh hưởng.
    if (SQL.current) { db.current?.close(); db.current = freshDb(SQL.current, setup); }
  };

  const last = out?.results?.at(-1);
  const shownHints = solution ? hints.slice(0, Math.min(hints.length, misses)) : [];
  const verdict = solution && out && (solved && !out.error ? "ok" : misses ? "miss" : null);
  return (
    <div className={`sql-play${solved ? " is-solved" : ""}`}>
      {solution && <p className="sql-play-task"><b>Bài tập</b>{solved ? " · đã đạt" : " · viết câu SQL rồi bấm Chạy để chấm"}</p>}
      <textarea value={text} spellCheck={false} autoCapitalize="off" autoCorrect="off"
        rows={Math.min(10, Math.max(3, text.split("\n").length + 1))}
        onChange={(event) => edit(event.target.value)}
        onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); run(); } }}
        aria-label="SQL" />
      <div className="sql-play-bar">
        <button type="button" className="edu-btn" disabled={!ready} onClick={run}>{solution ? "Chạy & chấm" : "Chạy"}</button>
        <button type="button" className="edu-btn edu-btn--ghost" onClick={reset}>Đặt lại</button>
        {solution && misses >= hints.length + 2 && !solved && (
          <button type="button" className="edu-btn edu-btn--ghost" onClick={() => edit(solution)}>Xem lời giải</button>
        )}
      </div>
      {verdict === "ok" && <p className="sql-play-verdict is-ok" role="status">Chính xác! Kết quả khớp với yêu cầu.</p>}
      {verdict === "miss" && !solved && <p className="sql-play-verdict is-miss" role="status">Chưa khớp — so lại số cột, số dòng{ordered ? " và thứ tự" : ""}.</p>}
      {shownHints.map((hint, i) => <p key={hint} className="sql-play-hint"><b>Gợi ý {i + 1}:</b> {hint}</p>)}
      {out?.error && <p className="sql-play-error" role="alert">{out.error}</p>}
      {last && (
        <div className="sql-play-table">
          <table>
            <thead><tr>{last.columns.map((c, i) => <th key={`${c}${i}`}>{c}</th>)}</tr></thead>
            <tbody>
              {last.values.slice(0, MAX_ROWS).map((row, r) => (
                <tr key={r}>{row.map((v, i) => <td key={i} className={v === null ? "is-null" : undefined}>{v === null ? "NULL" : String(v)}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <small>{last.values.length} dòng{last.values.length > MAX_ROWS ? ` (hiện ${MAX_ROWS})` : ""}</small>
        </div>
      )}
      {out && !out.error && !last && <small className="sql-play-ok">Đã chạy · {out.changes} dòng thay đổi · câu cuối không trả bảng</small>}
    </div>
  );
}
