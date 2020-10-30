const { colors } = require('tailwindcss/defaultTheme')

module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  purge: [],
  theme: {
    colors: {
      white: colors.white,
      black: colors.black,
      red: colors.red,
      yellow: colors.yellow,
      purple: colors.purple,
      teal: colors.teal,
      green: colors.green
    },
    extend: {
      screens: {
        sm: '640px',
        lg: '1024px',
        xl: '1280px',
      },
      colors: {
        theme1: '#FFFF65',
        theme2: '#FFF44F',
        theme3: '#CAE00D',
        theme4: '#8FD400',
        theme5: '#009150',
        theme6: '#007F5F',
        dark: {
          'light': '#575146',
          'default': '#413C34',
          'dark': '#2A2721'
        },
        light: {
          'light': '#F9F7F5',
          'default': '#F1EFEA',
          'dark': '#E7E5E0'
        }
      }
    },
  },
  variants: {},
  plugins: [],
}
