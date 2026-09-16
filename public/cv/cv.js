const params = new URLSearchParams(window.location.search);
const language = params.get("lang") === "en" ? "en" : "vi";

if (params.get("layout") === "ats") document.body.classList.add("ats");
document.querySelectorAll(".page").forEach((page) => {
  if (page.dataset.language !== language) page.remove();
});

document.documentElement.lang = language;
document.title = language === "vi" ? "CV — Lê Gia Huy" : "CV — Le Gia Huy";

const languageLink = document.querySelector("[data-language-link]");
const downloadLink = document.querySelector("[data-download-link]");
if (language === "en") {
  languageLink.href = "/cv/index.html?lang=vi";
  languageLink.textContent = "Tiếng Việt";
  downloadLink.href = "/cv-le-gia-huy-en.pdf";
  downloadLink.textContent = "Download PDF";
}
