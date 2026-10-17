/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surv: {
          bg: "#F5F3EE",         // Warm off-white canvas
          card: "#FFFFFF",       // White panels
          text: "#1F2328",       // Charcoal primary text
          muted: "#656D76",      // Secondary neutral text
          border: "#D9D6CE",     // Muted grey rules
          darkmap: "#14181C",    // Optional dark map background
          accent: "#1F4E5F",     // Deep teal survey accent
          accentHover: "#163B48",
          subtle: "#ECEAE4",     // Slight tinted surface
        },
        kiln: {
          fcbk: "#E8710A",       // Orange (Oval)
          zigzag: "#1A73E8",     // Blue (Rectangular)
          cfcbk: "#188038",      // Green (Circular)
        },
        geo: {
          boundary: "#1F2328",   // Dark ink dashed line
          roadPrimary: "#475569",
          roadSecondary: "#94A3B8",
          water: "#6BA4B8",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "Consolas", "monospace"],
        serif: ["'Source Serif 4'", "Georgia", "serif"],
      },
      fontSize: {
        '2xs': ['11px', '14px'],
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['28px', '34px'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '4px',
        full: '9999px',
      },
      boxShadow: {
        map: '0 1px 3px rgba(31, 35, 40, 0.12)',
        sm: '0 1px 2px rgba(31, 35, 40, 0.06)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
}
