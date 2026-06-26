/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          blue: '#0176D3',
          dark: '#0F2D5E',
          teal: '#00A99D',
          light: '#F3F6FC',
        },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
