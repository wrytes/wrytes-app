/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        avenir: ['Avenir', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Surface hierarchy (light theme)
        base: '#f2f0ec', // page / app background — warm off-white
        surface: '#f8f7f5', // panels, inputs, code blocks
        card: '#ffffff', // card containers, elevated elements

        // Brand
        brand: '#ff6b35', // Wrytes orange

        // Text
        'text-primary': '#0c0c0c',
        'text-secondary': '#374151',
        'text-muted': '#6b7280',

        // Input
        'input-border': '#d1d5db',
        'input-label':  '#6b7280',
        'input-empty':  '#9ca3af',

        // Table
        'table-header': '#f9fafb',
        'table-alt':    '#e5e7eb',

        // Status — error
        'error':          '#ef4444',
        'error-bg':       '#fef2f2',
        'error-border':   '#fecaca',

        // Status — success
        'success':        '#4ade80',
        'success-bg':     '#f0fdf4',
        'success-border': '#bbf7d0',

        // Status — info / warning
        'info':    '#60a5fa',
        'warning': '#f59e0b',

        // Misc
        gold:     '#ffd700',
        disabled: '#e5e7eb',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #f2f0ec 0%, #fde8dc 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #fff4ee 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        float: 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
        glow: '0 0 20px rgba(255, 107, 53, 0.25)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.25)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [],
};
