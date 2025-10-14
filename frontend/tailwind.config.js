/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sac-navy': '#2B3A4A',
        'sac-dark': '#1F2937',
        'sac-red': '#E63946',
        'sac-red-hover': '#D62828',
        'sac-light': '#F8F9FA',
        'sac-gray': '#6B7280',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

