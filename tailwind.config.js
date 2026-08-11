/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vblack: '#0A0A0A',
        vred: {
          DEFAULT: '#D32F2F',
          light: '#E53935',
          dark: '#9A1F1F',
        },
        vgold: {
          DEFAULT: '#D4AF37',
          light: '#E6C65A',
          dark: '#A8861F',
        },
        vmuted: '#A0A0A0',
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'Inter', 'system-ui', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', '"Noto Sans"', 'sans-serif'],
        display: ['"Noto Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 8px 24px -8px rgba(0,0,0,0.6)',
        glow: '0 0 20px -4px rgba(211,47,47,0.5)',
        goldglow: '0 0 20px -6px rgba(212,175,55,0.45)',
      },
      animation: {
        'pulse-live': 'pulseLive 1.4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        pulseLive: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
