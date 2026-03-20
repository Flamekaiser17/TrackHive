/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: '#6C63FF',
        teal: '#00D4AA',
        danger: '#FF4757',
        warning: '#FFA502',
        success: '#2ED573',
        'bg-primary': '#0A0A0F',
        'bg-secondary': '#12121A',
        'bg-card': '#1A1A26',
        'border-dark': '#2A2A3A',
        'text-muted': '#8B8BA7',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)',
        'gradient-teal': 'linear-gradient(135deg, #00D4AA 0%, #00B896 100%)',
        'gradient-danger': 'linear-gradient(135deg, #FF4757 0%, #EE2637 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(108, 99, 255, 0.3)',
        'glow-teal': '0 0 20px rgba(0, 212, 170, 0.3)',
        'glow-danger': '0 0 20px rgba(255, 71, 87, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(-12px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
