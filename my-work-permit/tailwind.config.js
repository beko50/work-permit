/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      borderColor: {
        input: 'var(--border)',
      },
      ringOffsetColor: {
        background: 'var(--background)',
      },
      ringColor: {
        ring: 'var(--ring)',
      },
    },
  },
  plugins: [],
}