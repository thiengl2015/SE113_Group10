/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d9ff",
          300: "#a3c0ff",
          400: "#739dff",
          500: "#4a74f6",
          600: "#2851e8",
          700: "#1f3ecc",
          800: "#1d33a6",
          900: "#1b2d82",
        },
        surface: {
          0: "#ffffff",
          25: "#f8fafc",
          50: "#f1f5f9",
          100: "#e2e8f0",
          200: "#cbd5e1",
        },
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)",
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
      },
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
      },
    },
  },
  plugins: [],
};
