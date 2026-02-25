const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const pluginQuery = require("@tanstack/eslint-plugin-query");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "**/dist/**", "**/backend/generated/**", "**/backend/prisma/**",
      "backend/generated/**", "backend/prisma/**", "backend/node_modules/**",
      "backend/src/generated/**", "**/node_modules/**", "node_modules/**",
      "**/.expo/**", ".expo/**", "**/.expo-shared/**", ".expo-shared/**",
      "**/patches/**", "patches/**", "bun.lock", "eslint.config.js",
      "nativewind-env.d.ts", "rootStore.example.ts",
    ],
    settings: { "import/resolver": { typescript: { alwaysTryTypes: true, project: "./tsconfig.json" } } },
    plugins: { "react-hooks": require("eslint-plugin-react-hooks") },
    rules: {
      "comma-spacing": ["warn", { before: false, after: true }],
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
    },
  },
  ...pluginQuery.configs["flat/recommended"],
]);
