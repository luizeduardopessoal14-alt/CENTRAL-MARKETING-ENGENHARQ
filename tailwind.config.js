/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        engenharq: {
          red: '#DE3A39',
          'red-hover': '#C52B2A',
          'red-light': '#FDF2F2',
          gray: '#373535',
          dark: '#1E1E1E',
          offwhite: '#F8F9FA',
          border: '#E5E7EB',
        }
      }
    },
  },
  plugins: [],
}

