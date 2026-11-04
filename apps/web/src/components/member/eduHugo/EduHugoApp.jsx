import AppFrame from "../os/AppFrame";

const EDUCATION_HUGO_URL = "https://education.hugowishpax.studio";

export default function EduHugoApp({ onBack }) {
  return (
    <AppFrame appId="eduhugo" onBack={onBack} forceScheme="light" className="bg-white" contentClassName="px-4 py-8">
      <section className="mx-auto flex min-h-[calc(100dvh-160px)] max-w-lg flex-col items-center justify-center text-center">
        <img
          src="/brand/edu-hugo-mascot.png"
          alt="Linh vật Edu Hugo"
          className="h-44 w-44 object-contain sm:h-56 sm:w-56"
        />
        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900">HugoCoding đã ngừng hoạt động</h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-600">
          Hugo Studio đã không còn cung cấp dịch vụ HugoCoding từ ngày 01/11/2026. Thay vào đó,
          chúng tôi đã nghiên cứu và phát triển trang web/ứng dụng Education Hugo. Bạn có thể nhấn
          nút dưới đây để chuyển tiếp.
        </p>
        <a
          href={EDUCATION_HUGO_URL}
          className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Chuyển đến Education Hugo
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
        </a>
      </section>
    </AppFrame>
  );
}
