import type { Config } from 'tailwindcss'

// Palette from the spec: near white background, white surfaces, zinc black for
// actions, green for pieces worn recently and amber for ones gathering dust.
// Everything else stays in the zinc greys so the clothes carry the colour.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAFA',
        surface: '#FFFFFF',
        sunk: '#F4F4F5',
        line: '#E4E4E7',
        strong: '#D4D4D8',
        ink: '#18181B',
        muted: '#52525B',
        faint: '#71717A',
        primary: { DEFAULT: '#18181B', hover: '#27272A', soft: '#F4F4F5' },
        worn: { DEFAULT: '#16A34A', ink: '#15803D', soft: '#DCFCE7' },
        unused: { DEFAULT: '#D97706', ink: '#B45309', soft: '#FEF3C7' },
        danger: { DEFAULT: '#B91C1C', soft: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(24, 24, 27, 0.04), 0 6px 20px -12px rgba(24, 24, 27, 0.12)',
        lift: '0 2px 6px rgba(24, 24, 27, 0.06), 0 24px 48px -24px rgba(24, 24, 27, 0.28)',
      },
      keyframes: {
        'rise-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        sway: { '0%, 100%': { transform: 'rotate(-2deg)' }, '50%': { transform: 'rotate(2deg)' } },
      },
      animation: {
        'rise-in': 'rise-in 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        scan: 'scan 1.4s ease-in-out infinite alternate',
        sway: 'sway 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
