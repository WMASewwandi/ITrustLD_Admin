/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "theme-green-action": "#0D9F1B",
        "theme-green-dark": "#14535B",
        "theme-green-shaded": "#669DA4",
        "theme-blue-dark": "#25223E",
        "theme-blue-darkshade": "#363351",
        "theme-blue-panel": "#302D48",
        "theme-black": "#0E1726",
        "theme-gray": "#888EA8",
        "theme-gray-white": "#F8F8F8",
        "theme-gray-border": "#E0E6ED",
        "theme-red-action": "#FF0000",
        "theme-orange": "#FF8329",
        /* Admin shell palette — dark workspace */
        "admin-chrome": "#28293D",
        "admin-chrome-deep": "#1F2030",
        "admin-chrome-lift": "#323348",
        "admin-canvas": "#070B16",
        "admin-surface": "#141625",
        "admin-surface-raised": "#1A1B2A",
        "admin-teal": "#236B6B",
        "admin-teal-deep": "#1A5555",
        "admin-accent": "#3B82F6",
        "admin-danger": "#E11D48",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"]
      },
      boxShadow: {
        "admin-card": "0 1px 2px rgba(0, 0, 0, 0.35), 0 8px 28px rgba(0, 0, 0, 0.35)",
        "admin-soft": "0 1px 3px rgba(0, 0, 0, 0.35)",
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
