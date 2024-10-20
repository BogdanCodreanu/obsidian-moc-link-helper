module.exports = {
  plugins: [
    require('postcss-prefix-selector')({
      prefix: '.moc-link-helper',  // Replace with the desired prefix
      transform: function (prefix, selector, prefixedSelector) {
        // If needed, add custom transformation logic here
        return prefixedSelector; 
      },
      exclude: ['.no-prefix'], // Add selectors that should not be prefixed
    }),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};