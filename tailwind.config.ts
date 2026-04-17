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
        // Surface hierarchy
        'base':    '#1a1a1a',   // page / app background
        'surface': '#1f1f1f',   // panels, inputs, code blocks
        'card':    '#2a2a2a',   // card containers, elevated elements

        // Brand
        'brand':   '#ff6b35',   // Wrytes orange

        // Text
        'text-primary':   '#ffffff',
        'text-secondary': '#a0a0a0',
        'text-muted':     '#666666',

        // Input
        'input-border': '#4B5563',
        'input-error':  '#ef4444',
        'input-label':  '#9CA3AF',
        'input-empty':  '#6B7280',

        // Table
        'table-header': '#242424',
        'table-alt':    '#374151',

        // Misc
        'gold':     '#ffd700',
        'disabled': '#111827',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%)',
        'gradient-card': 'linear-gradient(135deg, #2a2a2a 0%, #3a2a2a 100%)',
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
        card: '0 4px 20px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(255, 107, 53, 0.3)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
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
