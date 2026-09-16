const params = new URLSearchParams(window.location.search);
// Ba bản dùng chung một tệp; bản nào không khớp `?lang=` thì gỡ khỏi DOM.
const LANGUAGES = ["vi", "en", "zh"];
const language = LANGUAGES.includes(params.get("lang")) ? params.get("lang") : "vi";

if (params.get("layout") === "ats") document.body.classList.add("ats");
document.querySelectorAll(".page").forEach((page) => {
  if (page.dataset.language !== language) page.remove();
});

document.documentElement.lang = language;
document.title = language === "vi" ? "CV - Lê Gia Huy" : "CV - Le Gia Huy";

// Nút ngôn ngữ xoay vòng vi → en → zh → vi: ba thứ tiếng mà bày ba nút thì
// thanh công cụ chật, còn một nút "đổi" chung chung lại không nói được sắp
// sang đâu.
const NEXT = { vi: "en", en: "zh", zh: "vi" };
const LABEL = { vi: "Tiếng Việt", en: "English", zh: "中文" };
const PDF = { vi: "/cv-le-gia-huy.pdf", en: "/cv-le-gia-huy-en.pdf", zh: "/cv-le-gia-huy-zh.pdf" };
const DOWNLOAD = { vi: "Tải PDF", en: "Download PDF", zh: "下载 PDF" };

const languageLink = document.querySelector("[data-language-link]");
const downloadLink = document.querySelector("[data-download-link]");
const next = NEXT[language];
languageLink.href = `/cv/index.html?lang=${next}`;
languageLink.textContent = LABEL[next];
downloadLink.href = PDF[language];
downloadLink.textContent = DOWNLOAD[language];
