/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      borderWidth: {
        1: '1px',
      },
      padding: {
        1: '1px',
      },
      keyframes: {
        'scale-in': {
          '0%': {
            width: '0',
          },
          '100%': {
            width: '100%',
          },
        },
        animation: {
          'scale-in': 'scale-in 2s ease-in-out',
        },
      },
    },
    margin: {
      auto: 'auto',
      xs: '.236em',
      s: '.345em',
      m: '.786096em',
      l: '1em',
      xl: '1.618em',
      xxl: '2.618em',
    },
    padding: {
      xs: '.236em',
      s: '.345em',
      m: '.786096em',
      l: '1em',
      xl: '1.618em',
      xxl: '2.618em',
    },
    gap: {
      xs: '.236em',
      s: '.345em',
      m: '.786096em',
      l: '1em',
      xl: '1.618em',
      xxl: '2.618em',
    },
    colors: {
      base: {
        0: 'var(--color-base-00)',
        5: 'var(--color-base-05)',
        10: 'var(--color-base-10)',
        15: 'var(--color-base-15)',
        20: 'var(--color-base-20)',
        25: 'var(--color-base-25)',
        30: 'var(--color-base-30)',
        35: 'var(--color-base-35)',
        40: 'var(--color-base-40)',
        50: 'var(--color-base-50)',
        60: 'var(--color-base-60)',
        70: 'var(--color-base-70)',
        100: 'var(--color-base-100)',
      },
      'text-accent': 'var(--color-accent-1)',
      'accent-transparent': 'rgba(var(--color-accent-1), 0.5)',
      'interactive-accent': 'var(--color-accent)',
      'interactive-accent-hover': 'var(--color-accent-1)',
      'text-normal': 'var(--text-normal)',
      'bg-col': 'var(--background-primary)',
      orange: 'var(--color-orange)',
      red: 'var(--color-red)',
      green: 'var(--color-green)',
      pillBackground: 'var(--pill-background)',
    },
  },
};
