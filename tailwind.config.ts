import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'surface': '#111318',
        'surface-dim': '#111318',
        'surface-bright': '#37393e',
        'surface-container-lowest': '#0c0e12',
        'surface-container-low': '#1a1c20',
        'surface-container': '#1e2024',
        'surface-container-high': '#282a2e',
        'surface-container-highest': '#333539',
        'surface-variant': '#333539',
        'on-surface': '#e2e2e8',
        'on-surface-variant': '#c5c6d2',
        'primary': '#b1c5ff',
        'primary-container': '#002560',
        'on-primary': '#002c70',
        'on-primary-container': '#5f8cf3',
        'secondary': '#a2e7ff',
        'secondary-container': '#00d2fd',
        'on-secondary': '#003642',
        'tertiary': '#59d8de',
        'tertiary-container': '#002e30',
        'on-tertiary': '#003739',
        'outline': '#8e909c',
        'outline-variant': '#444650',
        'background': '#111318',
        'on-background': '#e2e2e8',
        'error': '#ffb4ab',
        'error-container': '#93000a',
      },
      fontFamily: {
        'headline': ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        'body': ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        'label': ['var(--font-manrope)', 'Manrope', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        'full': '0.75rem',
      },
    },
  },
  plugins: [],
}

export default config