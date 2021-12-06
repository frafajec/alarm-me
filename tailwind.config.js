module.exports = {
  mode: 'jit',
  purge: ['./public/**/*.html', './src/**/*.{ts,tsx,svg}'],
  // specify other options here
  darkMode: 'media',
  theme: {
    extend: {
      fontSize: {
        xxs: '.5rem',
      },
      colors: {
        blackish: '#222',
        cyan: '#49af95',
        cyanDark: '#347b69',
        orange: '#e78a00',
        orangeDark: '#b16900',
      },
      zIndex: {
        '-10': '-10',
      },
    },
  },
};
