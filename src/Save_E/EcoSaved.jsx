import { useState } from "react";
import { listSaved, removeSaved, recordSavedRead } from "./ecoStore";

// Kho "Đọc lại": bài đã tải một lần thì dùng lại, không tải lần hai.
// Toàn bộ trang này chạy 0 lượt gọi mạng — kể cả khi máy đang offline.

const dateLabel = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("vi", { day: "numeric", month: "numeric" }).format(new Date(value));
  } catch { return ""; }
};

export default function EcoSaved() {
  const [items, setItems] = useState(listSaved);
  const [openId, setOpenId] = useState(null);
  const open = items.find((item) => item.id === openId);

  const drop = (id) => {
    removeSaved(id);
    setItems(listSaved());
    if (openId === id) setOpenId(null);
  };

  const read = (item) => {
    setOpenId(item.id);
    recordSavedRead(JSON.stringify(item).length);
    window.scrollTo({ top: 0 });
  };

  if (open) {
    return (
      <article className="save-e-reader">
        <button type="button" className="save-e-chip" onClick={() => setOpenId(null)}>
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          Kho đọc lại
        </button>
        <p className="save-e-note">{open.source} · {dateLabel(open.publishedAt)} · đọc từ máy, 0 byte qua mạng</p>
        <h1>{open.title}</h1>
        {open.points?.length ? (
          <ul className="save-e-points">
            {open.points.map((point, index) => <li key={index}>{point}</li>)}
          </ul>
        ) : null}
        {open.paragraphs?.length
          ? open.paragraphs.map((text, index) => <p key={index}>{text}</p>)
          : <p className="save-e-note">Bài này lưu lúc chưa tải được toàn văn — chỉ còn phần tóm tắt.</p>}
        <a className="save-e-chip" href={open.url} target="_blank" rel="noopener noreferrer external">
          <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
          Mở bài gốc (cần mạng)
        </a>
      </article>
    );
  }

  return (
    <section className="save-e-section" aria-labelledby="eco-saved">
      <h2 id="eco-saved">Đọc lại · {items.length} bài</h2>
      {items.length === 0 ? (
        <div className="save-e-card save-e-empty">
          <span className="material-symbols-outlined" aria-hidden="true">recycling</span>
          <p>Chưa giữ bài nào.</p>
          <small>
            Mở một bài ở tab Bản tin rồi bấm “Giữ lại để đọc offline”. Bài đã giữ đọc được cả khi
            mất mạng và không tốn thêm lượt gọi máy chủ nào.
          </small>
        </div>
      ) : (
        <div className="save-e-card">
          {items.map((item) => (
            <div className="save-e-row" key={item.id}>
              <button type="button" className="save-e-rowmain" onClick={() => read(item)}>
                <strong>{item.title}</strong>
                <small>
                  {item.source} · {dateLabel(item.publishedAt)} ·
                  {item.paragraphs?.length ? ` ${item.paragraphs.length} đoạn` : " tóm tắt"}
                </small>
              </button>
              <button
                type="button"
                className="save-e-btn save-e-btn--plain"
                onClick={() => drop(item.id)}
                aria-label={`Bỏ bài ${item.title}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="save-e-note">
        Kho giữ tối đa 30 bài gần nhất và chỉ giữ phần chữ — ảnh bị bỏ vì chúng nặng gấp hàng chục
        lần phần nội dung.
      </p>
    </section>
  );
}
