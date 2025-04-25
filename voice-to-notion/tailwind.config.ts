module.exports = {
  // ...
  theme: {
    extend: {
      fontFamily: {
        gowun: [
          "Gowun Batang",
          ...require("tailwindcss/defaultTheme").fontFamily.sans,
        ], // Or 'Gowun Batang' if needed
        // Add other font families as needed
      },
    },
  },
  // ...
};
