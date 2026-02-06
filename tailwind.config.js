/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        modual: {
          pink: '#E94B8A',
          purple: '#A855F7',
          blue: '#6366F1',
        },
        primary: {
          50: '#fef2f4',
          100: '#fde6e9',
          200: '#fbd0d8',
          300: '#f7a8b8',
          400: '#f27593',
          500: '#E94B8A',
          600: '#d62d5a',
          700: '#b31e48',
          800: '#961c42',
          900: '#801b3e',
        },
        secondary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      backgroundImage: {
        'gradient-modual': 'linear-gradient(to right, #E94B8A, #A855F7, #6366F1)',
      },
    },
  },
  plugins: [],
}



