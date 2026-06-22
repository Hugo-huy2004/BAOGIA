/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // CSS-variable-based color tokens — override in :root / .dark
      colors: {
        // Brand primaries
        primary: {
          DEFAULT:   "hsl(var(--primary))",
          foreground:"hsl(var(--primary-foreground))",
          muted:     "hsl(var(--primary-muted))",
        },
        secondary: {
          DEFAULT:   "hsl(var(--secondary))",
          foreground:"hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT:   "hsl(var(--accent))",
          foreground:"hsl(var(--accent-foreground))",
        },
        // Surface system
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border:  "hsl(var(--border))",
        input:   "hsl(var(--input))",
        ring:    "hsl(var(--ring))",
        // Status
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT:    "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT:    "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },

        // --- Legacy tokens kept for backward compat ---
        "primary-container": "#e0e7ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#312e81",
        "surface":                 "#f8fafc",
        "surface-dim":             "#f1f5f9",
        "surface-bright":          "#ffffff",
        "surface-container-lowest":"#ffffff",
        "surface-container-low":   "#f8fafc",
        "surface-container":       "#f1f5f9",
        "surface-container-high":  "#e2e8f0",
        "surface-container-highest":"#cbd5e1",
        "surface-variant":         "#e2e8f0",
        "on-surface":              "#0f172a",
        "on-surface-variant":      "#475569",
        "outline":                 "#64748b",
        "outline-variant":         "#cbd5e1",
        "error":                   "#ef4444",
        "error-container":         "#fee2e2",
        "on-error":                "#ffffff",
        "on-error-container":      "#991b1b",
        "inverse-surface":         "#0f172a",
        "inverse-on-surface":      "#f8fafc",
        "inverse-primary":         "#a5b4fc",
        "tertiary":                "#fbbf24",
        "tertiary-container":      "#fef3c7",
      },

      borderRadius: {
        sm:  "calc(var(--radius) - 4px)",
        md:  "calc(var(--radius) - 2px)",
        DEFAULT: "var(--radius)",
        lg:  "calc(var(--radius) + 4px)",
        xl:  "calc(var(--radius) + 8px)",
        "2xl": "calc(var(--radius) + 14px)",
        "3xl": "calc(var(--radius) + 20px)",
        full: "9999px",
      },

      fontFamily: {
        display: ["Quicksand", "sans-serif"],
        body:    ["Plus Jakarta Sans", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },

      boxShadow: {
        "card":    "0 1px 3px 0 hsl(var(--shadow)/0.08), 0 4px 16px -2px hsl(var(--shadow)/0.06)",
        "card-hover": "0 4px 12px 0 hsl(var(--shadow)/0.12), 0 16px 40px -4px hsl(var(--shadow)/0.10)",
        "glow":    "0 0 20px hsl(var(--primary)/0.25)",
        "glow-lg": "0 0 40px hsl(var(--primary)/0.30)",
        "inner-soft": "inset 0 1px 0 hsl(var(--border)/0.6)",
        "badge":   "0 1px 3px hsl(var(--shadow)/0.12)",
      },

      keyframes: {
        // Fade
        "fade-in":  { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        // Slide
        "slide-up":   { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-down": { from: { opacity: "0", transform: "translateY(-12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-left": { from: { opacity: "0", transform: "translateX(12px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "slide-right":{ from: { opacity: "0", transform: "translateX(-12px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        // Scale
        "scale-in":  { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        "scale-out": { from: { opacity: "1", transform: "scale(1)" }, to: { opacity: "0", transform: "scale(0.95)" } },
        // Bounce soft
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        // Pulse glow
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary)/0.4)" },
          "50%":      { boxShadow: "0 0 0 8px hsl(var(--primary)/0)" },
        },
        // Shimmer
        "shimmer": {
          from: { backgroundPosition: "200% 0" },
          to:   { backgroundPosition: "-200% 0" },
        },
        // Spin slow
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        // Toast animations
        "toast-in":  { from: { opacity: "0", transform: "translateY(100%) scale(0.9)" }, to: { opacity: "1", transform: "translateY(0) scale(1)" } },
        "toast-out": { from: { opacity: "1", transform: "translateY(0) scale(1)" }, to: { opacity: "0", transform: "translateY(100%) scale(0.9)" } },
        // Accordion
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        // Radio VU-meter bar
        "eq-bar": { "0%, 100%": { transform: "scaleY(0.25)" }, "50%": { transform: "scaleY(1)" } },
        // Invalid-guess shake (HugoArcade word game)
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
      },

      animation: {
        "fade-in":     "fade-in 0.25s ease-out",
        "fade-out":    "fade-out 0.2s ease-in",
        "slide-up":    "slide-up 0.3s cubic-bezier(0.16,1,0.3,1)",
        "slide-down":  "slide-down 0.3s cubic-bezier(0.16,1,0.3,1)",
        "slide-left":  "slide-left 0.3s cubic-bezier(0.16,1,0.3,1)",
        "slide-right": "slide-right 0.3s cubic-bezier(0.16,1,0.3,1)",
        "scale-in":    "scale-in 0.2s cubic-bezier(0.16,1,0.3,1)",
        "scale-out":   "scale-out 0.15s ease-in",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "pulse-glow":  "pulse-glow 2s ease-in-out infinite",
        "shimmer":     "shimmer 2.5s linear infinite",
        "spin-slow":   "spin-slow 3s linear infinite",
        "toast-in":    "toast-in 0.35s cubic-bezier(0.16,1,0.3,1)",
        "toast-out":   "toast-out 0.25s ease-in forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "eq-bar":         "eq-bar 0.9s ease-in-out infinite",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, hsl(var(--primary)/0.08) 50%, transparent 100%)",
        "mesh-gradient": "radial-gradient(at 20% 20%, hsl(var(--primary)/0.15) 0px, transparent 50%), radial-gradient(at 80% 80%, hsl(var(--accent)/0.10) 0px, transparent 50%)",
      },

      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
        "snappy": "cubic-bezier(0.25, 0, 0, 1)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    function({ addUtilities, addBase, theme }) {
      addUtilities({
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
        ".scrollbar-thin": {
          "scrollbar-width": "thin",
          "scrollbar-color": "hsl(var(--border)) transparent",
        },
        ".glass": {
          "background": "hsl(var(--card)/0.7)",
          "backdrop-filter": "blur(16px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(16px) saturate(180%)",
          "border": "1px solid hsl(var(--border)/0.5)",
        },
        ".glass-sm": {
          "background": "hsl(var(--card)/0.5)",
          "backdrop-filter": "blur(8px) saturate(160%)",
          "-webkit-backdrop-filter": "blur(8px) saturate(160%)",
          "border": "1px solid hsl(var(--border)/0.4)",
        },
        ".text-gradient": {
          "background": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
          "-webkit-background-clip": "text",
          "background-clip": "text",
          "-webkit-text-fill-color": "transparent",
        },
        ".text-gradient-warm": {
          "background": "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
          "-webkit-background-clip": "text",
          "background-clip": "text",
          "-webkit-text-fill-color": "transparent",
        },
        ".text-gradient-cool": {
          "background": "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
          "-webkit-background-clip": "text",
          "background-clip": "text",
          "-webkit-text-fill-color": "transparent",
        },
        ".no-tap-highlight": {
          "-webkit-tap-highlight-color": "transparent",
        },
        ".focus-ring": {
          "&:focus-visible": {
            "outline": "2px solid hsl(var(--ring))",
            "outline-offset": "2px",
          },
        },
      });
    },
  ],
};
