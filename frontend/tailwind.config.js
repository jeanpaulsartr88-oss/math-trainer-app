/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        academic: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          text: '#F8FAFC',
          muted: '#94A3B8',
          accent: '#3B82F6',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
        },
        duo: {
          green: '#10B981',
          greenDark: '#059669',
          greenLight: '#D1FAE5',
          blue: '#3B82F6',
          blueDark: '#2563EB',
          blueLight: '#DBEAFE',
          red: '#EF4444',
          redDark: '#DC2626',
          redLight: '#FEE2E2',
          yellow: '#F59E0B',
          yellowDark: '#D97706',
          yellowLight: '#FEF3C7',
          gray: '#E2E8F0',
          grayDark: '#94A3B8',
          text: '#1E293B',
          textDark: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
