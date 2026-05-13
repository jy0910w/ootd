import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary Brand Color - Teal (#00D4AA)
        brand: {
          50:  "#ECFDF7",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#00D4AA", // Primary
          600: "#00B894", // Hover
          700: "#0D9B7E", // Active
          800: "#047857",
          900: "#065F46"
        },
        // Accent Color - Sunshine Orange (#FFB347)
        accent: {
          50:  "#FFF7ED",
          100: "#FFEDD5",
          400: "#FFB347", // Primary
          500: "#FF9E1F", // Hover
          600: "#F97316"  // Active
        },
        // Semantic Colors
        success: {
          DEFAULT: "#10B981",
          bg:      "#D1FAE5"
        },
        warning: {
          DEFAULT: "#F59E0B",
          bg:      "#FEF3C7"
        },
        error: {
          DEFAULT: "#EF4444",
          bg:      "#FEE2E2"
        },
        info: {
          DEFAULT: "#3B82F6",
          bg:      "#DBEAFE"
        }
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"]
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.03em",
        tight:    "-0.02em",
        widest:   "0.2em"
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "10px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px"
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 212, 170, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0, 212, 170, 0.1), 0 1px 2px -1px rgba(0, 212, 170, 0.1)",
        md: "0 4px 6px -1px rgba(0, 212, 170, 0.1), 0 2px 4px -2px rgba(0, 212, 170, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 212, 170, 0.1), 0 4px 6px -4px rgba(0, 212, 170, 0.1)",
        xl: "0 20px 25px -5px rgba(0, 212, 170, 0.1), 0 8px 10px -6px rgba(0, 212, 170, 0.1)"
      }
    }
  },
  plugins: []
};

export default config;
