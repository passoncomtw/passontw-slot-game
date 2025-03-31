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
      },
    },
  },
  plugins: [],
} 