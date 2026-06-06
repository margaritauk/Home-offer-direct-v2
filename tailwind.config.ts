import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf5",
          100: "#d6fae6",
          200: "#aff3cf",
          300: "#78e7b1",
          400: "#3fd28e",
          500: "#16b673",
          600: "#0a935c",
          700: "#0a754c",
          800: "#0c5c3e",
          900: "#0c4c34",
          950: "#022b1d",
        },
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
