import { useEffect, useState } from "react";

// Năm tình huống bảo mật kể bằng hình đời thường: két sắt, bảo vệ soát vé, lễ
// tân giữ chìa khoá, sổ ghi bằng vân tay, máy quét vé giả. Tên kỹ thuật vẫn
// hiện nhưng nằm ở nhãn nhỏ, không phải thứ người đọc phải hiểu trước.
const SCENES = [
  {
    id: "encryption",
    icon: "lock",
    tech: "AES-256-GCM",
    title: "Chữ của bạn được bỏ vào két trước khi cất",
    summary: "Ai mở được kho lưu trữ cũng chỉ thấy một chuỗi vô nghĩa, vì chìa khoá không nằm cùng chỗ với dữ liệu.",
  },
  {
    id: "member-api",
    icon: "badge",
    tech: "requireMember",
    title: "Bảo vệ soát vòng tay, không tin lời khai",
    summary: "Bạn có thể gõ tên người khác vào yêu cầu, nhưng hệ thống chỉ nhìn vòng tay đã được cấp lúc đăng nhập.",
  },
  {
    id: "ai-gateway",
    icon: "key",
    tech: "INTERNAL_API_KEY",
    title: "Chìa khoá kho không rời khỏi quầy",
    summary: "Trình duyệt của bạn không bao giờ cầm chìa. Bạn nói với quầy, quầy tự đi mở kho rồi mang kết quả ra.",
  },
  {
    id: "security-hash",
    icon: "fingerprint",
    tech: "HMAC-SHA256",
    title: "Sổ chặn ghi bằng vân tay, không ghi tên",
    summary: "Muốn biết ai đang bị chặn thì đối chiếu vân tay. Đọc trộm quyển sổ cũng không lấy được email hay IP của ai.",
  },
  {
    id: "joy-safe-error",
    icon: "receipt_long",
    tech: "JOY_QR_SECRET",
    title: "Vé bị sửa số là máy quét biết ngay",
    summary: "Thêm một số 0 vào vé thì con tem trên vé không còn khớp nữa. Máy từ chối và không nói vì sao nó biết.",
  },
];

const SCENE_DURATION_MS = 9000;

