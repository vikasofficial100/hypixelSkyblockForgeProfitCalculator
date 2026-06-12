module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sky-dark': '#0f0f1a',
        'sky-card': '#1a1a2e',
        'sky-border': '#2a2a4a',
        'sky-text': '#e2e2e2',
        'sky-text-secondary': '#a0a0a0',
        'profit-green': '#00ff88',
        'loss-red': '#ff4444',
        'warning-yellow': '#ffaa00',
        'info-blue': '#0088ff',
      },
      fontFamily: {
        'minecraft': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}