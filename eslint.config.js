import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";


export default tseslint.config(

  { // Configuration object with just 'ignores' produces a global ignore rule
    ignores: ["dist/", ".eslintrc.cjs", "eslint.config.js", "vite.config.ts"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser
      },
    },
    files: ["**/*.@(js|jsx|cjs|cjsx|ts|tsx)"],
    extends: [
      eslint.configs.recommended,
      // ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      import('eslint-plugin-react/configs/recommended.js'),
    ],
    plugins: {
      "react": react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "typescript-eslint": tseslint
    },
    rules: {
      // I'm not convinced this is actually running...
      "react-refresh/only-export-components": [
        "warn",
        { "allowConstantExport": true },
      ],
      "react-refresh/only-export-components": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "all",
          "argsIgnorePattern": "^_",
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],
      "@typescript-eslint/strict-boolean-expressions": "error",
      // Otherwise this will yell about things like "obj?.property === true" which I find a better habit
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          "allowBoolean": true,
          "allowNumber": true,
        }
      ]
      // "eqeqeq": "error",
    },
  }
);