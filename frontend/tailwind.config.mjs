/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{mjs,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        bounce: 'bounce 1.2s infinite'
      }
    }
  },
  plugins: []
}
