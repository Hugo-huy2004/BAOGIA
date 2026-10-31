import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "portfolio-entry",
      transformIndexHtml: {
        order: "pre",
        handler: (html) => html
          .replace('/src/main.jsx', '/src/portfolio/main.jsx')
          .replace('maximum-scale=1.0, user-scalable=no, ', ''),
      },
    },
    react(),
  ],
  define: { "import.meta.env.VITE_SITE_TARGET": JSON.stringify("portfolio") },
  optimizeDeps: { entries: ["src/portfolio/main.jsx"] },
  build: { outDir: "dist-portfolio" },
  server: { port: 3001 },
});
