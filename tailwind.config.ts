import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./charts/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-low": "var(--surface-low)",
        "surface-high": "var(--surface-high)",
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        outline: "var(--outline)",
        success: "var(--success)",
        warning: "var(--warning)",
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        ambient: "0 12px 32px rgba(17, 24, 39, 0.06)",
      },
      borderRadius: {
        panel: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;