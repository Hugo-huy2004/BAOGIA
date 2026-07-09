import React from "react";

export const renderMobileIllustration = (type, courseId = "") => {
  const nodeClass = "rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-black text-foreground shadow-sm";
  const num = parseInt(courseId?.replace("lesson", ""), 10) || 0;

  // 1. Lesson 51: CIA Triad
  if (num === 51) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-3 font-sans text-left">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-500/5 text-center space-y-1">
            <span className="text-[14px] text-rose-500 font-black">C</span>
            <div className="text-[9px] font-black text-rose-600 dark:text-rose-400">Bảo mật</div>
            <div className="text-[8px] text-muted-foreground leading-tight">Chỉ người dùng có quyền mới được xem dữ liệu</div>
          </div>
          <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-500/5 text-center space-y-1">
            <span className="text-[14px] text-amber-500 font-black">I</span>
            <div className="text-[9px] font-black text-amber-600 dark:text-amber-400">Toàn vẹn</div>
            <div className="text-[8px] text-muted-foreground leading-tight">Dữ liệu không bị sửa đổi trái phép</div>
          </div>
          <div className="p-2.5 rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-500/5 text-center space-y-1">
            <span className="text-[14px] text-sky-500 font-black">A</span>
            <div className="text-[9px] font-black text-sky-600 dark:text-sky-400">Sẵn sàng</div>
            <div className="text-[8px] text-muted-foreground leading-tight">Hệ thống luôn hoạt động khi cần</div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Lesson 52: HTTPS Encryption
  if (num === 52) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-3 font-sans">
        <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-center">
          <div className="p-1.5 border border-border rounded bg-white dark:bg-zinc-900 w-16">
            Browser
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[8px] text-emerald-500 font-black uppercase">🔒 HTTPS (Mã hóa SSL)</span>
            <div className="w-full h-1 bg-emerald-500/30 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 w-1/3 bg-emerald-500 rounded-full animate-[hugoCodeSlide_1.5s_linear_infinite]" />
            </div>
            <span className="text-[8px] text-muted-foreground">Khóa bảo mật AES-256</span>
          </div>
          <div className="p-1.5 border border-primary/20 rounded bg-primary/10 text-primary w-16">
            Server
          </div>
        </div>
      </div>
    );
  }

  // 3. Lesson 53: File Naming rules
  if (num === 53) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-2.5 font-sans text-left">
        <div className="p-2 border border-destructive/20 bg-destructive/5 rounded-lg flex items-center justify-between text-xs">
          <span className="text-destructive font-mono font-bold">❌ Main Page v2.js</span>
          <span className="text-[10px] text-muted-foreground">Lỗi khoảng trắng & chữ hoa</span>
        </div>
        <div className="p-2 border border-success/20 bg-success/5 rounded-lg flex items-center justify-between text-xs">
          <span className="text-success font-mono font-bold">✅ main-page-v2.js</span>
          <span className="text-[10px] text-muted-foreground">Kebab-case chuẩn Linux</span>
        </div>
      </div>
    );
  }

  // 4. Lesson 54: camelCase vs snake_case naming style
  if (num === 54) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-3 font-sans text-left">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-500/5">
            <span className="text-[9px] font-black text-sky-500 uppercase block mb-1">camelCase</span>
            <code className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-300">userEmailAddress</code>
            <p className="text-[8px] text-muted-foreground mt-1">Dùng cho Biến/Hàm JS</p>
          </div>
          <div className="p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-500/5">
            <span className="text-[9px] font-black text-emerald-500 uppercase block mb-1">snake_case</span>
            <code className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">user_email_address</code>
            <p className="text-[8px] text-muted-foreground mt-1">Dùng trong Database SQL</p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Lesson 55: Comment rules
  if (num === 55) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-2.5 font-sans text-left text-[11px]">
        <div className="p-2 border border-destructive/20 bg-destructive/5 rounded-lg">
          <code className="text-destructive font-mono block">// Gán i bằng 0</code>
          <p className="text-[9px] text-muted-foreground mt-0.5">❌ Bad: Giải thích code làm cái gì (dư thừa).</p>
        </div>
        <div className="p-2 border border-success/20 bg-success/5 rounded-lg">
          <code className="text-success font-mono block">// Bù lệch múi giờ UTC+7 khi lưu DB</code>
          <p className="text-[9px] text-muted-foreground mt-0.5">✅ Good: Giải thích tại sao cần viết đoạn code này.</p>
        </div>
      </div>
    );
  }

  // 6. Lesson 56: SQL Injection Protection
  if (num === 56) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-2.5 font-sans text-left text-[11px]">
        <div className="p-2 border border-destructive/20 bg-destructive/5 rounded-lg">
          <code className="text-destructive font-mono block">"SELECT * FROM users WHERE id = " + input</code>
          <p className="text-[9px] text-muted-foreground mt-0.5">❌ Nguy hiểm: Hacker nhập mã độc làm thay đổi câu truy vấn SQL.</p>
        </div>
        <div className="p-2 border border-success/20 bg-success/5 rounded-lg">
          <code className="text-success font-mono block">"SELECT * FROM users WHERE id = ?"</code>
          <p className="text-[9px] text-muted-foreground mt-0.5">✅ An toàn: Tham số hóa dữ liệu đầu vào (Prepared Statement).</p>
        </div>
      </div>
    );
  }

  // 7. Lesson 57: XSS Attack Protection
  if (num === 57) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-2 font-sans text-left text-[11px]">
        <div className="p-1.5 border border-destructive/20 bg-destructive/5 rounded text-destructive font-mono">
          {"<script>stealCookie()</script>"}
        </div>
        <div className="text-center text-muted-foreground text-[10px]">➔ Lọc Escaping ➔</div>
        <div className="p-1.5 border border-success/20 bg-success/5 rounded text-success font-mono">
          {"&lt;script&gt;stealCookie()&lt;/script&gt;"}
        </div>
      </div>
    );
  }

  // 8. Lesson 63: DRY Code Principle
  if (num === 63) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-3 font-sans text-left text-[11px]">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 border border-destructive/20 bg-destructive/5 rounded-lg">
            <span className="text-destructive font-black block text-[9px] mb-1">❌ WET (Lặp lại)</span>
            <code className="text-[8px] font-mono text-zinc-400 block line-through leading-tight">
              let vatA = pA * 0.1;<br/>
              let vatB = pB * 0.1;
            </code>
          </div>
          <div className="p-2 border border-success/20 bg-success/5 rounded-lg">
            <span className="text-success font-black block text-[9px] mb-1">✅ DRY (Tối ưu)</span>
            <code className="text-[8px] font-mono text-zinc-500 block leading-tight">
              const vat = p =&gt; p * 0.1;<br/>
              vat(pA); vat(pB);
            </code>
          </div>
        </div>
      </div>
    );
  }

  // 9. Lesson 67: LLM & AI tokens flow
  if (num === 67) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-4 space-y-3 font-sans text-center">
        <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase text-zinc-400">
          <span className="p-1 border border-border bg-white dark:bg-zinc-900 rounded text-foreground font-mono">Prompts</span>
          <span>➔</span>
          <span className="p-1 border border-border bg-white dark:bg-zinc-900 rounded text-foreground font-mono">Tokenizer</span>
          <span>➔</span>
          <span className="p-1 border border-primary/20 bg-primary/10 text-primary rounded font-mono animate-pulse">LLM Core</span>
          <span>➔</span>
          <span className="p-1 border border-success/20 bg-success/10 text-success rounded font-mono">Output</span>
        </div>
      </div>
    );
  }

  // 10. Lesson 68: Prompt engineering context structure
  if (num === 68) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-zinc-950 p-3 space-y-2.5 font-sans text-left text-[11px]">
        <div className="p-2 border border-sky-200 dark:border-sky-900/50 bg-sky-500/5 rounded-lg space-y-1">
          <div className="text-[9px] font-black text-sky-500 uppercase">Cấu trúc Prompt Chuẩn</div>
          <p className="text-[8px] text-muted-foreground leading-relaxed">
            1. **Vai trò**: "Là chuyên gia Frontend..."<br/>
            2. **Bối cảnh**: "Đoạn code JS này bị lỗi..."<br/>
            3. **Ràng buộc**: "Sửa lỗi và chỉ trả về code sạch."
          </p>
        </div>
      </div>
    );
  }

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

