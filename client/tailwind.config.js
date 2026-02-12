/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Boxflow brand colors - modern dark theme
        'boxflow': {
          primary: '#00a8e8',      // Cyan/blue - primary brand color
          secondary: '#0077b6',    // Darker blue - secondary actions
          accent: '#00d9ff',       // Bright cyan - highlights
          success: '#06d6a0',      // Green - success states
          warning: '#ffd166',      // Yellow/orange - warnings
          danger: '#ef476f',       // Red - errors/delete
          dark: '#1a1d23',         // Main dark background
          darker: '#151820',       // Sidebar/darker panels
          darkest: '#0f1115',      // Deepest dark for contrast
          light: '#e4e6eb',        // Main text color
          muted: '#9ca3af',        // Secondary text
          subtle: '#6b7280',       // Tertiary text
          border: '#2d3139',       // Border color
        },
        // Legacy discord colors (for gradual migration)
        'discord-dark': '#36393f',
        'discord-darker': '#2f3136',
        'discord-darkest': '#202225',
        'discord-light': '#dcddde',
        'discord-blurple': '#5865f2',
        'discord-green': '#3ba55c',
      },
      fontFamily: {
        sans: ['Montserrat', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
