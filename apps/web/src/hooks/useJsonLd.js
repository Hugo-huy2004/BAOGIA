import { useEffect } from "react";

// Inject/refresh a JSON-LD structured-data <script> in <head>; removed on unmount.
export function useJsonLd(id, schema) {
  useEffect(() => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
    return () => document.getElementById(id)?.remove();
  }, [id, schema]);
}
