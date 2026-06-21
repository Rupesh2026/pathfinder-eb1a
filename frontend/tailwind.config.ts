import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          raised: '#f4f2ee',
          overlay: '#ece9e3',
        },
        border: {
          DEFAULT: 'rgba(0,0,0,0.08)',
          subtle: 'rgba(0,0,0,0.05)',
          strong: 'rgba(0,0,0,0.13)',
        },
        accent: {
          DEFAULT: '#e8643a',
          hover: '#d4572f',
          subtle: 'rgba(232,100,58,0.08)',
          border: 'rgba(232,100,58,0.22)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)',
        'glow-coral': '0 0 32px rgba(232,100,58,0.18)',
        'glow-green': '0 0 24px rgba(22,163,74,0.12)',
        'glow-amber': '0 0 24px rgba(180,83,9,0.1)',
        'sidebar': '1px 0 0 rgba(0,0,0,0.07)',
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.025) 50%, transparent 100%)',
        'coral-glow': 'radial-gradient(ellipse at top, rgba(232,100,58,0.07) 0%, transparent 60%)',
        'warm-surface': 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,249,247,0.6) 100%)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config
