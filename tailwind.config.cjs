/**** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: '#b2a8ff',
          300: '#9b8ff5',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: '#5a3a8a',
          800: '#3e2460',
          900: '#261540',
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
