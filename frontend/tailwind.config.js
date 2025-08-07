module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fiverr Brand Colors
        primary: '#1DBF73',        // Fiverr Green
        secondary: '#404145',      // Fiverr Dark Gray
        accent: '#00B22D',         // Darker Green for hover states

        // Supporting Colors
        'gray-dark': '#404145',    // Main text color
        'gray-medium': '#62646A',  // Secondary text
        'gray-light': '#B5B6BA',   // Disabled/placeholder text
        'gray-lighter': '#F7F7F7', // Background gray
        'gray-border': '#DADBDD',  // Border color

        // Status Colors
        success: '#1DBF73',
        warning: '#FFB33E',
        error: '#FF5A5F',
        info: '#0E9F6E',

        // Background Colors
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F7F7F7',
        'bg-tertiary': '#FAFAFA',

        // Text Colors
        text: '#404145',
        'text-secondary': '#62646A',
        'text-light': '#B5B6BA',
        'text-white': '#FFFFFF',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'macan': ['Macan', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
        '5xl': ['48px', '52px'],
        '6xl': ['60px', '64px'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
