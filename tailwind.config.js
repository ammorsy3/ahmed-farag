import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Site-wide font (Arabic and English); falls back to the system font stack
        sans: ['"Fatimah Arabic"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: { DEFAULT: token('primary'), hover: token('primary-hover') },
        bright: token('bright'),
        lime: token('lime'),
        heading: token('heading'),
        forest: token('forest'),
        body: token('body'),
        muted: token('muted'),
        surface: token('surface'),
        mint: token('mint'),
        card: token('card'),
        line: { DEFAULT: token('line'), strong: token('line-strong') },
      },
    },
  },
  plugins: [],
};
