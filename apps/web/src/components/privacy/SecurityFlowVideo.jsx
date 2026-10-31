const FLOW_STEPS = [
  { icon: "lock", title: "Mã hoá đường truyền", text: "Trình duyệt gửi yêu cầu qua HTTPS." },
  { icon: "verified_user", title: "Kiểm tra tại server", text: "Server xác minh phiên và quyền truy cập." },
  { icon: "encrypted", title: "Chỉ lưu phần cần thiết", text: "Dữ liệu nhạy cảm được bảo vệ trước khi lưu." },
  { icon: "reply", title: "Phản hồi an toàn", text: "Chỉ trả dữ liệu hợp lệ, không kèm lỗi nội bộ." },
];

export default function SecurityFlowVideo() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="security-flow-title">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p id="security-flow-title" className="text-sm font-bold text-foreground">Một yêu cầu đi qua hệ thống như thế nào?</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Minh hoạ tự động · không phải bản ghi dữ liệu thật</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
          <span className="security-flow-live size-1.5 rounded-full bg-primary" aria-hidden="true" />
          Đang phát
        </span>
      </div>

      <div className="relative overflow-hidden bg-muted/25 px-4 py-7 sm:px-7">
        <div className="relative mx-auto grid max-w-2xl grid-cols-3 items-center gap-3">
          <FlowNode icon="person" label="Bạn" detail="Trình duyệt" />
          <FlowNode icon="shield_lock" label="Hugo Studio" detail="API bảo vệ" featured />
          <FlowNode icon="dns" label="Server" detail="Dữ liệu" />

          <div className="pointer-events-none absolute left-[17%] right-[17%] top-5 z-0 h-px bg-border" aria-hidden="true">
            <span className="security-flow-packet absolute -top-1.5 grid size-3 place-items-center rounded-full bg-primary shadow-[0_0_0_5px_hsl(var(--primary)/0.12)]" />
            <span className="security-flow-packet security-flow-packet-back absolute -top-1.5 grid size-3 place-items-center rounded-full bg-foreground shadow-[0_0_0_5px_hsl(var(--foreground)/0.08)]" />
          </div>
        </div>

        <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map((step, index) => (
            <div key={step.title} className="security-flow-step rounded-xl border border-border bg-background/90 p-3" style={{ "--flow-delay": `${index * 1.2}s` }}>
              <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">{step.icon}</span>
              <p className="mt-1 text-xs font-bold text-foreground">{step.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      <figcaption className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Phản hồi chỉ quay về sau khi server kiểm tra yêu cầu. Trình duyệt không được kết nối thẳng tới cơ sở dữ liệu hoặc máy chủ AI nội bộ.
      </figcaption>

      <style>{`
        @keyframes security-flow-forward {
          0%, 8% { left: 0; opacity: 0; }
          16% { opacity: 1; }
          46%, 55% { left: 100%; opacity: 1; }
          63%, 100% { left: 100%; opacity: 0; }
        }
        @keyframes security-flow-back {
          0%, 55% { right: 0; opacity: 0; }
          63% { opacity: 1; }
          92% { right: 100%; opacity: 1; }
          100% { right: 100%; opacity: 0; }
        }
        @keyframes security-flow-step {
          0%, 100% { border-color: hsl(var(--border)); transform: translateY(0); }
          12%, 28% { border-color: hsl(var(--primary) / .55); transform: translateY(-2px); }
        }
        @keyframes security-flow-live {
          50% { opacity: .35; transform: scale(.75); }
        }
        .security-flow-packet { animation: security-flow-forward 4.8s ease-in-out infinite; }
        .security-flow-packet-back { animation: security-flow-back 4.8s ease-in-out infinite; }
        .security-flow-step { animation: security-flow-step 4.8s ease-in-out infinite; animation-delay: var(--flow-delay); }
        .security-flow-live { animation: security-flow-live 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .security-flow-packet, .security-flow-packet-back, .security-flow-step, .security-flow-live { animation: none; }
          .security-flow-packet { left: 48%; opacity: 1; }
          .security-flow-packet-back { display: none; }
        }
      `}</style>
    </figure>
  );
}

function FlowNode({ icon, label, detail, featured = false }) {
  return (
    <div className="relative z-10 text-center">
      <span className={`mx-auto grid size-10 place-items-center rounded-xl border ${featured ? "border-primary/40 bg-primary text-white" : "border-border bg-background text-foreground"}`}>
        <span className="material-symbols-outlined text-xl" aria-hidden="true">{icon}</span>
      </span>
      <p className="mt-2 text-xs font-black text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}
