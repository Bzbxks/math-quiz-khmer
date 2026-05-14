/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        khmer: ['var(--font-kantumruy)', 'sans-serif'],
        khmerHeading: ['var(--font-battambang)', 'sans-serif'],
      },
      colors: {
        airbnb: {
          red: '#FF385C',
          black: '#222222',
          gray: '#6A6A6A',
          light: '#F7F7F7',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#4F46E5',
          600: '#4338ca',
        }
      },
      boxShadow: {
        'airbnb': '0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.04), 0px 4px 8px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        '2xl-2': '20px',
      }
    },
  },
  plugins: [],
};
