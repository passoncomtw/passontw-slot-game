/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans TC', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6200EA',
          light: '#B388FF',
          dark: '#4A00B0',
        },
        accent: {
          DEFAULT: '#FF9100',
          light: '#FFC166',
          dark: '#E56F00',
        },
        success: '#00C853',
        error: '#F44336',
        warning: '#FFC107',
        info: '#2196F3',
        surface: '#1E1E1E',
        gray: {
          100: '#F0F0F0',
          200: '#E1E1E1',
          300: '#C8C8C8',
          400: '#ADADAD',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1E1E1E',
        },
      },
    },
  },
  plugins: [],
} 