import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#101010",
          card: "#141414",
          hover: "#1a1a1a",
          border: "rgba(243,234,227,0.08)",
        },
        accent: {
          purple: "#FF0A33",
          pink: "#FF5470",
          blue: "#3b82f6",
          green: "#8fe3ac",
          orange: "#f97316",
          red: "#FF0A33",
          yellow: "#eab308",
        },
        text: {
          primary: "#F3EAE3",
          secondary: "#B6ABA1",
          muted: "#7a7169",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        modal: "16px",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.5)",
        modal: "0 8px 48px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
