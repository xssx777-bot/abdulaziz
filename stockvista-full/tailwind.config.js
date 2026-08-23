/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#0066cc',
        success: '#10b981',
        danger: '#ef4444',
      }
    }
  },
  plugins: [],
}
