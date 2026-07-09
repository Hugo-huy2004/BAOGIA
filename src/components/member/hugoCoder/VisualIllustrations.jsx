import React from "react";

export const renderMobileIllustration = (type) => {
  const nodeClass = "rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-black text-foreground shadow-sm";

  if (type === "htmlTree") {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border bg-white dark:bg-zinc-900 p-4">
        <div className="absolute left-9 top-14 bottom-8 w-px bg-primary/25" />
        <div className="space-y-2">
          <div className={`${nodeClass} w-max animate-[hugoCodeGlow_2.4s_ease-in-out_infinite]`}>&lt;article&gt;</div>
          <div className="ml-8 grid grid-cols-2 gap-2">
            {["img", "h2", "p", "button"].map((tag, index) => (
              <div key={tag} className={`${nodeClass} text-center animate-[hugoCodeFloat_2.8s_ease-in-out_infinite]`} style={{ animationDelay: `${index * 0.15}s` }}>
                &lt;{tag}&gt;
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "boxModel") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4">
        <div className="rounded-lg bg-amber-100 dark:bg-amber-500/15 p-4 text-center text-[10px] font-black text-amber-700 dark:text-amber-300 animate-[hugoCodeGlow_2.6s_ease-in-out_infinite]">
          margin
          <div className="mt-2 rounded-lg bg-sky-100 dark:bg-sky-500/15 p-4 text-sky-700 dark:text-sky-300">
            border
            <div className="mt-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 p-4 text-emerald-700 dark:text-emerald-300">
              padding
              <div className="mt-2 rounded-lg bg-white dark:bg-zinc-950 border border-border p-3 text-foreground">content</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "eventFlow") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center">
          {["Click", "Listener", "UI đổi"].map((label, index) => (
            <React.Fragment key={label}>
              <div className={`${nodeClass} animate-[hugoCodeFloat_2.4s_ease-in-out_infinite]`} style={{ animationDelay: `${index * 0.2}s` }}>{label}</div>
              {index < 2 && <div className="h-0.5 w-5 bg-primary animate-[hugoCodeSlide_1.4s_ease-in-out_infinite]" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (type === "apiFlow") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className={nodeClass}>Browser</div>
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 bg-primary animate-[hugoCodeSlide_1.2s_ease-in-out_infinite]" />
          </div>
          <div className={nodeClass}>API</div>
        </div>
        <div className="text-[11px] text-muted-foreground font-semibold">{"request -> JSON response -> render UI"}</div>
      </div>
    );
  }

  if (type === "sqlPipeline") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4">
        <div className="flex gap-2 overflow-hidden">
          {["FROM", "WHERE", "ORDER", "LIMIT"].map((step, index) => (
            <div key={step} className="min-w-16 flex-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-3 text-center text-[10px] font-black text-primary animate-[hugoCodeFloat_2.8s_ease-in-out_infinite]" style={{ animationDelay: `${index * 0.18}s` }}>
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "phpFlow") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-center">
          <div className="p-2 border border-border rounded bg-muted">Browser (Client)</div>
          <div className="text-primary animate-pulse">➔ req ➔</div>
          <div className="p-2 border border-primary/20 rounded bg-primary/10 text-primary">Server PHP</div>
          <div className="text-success animate-pulse">➔ HTML ➔</div>
          <div className="p-2 border border-border rounded bg-muted">Browser</div>
        </div>
        <p className="text-[9.5px] text-muted-foreground/80 leading-relaxed text-left">
          * PHP chỉ xử lý trên Server. Khi trình duyệt nhận được HTML, code PHP đã thực thi xong.
        </p>
      </div>
    );
  }

  if (type === "debugTree") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4 text-[10px] space-y-2 text-left">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center text-white text-[9px] font-black shrink-0">1</span>
          <span className="text-destructive font-black shrink-0">Phát hiện Lỗi:</span>
          <span className="text-zinc-500 font-medium">Báo E_WARNING / Crash</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-warning flex items-center justify-center text-zinc-950 text-[9px] font-black shrink-0">2</span>
          <span className="text-warning font-black shrink-0">Cô lập vùng lỗi:</span>
          <span className="text-zinc-500 font-medium">Dùng var_dump() / print_r()</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-success flex items-center justify-center text-white text-[9px] font-black shrink-0">3</span>
          <span className="text-success font-black shrink-0">Viết bản vá:</span>
          <span className="text-zinc-500 font-medium">Test lại điều kiện biên (&lt;)</span>
        </div>
      </div>
    );
  }

  if (type === "flexboxPreview") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-3 space-y-3">
        <div className="space-y-1 text-left">
          <p className="text-[10px] font-black text-primary uppercase">Trục ngang (flex-row)</p>
          <div className="flex gap-2 p-2 bg-muted/40 border border-border/60 rounded-lg">
            <div className="w-7 h-7 rounded bg-primary text-white flex items-center justify-center text-[10px] font-black">1</div>
            <div className="w-7 h-7 rounded bg-success text-white flex items-center justify-center text-[10px] font-black">2</div>
            <div className="w-7 h-7 rounded bg-warning text-zinc-950 flex items-center justify-center text-[10px] font-black">3</div>
          </div>
        </div>
        <div className="space-y-1 text-left">
          <p className="text-[10px] font-black text-primary uppercase">Trục dọc (flex-col)</p>
          <div className="flex flex-col gap-1.5 p-2 bg-muted/40 border border-border/60 rounded-lg w-max min-w-[70px]">
            <div className="w-7 h-7 rounded bg-primary text-white flex items-center justify-center text-[10px] font-black">1</div>
            <div className="w-7 h-7 rounded bg-success text-white flex items-center justify-center text-[10px] font-black">2</div>
            <div className="w-7 h-7 rounded bg-warning text-zinc-950 flex items-center justify-center text-[10px] font-black">3</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "fullstackArchitecture") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-3 space-y-2.5">
        <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-black">
          <div className="p-2 border border-border rounded bg-muted flex flex-col justify-between items-center">
            <span className="material-symbols-outlined text-[15px] text-muted-foreground">laptop_chromebook</span>
            <span>Frontend JS</span>
          </div>
          <div className="p-2 border border-primary/20 rounded bg-primary/10 text-primary flex flex-col justify-between items-center">
            <span className="material-symbols-outlined text-[15px] text-primary">dns</span>
            <span>Backend PHP</span>
          </div>
          <div className="p-2 border border-success/20 rounded bg-success/10 text-success flex flex-col justify-between items-center">
            <span className="material-symbols-outlined text-[15px] text-success">database</span>
            <span>Database SQL</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[8px] text-muted-foreground/80 font-bold px-1">
          <span>1. fetch('/api') ➔</span>
          <span>2. SELECT * ➔</span>
        </div>
      </div>
    );
  }

  if (type === "securityVault") {
    return (
      <div className="rounded-lg border border-border bg-white dark:bg-zinc-900 p-4 text-[10px] text-left space-y-2.5">
        <div className="p-2 border border-destructive/20 bg-destructive/5 rounded-lg flex items-start gap-2">
          <span className="material-symbols-outlined text-destructive text-sm mt-0.5">gpp_bad</span>
          <div>
            <strong className="text-destructive">Dữ liệu thô (Raw input):</strong>
            <p className="text-[9px] text-muted-foreground mt-0.5">Dễ bị SQL Injection & XSS nhúng mã độc.</p>
          </div>
        </div>
        <div className="p-2 border border-success/20 bg-success/5 rounded-lg flex items-start gap-2">
          <span className="material-symbols-outlined text-success text-sm mt-0.5">verified_user</span>
          <div>
            <strong className="text-success">Dữ liệu an toàn (Sanitized):</strong>
            <p className="text-[9px] text-muted-foreground mt-0.5">Lọc qua htmlspecialchars() & prepare().</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export const getMobileVisualSet = (type) => {
  const sets = {
    htmlTree: {
      title: "Bộ tranh HTML",
      panels: [
        { label: "Khung trang", title: "Article là hộp nội dung", caption: "Một vùng có ý nghĩa riêng, dễ đọc và dễ tái sử dụng.", tone: "sky" },
        { label: "Nội dung", title: "Heading dẫn mắt", caption: "Tên sản phẩm nên là tiêu đề để người đọc lướt nhanh.", tone: "emerald" },
        { label: "Hành động", title: "Button thật", caption: "Hành động bấm cần dùng button để truy cập tốt hơn.", tone: "violet" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "Hãy tưởng tượng HTML là bản phác thảo kiến trúc: tường, cửa, biển tên và lối đi phải rõ trước khi sơn màu." },
        { id: "diagram", label: "Sơ đồ", body: "Cây DOM đi từ article xuống img, h2, p, button. CSS và JS đều bám vào cây này để làm việc." },
        { id: "memory", label: "Ghi nhớ", body: "Đọc HTML từ ngoài vào trong: container -> nội dung -> hành động." }
      ]
    },
    boxModel: {
      title: "Bộ tranh CSS",
      panels: [
        { label: "Khoảng thở", title: "Padding", caption: "Đẩy nội dung xa viền để card dễ đọc.", tone: "amber" },
        { label: "Ranh giới", title: "Border", caption: "Tạo biên nhận diện giữa card và nền.", tone: "sky" },
        { label: "Nhịp bố cục", title: "Margin", caption: "Tạo khoảng cách giữa card và phần tử xung quanh.", tone: "rose" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "CSS giống người dàn trang: quyết định khoảng cách, độ nổi, điểm nhấn và cảm giác khi chạm." },
        { id: "diagram", label: "Sơ đồ", body: "Box Model là 4 lớp. Nếu card quá to, hãy hỏi: do content, padding, border hay margin?" },
        { id: "memory", label: "Ghi nhớ", body: "Layout trước, màu sắc sau. Khoảng cách nhất quán làm UI chuyên nghiệp hơn." }
      ]
    },
    eventFlow: {
      title: "Bộ tranh Javascript",
      panels: [
        { label: "Tín hiệu", title: "User click", caption: "Người dùng tạo event từ một hành động nhỏ.", tone: "emerald" },
        { label: "Bộ nghe", title: "Listener", caption: "Code chờ đúng sự kiện để chạy logic.", tone: "violet" },
        { label: "Phản hồi", title: "UI state", caption: "Giao diện đổi chữ, màu, số lượng hoặc trạng thái.", tone: "sky" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "Javascript là nhân viên trực quầy: nghe người dùng gọi, kiểm tra yêu cầu, rồi cập nhật màn hình." },
        { id: "diagram", label: "Sơ đồ", body: "Event đi vào listener, listener chạy function, function đổi DOM hoặc state." },
        { id: "memory", label: "Ghi nhớ", body: "Query đúng phần tử trước, kiểm tra null, rồi mới gắn event." }
      ]
    },
    apiFlow: {
      title: "Bộ tranh API",
      panels: [
        { label: "Hỏi", title: "Request", caption: "Frontend gửi URL, method và thông tin cần thiết.", tone: "sky" },
        { label: "Xử lý", title: "Server", caption: "Backend kiểm tra, đọc dữ liệu và tạo response.", tone: "amber" },
        { label: "Hiển thị", title: "Render", caption: "JSON được chuyển thành nội dung người dùng thấy.", tone: "emerald" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "API giống quầy thư viện: bạn đưa mã sách, thủ thư tìm dữ liệu, rồi trả đúng thông tin." },
        { id: "diagram", label: "Sơ đồ", body: "Loading -> request -> parse JSON -> success hoặc error. Đó là khung UI tối thiểu." },
        { id: "memory", label: "Ghi nhớ", body: "Luôn thiết kế trạng thái lỗi; mạng không bao giờ chắc chắn 100%." }
      ]
    },
    sqlPipeline: {
      title: "Bộ tranh SQL",
      panels: [
        { label: "Nguồn", title: "FROM", caption: "Chọn bảng dữ liệu cần đọc.", tone: "violet" },
        { label: "Lọc", title: "WHERE", caption: "Giảm dữ liệu về đúng điều kiện.", tone: "rose" },
        { label: "Gọn", title: "LIMIT", caption: "Trả vừa đủ để giao diện chạy nhanh.", tone: "emerald" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "SQL giống đặt câu hỏi với kho hàng: lấy từ kệ nào, lọc món nào, xếp ra sao, lấy bao nhiêu." },
        { id: "diagram", label: "Sơ đồ", body: "FROM tạo nguồn, WHERE lọc dòng, ORDER BY sắp xếp, LIMIT chốt số lượng." },
        { id: "memory", label: "Ghi nhớ", body: "Đừng update/delete nếu chưa có WHERE rõ ràng." }
      ]
    }
  };

  return sets[type] || sets.htmlTree;
};

export const renderVisualArtwork = (panel, index) => {
  const toneMap = {
    sky: "from-sky-50 via-card to-white dark:from-sky-500/15 dark:via-zinc-950 dark:to-zinc-900 border-sky-200 dark:border-sky-500/25 text-sky-700 dark:text-sky-300",
    emerald: "from-emerald-50 via-card to-white dark:from-emerald-500/15 dark:via-zinc-950 dark:to-zinc-900 border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300",
    violet: "from-violet-50 via-card to-white dark:from-violet-500/15 dark:via-zinc-950 dark:to-zinc-900 border-violet-200 dark:border-violet-500/25 text-violet-700 dark:text-violet-300",
    amber: "from-amber-50 via-card to-white dark:from-amber-500/15 dark:via-zinc-950 dark:to-zinc-900 border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-300",
    rose: "from-rose-50 via-card to-white dark:from-rose-500/15 dark:via-zinc-950 dark:to-zinc-900 border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300"
  };
  const tone = toneMap[panel.tone] || toneMap.sky;
  const artKey = `${panel.label} ${panel.title}`.toLowerCase();
  const labelClass = "rounded-md border border-current/20 bg-white/85 dark:bg-zinc-950/75 px-2 py-1 text-[8px] font-black uppercase shadow-sm backdrop-blur";
  const surfaceClass = "bg-white/85 dark:bg-zinc-950/70 border border-current/20 shadow-sm";
  const softSurfaceClass = "bg-white/60 dark:bg-white/10 border border-current/15";

  const renderArt = () => {
    if (artKey.includes("article") || artKey.includes("khung")) {
      return (
        <>
          <div className={`absolute inset-x-5 top-5 h-28 rounded-xl ${surfaceClass} animate-[hugoCodeGlow_2.4s_ease-in-out_infinite]`} />
          <div className="absolute left-9 top-9 right-9 h-5 rounded-md bg-current/15" />
          <div className={`absolute left-9 top-20 w-24 h-8 rounded-lg ${softSurfaceClass}`} />
          <div className={`absolute right-9 top-[68px] w-14 h-14 rounded-lg ${softSurfaceClass}`} />
          <div className="absolute left-9 right-9 bottom-7 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => <span key={item} className="h-2 rounded-full bg-current/25" />)}
          </div>
          <span className={`absolute left-7 top-6 ${labelClass}`}>article</span>
          <span className={`absolute right-7 bottom-5 ${labelClass}`}>container</span>
        </>
      );
    }

    if (artKey.includes("heading") || artKey.includes("nội dung")) {
      return (
        <>
          <div className={`absolute left-5 right-5 top-5 h-10 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-9 top-9 w-24 h-4 rounded bg-current/35 animate-[hugoCodePulse_2s_ease-in-out_infinite]" />
          <div className={`absolute left-5 right-5 top-20 h-20 rounded-xl ${softSurfaceClass}`} />
          <div className="absolute left-9 top-26 right-14 h-3 rounded bg-current/20" />
          <div className="absolute left-9 top-34 right-9 h-3 rounded bg-current/15" />
          <div className="absolute left-9 bottom-5 flex gap-2">
            <span className="w-12 h-3 rounded-full bg-current/20" />
            <span className="w-16 h-3 rounded-full bg-current/15" />
          </div>
          <span className={`absolute right-7 top-7 ${labelClass}`}>h2</span>
          <span className={`absolute left-7 bottom-5 ${labelClass}`}>paragraph</span>
        </>
      );
    }

    if (artKey.includes("button") || artKey.includes("hành động")) {
      return (
        <>
          <div className="absolute left-1/2 top-6 w-24 h-24 -translate-x-1/2 rounded-full border-[10px] border-current/15 animate-[hugoCodePulse_2.2s_ease-in-out_infinite]" />
          <div className="absolute left-1/2 top-14 w-10 h-10 -translate-x-1/2 rounded-full bg-current/25" />
          <div className="absolute left-9 right-9 bottom-7 h-[52px] rounded-xl bg-current text-white dark:text-zinc-950 flex items-center justify-center text-xs font-black shadow-lg animate-[hugoCodeFloat_2.4s_ease-in-out_infinite]">
            BUTTON
          </div>
          <div className="absolute left-14 right-14 bottom-5 h-px bg-current/35" />
          <span className={`absolute left-7 top-7 ${labelClass}`}>tap event</span>
          <span className={`absolute right-7 bottom-5 ${labelClass}`}>action</span>
        </>
      );
    }

    if (artKey.includes("padding")) {
      return (
        <>
          <div className="absolute inset-5 rounded-xl bg-current/10 border-2 border-dashed border-current/35 p-6">
            <div className={`w-full h-full rounded-lg ${surfaceClass}`} />
          </div>
          <div className="absolute left-9 right-9 top-9 h-2 rounded bg-current/40 animate-[hugoCodePulse_2s_ease-in-out_infinite]" />
          <div className="absolute left-9 right-9 bottom-9 h-2 rounded bg-current/25" />
          <span className={`absolute left-7 top-6 ${labelClass}`}>padding 20px</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>content</span>
        </>
      );
    }

    if (artKey.includes("border")) {
      return (
        <>
          <div className={`absolute inset-7 rounded-xl border-4 border-current/70 bg-white/50 dark:bg-white/10 animate-[hugoCodeGlow_2.3s_ease-in-out_infinite]`} />
          <div className="absolute left-12 right-12 top-15 h-5 rounded bg-current/20" />
          <div className="absolute left-12 right-20 top-24 h-3 rounded bg-current/15" />
          <div className="absolute inset-x-12 bottom-8 h-8 rounded-lg bg-current/10 border border-current/20" />
          <span className={`absolute right-7 top-7 ${labelClass}`}>1px solid</span>
          <span className={`absolute left-7 bottom-6 ${labelClass}`}>edge</span>
        </>
      );
    }

    if (artKey.includes("margin")) {
      return (
        <>
          <div className="absolute inset-3 rounded-xl border border-dashed border-current/45 bg-current/5" />
          <div className={`absolute inset-10 rounded-lg ${surfaceClass} animate-[hugoCodeFloat_2.8s_ease-in-out_infinite]`} />
          <div className="absolute left-4 top-1/2 w-7 h-1 rounded bg-current/45" />
          <div className="absolute right-4 top-1/2 w-7 h-1 rounded bg-current/45" />
          <div className="absolute left-1/2 top-4 h-7 w-1 -translate-x-1/2 rounded bg-current/35" />
          <span className={`absolute left-7 top-6 ${labelClass}`}>outside</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>margin</span>
        </>
      );
    }

    if (artKey.includes("click") || artKey.includes("tín hiệu")) {
      return (
        <>
          <div className="absolute left-8 top-8 w-24 h-24 rounded-full bg-current/10 border border-current/25 animate-[hugoCodePulse_1.6s_ease-in-out_infinite]" />
          <div className={`absolute left-16 top-[68px] w-16 h-[52px] rounded-lg ${surfaceClass} rotate-12`} />
          <div className="absolute left-[88px] top-[88px] w-5 h-5 rounded-full bg-current/45" />
          <div className="absolute right-7 top-12 w-16 h-px bg-current/35" />
          <div className="absolute right-8 bottom-8 h-3 w-24 rounded bg-current/25" />
          <span className={`absolute left-7 top-6 ${labelClass}`}>click</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>signal</span>
        </>
      );
    }

    if (artKey.includes("listener") || artKey.includes("bộ nghe")) {
      return (
        <>
          <div className="absolute left-6 top-6 bottom-6 w-[72px] rounded-xl bg-zinc-950 text-emerald-300 p-3 text-[9px] font-mono leading-4 shadow-lg">btn<br/>.<br/>addEvent</div>
          <div className={`absolute right-6 top-7 bottom-7 w-24 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-[120px] right-11 top-12 h-2 rounded bg-current/25 animate-[hugoCodeSlide_1.5s_ease-in-out_infinite]" />
          <div className="absolute left-[120px] right-14 top-[88px] h-2 rounded bg-current/20" />
          <div className="absolute left-[120px] right-[72px] top-32 h-2 rounded bg-current/15" />
          <span className={`absolute left-7 bottom-6 ${labelClass}`}>listener</span>
          <span className={`absolute right-8 top-9 ${labelClass}`}>handler</span>
        </>
      );
    }

    if (artKey.includes("state") || artKey.includes("phản hồi")) {
      return (
        <>
          <div className={`absolute left-6 right-6 top-5 h-24 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-10 top-10 w-12 h-12 rounded-lg bg-current/15" />
          <div className="absolute left-28 right-10 top-12 h-4 rounded bg-current/30 animate-[hugoCodePulse_1.8s_ease-in-out_infinite]" />
          <div className="absolute left-28 right-20 top-[88px] h-3 rounded bg-current/20" />
          <div className="absolute right-10 bottom-5 w-12 h-8 rounded-lg bg-current/30" />
          <span className={`absolute left-7 bottom-6 ${labelClass}`}>state changed</span>
        </>
      );
    }

    if (artKey.includes("request") || artKey.includes("hỏi")) {
      return (
        <>
          <div className={`absolute left-5 top-14 w-[88px] h-[60px] rounded-lg ${surfaceClass}`} />
          <div className="absolute left-8 top-[76px] right-[192px] h-2 rounded bg-current/25" />
          <div className="absolute left-[116px] right-14 top-20 h-2 rounded bg-current/35 animate-[hugoCodeSlide_1.3s_ease-in-out_infinite]" />
          <div className="absolute right-5 top-14 w-16 h-[60px] rounded-lg bg-current/15 border border-current/25" />
          <span className={`absolute left-7 top-7 ${labelClass}`}>GET /users</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>endpoint</span>
        </>
      );
    }

    if (artKey.includes("server") || artKey.includes("xử lý")) {
      return (
        <>
          <div className="absolute left-1/2 top-5 w-[104px] h-[120px] -translate-x-1/2 rounded-xl bg-zinc-950 text-current p-3 space-y-2 shadow-xl">
            {[0, 1, 2].map((row) => <div key={row} className="h-3 rounded bg-current/50 animate-[hugoCodePulse_2s_ease-in-out_infinite]" style={{ animationDelay: `${row * 0.2}s` }} />)}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <span className="h-5 rounded bg-current/25" />
              <span className="h-5 rounded bg-current/15" />
            </div>
          </div>
          <div className="absolute left-8 top-12 w-8 h-8 rounded-full bg-current/15" />
          <div className="absolute right-8 bottom-8 w-8 h-8 rounded-full bg-current/15" />
          <span className={`absolute left-7 bottom-6 ${labelClass}`}>validate</span>
          <span className={`absolute right-7 top-7 ${labelClass}`}>logic</span>
        </>
      );
    }

    if (artKey.includes("render") || artKey.includes("hiển thị")) {
      return (
        <>
          <div className={`absolute inset-x-6 top-5 h-28 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-10 top-10 w-10 h-10 rounded-lg bg-current/20" />
          <div className="absolute left-[104px] right-10 top-12 h-3 rounded bg-current/25" />
          <div className="absolute left-[104px] right-20 top-20 h-3 rounded bg-current/15" />
          <div className="absolute left-10 right-10 bottom-7 h-7 rounded-lg bg-current/15 border border-current/20" />
          <span className={`absolute right-7 top-7 ${labelClass}`}>{"JSON -> UI"}</span>
        </>
      );
    }

    if (artKey.includes("from") || artKey.includes("nguồn")) {
      return (
        <>
          <div className={`absolute inset-x-8 top-6 bottom-6 rounded-xl ${surfaceClass} overflow-hidden`}>
            {[0, 1, 2, 3].map((row) => <div key={row} className="h-7 border-b border-current/15 flex gap-2 px-3 items-center"><span className="w-8 h-2 rounded bg-current/25" /><span className="flex-1 h-2 rounded bg-current/15" /></div>)}
          </div>
          <span className={`absolute left-7 top-7 ${labelClass}`}>products table</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>rows</span>
        </>
      );
    }

    if (artKey.includes("where") || artKey.includes("lọc")) {
      return (
        <>
          <div className={`absolute left-7 right-7 top-6 h-28 rounded-xl ${surfaceClass}`} />
          <div className="absolute left-12 right-12 top-12 h-4 rounded bg-current/15" />
          <div className="absolute left-12 right-20 top-20 h-4 rounded bg-current/40 animate-[hugoCodePulse_1.7s_ease-in-out_infinite]" />
          <div className="absolute left-12 right-28 top-28 h-4 rounded bg-current/15" />
          <div className="absolute right-11 top-[76px] w-7 h-7 rounded-full border-2 border-current/55" />
          <span className={`absolute left-7 top-7 ${labelClass}`}>price &gt; 1000</span>
          <span className={`absolute right-7 bottom-6 ${labelClass}`}>filter</span>
        </>
      );
    }

    if (artKey.includes("limit") || artKey.includes("gọn")) {
      return (
        <>
          {[0, 1, 2].map((row) => (
            <div key={row} className={`absolute left-8 right-8 h-8 rounded-lg ${surfaceClass} animate-[hugoCodeFloat_2.6s_ease-in-out_infinite]`} style={{ top: `${24 + row * 36}px`, animationDelay: `${row * 0.15}s` }}>
              <span className="absolute left-3 top-3 w-10 h-2 rounded bg-current/25" />
              <span className="absolute left-18 right-3 top-3 h-2 rounded bg-current/15" />
            </div>
          ))}
          <div className="absolute right-8 bottom-5 rounded-md bg-current/25 px-3 py-1 text-[10px] font-black">LIMIT 3</div>
          <span className={`absolute left-7 top-7 ${labelClass}`}>output</span>
        </>
      );
    }

    return (
      <>
        <div className="absolute inset-x-4 top-4 h-7 rounded-md bg-white/80 dark:bg-white/10 border border-white/70 dark:border-white/10 animate-[hugoCodePulse_2s_ease-in-out_infinite]" />
        <div className="absolute left-4 right-16 top-16 h-12 rounded-lg bg-white/70 dark:bg-white/10 border border-white/70 dark:border-white/10" />
        <div className="absolute right-4 top-16 w-10 h-12 rounded-lg bg-current opacity-20 animate-[hugoCodeFloat_2.4s_ease-in-out_infinite]" />
      </>
    );
  };

  return (
    <div key={`${panel.label}-${panel.title}`} className={`shrink-0 w-[74vw] max-w-[300px] overflow-hidden rounded-lg border bg-gradient-to-br ${tone}`}>
      <div
        className="h-44 p-4 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          backgroundPosition: "-1px -1px",
          opacity: 1
        }}
      >
        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/80" />
        <div className="absolute left-4 top-4 text-[9px] font-black uppercase opacity-50">{String(index + 1).padStart(2, "0")}</div>
        {renderArt()}
      </div>
      <div className="border-t border-current/15 bg-white/75 dark:bg-zinc-950/40 p-3">
        <span className="text-[10px] font-black uppercase opacity-80">{panel.label}</span>
        <h4 className="text-sm font-black text-foreground mt-0.5">{panel.title}</h4>
        <p className="text-xs leading-5 text-muted-foreground mt-1">{panel.caption}</p>
      </div>
    </div>
  );
};

export const renderStudyModePanel = (visualSet, activeMode) => {
  const mode = visualSet.modes.find(item => item.id === activeMode) || visualSet.modes[0];
  const modeIndex = visualSet.modes.findIndex(item => item.id === mode.id);

  const renderArtwork = (modeId) => {
    if (modeId === "story") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-zinc-950">
          <div className="relative w-16 h-14 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded shadow-lg animate-[hugoCodeFloat_3s_ease-in-out_infinite]">
            <div className="absolute left-3 top-3 w-8 h-1.5 rounded-full bg-indigo-500/50" />
            <div className="absolute left-3 top-6 w-10 h-1.5 rounded-full bg-indigo-500/30" />
            <div className="absolute left-3 top-9 w-6 h-1.5 rounded-full bg-indigo-500/30" />
            
            {/* Book spine */}
            <div className="absolute -left-1.5 top-0 bottom-0 w-3 bg-indigo-500 rounded-l" />
            
            {/* Floating particles */}
            <div className="absolute -right-4 -top-3 w-3 h-3 rounded-full bg-amber-400/80 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute -left-2 -bottom-2 w-2 h-2 rounded-full bg-sky-400/80 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>
        </div>
      );
    }
    if (modeId === "diagram") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-950">
          <div className="relative w-32 h-20">
            {/* Top Node */}
            <div className="absolute left-1/2 top-1 -translate-x-1/2 w-12 h-5 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center animate-[hugoCodeGlow_2s_ease-in-out_infinite]">
              <div className="w-5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            
            {/* Lines */}
            <div className="absolute left-1/2 top-6 w-px h-4 bg-emerald-500/50" />
            <div className="absolute left-[30%] top-[26px] w-[40%] h-px bg-emerald-500/50" />
            <div className="absolute left-[30%] top-[26px] w-px h-4 bg-emerald-500/50" />
            <div className="absolute right-[30%] top-[26px] w-px h-4 bg-emerald-500/50" />
            
            {/* Bottom Nodes */}
            <div className="absolute left-[10%] top-11 w-12 h-5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center animate-[hugoCodeFloat_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}>
              <div className="w-5 h-1.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="absolute right-[10%] top-11 w-12 h-5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center animate-[hugoCodeFloat_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}>
              <div className="w-5 h-1.5 rounded-full bg-emerald-400/70" />
            </div>
          </div>
        </div>
      );
    }
    if (modeId === "memory") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-zinc-950">
          <div className="relative w-24 h-16" style={{ perspective: '1000px' }}>
            {/* Back card */}
            <div className="absolute inset-0 rotate-6 translate-x-2 translate-y-1 bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-800 rounded-lg shadow-sm" />
            {/* Front card */}
            <div className="absolute inset-0 bg-white dark:bg-zinc-900 border-2 border-rose-400 dark:border-rose-600 rounded-lg shadow-lg flex flex-col items-center justify-center animate-[hugoCodePulse_2.5s_ease-in-out_infinite]">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mb-1.5 border border-rose-200 dark:border-rose-800">
                <span className="material-symbols-outlined text-rose-500 text-[14px]">psychology</span>
              </div>
              <div className="w-12 h-1.5 rounded-full bg-rose-500/40" />
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback skeleton
    return (
      <>
        <div className="absolute left-3 top-3 bottom-3 w-12 rounded-md bg-primary/10 border border-primary/20 animate-[hugoCodeFloat_2.8s_ease-in-out_infinite]" />
        <div className="absolute left-20 right-3 top-4 h-3 rounded bg-muted" />
        <div className="absolute left-20 right-8 top-9 h-3 rounded bg-muted" />
        <div className="absolute left-20 right-16 top-14 h-3 rounded bg-muted" />
        <div className="absolute bottom-3 left-20 h-6 w-24 rounded-md bg-primary/15 border border-primary/20 animate-[hugoCodePulse_2s_ease-in-out_infinite]" style={{ animationDelay: `${modeIndex * 0.15}s` }} />
      </>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4 overflow-hidden">
      <div className="h-28 rounded-lg border border-border bg-white dark:bg-zinc-950 relative overflow-hidden">
        {renderArtwork(mode.id)}
      </div>
      <h4 className="mt-4 text-sm font-black text-foreground flex items-center gap-2 font-sans">
        {mode.id === "story" && <span className="material-symbols-outlined text-indigo-500 text-[18px]">menu_book</span>}
        {mode.id === "diagram" && <span className="material-symbols-outlined text-emerald-500 text-[18px]">account_tree</span>}
        {mode.id === "memory" && <span className="material-symbols-outlined text-rose-500 text-[18px]">psychology</span>}
        {mode.label}
      </h4>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground font-sans">{mode.body}</p>
    </div>
  );
};
