/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F6', // Warm Alabaster
        navy: {
          950: '#0B131F',
          900: '#132238', // Deep Oxford Navy
          800: '#1A2F4C',
          700: '#233E65',
          600: '#325688',
          100: '#E6EDF5',
          50: '#F0F5FA',
        },
        gold: {
          600: '#946E2B',
          500: '#B48A3E', // Burnished Gold / Ochre
          400: '#C79F52',
          100: '#F7ECD4',
          50: '#FDF8EE', // Soft tint badge
        },
        charcoal: {
          900: '#0F172A',
          800: '#1E293B', // Charcoal Slate
          700: '#334155',
          600: '#475569',
          500: '#64748B', // Muted Slate
          400: '#94A3B8',
          200: '#E2E8F0', // Hairline borders
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(19, 34, 56, 0.05), 0 1px 2px 0 rgba(19, 34, 56, 0.03)',
        editor: '0 4px 20px -2px rgba(19, 34, 56, 0.06), 0 2px 6px -1px rgba(19, 34, 56, 0.04)',
        modal: '0 20px 25px -5px rgba(19, 34, 56, 0.1), 0 10px 10px -5px rgba(19, 34, 56, 0.04)',
      },
    },
  },
  plugins: [],
};
