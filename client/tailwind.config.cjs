/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0EA5B7",
          50: "#f0fafb",
          100: "#cef0f5",
          200: "#9de1eb",
          300: "#5ecbda",
          400: "#2db0c4",
          500: "#0EA5B7",
          600: "#0b8fa0",
          700: "#097283",
          800: "#075a69",
          900: "#054757",
        },
        secondary: {
          DEFAULT: "#22C55E",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22C55E",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        accent: {
          DEFAULT: "#FB923C",
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        navy: {
          DEFAULT: "#0F172A",
          800: "#1e293b",
          900: "#0f172a",
        },
        background: "#F8FAFC",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#0EA5B7",
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      dropShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.12)",
        glow: "0 0 20px rgba(14,165,183,0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(14,165,183,0)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(14,165,183,0.35)" },
        },
      },
    },
  },
  plugins: [],
};
