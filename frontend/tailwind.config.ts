import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        work:     '#6366f1',
        study:    '#8b5cf6',
        personal: '#10b981',
        health:   '#f59e0b',
        errand:   '#ec4899',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'gradient-card':   'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
      },
    },
  },
  plugins: [],
};
export default config;
