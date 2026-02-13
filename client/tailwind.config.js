/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Discord-inspired color palette
        'boxflow': {
          primary: '#5865f2',      // Discord blurple - primary brand
          secondary: '#4752c4',    // Darker blurple - hover states
          accent: '#7289da',       // Light blurple - accents
          success: '#3ba55c',      // Green - success/online
          warning: '#faa61a',      // Orange - warnings
          danger: '#ed4245',       // Red - errors/delete
          dark: '#36393f',         // Main dark background
          darker: '#2f3136',       // Sidebar/darker panels
          darkest: '#202225',      // Deepest dark for contrast
          light: '#dcddde',        // Main text color
          muted: '#b9bbbe',        // Secondary text
          subtle: '#72767d',       // Tertiary text
          border: '#202225',       // Border color
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
