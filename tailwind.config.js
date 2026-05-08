export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        sidebar: '#0f2744',
        'sidebar-hover': '#1a3a5c',
        'sidebar-active': '#1d4ed8',
      },
    },
  },
  plugins: [],
}
