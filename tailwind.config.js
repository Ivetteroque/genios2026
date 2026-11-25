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
        /* Fondo crema: más cálido que el blanco, el contenido resalta sin cansar */
        background: {
          DEFAULT: '#FBF8F3',
        },
        /* Color principal de marca: el azul firme para títulos destacados,
           enlaces y etiquetas. "deep" es para el footer y secciones oscuras.
           El celeste (primary) queda como tono suave de fondo y selección;
           el salmón (secondary) queda solo para los botones de acción. */
        brand: {
          light: '#5B86C6',
          DEFAULT: '#3F6FB5',
          dark: '#335C98',
          deep: '#1C3254',
        },
        /* Bandas de sección: lavados muy tenues de los pasteles de marca.
           Reemplazan a los grises neutros para que cada sección se distinga. */
        surface: {
          paper: '#FBF8F3',
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
        heading: ['Fraunces', 'Georgia', 'serif'],
        body: ['Open Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};