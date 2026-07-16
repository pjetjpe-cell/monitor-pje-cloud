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
          gold: '#b8863e',
        },
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
