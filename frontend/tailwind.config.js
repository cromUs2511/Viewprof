/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mapua: {
          red: '#C8102E',
          'red-dark': '#9B0D23',
          'red-light': '#E83E52',
          black: '#1A1A1A',
          charcoal: '#2D2D2D',
          gray: '#6B6B6B',
          'gray-light': '#F5F5F5',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}