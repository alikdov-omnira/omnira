import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "**/.expo/**"] },
  { files: ["**/*.{ts,tsx}"], languageOptions: { parser: tseslint.parser }, rules: {} }
];
