/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        card2: 'rgb(var(--c-card2) / <alpha-value>)',
        edge: 'rgb(var(--c-edge) / <alpha-value>)',
        txt: 'rgb(var(--c-txt) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        accent2: 'rgb(var(--c-accent2) / <alpha-value>)',
        gpu: 'rgb(var(--c-gpu) / <alpha-value>)',
        warn: 'rgb(var(--c-warn) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        freq: 'rgb(var(--c-freq) / <alpha-value>)',
        track: 'rgb(var(--c-track) / <alpha-value>)'
      }
    }
  },
  plugins: []
};
