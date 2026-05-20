import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1d4ed8', light: '#3b82f6', dark: '#1e3a8a' },
        success: { DEFAULT: '#16a34a', light: '#dcfce7' },
        warning: { DEFAULT: '#d97706', light: '#fef9c3' },
        danger:  { DEFAULT: '#dc2626', light: '#fce4d6' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
