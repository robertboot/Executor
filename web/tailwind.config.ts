import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Heirloom brand palette (ported from lib/theme.ts in the Expo app)
        forest: {
          DEFAULT: '#0F3D2E',
          deep: '#0A2D22',
          soft: '#1B5340',
        },
        cream: {
          DEFAULT: '#F1E9DA',
          soft: '#E6DCC8',
        },
        paper: '#FFFFFF',
        gold: {
          DEFAULT: '#B89668',
          soft: '#E6D7BD',
          deep: '#8C6F47',
        },
        ink: {
          DEFAULT: '#1F2937',
          soft: '#374151',
        },
        hairline: '#E5DDD0',
        divider: '#EFE9DC',
        muted: '#6B7280',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(31, 41, 55, 0.05)',
        raised: '0 2px 8px rgba(31, 41, 55, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
