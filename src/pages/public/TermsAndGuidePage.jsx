import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import DocsLayout from "./DocsLayout";
import {
  UPDATED_AT_VI,
  META_VI,
  PILLARS_VI,
  SECTIONS_VI,
} from "./termsAndGuideData.vi";
import {
  UPDATED_AT_EN,
  META_EN,
  PILLARS_EN,
  SECTIONS_EN,
} from "./termsAndGuideData.en";
import {
  UPDATED_AT_ZH,
  META_ZH,
  PILLARS_ZH,
  SECTIONS_ZH,
} from "./termsAndGuideData.zh";

export default function TermsAndGuidePage({ defaultPillar = "all" }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("zh")
    ? "zh"
    : i18n.language?.startsWith("en")
    ? "en"
    : "vi";

  const data = useMemo(() => {
    switch (lang) {
      case "zh":
        return {
          updatedAt: UPDATED_AT_ZH,
          meta: META_ZH,
          pillars: PILLARS_ZH,
          sections: SECTIONS_ZH,
        };
      case "en":
        return {
          updatedAt: UPDATED_AT_EN,
          meta: META_EN,
          pillars: PILLARS_EN,
          sections: SECTIONS_EN,
        };
      default:
        return {
          updatedAt: UPDATED_AT_VI,
          meta: META_VI,
          pillars: PILLARS_VI,
          sections: SECTIONS_VI,
        };
    }
  }, [lang]);

  useHeadMeta({
    title: data.meta.title,
    description: data.meta.description,
    keywords: data.meta.keywords,
    canonicalUrl: "https://www.hugowishpax.studio/terms-and-guide",
  });

  return (
    <DocsLayout
      eyebrow={data.meta.eyebrow}
      version={data.meta.version}
      title={data.meta.pageTitle}
      intro={data.meta.intro}
      updatedAt={data.updatedAt}
      pillars={data.pillars}
      defaultPillar={defaultPillar}
      sections={data.sections}
      footerNote={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground font-mono">
          <span>{data.meta.footerLeft}</span>
          <span>{data.meta.footerRight}</span>
        </div>
      }
    />
  );
}
