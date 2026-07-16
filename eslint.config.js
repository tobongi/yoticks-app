// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "dist-release/*"],
    rules: {
      // React Native data-loading effects intentionally hydrate local state from
      // device APIs and network responses. The compiler-oriented rule treats
      // these established RN patterns as errors even when they are guarded.
      "react-hooks/set-state-in-effect": "off",
      // Animated.Value is a mutable native animation handle by design.
      "react-hooks/refs": "off",
      // Apostrophes are ordinary text in React Native <Text>, not HTML markup.
      "react/no-unescaped-entities": "off"
    },
  }
]);
