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
      // accent: {
      //   0: 'var(--color-accent)',
      //   1: 'var(--color-accent-1)',
      //   2: 'var(--color-accent-2)',
      //   hsl: 'var(--color-accent-hsl)',
      // },
      'text-accent': 'var(--color-accent-1);',
      'interactive-accent': 'var(--color-accent)',
      'interactive-accent-hover': 'var(--color-accent-1)',
      'text-normal': 'var(--text-normal)',
      'bg-col': 'var(--background-primary)',
      'orange': 'var(--color-orange)',
      'red': 'var(--color-red)',
      'green': 'var(--color-green)',
    },
  },
};
