/**** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: '#b2d0ff',
          300: '#89b3ff',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: '#1731b4',
          800: '#142b8c',
          900: '#14266f',
        },
        surface: 'var(--bg-primary)',
        'th-primary': 'var(--text-primary)',
        'th-secondary': 'var(--text-secondary)',
        'th-muted': 'var(--text-muted)',
      },
      backgroundColor: {
        'th-primary': 'var(--bg-primary)',
        'th-secondary': 'var(--bg-secondary)',
        'th-card': 'var(--bg-card)',
        'th-card-hover': 'var(--bg-card-hover)',
        'th-input': 'var(--input-bg)',
      },
      borderColor: {
        'th-border': 'var(--border-color)',
      },
    },
  },
  plugins: [],
};
