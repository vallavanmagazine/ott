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
        'splash-icon-spin': 'splashIconSpin 1.6s ease-out forwards',
        'splash-icon-glow': 'splashIconGlow 2s ease-in-out infinite',
        'splash-orbit': 'splashOrbit 3s linear infinite',
        'splash-orbit-rev': 'splashOrbitRev 3.5s linear infinite',
        'splash-pop-in': 'splashPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'splash-float': 'splashFloat 2s ease-in-out infinite',
        'splash-progress': 'splashProgress 1.6s ease-in-out forwards',
        'splash-fade-out': 'splashFadeOut 0.5s ease-out forwards',
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
        splashIconSpin: {
          '0%': { transform: 'rotate(-180deg) scale(0.3)', opacity: '0' },
          '60%': { transform: 'rotate(10deg) scale(1.1)', opacity: '1' },
          '100%': { transform: 'rotate(0deg) scale(1)', opacity: '1' },
        },
        splashIconGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(211,47,47,0.3))' },
          '50%': { filter: 'drop-shadow(0 0 24px rgba(211,47,47,0.7))' },
        },
        splashOrbit: {
          '0%': { transform: 'rotate(0deg) translateX(48px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(48px) rotate(-360deg)' },
        },
        splashOrbitRev: {
          '0%': { transform: 'rotate(0deg) translateX(70px) rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg) translateX(70px) rotate(360deg)' },
        },
        splashPopIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        splashFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        splashProgress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        splashFadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
