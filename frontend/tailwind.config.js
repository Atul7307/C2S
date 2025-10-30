/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f766e',
        accent: '#f97316',
        muted: '#6b7280',
      },
    },
  },
  plugins: [],
};
