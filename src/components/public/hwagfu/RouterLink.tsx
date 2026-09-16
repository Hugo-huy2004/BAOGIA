import { Link as ReactRouterLink } from "react-router-dom";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof ReactRouterLink>, "to"> & { href: string };

export function Link({ href, ...props }: Props) {
  if (/^(?:https?:|mailto:|tel:)/.test(href)) return <a href={href} {...props} />;
  if (href === "/cv") return <a href="/cv/index.html" {...props} />;
  return <ReactRouterLink to={href} {...props} />;
}
