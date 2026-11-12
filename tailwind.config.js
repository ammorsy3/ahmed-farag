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
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
      },
      animation: {
        marquee: 'marquee var(--duration) infinite linear',
        'marquee-vertical': 'marquee-vertical var(--duration) infinite linear',
      },
      colors: {
        primary: { DEFAULT: token('primary'), hover: token('primary-hover') },
        bright: token('bright'),
        lime: token('lime'),
        heading: token('heading'),
        forest: token('forest'),
        body: token('body'),
        muted: { DEFAULT: token('muted'), foreground: token('muted') },
        surface: token('surface'),
        mint: token('mint'),
        card: { DEFAULT: token('card'), foreground: token('heading') },
        // shadcn semantic names, mapped onto the brand palette
        background: token('surface'),
        foreground: token('heading'),
        border: token('line'),
        line: { DEFAULT: token('line'), strong: token('line-strong') },
      },
    },
  },
  plugins: [],
};
