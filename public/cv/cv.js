const params = new URLSearchParams(window.location.search);
// Ba bản dùng chung một tệp; bản nào không khớp `?lang=` thì gỡ khỏi DOM.
const LANGUAGES = ["vi", "en", "zh"];
const language = LANGUAGES.includes(params.get("lang")) ? params.get("lang") : "vi";

// English is the ATS-first version for international applications. Vietnamese
// and Chinese retain their human-readable local layouts; ?layout=ats remains
// available when an application form explicitly requests plain parsing.
if (language === "en" || params.get("layout") === "ats") document.body.classList.add("ats");
document.body.classList.add(`cv-${language}`);
document.querySelectorAll(".page").forEach((page) => {
  if (page.dataset.language !== language) page.remove();
});

document.documentElement.lang = language;
const TITLE = {
  vi: "Hugo Wishpax · Kỹ sư phần mềm & Người xây sản phẩm | CV",
  en: "Hugo Wishpax · Software Engineer & Product Builder | CV",
  zh: "Hugo Wishpax · 软件工程师与产品构建者 | CV",
};
document.title = TITLE[language];

// Ba ngôn ngữ bày thẳng trên thanh công cụ, cái đang xem tô đậm — một nút xoay
// vòng bắt người đọc bấm hai lần và đoán xem lần sau sẽ ra tiếng gì.
const PDF = { vi: "/hugo-wishpax-cv.pdf", en: "/hugo-wishpax-cv-en.pdf", zh: "/hugo-wishpax-cv-zh.pdf" };
const DOWNLOAD = { vi: "Tải PDF", en: "Download PDF", zh: "下载 PDF" };

for (const link of document.querySelectorAll("[data-langs] a")) {
  const code = link.dataset.lang;
  link.href = `/cv/index.html?lang=${code}`;
  if (code === language) link.setAttribute("aria-current", "page");
}

const downloadLink = document.querySelector("[data-download-link]");
downloadLink.href = PDF[language];
downloadLink.textContent = DOWNLOAD[language];
