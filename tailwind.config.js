/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Curated Premium Slate & Indigo & Gold theme
        "primary": "#6366f1",
        "primary-container": "#e0e7ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#312e81",
        "secondary": "#0ea5e9",
        "secondary-container": "#e0f2fe",
        "on-secondary": "#ffffff",
        "tertiary": "#fbbf24",
        "tertiary-container": "#fef3c7",
        
        // Surface colors
        "surface": "#f8fafc",
        "surface-dim": "#f1f5f9",
        "surface-bright": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8fafc",
        "surface-container": "#f1f5f9",
        "surface-container-high": "#e2e8f0",
        "surface-container-highest": "#cbd5e1",
        "surface-variant": "#e2e8f0",
        
        // On colors
        "on-surface": "#0f172a",
        "on-surface-variant": "#475569",
        "outline": "#64748b",
        "outline-variant": "#cbd5e1",
        
        // Error colors
        "error": "#ef4444",
        "error-container": "#fee2e2",
        "on-error": "#ffffff",
        "on-error-container": "#991b1b",
        
        // Additional
        "inverse-surface": "#0f172a",
        "inverse-on-surface": "#f8fafc",
        "inverse-primary": "#a5b4fc",
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      spacing: {
        "base-unit": "8px",
        "stack-gap": "1rem",
        "gutter": "1.5rem",
      },
      fontFamily: {
        display: ["Quicksand", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"]
      }
    }
  },
  plugins: [],
}
