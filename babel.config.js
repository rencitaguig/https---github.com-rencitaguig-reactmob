module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    ["@babel/plugin-transform-private-methods", { loose: true }], // Set loose mode
    ["@babel/plugin-proposal-class-properties", { loose: true }], // Set loose mode
    ["@babel/plugin-proposal-private-property-in-object", { loose: true }] // Set loose mode
  ],
};
