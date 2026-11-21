/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A192F',
          800: '#112240',
          700: '#233554',
          600: '#334155',
        },
        brand: {
          blue: '#2563EB',
          'blue-electric': '#0066FF',
          'blue-dark': '#1D4ED8',
          purple: '#7C3AED',
          'purple-light': '#8B5CF6',
          'purple-dark': '#6D28D9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
