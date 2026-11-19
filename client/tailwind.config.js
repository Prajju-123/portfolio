/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#111111', paper: '#ffffff', mist: '#f5f5f4', gold: '#f59e0b' },
      fontFamily: { display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'], body: ['Figtree', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
