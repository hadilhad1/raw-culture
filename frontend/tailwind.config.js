/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        raw: {
          bg: '#111315',
          panel: '#1B1F22',
          cream: '#F4F1EA',
          accent: '#315CFF',
          lime: '#B7FF4A',
          text: '#111111',
          white: '#F5F5F5',
          silver: '#C8CED3',
        },
      },
      boxShadow: {
        raw: '0 18px 40px rgba(20,20,20,0.18)',
      },
      fontFamily: {
        display: ['"Arial Black"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
