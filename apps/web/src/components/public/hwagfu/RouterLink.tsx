import { Link as ReactRouterLink } from "react-router-dom";
import { cvPdf } from "../../../config/publicSites";
import i18n from "../../../i18n/config";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof ReactRouterLink>, "to"> & { href: string };

export function Link({ href, ...props }: Props) {
  if (/^(?:https?:|mailto:|tel:)/.test(href)) return <a href={href} {...props} />;
  if (href === "/cv") return <a href={cvPdf(i18n.language)} target="_blank" rel="noopener noreferrer" {...props} />;
  return <ReactRouterLink to={href} {...props} />;
}
