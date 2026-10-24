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
        pje: {
          blue: '#003580',
          green: '#1a7a4a',
          amber: '#f59e0b',
          red: '#dc2626',
        },
        dipallacio: {
          navy: {
            950: '#08182e',
            900: '#0d2340',
            800: '#15335c',
            700: '#1e4677',
          },
          petrol: {
            700: '#0b4747',
            600: '#125e5e',
            500: '#1a7373',
          },
          cream: '#f7f4ec',
          paper: '#fbf9f4',
          mint: { 300: '#8ae9cc', 400: '#4fdcb3', 500: '#2bc79a', 600: '#169b76' },
          gold: '#b8863e',
        },
      },
      boxShadow: {
        luxo: '0 30px 80px -30px rgba(8,24,46,0.45)',
        suave: '0 10px 40px -18px rgba(8,24,46,0.28)',
      },
      fontFamily: {
        serif: ['var(--font-dipallacio-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-dipallacio-sans)', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