export const getMobileVisualSet = (type, courseId = "", courseTitle = "") => {
  const num = parseInt(courseId?.replace("lesson", ""), 10) || 0;
  
  // Custom definitions for specific lessons or phases to keep it interactive and highly relevant
  if (num >= 51 && num <= 60) {
    if (num === 51) {
      return {
        title: "Bảo mật: Tam giác CIA Triad",
        panels: [
          { label: "Bảo mật", title: "Confidentiality", caption: "Chỉ người dùng có quyền mới được xem thông tin nhạy cảm.", tone: "rose" },
          { label: "Toàn vẹn", title: "Integrity", caption: "Dữ liệu không bị sửa đổi trái phép khi lưu trữ/truyền tải.", tone: "amber" },
          { label: "Sẵn sàng", title: "Availability", caption: "Hệ thống luôn chạy tốt và sẵn sàng khi cần truy cập.", tone: "sky" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "CIA Triad giống như két sắt ngân hàng: Thẻ từ chính chủ mới mở được (Bảo mật), tiền gửi vào không bị hao hụt (Toàn vẹn), và ngân hàng mở cửa đúng giờ giao dịch (Sẵn sàng)." },
          { id: "diagram", label: "Sơ đồ", body: "Bảo mật dữ liệu ➔ [Mã hóa + Phân quyền] ➔ Kiểm tra checksum/hashing ➔ Load balancing + Server uptime." },
          { id: "memory", label: "Ghi nhớ", body: "Mọi thiết kế hệ thống phần mềm đều phải tự hỏi: Tính năng này có vi phạm C, I, hay A không?" }
        ]
      };
    }
    if (num === 52) {
      return {
        title: "Bảo mật: Mã hóa HTTPS & SSL/TLS",
        panels: [
          { label: "Dữ liệu thô", title: "Plaintext HTTP", caption: "Dữ liệu dạng text thường, dễ bị hacker sniff giữa đường truyền.", tone: "rose" },
          { label: "Chìa khóa", title: "SSL Handshake", caption: "Client và Server thỏa thuận cặp khóa mã hóa chung.", tone: "violet" },
          { label: "Bảo vệ", title: "HTTPS Tunnel", caption: "Mã hóa toàn bộ dữ liệu đi qua đường truyền bằng thuật toán AES.", tone: "emerald" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "HTTP giống như gửi thư bằng bưu thiếp - ai cầm cũng đọc được. HTTPS giống như bỏ thư vào hộp sắt có khóa số, chỉ người nhận mới mở được." },
          { id: "diagram", label: "Sơ đồ", body: "Browser ➔ [Client Hello] ➔ Server ➔ [Certificate] ➔ Thỏa thuận Key mã hóa ➔ Mã hóa dữ liệu truyền tải." },
          { id: "memory", label: "Ghi nhớ", body: "Luôn dùng HTTPS. Trình duyệt hiện đại sẽ cảnh báo 'Không an toàn' nếu trang dùng HTTP thường." }
        ]
      };
    }
    if (num === 53) {
      return {
        title: "Quy tắc: Đặt tên File Dự Án",
        panels: [
          { label: "Viết thường", title: "Lowercase", caption: "Tránh dùng chữ hoa để không bị lỗi phân biệt hoa-thường trên Linux/Windows.", tone: "sky" },
          { label: "Gạch nối", title: "kebab-case", caption: "Dùng dấu gạch ngang (nhu-the-nay.js) thay vì khoảng trắng.", tone: "emerald" },
          { label: "Rõ ràng", title: "Semantic Name", caption: "Đặt tên mô tả chức năng của file thay vì đặt chung chung (app-v2-final.js).", tone: "violet" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Tên file bừa bãi giống như tủ hồ sơ bị trộn lẫn: Tìm một file 'index-copy-final-3.js' mất nhiều giờ và dễ ghi đè lên code của đồng đội." },
          { id: "diagram", label: "Sơ đồ", body: "Quy tắc đặt tên file: folder/viet-thuong-gach-ngang.js hoặc ComponentName.jsx (cho React component)." },
          { id: "memory", label: "Ghi nhớ", body: "Tuyệt đối không dùng khoảng trắng hay ký tự đặc biệt có dấu (Tiếng Việt) trong tên file." }
        ]
      };
    }
    if (num === 54) {
      return {
        title: "Quy tắc: Đặt tên Biến & Hàm",
        panels: [
          { label: "Biến/Hàm", title: "camelCase style", caption: "Chữ cái đầu viết thường, chữ sau viết hoa, ví dụ: userProfileDetails.", tone: "sky" },
          { label: "Lớp/Class", title: "PascalCase style", caption: "Mọi chữ cái đầu viết hoa, ví dụ: MemberPortalPage.", tone: "emerald" },
          { label: "Hằng số", title: "UPPER_SNAKE", caption: "Chữ hoa toàn bộ ngăn cách bằng gạch dưới, ví dụ: MAX_RETRY_COUNT.", tone: "amber" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Biến đặt tên 'a', 'b', 'c' làm code trở thành mật thư. Đặt tên rõ nghĩa 'getUserBalance()' giúp người đọc hiểu ngay hàm làm nhiệm vụ gì." },
          { id: "diagram", label: "Sơ đồ", body: "camelCase (JS/TS variables) ➔ PascalCase (React Components/Classes) ➔ snake_case (Python/DB columns) ➔ UPPER_CASE (Constants)." },
          { id: "memory", label: "Ghi nhớ", body: "Tên hàm bắt đầu bằng một Động từ (get, set, fetch, handle, is) + Danh từ." }
        ]
      };
    }
    if (num === 55) {
      return {
        title: "Quy tắc: Viết Ghi Chú Sạch",
        panels: [
          { label: "Tại sao?", title: "Explain Why", caption: "Ghi chú giải thích tại sao dùng cách xử lý phức tạp này, thay vì giải thích code làm gì.", tone: "sky" },
          { label: "Định dạng", title: "JSDoc / Docstring", caption: "Viết ghi chú chuẩn để IDE tự động hiển thị hướng dẫn khi rê chuột.", tone: "violet" },
          { label: "Xóa rác", title: "No Dead Code", caption: "Không comment lại đoạn code cũ không dùng. Hãy xóa đi vì Git đã lưu lịch sử.", tone: "rose" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Một bình luận hay giống như biển cảnh báo nguy hiểm trên đèo: chỉ cắm ở chỗ cua gấp khuất tầm nhìn, không cắm ở đường thẳng băng dễ thấy." },
          { id: "diagram", label: "Sơ đồ", body: "Bad Comment: '// Tăng i lên 1' ➔ Good Comment: '// Bù đắp lệch múi giờ 7 tiếng của Server Render'." },
          { id: "memory", label: "Ghi nhớ", body: "Code tốt nhất chính là code tự giải thích (Self-documenting code) thông qua đặt tên rõ ràng." }
        ]
      };
    }
    if (num === 56) {
      return {
        title: "Bảo mật: Chống SQL Injection",
        panels: [
          { label: "Lỗ hổng", title: "String Concatenation", caption: "Cộng chuỗi trực tiếp đầu vào của user vào câu SQL (Cực kỳ nguy hiểm).", tone: "rose" },
          { label: "Lá chắn", title: "Prepared Statements", caption: "Dùng tham số hóa (?) để ép dữ liệu đầu vào luôn là text, không chứa mã lệnh.", tone: "emerald" },
          { label: "Ép kiểu", title: "Type Casting", caption: "Ép kiểu dữ liệu (ví dụ parseInt) trước khi thực hiện truy vấn.", tone: "sky" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Hacker nhập tên người dùng là \"admin' OR '1'='1\". Nếu nối chuỗi thường, câu SQL bị biến đổi cấu trúc giúp bypass mật khẩu đăng nhập thành công." },
          { id: "diagram", label: "Sơ đồ", body: "User Input ➔ Prepared SQL Placeholder (?) ➔ DB Engine compile cấu trúc trước ➔ Chèn giá trị an toàn." },
          { id: "memory", label: "Ghi nhớ", body: "Tuyệt đối không bao giờ nối chuỗi để tạo câu SQL động với dữ liệu từ người dùng gửi lên." }
        ]
      };
    }
    if (num === 57) {
      return {
        title: "Bảo mật: Chống tấn công XSS",
        panels: [
          { label: "Mã độc", title: "HTML Injection", caption: "Người dùng chèn thẻ <script> ăn cắp Session Token/Cookie của nạn nhân.", tone: "rose" },
          { label: "Mã hóa", title: "HTML Escaping", caption: "Chuyển đổi < thành &lt; và > thành &gt; trước khi hiển thị ra giao diện.", tone: "emerald" },
          { label: "Lá chắn CSP", title: "Content Security Policy", caption: "Cấu hình HTTP header chỉ cho phép tải script từ các domain tin cậy.", tone: "violet" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "XSS giống như kẻ gian trà trộn tờ quảng cáo giả vào bảng tin chung để lừa người đọc ấn vào link lừa đảo." },
          { id: "diagram", label: "Sơ đồ", body: "User input script ➔ Escape/Sanitize function ➔ An toàn hiển thị dưới dạng văn bản thường." },
          { id: "memory", label: "Ghi nhớ", body: "Khi dùng React, hãy cẩn thận khi dùng dangerouslySetInnerHTML; luôn sanitize nội dung trước." }
        ]
      };
    }
    if (num === 58) {
      return {
        title: "Bảo mật: Session vs JWT Token",
        panels: [
          { label: "Đăng nhập", title: "Credentials Check", caption: "Server xác minh username/password và sinh token ký số.", tone: "sky" },
          { label: "Bảo quản", title: "HttpOnly Cookies", caption: "Lưu token trong cookie bảo mật giúp JS không đọc được (ngăn XSS trộm token).", tone: "emerald" },
          { label: "Xác thực", title: "Stateless Auth", caption: "Client đính kèm Authorization Header trong mỗi request gửi lên.", tone: "violet" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Session giống như ghi sổ ở quầy lễ tân khách sạn. JWT giống như tấm thẻ phòng thông minh: tự chứa thông tin phòng và hạn sử dụng được ký số bảo mật." },
          { id: "diagram", label: "Sơ đồ", body: "Client -> Login -> Server (ký JWT) -> Client lưu Token -> Request đính kèm token -> Server verify chữ ký." },
          { id: "memory", label: "Ghi nhớ", body: "Không lưu thông tin nhạy cảm như mật khẩu hay quyền admin ở dạng plaintext trong JWT." }
        ]
      };
    }
    if (num === 59) {
      return {
        title: "Quy tắc: Tổ chức Folder Thư Mục",
        panels: [
          { label: "Mã nguồn", title: "/src directory", caption: "Thư mục gốc chứa toàn bộ code chạy ứng dụng.", tone: "sky" },
          { label: "Giao diện", title: "/src/components", caption: "Chứa các React component/HTML layout chia nhỏ tái sử dụng.", tone: "emerald" },
          { label: "Tài nguyên", title: "/assets & /public", caption: "Nơi chứa logo, hình ảnh, file cấu hình tĩnh và font chữ.", tone: "violet" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Một dự án lớn không có cấu trúc thư mục rõ ràng giống như đống quần áo chất núi: bạn mất nửa ngày chỉ để đi tìm file CSS định dạng màu sắc." },
          { id: "diagram", label: "Sơ đồ", body: "root ➔ package.json ➔ src/ (pages/, components/, assets/, utils/). Luôn chia theo tính năng hoặc loại file." },
          { id: "memory", label: "Ghi nhớ", body: "Tách biệt rõ ràng code xử lý logic (api, helper) ra khỏi giao diện hiển thị (HTML/React JSX)." }
        ]
      };
    }
    if (num === 60) {
      return {
        title: "Quy tắc: Git Commit & Workflows",
        panels: [
          { label: "Commit", title: "Atomic Commits", caption: "Mỗi commit chỉ giải quyết 1 vấn đề nhỏ duy nhất kèm tin nhắn mô tả rõ nghĩa.", tone: "emerald" },
          { label: "Nhánh phụ", title: "Feature Branching", caption: "Tạo nhánh mới để code tính năng, tránh sửa trực tiếp trên nhánh main.", tone: "sky" },
          { label: "Đánh giá", title: "Pull Request (PR)", caption: "Yêu cầu đồng nghiệp review code trước khi gộp vào nhánh chính.", tone: "violet" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Commit bừa bãi giống như chụp ảnh gia đình mà không ghi ngày tháng: khi ảnh hỏng, bạn không biết bức ảnh nào chụp trước và do ai chụp." },
          { id: "diagram", label: "Sơ đồ", body: "git checkout -b feature ➔ code ➔ git commit -m 'feat: ...' ➔ git push ➔ Pull Request ➔ Merge to main." },
          { id: "memory", label: "Ghi nhớ", body: "Viết commit message bắt đầu bằng: feat (tính năng), fix (sửa lỗi), docs (tài liệu), style (định dạng)." }
        ]
      };
    }
  }

  // Chặng 6: Tối ưu & Tích hợp AI (Lessons 63–70)
  if (num >= 63 && num <= 70) {
    if (num === 63) {
      return {
        title: "Tối ưu: Nguyên tắc DRY",
        panels: [
          { label: "Trùng lặp", title: "WET Code logic", caption: "Đoạn code copy-paste lặp đi lặp lại nhiều nơi, khó sửa đổi.", tone: "rose" },
          { label: "Trích xuất", title: "Function Extraction", caption: "Gom code lặp lại thành một hàm nhận tham số linh hoạt.", tone: "sky" },
          { label: "DRY", title: "Don't Repeat Yourself", caption: "Tái sử dụng hàm ở mọi nơi. Khi sửa logic chỉ cần sửa ở 1 nơi duy nhất.", tone: "emerald" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Code lặp giống như viết tay 10 bức thư gửi cho 10 người. Dùng hàm giống như viết mẫu thư mẫu (Template) và chỉ thay tên người nhận." },
          { id: "diagram", label: "Sơ đồ", body: "Block A & Block B giống nhau ➔ Tạo helper function() ➔ Cả hai gọi chung helper()." },
          { id: "memory", label: "Ghi nhớ", body: "Nếu bạn copy-paste một đoạn code đến lần thứ 3, hãy lập tức tách nó thành hàm hoặc component." }
        ]
      };
    }
    if (num === 64) {
      return {
        title: "Tốc độ: Viết Code với Emmet",
        panels: [
          { label: "Viết tắt", title: "Emmet Syntax", caption: "Gõ lệnh viết tắt nhanh như 'div.card>h2+p' rồi nhấn Tab.", tone: "sky" },
          { label: "Bung code", title: "Code Expansion", caption: "IDE tự sinh ra cấu trúc HTML phức tạp đầy đủ các thẻ tương ứng.", tone: "emerald" },
          { label: "Gõ tắt", title: "Hotkeys", caption: "Dùng các phím tắt di chuyển dòng, nhân bản dòng để tăng 300% tốc độ gõ phím.", tone: "violet" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Không dùng phím tắt giống như đi bộ, dùng phím tắt và Emmet giống như đi xe máy tốc độ cao trên xa lộ code." },
          { id: "diagram", label: "Sơ đồ", body: "Gõ 'ul>li*3>a' + Tab ➔ IDE sinh ra danh sách có sẵn link cực kỳ nhanh chóng." },
          { id: "memory", label: "Ghi nhớ", body: "Dành 1 ngày học phím tắt của VS Code / Cursor sẽ giúp bạn tiết kiệm hàng trăm giờ code sau này." }
        ]
      };
    }
    if (num === 65) {
      return {
        title: "Testing: Viết Unit Test Cơ Bản",
        panels: [
          { label: "Đầu vào", title: "Test Case", caption: "Thiết lập dữ liệu giả lập đầu vào để chạy thử hàm.", tone: "sky" },
          { label: "Thực thi", title: "Run Test", caption: "Gọi hàm cần kiểm tra và nhận kết quả đầu ra thực tế.", tone: "violet" },
          { label: "Khớp lệnh", title: "Assertion (expect)", caption: "So sánh kết quả thực tế với mong đợi. Nếu khớp -> xanh, lệch -> đỏ.", tone: "emerald" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Viết code không viết test giống như phóng xe nhanh ban đêm không đèn: bạn chỉ biết đâm xuống hố khi xe đã đổ." },
          { id: "diagram", label: "Sơ đồ", body: "Hàm sum(a,b) ➔ Test sum(2,3) ➔ expect(sum(2,3)).toBe(5) ➔ Test Passed." },
          { id: "memory", label: "Ghi nhớ", body: "Unit test giúp bạn tự tin refactor (sửa đổi) code cũ mà không sợ làm hỏng các tính năng cũ đang chạy tốt." }
        ]
      };
    }
    if (num === 66) {
      return {
        title: "Git: Khôi Phục & Debug Code",
        panels: [
          { label: "Quay lui", title: "Git Reset", caption: "Hủy bỏ các commit lỗi để đưa code về trạng thái an toàn trước đó.", tone: "rose" },
          { label: "Tìm thủ phạm", title: "Git Bisect", caption: "Chia đôi lịch sử commit để dò tìm xem commit nào đã gây ra lỗi.", tone: "amber" },
          { label: "Khôi phục file", title: "Git Checkout", caption: "Khôi phục một file cụ thể về phiên bản cũ mà không ảnh hưởng file khác.", tone: "sky" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Git giống như cỗ máy thời gian: khi ứng dụng bị lỗi nghiêm trọng, bạn có thể quay ngược thời gian về lúc hệ thống còn hoạt động ổn định nhất." },
          { id: "diagram", label: "Sơ đồ", body: "Commit lỗi ➔ git log ➔ git checkout [hash] ➔ Sửa lỗi an toàn ➔ git commit mới." },
          { id: "memory", label: "Ghi nhớ", body: "Luôn commit code trước khi thực hiện reset để không bị mất các thay đổi chưa lưu." }
        ]
      };
    }
    if (num === 67) {
      return {
        title: "AI: Mô Hình LLM Hoạt Động",
        panels: [
          { label: "Mã hóa", title: "Tokenizer", caption: "Chuyển chữ viết thành mảng các số (Token) để máy tính tính toán.", tone: "sky" },
          { label: "Tính toán", title: "Transformer Model", caption: "Dự đoán xác suất của từ tiếp theo dựa trên hàng tỷ tham số trọng số.", tone: "violet" },
          { label: "Kết quả", title: "Generation", caption: "Ghép các từ dự đoán có xác suất cao nhất thành câu trả lời hoàn chỉnh.", tone: "emerald" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "LLM giống như một người trợ lý đã đọc hết toàn bộ thư viện thế giới: họ không 'hiểu' theo cách con người hiểu, mà họ đoán xem chữ nào nên xuất hiện tiếp theo dựa trên những gì họ đã đọc." },
          { id: "diagram", label: "Sơ đồ", body: "Prompt đầu vào ➔ Tokenizer ➔ Transformer Network ➔ Predict next token ➔ Decode ra Text phản hồi." },
          { id: "memory", label: "Ghi nhớ", body: "AI có thể bị ảo giác (hallucination). Luôn kiểm tra tính chính xác của code AI sinh ra trước khi đưa vào dự án." }
        ]
      };
    }
    if (num === 68) {
      return {
        title: "AI: Viết Prompt Lập Trình Tối Ưu",
        panels: [
          { label: "Bối cảnh", title: "Role & Context", caption: "Đóng vai chuyên gia cao cấp và mô tả cấu trúc codebase hiện tại.", tone: "sky" },
          { label: "Yêu cầu", title: "Clear Constraints", caption: "Đặt giới hạn cụ thể (ví dụ: 'không dùng thư viện ngoài', 'dưới 50 dòng code').", tone: "violet" },
          { label: "Mẫu ví dụ", title: "Few-shot Examples", caption: "Cung cấp 1-2 mẫu code mong muốn để AI bắt chước đúng định dạng.", tone: "emerald" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Hỏi AI chung chung giống như nhờ đầu bếp nấu 'món gì ngon ngon'. Hỏi chi tiết kèm điều kiện giống như đặt bếp nấu 'mì Ý sốt kem ít béo không hành'." },
          { id: "diagram", label: "Sơ đồ", body: "Bad Prompt: 'Viết app todo' ➔ Good Prompt: 'Viết React component TodoList dùng Tailwind CSS, có checkbox lưu trạng thái vào localStorage'." },
          { id: "memory", label: "Ghi nhớ", body: "Prompt càng rõ ràng, câu trả lời của AI càng chính xác và giảm thiểu thời gian sửa lỗi." }
        ]
      };
    }
    if (num === 69) {
      return {
        title: "AI: Tích hợp API Gemini/OpenAI",
        panels: [
          { label: "Gửi đi", title: "POST Request", caption: "Client hoặc Backend gửi JSON chứa prompt đến endpoint API của AI.", tone: "sky" },
          { label: "Chìa khóa", title: "API Key Header", caption: "Đính kèm khóa bí mật Bearer Token để xác thực và thanh toán lượt dùng.", tone: "amber" },
          { label: "Nhận về", title: "Streaming Response", caption: "Nhận luồng dữ liệu trả về từng chữ một để tạo hiệu ứng gõ chữ mượt mà.", tone: "emerald" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Tích hợp API giống như thuê một chuyên gia bên ngoài trực tổng đài: cứ có câu hỏi từ khách hàng là bạn chuyển tiếp cho họ qua điện thoại (API) rồi đọc câu trả lời lại cho khách nghe." },
          { id: "diagram", label: "Sơ đồ", body: "Web Client ➔ Backend server (giấu API Key) ➔ Google Gemini API ➔ Response JSON ➔ Client hiển thị." },
          { id: "memory", label: "Ghi nhớ", body: "Không bao giờ để lộ API Key ở frontend (HTML/JS client), kẻ xấu sẽ lấy trộm và dùng chùa khiến bạn mất nhiều tiền." }
        ]
      };
    }
    if (num === 70) {
      return {
        title: "AI: Tự động hóa Code Review",
        panels: [
          { label: "Phân tích", title: "Complexity Check", caption: "Dùng AI đọc qua hàm để phát hiện các vòng lặp lồng nhau hoặc thắt nút cổ chai.", tone: "rose" },
          { label: "Đề xuất", title: "Refactor Suggestion", caption: "AI viết lại mã nguồn theo hướng tối ưu bộ nhớ và dòng code.", tone: "sky" },
          { label: "Áp dụng", title: "Code Patching", caption: "Tự động gộp mã nguồn mới đã tối ưu vào codebase sau khi review.", tone: "emerald" }
        ],
        modes: [
          { id: "story", label: "Truyện", body: "Dùng AI review giống như mời một người bạn thông minh đọc hộ bài luận trước khi nộp: họ sẽ chỉ ra lỗi chính tả và gợi ý câu cú mượt mà hơn." },
          { id: "diagram", label: "Sơ đồ", body: "Code hiện tại ➔ Prompt gửi kèm Code ➔ AI phân tích lỗi tiềm ẩn ➔ Xuất file so sánh Diff." },
          { id: "memory", label: "Ghi nhớ", body: "AI Review rất nhanh nhưng có thể bỏ sót logic nghiệp vụ phức tạp. Luôn tự mình duyệt lại trước khi bấm gộp nhánh." }
        ]
      };
    }
  }

  // Chặng 7: Lập trình web nâng cao (Lessons 71–100)
  if (num >= 71 && num <= 100) {
    return {
      title: `Chặng 7 - Bài ${num}: Xây dựng dự án Web`,
      panels: [
        { label: "Mô-đun", title: "Component Architecture", caption: "Chia nhỏ website thành Navbar, Sidebar, ProductCard, Footer độc lập.", tone: "sky" },
        { label: "Dữ liệu", title: "State & API Integration", caption: "Quản lý dữ liệu giỏ hàng, thông tin tài khoản dùng chung giữa các trang.", tone: "emerald" },
        { label: "Triển khai", title: "Production Deployment", caption: "Build tối ưu dung lượng và đẩy code lên internet cho mọi người truy cập.", tone: "violet" }
      ],
      modes: [
        { id: "story", label: "Truyện", body: "Học 70 bài trước là học cách làm gạch, cát, xi măng. Chặng 7 này là lúc bạn thực sự tự tay xây dựng một tòa nhà hoàn thiện từ móng đến mái." },
        { id: "diagram", label: "Sơ đồ", body: "Figma Mockup ➔ Chia nhỏ component ➔ Code HTML/React ➔ Gắn API Backend ➔ Deploy lên Hosting." },
        { id: "memory", label: "Ghi nhớ", body: "Làm đến đâu kiểm tra đến đấy. Tránh viết một mạch 500 dòng code rồi mới quay lại sửa lỗi, lúc đó sẽ cực kỳ khó tìm lỗi." }
      ]
    };
  }

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