export default function SecurityExamplesVideo() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!playing || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % SCENES.length);
    }, SCENE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  const scene = SCENES[active];

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="security-examples-title">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p id="security-examples-title" className="text-sm font-black text-foreground">Hugo Studio giữ dữ liệu của bạn thế nào?</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Hoạt cảnh tự chạy · cảnh {active + 1}/{SCENES.length}</p>
        </div>
        <button type="button" onClick={() => setPlaying((value) => !value)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-foreground" aria-label={playing ? "Tạm dừng hoạt cảnh" : "Tiếp tục hoạt cảnh"}>
          <span className="material-symbols-outlined text-xl" aria-hidden="true">{playing ? "pause" : "play_arrow"}</span>
        </button>
      </div>

      <div className="relative overflow-hidden bg-muted/25 px-4 py-6 sm:px-7">
        <div key={scene.id} className="sd-scene">
          <div className="mx-auto max-w-xl text-center">
            <h3 className="text-base font-black leading-snug text-foreground sm:text-lg">{scene.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{scene.summary}</p>
          </div>
          <div className="mx-auto mt-6 min-h-[190px] max-w-2xl sm:min-h-[210px]">
            <SceneVisual kind={scene.id} />
          </div>
          <p className="mt-5 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground">
              <span className="material-symbols-outlined text-[13px]" aria-hidden="true">code</span>
              Tên kỹ thuật: {scene.tech}
            </span>
          </p>
        </div>
      </div>

      <div className="h-1 bg-muted" aria-hidden="true">
        {playing && <span key={`${scene.id}-progress`} className="sd-progress block h-full bg-primary" />}
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t border-border px-3 py-3">
        {SCENES.map((item, index) => (
          <button key={item.id} type="button" onClick={() => setActive(index)} aria-label={`Xem cảnh: ${item.title}`} aria-current={active === index ? "true" : undefined} className={`grid size-9 place-items-center rounded-xl transition-colors ${active === index ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>
            <span className="material-symbols-outlined text-lg" aria-hidden="true">{item.icon}</span>
          </button>
        ))}
      </div>

      <figcaption className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:px-5">
        Hoạt cảnh dùng dữ liệu giả và cách kể đơn giản hoá. Không có khoá, token, địa chỉ nội bộ hoặc dữ liệu thành viên thật xuất hiện trong video.
      </figcaption>

      <style>{`
        @keyframes sd-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes sd-progress { from { width: 0; } to { width: 100%; } }

        /* Chữ đọc được mờ đi, chuỗi mã hiện lên, ổ khoá đóng sập. */
        @keyframes sd-plain { 0%, 28% { opacity: 1; } 40%, 100% { opacity: 0; } }
        @keyframes sd-cipher { 0%, 32% { opacity: 0; } 46%, 100% { opacity: 1; } }
        @keyframes sd-lock-drop { 0%, 24% { opacity: 0; transform: translateY(-14px) scale(1.6); } 44%, 100% { opacity: 1; transform: none; } }

        /* Gói dữ liệu chạy dọc đường ray giữa các chặng. */
        @keyframes sd-travel { 0%, 6% { left: 4%; opacity: 0; } 14%, 66% { opacity: 1; } 80%, 100% { left: calc(96% - 12px); opacity: 0; } }

        /* Lời khai bị gạch, dấu tick xanh bật lên sau đó. */
        @keyframes sd-strike { 0%, 30% { transform: scaleX(0); } 46%, 100% { transform: scaleX(1); } }
        @keyframes sd-approve { 0%, 55% { opacity: 0; transform: scale(.4); } 70%, 100% { opacity: 1; transform: scale(1); } }

        /* Chìa khoá đi từ quầy sang kho rồi quay về, không bao giờ sang trái. */
        @keyframes sd-key { 0%, 10% { transform: translateX(0) rotate(0); } 45%, 60% { transform: translateX(64px) rotate(90deg); } 95%, 100% { transform: translateX(0) rotate(0); } }
        @keyframes sd-vault { 0%, 45% { transform: scaleY(1); } 60%, 88% { transform: scaleY(.12); } 100% { transform: scaleY(1); } }

        /* Thẻ tên rơi vào máy, máy rung, vân tay hiện ra. */
        @keyframes sd-drop { 0% { opacity: 0; transform: translateY(-18px); } 18%, 40% { opacity: 1; transform: none; } 52%, 100% { opacity: 0; transform: translateY(14px) scale(.9); } }
        @keyframes sd-shake { 0%, 44% { transform: none; } 50% { transform: rotate(-4deg); } 56% { transform: rotate(4deg); } 62%, 100% { transform: none; } }

        /* Số bị thêm vào vé, tia quét chạy qua, con dấu TỪ CHỐI đóng xuống. */
        @keyframes sd-forge { 0%, 18% { opacity: 0; transform: scale(1.8); } 30%, 100% { opacity: 1; transform: none; } }
        @keyframes sd-beam { 0%, 30% { opacity: 0; top: 8%; } 40% { opacity: 1; } 62% { opacity: 1; top: 82%; } 70%, 100% { opacity: 0; top: 82%; } }
        @keyframes sd-stamp { 0%, 66% { opacity: 0; transform: scale(2.2) rotate(-14deg); } 78%, 100% { opacity: 1; transform: scale(1) rotate(-8deg); } }

        .sd-scene { animation: sd-enter .45s ease-out both; }
        .sd-progress { animation: sd-progress ${SCENE_DURATION_MS}ms linear both; }
        .sd-plain { animation: sd-plain 4.4s ease-in-out infinite; }
        .sd-cipher { animation: sd-cipher 4.4s ease-in-out infinite; }
        .sd-lock { animation: sd-lock-drop 4.4s ease-in-out infinite; }
        .sd-travel { animation: sd-travel 4.4s ease-in-out infinite; }
        .sd-strike { animation: sd-strike 4.4s ease-in-out infinite; transform-origin: left; }
        .sd-approve { animation: sd-approve 4.4s ease-in-out infinite; }
        .sd-key { animation: sd-key 4.4s ease-in-out infinite; }
        .sd-vault { animation: sd-vault 4.4s ease-in-out infinite; transform-origin: top; }
        .sd-drop { animation: sd-drop 4.4s ease-in-out infinite; }
        .sd-shake { animation: sd-shake 4.4s ease-in-out infinite; }
        .sd-forge { animation: sd-forge 4.4s ease-in-out infinite; }
        .sd-beam { animation: sd-beam 4.4s ease-in-out infinite; }
        .sd-stamp { animation: sd-stamp 4.4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .sd-scene, .sd-progress, .sd-plain, .sd-cipher, .sd-lock, .sd-travel, .sd-strike,
          .sd-approve, .sd-key, .sd-vault, .sd-drop, .sd-shake, .sd-forge, .sd-beam, .sd-stamp {
            animation: none;
          }
          .sd-plain, .sd-drop { opacity: 0; }
          .sd-travel { left: 48%; }
        }
      `}</style>
    </figure>
  );
}

function SceneVisual({ kind }) {
  if (kind === "encryption") {
    return (
      <Rail>
        <Stop caption="Bạn gõ trên máy mình">
          <Paper>
            <span className="text-[11px] font-semibold leading-snug text-foreground">“Hôm nay mình<br />hơi lo lắng”</span>
          </Paper>
        </Stop>

        <Stop caption="Đi qua ổ khoá của server">
          <div className="relative grid size-20 place-items-center rounded-2xl border border-primary/40 bg-primary text-white">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">lock</span>
            <span className="sd-lock absolute -right-1.5 -top-1.5 grid size-7 place-items-center rounded-full bg-foreground text-background">
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">key</span>
            </span>
          </div>
        </Stop>

        <Stop caption="Nằm trong kho lưu trữ">
          <Paper>
            <span className="sd-plain absolute inset-0 grid place-items-center px-2 text-[11px] font-semibold leading-snug text-foreground">“Hôm nay mình<br />hơi lo lắng”</span>
            <span className="sd-cipher font-mono text-[10px] leading-snug tracking-tight text-muted-foreground">7f2a·9c41<br />b08e·d3a7</span>
          </Paper>
        </Stop>
      </Rail>
    );
  }

  if (kind === "member-api") {
    return (
      <Rail>
        <Stop caption="Yêu cầu tự khai tên">
          <Paper>
            <span className="relative text-[11px] font-semibold text-foreground">
              “Tôi là chủ<br />tài khoản A”
              <span className="sd-strike absolute inset-x-0 top-1/2 h-0.5 rounded bg-destructive" aria-hidden="true" />
            </span>
          </Paper>
        </Stop>

        <Stop caption="Bảo vệ chỉ soát vòng tay">
          <div className="sd-shake grid size-20 place-items-center rounded-2xl border border-primary/40 bg-primary text-white">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">badge</span>
          </div>
        </Stop>

        <Stop caption="Phục vụ đúng người">
          <div className="relative grid size-20 place-items-center rounded-2xl border border-border bg-background">
            <span className="material-symbols-outlined text-4xl text-foreground" aria-hidden="true">person</span>
            <span className="sd-approve absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full bg-foreground text-background">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check</span>
            </span>
          </div>
        </Stop>
      </Rail>
    );
  }

  if (kind === "ai-gateway") {
    return (
      <Rail>
        <Stop caption="Máy của bạn: không có chìa">
          <div className="relative grid size-20 place-items-center rounded-2xl border border-border bg-background">
            <span className="material-symbols-outlined text-4xl text-foreground" aria-hidden="true">smartphone</span>
            <span className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full bg-muted text-muted-foreground line-through">
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">key_off</span>
            </span>
          </div>
        </Stop>

        <Stop caption="Quầy Hugo giữ chìa">
          <div className="relative grid size-20 place-items-center rounded-2xl border border-primary/40 bg-primary text-white">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">support_agent</span>
            <span className="sd-key absolute -right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-foreground text-background">
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">key</span>
            </span>
          </div>
        </Stop>

        <Stop caption="Kho AI chỉ mở cho quầy">
          <div className="relative grid size-20 place-items-center overflow-hidden rounded-2xl border border-border bg-background">
            <span className="material-symbols-outlined text-4xl text-foreground" aria-hidden="true">smart_toy</span>
            <span className="sd-vault absolute inset-0 bg-muted" aria-hidden="true" />
          </div>
        </Stop>
      </Rail>
    );
  }

  if (kind === "security-hash") {
    return (
      <Rail>
        <Stop caption="Tên thật của người bị chặn">
          <Paper>
            <span className="sd-drop font-mono text-[10px] text-foreground">an***@mail.com<br />203.0.113.7</span>
          </Paper>
        </Stop>

        <Stop caption="Máy dập một chiều">
          <div className="sd-shake grid size-20 place-items-center rounded-2xl border border-primary/40 bg-primary text-white">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">fingerprint</span>
          </div>
        </Stop>

        <Stop caption="Sổ chỉ có vân tay">
          <Paper>
            <span className="block space-y-1 font-mono text-[9px] leading-tight text-muted-foreground">
              <span className="block rounded bg-muted px-1.5 py-0.5">9f3c…a21d</span>
              <span className="block rounded bg-muted px-1.5 py-0.5">4b70…c8e2</span>
            </span>
          </Paper>
        </Stop>
      </Rail>
    );
  }

  return (
    <Rail>
      <Stop caption="Vé JOY bị sửa số">
        <Paper>
          <span className="text-sm font-black text-foreground">
            50<span className="sd-forge inline-block text-destructive">0</span> JOY
          </span>
          <span className="mt-1 block font-mono text-[9px] text-muted-foreground">tem: a71f…</span>
        </Paper>
      </Stop>

      <Stop caption="Máy quét đối chiếu tem">
        <div className="relative grid size-20 place-items-center overflow-hidden rounded-2xl border border-primary/40 bg-primary text-white">
          <span className="material-symbols-outlined text-4xl" aria-hidden="true">barcode_scanner</span>
          <span className="sd-beam absolute inset-x-0 h-0.5 bg-white/90" aria-hidden="true" />
        </div>
      </Stop>

      <Stop caption="Từ chối, không giải thích thêm">
        <div className="relative grid size-20 place-items-center rounded-2xl border border-border bg-background">
          <span className="material-symbols-outlined text-4xl text-muted-foreground" aria-hidden="true">block</span>
          <span className="sd-stamp absolute inset-x-1 bottom-2 rounded border-2 border-destructive/70 py-0.5 text-center text-[9px] font-black uppercase tracking-wider text-destructive">
            Từ chối
          </span>
        </div>
      </Stop>
    </Rail>
  );
}

/** Ba chặng nằm trên một đường ray, có gói dữ liệu chạy qua để thấy chiều đi. */
function Rail({ children }) {
  return (
    <div className="relative grid grid-cols-3 gap-2 sm:gap-5">
      <div className="absolute left-[16%] right-[16%] top-10 h-px bg-border" aria-hidden="true">
        <span className="sd-travel absolute -top-1.5 size-3 rounded-full bg-primary shadow-[0_0_0_5px_hsl(var(--primary)/0.12)]" />
      </div>
      {children}
    </div>
  );
}

function Stop({ caption, children }) {
  return (
    <div className="relative z-10 flex min-w-0 flex-col items-center">
      {children}
      <p className="mt-3 text-center text-[10px] font-semibold leading-snug text-muted-foreground sm:text-[11px]">{caption}</p>
    </div>
  );
}

/** Tờ giấy/thẻ dùng cho hai đầu của mỗi cảnh — cùng kích thước với ô icon. */
function Paper({ children }) {
  return (
    <div className="relative grid size-20 place-items-center rounded-2xl border border-border bg-background px-1.5 text-center">
      {children}
    </div>
  );
}
