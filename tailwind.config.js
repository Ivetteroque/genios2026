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
        },
        /* Bandas de sección: lavados muy tenues de los pasteles de marca.
           Reemplazan a los grises neutros para que cada sección se distinga. */
        surface: {
          paper: '#FDFDFD',
          blue: '#F1F6FF',
          mint: '#EDFAF9',
          rose: '#FFF4F2',
        },
        /* Versiones oscuras de los pasteles, legibles para texto pequeño */
        ink: {
          blue: '#3F6FB5',
          mint: '#2E7C77',
          rose: '#C05A54',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Open Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};