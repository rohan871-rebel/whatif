/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050811',
          900: '#0B1120',
          850: '#0F172A',
          800: '#15213D',
          750: '#1C2B4C',
          700: '#24355A',
        },
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
        },
        sky: {
          400: '#38BDF8',
          500: '#0EA5E9',
        },
        violet: {
          400: '#A78BFA',
          500: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'apple': '0 8px 30px rgba(0, 0, 0, 0.35)',
        'apple-glow': '0 0 25px rgba(6, 182, 212, 0.15)',
        'apple-glow-purple': '0 0 25px rgba(139, 92, 246, 0.15)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-glow': 'signalGlow 2.5s ease-in-out infinite',
      },
      keyframes: {
        signalGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 16px rgba(6, 182, 212, 0.8))' },
        }
      }
    },
  },
  plugins: [],
}
