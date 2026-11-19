/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { night: '#120a2a', paper: '#f5f0ff', gold: '#ffc15e', mint: '#5eead4', orchid: '#f472b6' },
      fontFamily: { display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'], body: ['Figtree', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
