import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          emerald: '#A8E6CF',
          green: '#DCEDC1',
          yellow: '#FFD3B6',
          orange: '#FF8B94', // A bit vibrant but still pastel
          pink: '#FFAAA5',
          blue: '#A2D5F2',
          purple: '#B8B5FF',
          cream: '#FAF3F0',
          background: '#F9F9F9',
        },
        brand: {
          primary: '#A8E6CF',
          secondary: '#FFD3B6',
          accent: '#FFAAA5',
        }
      },
      fontFamily: {
        sans: ['"SVN-Gilroy"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
      }
    },
  },
  plugins: [],
} satisfies Config
