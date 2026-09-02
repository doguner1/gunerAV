import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#f5f5f5",
        surface: {
          DEFAULT: "#121212",
          hover: "#1a1a1a",
          border: "#262626",
          subtle: "#181818",
        },
        tactical: {
          black: "#000000",
          dark: "#0a0a0a",
          card: "#121212",
          border: "#262626",
          muted: "#737373",
          light: "#a3a3a3",
          white: "#ffffff",
          accent: "#d4af37", // subtle tactical brass / gold accent
          alert: "#ef4444",  // legal permit warning
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
