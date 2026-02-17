/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Modern Discord-inspired color palette
        'boxflow': {
          primary: '#5865f2',      // Discord blurple - primary brand
          secondary: '#4752c4',    // Darker blurple - hover states
          accent: '#7289da',       // Light blurple - accents
          success: '#3ba55c',      // Green - success/online
          warning: '#faa61a',      // Orange - warnings
          danger: '#ed4245',       // Red - errors/delete
          dark: '#313338',         // Main dark background (Discord 2023)
          darker: '#2b2d31',       // Sidebar/darker panels (Discord 2023)
          darkest: '#1e1f22',      // Deepest dark for contrast (Discord 2023)
          light: '#f2f3f5',        // Main text color (brighter)
          muted: '#b5bac1',        // Secondary text (adjusted)
          subtle: '#80848e',       // Tertiary text (adjusted)
          border: '#1e1f22',       // Border color
          hover: '#404249',        // Hover state background
        },
        // Legacy discord colors (for gradual migration)
        'discord-dark': '#313338',
        'discord-darker': '#2b2d31',
        'discord-darkest': '#1e1f22',
        'discord-light': '#f2f3f5',
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
