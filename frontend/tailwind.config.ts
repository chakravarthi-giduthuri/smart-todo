import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Public Sans', 'Plus Jakarta Sans', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary:    '#ec5b13',
        'primary-dark':  '#d44e0f',
        'primary-light': '#f97316',
        work:     '#6366f1',
        study:    '#8b5cf6',
        personal: '#10b981',
        health:   '#f59e0b',
        errand:   '#ec4899',
        'app-dark':  '#1a0f08',
        'app-dark-2':'#221610',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #ec5b13, #f97316)',
        'gradient-card':   'linear-gradient(135deg, rgba(236,91,19,0.15), rgba(249,115,22,0.08))',
      },
    },
  },
  plugins: [],
};
export default config;
