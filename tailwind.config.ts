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
          DEFAULT: "#0f0f13",
          card: "#18181f",
          hover: "#1e1e28",
          border: "#2a2a38",
        },
        accent: {
          purple: "#a855f7",
          pink: "#ec4899",
          blue: "#3b82f6",
          green: "#22c55e",
          orange: "#f97316",
          red: "#ef4444",
          yellow: "#eab308",
        },
        text: {
          primary: "#f1f0f5",
          secondary: "#9898b0",
          muted: "#5a5a78",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        modal: "16px",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.4)",
        modal: "0 8px 48px rgba(0,0,0,0.7)",
      },
    },
  },
  plugins: [],
};

export default config;
