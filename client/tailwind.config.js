/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Monochrome base
        neu: {
          dark: '#1a1a1a',
          surface: '#242424',
          elevated: '#2a2a2a',
          inset: '#1e1e1e',
          border: '#333333',
        },
        // Accent color
        accent: {
          DEFAULT: '#00ff88',
          dim: '#00cc6a',
          glow: 'rgba(0, 255, 136, 0.3)',
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#666666',
        }
      },
      boxShadow: {
        // Neumorphic shadows
        'neu-raised': '6px 6px 12px rgba(0, 0, 0, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.03)',
        'neu-raised-sm': '4px 4px 8px rgba(0, 0, 0, 0.4), -4px -4px 8px rgba(255, 255, 255, 0.02)',
        'neu-raised-lg': '10px 10px 20px rgba(0, 0, 0, 0.5), -10px -10px 20px rgba(255, 255, 255, 0.03)',
        'neu-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.03)',
        'neu-inset-sm': 'inset 2px 2px 4px rgba(0, 0, 0, 0.4), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
        'accent-glow': '0 0 20px rgba(0, 255, 136, 0.3)',
        'accent-glow-sm': '0 0 10px rgba(0, 255, 136, 0.2)',
      },
      borderRadius: {
        'neu': '16px',
        'neu-sm': '12px',
        'neu-lg': '20px',
      }
    },
  },
  plugins: [],
}
