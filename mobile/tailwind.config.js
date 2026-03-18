/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#ec5b13',
        'app-bg': '#080810',
        'surface': '#18181b',
        'surface-2': '#27272a',
        work:     '#3B82F6',
        study:    '#8B5CF6',
        personal: '#10B981',
        health:   '#F59E0B',
        errand:   '#EC4899',
      },
    },
  },
  plugins: [],
};
