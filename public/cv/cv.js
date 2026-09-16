const params = new URLSearchParams(window.location.search);
// Ba bản dùng chung một tệp; bản nào không khớp `?lang=` thì gỡ khỏi DOM.
const LANGUAGES = ["vi", "en", "zh"];
const language = LANGUAGES.includes(params.get("lang")) ? params.get("lang") : "vi";

if (params.get("layout") === "ats") document.body.classList.add("ats");
document.querySelectorAll(".page").forEach((page) => {
  if (page.dataset.language !== language) page.remove();
});

document.documentElement.lang = language;
const TITLE = { vi: "CV - Lê Gia Huy", en: "CV - Gia Huy, Le", zh: "CV - 黎家辉" };
document.title = TITLE[language];

// Ba ngôn ngữ bày thẳng trên thanh công cụ, cái đang xem tô đậm — một nút xoay
// vòng bắt người đọc bấm hai lần và đoán xem lần sau sẽ ra tiếng gì.
const PDF = { vi: "/cv-le-gia-huy.pdf", en: "/cv-le-gia-huy-en.pdf", zh: "/cv-le-gia-huy-zh.pdf" };
const DOWNLOAD = { vi: "Tải PDF", en: "Download PDF", zh: "下载 PDF" };

for (const link of document.querySelectorAll("[data-langs] a")) {
  const code = link.dataset.lang;
  link.href = `/cv/index.html?lang=${code}`;
  if (code === language) link.setAttribute("aria-current", "page");
}

const downloadLink = document.querySelector("[data-download-link]");
downloadLink.href = PDF[language];
downloadLink.textContent = DOWNLOAD[language];
