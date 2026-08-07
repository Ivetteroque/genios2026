/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#B8D4FF',
          DEFAULT: '#A0C4FF',
          dark: '#8AB4FF',
        },
        secondary: {
          light: '#FFB8B8',
          DEFAULT: '#FFADAD',
          dark: '#FF9D9D',
        },
        success: {
          light: '#D0FDFB',
          DEFAULT: '#C0FDFB',
          dark: '#A0FDFB',
        },
        text: {
          DEFAULT: '#2F2F2F',
        },
        background: {
          DEFAULT: '#FDFDFD',
        }
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Open Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};