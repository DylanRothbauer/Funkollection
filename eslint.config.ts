import { defineConfigWithVueTs } from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },
)
