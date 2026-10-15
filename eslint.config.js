import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.local/**', 'dist/**', 'node_modules/**', '.codex_work/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
