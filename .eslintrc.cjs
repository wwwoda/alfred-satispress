module.exports = {
  extends: [
    'eslint-config-woda/typescript',
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  rules: {
    'import/extensions': 0,
    'import/no-unresolved': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
  },
};
