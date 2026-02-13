import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--bg-page)",
        sidebar: "var(--bg-sidebar)",
        hover: "var(--bg-hover)",
        active: "var(--bg-active)",
        main: "var(--text-main)",
        muted: "var(--text-muted)",
        "on-active": "var(--text-on-active)",
        border: "var(--border-color)",
        overlay: "var(--overlay-bg)",
      },
    },
  },
  plugins: [],
};
export default config;