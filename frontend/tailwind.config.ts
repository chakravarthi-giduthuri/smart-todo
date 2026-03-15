import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: '#0d6cf2',
        'primary-dark': '#0b5ed7',
        'primary-light': '#3b8ef7',
        'background-light': '#f5f7f8',
        'background-dark': '#101722',
        work:     '#6366f1',
        study:    '#8b5cf6',
        personal: '#10b981',
        health:   '#f59e0b',
        errand:   '#ec4899',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #3b82f6, #6366f1)',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0,0,0,0.06), 0 2px 8px -1px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
};
export default config;
