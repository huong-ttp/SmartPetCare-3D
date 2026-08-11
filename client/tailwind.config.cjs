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
        spc: {
          blue: '#3B82F6',
          cyan: '#06b6d4',
        },
      },
      dropShadow: {
        'soft': '0 10px 30px rgba(0,0,0,0.12)'
      }
    },
  },
  plugins: [],
};
