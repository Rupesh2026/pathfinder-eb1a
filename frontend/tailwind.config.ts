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
          raised: '#f0f1f6',
          overlay: '#e8e9f0',
        },
        border: {
          DEFAULT: 'rgba(0,0,0,0.09)',
          subtle: 'rgba(0,0,0,0.05)',
          strong: 'rgba(0,0,0,0.16)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
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
          '0%': { transform: 'translateY(6px)', opacity: '0' },
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
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        'glow-indigo': '0 0 24px rgba(91,95,199,0.15)',
        'glow-green': '0 0 24px rgba(22,163,74,0.12)',
        'glow-amber': '0 0 24px rgba(180,83,9,0.12)',
        'inner': 'inset 0 1px 0 rgba(0,0,0,0.04)',
        'sidebar': '1px 0 0 rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.03) 50%, transparent 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, transparent 60%)',
        'indigo-glow': 'radial-gradient(ellipse at top, rgba(91,95,199,0.06) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
}

export default config
