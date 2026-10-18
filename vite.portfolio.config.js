import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "portfolio-entry",
      transformIndexHtml: {
        order: "pre",
        handler: (html) => html.replace('/src/main.jsx', '/src/portfolio/main.jsx'),
      },
    },
    react(),
  ],
  define: { "import.meta.env.VITE_SITE_TARGET": JSON.stringify("portfolio") },
  build: { outDir: "dist-portfolio" },
  server: { port: 3001 },
});
