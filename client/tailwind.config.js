/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Now using CSS variables for proper theme switching
        'boxflow': {
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          'primary-10': 'var(--color-primary-10)',
          'primary-20': 'var(--color-primary-20)',
          'primary-25': 'var(--color-primary-25)',
          'primary-30': 'var(--color-primary-30)',
          'primary-50': 'var(--color-primary-50)',
          'primary-90': 'var(--color-primary-90)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-secondary)', // Alias for secondary
          success: 'var(--color-success)',
          'success-20': 'var(--color-success-20)',
          warning: 'var(--color-warning)',
          danger: 'var(--color-danger)',
          'danger-hover': 'var(--color-danger-hover)',
          'danger-10': 'var(--color-danger-10)',
          'danger-20': 'var(--color-danger-20)',
          'danger-50': 'var(--color-danger-50)',
          dark: 'var(--color-bg-dark)',
          darker: 'var(--color-bg-darker)',
          darkest: 'var(--color-bg-darkest)',
          hover: 'var(--color-bg-hover)',
          'hover-50': 'var(--color-bg-hover-50)',
          light: 'var(--color-text-light)',
          normal: 'var(--color-text-normal)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
          border: 'var(--color-border)',
          'border-50': 'var(--color-border-50)',
        },
        // Legacy discord colors (kept for backward compatibility)
        'discord-dark': 'var(--color-bg-dark)',
        'discord-darker': 'var(--color-bg-darker)',
        'discord-darkest': 'var(--color-bg-darkest)',
        'discord-light': 'var(--color-text-light)',
        'discord-blurple': 'var(--color-primary)',
        'discord-green': 'var(--color-success)',
      },
      fontFamily: {
        sans: ['Montserrat', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      keyframes: {
        'voice-bar': {
          '0%': { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'shimmer': {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'voice-glow': {
          '0%, 100%': { boxShadow: '0 0 0 2px rgb(34 197 94), 0 0 8px 2px rgba(34, 197, 94, 0.3)' },
          '50%': { boxShadow: '0 0 0 2px rgb(34 197 94), 0 0 14px 4px rgba(34, 197, 94, 0.5)' },
        },
      },
      animation: {
        'voice-bar': 'voice-bar 0.4s ease-in-out infinite alternate',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.25s ease-out',
        'fade-in-down': 'fade-in-down 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-in-left': 'slide-in-left 0.25s ease-out',
        'pulse-soft': 'pulse-soft 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'voice-glow': 'voice-glow 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
