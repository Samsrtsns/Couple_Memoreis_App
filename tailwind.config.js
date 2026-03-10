/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF8A8A",
        coralLight: "#FFB1B1",
        coralDark: "#EE2B4B",

        bgLight: "#FDF8F7",
        bgDark: "#121212",

        slate800: "#1F2937",
        slate100: "#F1F5F9",
        slate200: "#E2E8F0",
        slate400: "#94A3B8",
        slate500: "#64748B",
        slate700: "#334155",
        slate800TextDark: "#F8FAFC",
      },
    },
  },
  plugins: [],
};
