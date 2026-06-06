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
      },
    },
  },
  plugins: [],
}

export default config
