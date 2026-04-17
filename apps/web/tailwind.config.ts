import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f7f3",
          100: "#d9ece1",
          200: "#b3d9c4",
          300: "#7bbfa0",
          400: "#4a9f7a",
          500: "#2f7a56",
          600: "#256244",
          700: "#1e4e36",
          800: "#183d2b",
          900: "#132f21"
        },
        ink: {
          DEFAULT: "#0d0d0b",
          soft:    "#1a1a17",
          muted:   "#6b6b5e"
        },
        cream: {
          DEFAULT: "#f5f0eb",
          warm:    "#ede6dc",
          deep:    "#d6ccbe"
        }
      },
      fontFamily: {
        display: ['"Noto Serif TC"', '"Cormorant Garamond"', "Georgia", "serif"],
        sans:    ['"Noto Sans TC"', "system-ui", "sans-serif"],
        body:    ['"Noto Sans TC"', "system-ui", "sans-serif"],
        latin:   ['"Cormorant Garamond"', "Georgia", "serif"]
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.03em",
        tight:    "-0.02em",
        widest:   "0.2em"
      }
    }
  },
  plugins: []
};

export default config;
