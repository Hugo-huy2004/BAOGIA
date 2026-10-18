import { useEffect } from "react";
import { PORTFOLIO_ORIGIN } from "../config/publicSites";

export default function PortfolioRedirect() {
  const prefix = window.location.pathname.match(/^\/(en|zh)(?=\/|$)/)?.[0] || "";
  const url = `${PORTFOLIO_ORIGIN}${prefix}/${window.location.hash}`;
  useEffect(() => { window.location.replace(url); }, [url]);
  return <a href={url}>Hugo Wishpax · Portfolio</a>;
}
