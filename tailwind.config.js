/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'mine-dark': '#0A1628',
        'mine-card': '#0F2035',
        'mine-accent': '#00D4FF',
        'mine-success': '#00E676',
        'mine-danger': '#FF4D6A',
        'mine-warning': '#FFB300',
        'mine-orange': '#FF6B35',
      },
      fontFamily: {
        din: ['"DIN Alternate"', '"Roboto Mono"', 'monospace'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'number-flip': 'number-flip 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
