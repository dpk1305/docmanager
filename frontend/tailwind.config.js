/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          page: 'var(--bg-page)'
        },
        surface: 'var(--surface)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        accent600: 'var(--accent-600)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        text: 'var(--text)'
      }
    }
  },
  plugins: []
}

// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // custom accent color with a 600 shade
        accent: {
          DEFAULT: '#2563EB',   // tailwind class: bg-accent, text-accent
          600: '#1D4ED8',       // tailwind class: bg-accent-600, hover:bg-accent-600
        },
        // you can also add more theme colors here (muted, danger, etc.)
      },
    },
  },
  plugins: [],
};

