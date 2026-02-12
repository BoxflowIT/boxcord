/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Discord-inspired dark theme
        'discord-dark': '#36393f',
        'discord-darker': '#2f3136',
        'discord-darkest': '#202225',
        'discord-light': '#dcddde',
        'discord-blurple': '#5865f2',
        'discord-green': '#3ba55c',
      },
    },
  },
  plugins: [],
};
