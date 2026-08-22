import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-deep": "var(--color-primary-deep)",
        secondary: "var(--color-secondary)",
        "secondary-light": "var(--color-secondary-light)",
        "secondary-shadow": "var(--color-secondary-shadow)",
        background: "var(--color-background)",
        "background-deep": "var(--color-background-deep)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
      },
      letterSpacing: {
        widest2: "0.28em",
        widest3: "0.4em",
      },
    },
  },
  plugins: [],
};

export default config;
