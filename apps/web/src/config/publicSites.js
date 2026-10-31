export const PORTFOLIO_ORIGIN = "https://portfolio.hugowishpax.studio";
export const SERVICES_ORIGIN = "https://www.hugowishpax.studio";
export const SITE_ORIGIN = import.meta.env.VITE_SITE_TARGET === "portfolio"
  ? PORTFOLIO_ORIGIN : SERVICES_ORIGIN;

export const cvPdf = (language = "vi") => {
  const code = language.split("-")[0];
  return `/hugo-wishpax-cv${code === "en" || code === "zh" ? `-${code}` : ""}.pdf`;
};
