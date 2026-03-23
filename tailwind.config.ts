/** @type {import('tailwindcss').Config} */
module.exports = {
  // CRITICAL: 'class' strategy means dark: variants activate
  // when the <html> element has the class "dark".
  // The MainApp.vue watch() adds/removes it via
  // document.documentElement.classList.add/remove('dark')
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        // Single accent — violet
        accent: {
          DEFAULT: '#8b5cf6', // violet-500
          light:   '#a78bfa', // violet-400
          dark:    '#7c3aed', // violet-600
          faint:   'rgba(139,92,246,0.08)',
          glow:    'rgba(139,92,246,0.3)',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },

  plugins: [],
}