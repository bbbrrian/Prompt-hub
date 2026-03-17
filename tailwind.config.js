/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00ffff',
          purple: '#bf00ff',
          blue: '#0080ff',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 255, 255, 0.3), 0 0 30px rgba(0, 255, 255, 0.1)',
        'neon-cyan-lg': '0 0 25px rgba(0, 255, 255, 0.5), 0 0 50px rgba(0, 255, 255, 0.2)',
        'neon-purple': '0 0 15px rgba(191, 0, 255, 0.3), 0 0 30px rgba(191, 0, 255, 0.1)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.4), 0 0 40px rgba(0, 255, 255, 0.1)' },
        },
      },
    },
  },
  plugins: [],
}
