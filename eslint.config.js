//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  { ignores: ['.output/**', 'eslint.config.js', 'prettier.config.js'] },
  ...tanstackConfig,
  {
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
]
