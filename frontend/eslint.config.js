// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // React Native renders apostrophes and quotation marks inside <Text>
      // directly; treating them as build-blocking JSX entity errors creates
      // false positives across translated devotional content.
      'react/no-unescaped-entities': 'warn',
    },
  },
]);
