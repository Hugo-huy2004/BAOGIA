import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import LegalDoc from "../../components/legal/LegalDoc";
import { legalDoc } from "../../content/legal";

/** /terms và /privacy-policy — nội dung ở content/legal.js. */
export default function LegalPage({ kind }) {
  const { i18n } = useTranslation();
  const doc = legalDoc(kind, i18n.resolvedLanguage || i18n.language);
  useHeadMeta({
    title: `${doc.title} | Hugo Studio`,
    description: doc.intro,
    canonicalUrl: `https://www.hugowishpax.studio/${kind === "terms" ? "terms" : "privacy-policy"}`,
  });
  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <LegalDoc kind={kind} />
    </main>
  );
}
