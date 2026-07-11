module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  // Keep 'class' strategy (not the default 'media') so leftover dark: utility
  // classes in JSX stay fully inert — nothing ever adds .dark to <html>
  // anymore, so they never activate, regardless of the user's OS preference.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#F4F4F2',
        ink: '#1C1C1E',
        primary: '#1B4B8C',
        'primary-dark': '#163C6E',
        alert: '#E8622C',
        success: '#2C7A6B',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
