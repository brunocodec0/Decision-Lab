import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Iniciativa Consultoria
        brand: {
          DEFAULT: "#690a96",
          light:   "#8b1cc4",
          dim:     "#690a9618",
        },
        accent: {
          DEFAULT: "#50d9c9",
          dim:     "#50d9c918",
        },
        surface: {
          DEFAULT:   "#09090f",
          secondary: "#0f0f18",
          card:      "#141420",
          border:    "#1e1e32",
          borderHi:  "#2e2e50",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
