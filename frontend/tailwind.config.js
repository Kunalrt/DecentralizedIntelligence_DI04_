/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kiln: {
          fcbk: "#E8710A",     // Orange (Oval)
          zigzag: "#1A73E8",   // Blue (Rectangular)
          cfcbk: "#188038",    // Green (Circular)
        },
        brand: {
          primary: "#1A73E8",
          dark: "#0F172A",
          surface: "#F8FAFC",
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
}
