import { useState } from "react";

// Mục gập lại, chỉ gọi máy chủ khi người dùng thực sự MỞ nó ra — và chỉ đúng
// một lượt. Đây là cách chế độ này cho vào thêm nhiều tính năng mà số lượt gọi
// khi mở app vẫn giữ nguyên: không mở thì không tốn gì.
export default function EcoFold({ title, hint, icon, load, children }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ data: null, loading: false, error: "" });

  const run = () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    Promise.resolve()
      .then(load)
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((error) => setState({ data: null, loading: false, error: error.message || "Không tải được." }));
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !state.data && !state.loading) run();
  };

  return (
    <div className="save-e-fold">
      <button type="button" className="save-e-foldhead" aria-expanded={open} onClick={toggle}>
        <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
        <span className="save-e-foldtext">
          <strong>{title}</strong>
          {hint ? <small>{hint}</small> : null}
        </span>
        <span className="material-symbols-outlined" aria-hidden="true">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open ? (
        <div className="save-e-foldbody">
          {state.loading ? <p className="save-e-note">Đang tải…</p> : null}
          {state.error ? (
            <p className="save-e-note">
              {state.error}{" "}
              <button type="button" className="save-e-link" onClick={run}>Thử lại</button>
            </p>
          ) : null}
          {children({ ...state, reload: run, setData: (data) => setState({ data, loading: false, error: "" }) })}
        </div>
      ) : null}
    </div>
  );
}
