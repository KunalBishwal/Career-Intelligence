import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#151416", // Main dark dashboard background
          900: "#100F11",
          800: "#151416",
          700: "#1D1B1E",
          600: "#27252A",
        },
        aubergine: {
          DEFAULT: "#21152B", // Dark contrast surfaces & supporting details
          900: "#170E1E",
          800: "#21152B",
          700: "#2C1D3A",
          600: "#3A264D",
          border: "#3D2852",
        },
        lavender: {
          DEFAULT: "#CBB3E8", // Primary surfaces, selected nav, visual highlights
          light: "#E4D6F6",
          dark: "#A382CE",
          muted: "rgba(203, 179, 232, 0.12)",
          border: "rgba(203, 179, 232, 0.28)",
        },
        chartreuse: {
          DEFAULT: "#D4FF3F", // Primary CTA, active states, key metrics, interactive accents
          hover: "#C3F224",
          muted: "rgba(212, 255, 63, 0.12)",
          border: "rgba(212, 255, 63, 0.32)",
        },
        tomato: {
          DEFAULT: "#E34234", // Important alerts, emphasis, selected data points
          muted: "rgba(227, 66, 52, 0.14)",
          border: "rgba(227, 66, 52, 0.32)",
        },
        offwhite: {
          DEFAULT: "#F5F0EA", // Text or light sections
          sub: "#D8D2CA",
          muted: "#9E9890",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        editorial: [
          "var(--font-editorial)",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
