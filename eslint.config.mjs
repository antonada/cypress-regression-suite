import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginCypress from 'eslint-plugin-cypress';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'cypress/reports/', 'cypress/screenshots/', 'cypress/videos/'],
  },
  js.configs.recommended,
  {
    files: ['server/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['src/**/*.{js,jsx,mjs}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['cypress/**/*.ts'],
    ...pluginCypress.configs.recommended,
  },
);
