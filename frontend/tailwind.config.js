/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: '#0A0E1A',     // Deep space dark
          card: '#121826',     // Card backdrop dark
          surface: '#182235',  // Inner surfaces
          border: '#23324C',   // Neon border lines
          neonCyan: '#00F3FF', // Attack / passing lanes glow
          neonGreen: '#39FF14',// Movement paths / triggers glow
          neonRed: '#FF0055',  // Pressing traps / danger zones
          neonAmber: '#FFB800',// Highlights / active player indicator
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 12px rgba(0, 243, 255, 0.35)',
        'glow-green': '0 0 12px rgba(57, 255, 20, 0.35)',
        'glow-red': '0 0 12px rgba(255, 0, 85, 0.35)',
        'glow-amber': '0 0 12px rgba(255, 184, 0, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
