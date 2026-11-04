/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#FDF2F2',
          100: '#FCE7E7',
          200: '#F9C5C5',
          300: '#F49494',
          400: '#EA5656',
          500: '#D92626',
          600: '#B21010', // Cor institucional primária
          700: '#8F0D0D',
          800: '#750E0E',
          900: '#5E0808',
          950: '#380404',
        },
        engenharq: {
          red: '#B21010',
          'red-hover': '#8F0D0D',
          'red-light': '#FDF2F2',
          gray: '#1E293B',
          dark: '#0F172A',
          offwhite: '#F8F9FB',
          border: '#E2E8F0',
        },
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        'dropdown': '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
      animation: {
        'fadeIn': 'fadeIn 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slideUp': 'slideUp 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
