/**** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      typography: {
        invert: {
          css: {
            '--tw-prose-body': 'rgb(203 213 225)',
            '--tw-prose-headings': 'rgb(255 255 255)',
            '--tw-prose-lead': 'rgb(203 213 225)',
            '--tw-prose-links': 'rgb(165 180 252)',
            '--tw-prose-bold': 'rgb(255 255 255)',
            '--tw-prose-counters': 'rgb(148 163 184)',
            '--tw-prose-bullets': 'rgb(148 163 184)',
            '--tw-prose-hr': 'rgba(255,255,255,0.1)',
            '--tw-prose-quotes': 'rgb(203 213 225)',
            '--tw-prose-quote-borders': 'rgb(102 126 234)',
            '--tw-prose-captions': 'rgb(148 163 184)',
            '--tw-prose-code': 'rgb(255 255 255)',
            '--tw-prose-pre-code': 'rgb(203 213 225)',
            '--tw-prose-pre-bg': 'rgb(15 23 42)',
            '--tw-prose-th-borders': 'rgba(255,255,255,0.1)',
            '--tw-prose-td-borders': 'rgba(255,255,255,0.05)',
          },
        },
      },
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
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
